import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upsertUser, createSession } from "@/server/src/db/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error("No access token received");
    }

    // Get user data from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Upsert user in the database
    const upsertResult = await upsertUser({
      githubId: String(userData.id),
      firstName: userData.name ? userData.name.split(" ")[0] : undefined,
      lastName: userData.name
        ? userData.name.split(" ").slice(1).join(" ")
        : undefined,
      email: userData.email || `${userData.login}@users.noreply.github.com`,
      avatarUrl: userData.avatar_url,
      githubUsername: userData.login,
      bio: userData.bio,
      joinedAt: userData.created_at ? new Date(userData.created_at) : undefined,
    });

    // Create a session in the database
    if (upsertResult && upsertResult.user) {
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 1 week
      await createSession({
        userId: upsertResult.user.id,
        expiresAt,
        deletedAt: null,
      });
    }

    // Store the access token and user data in cookies
    cookieStore.set("github_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    cookieStore.set("github_user", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    cookieStore.delete("github_oauth_state");

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }
}
