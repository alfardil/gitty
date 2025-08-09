import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upsertUser, createSession } from "@/server/src/db/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value;
  const isProd = process.env.NODE_ENV === "production";

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
          client_id: isProd
            ? process.env.PROD_GITHUB_CLIENT_ID
            : process.env.DEV_GITHUB_CLIENT_ID,
          client_secret: isProd
            ? process.env.PROD_GITHUB_CLIENT_SECRET
            : process.env.DEV_GITHUB_CLIENT_SECRET,
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

    // // Check if user is admin before proceeding
    // const isDeveloper = await isUserDeveloper(String(userData.id));
    // if (!isDeveloper) {
    //   // Clear any existing cookies
    //   cookieStore.delete("github_user");
    //   cookieStore.delete("github_access_token");
    //   cookieStore.delete("session_id");
    //   cookieStore.delete("github_oauth_state");

    //   return NextResponse.redirect(new URL("/auth/access-denied", request.url));
    // }

    // Create a session in the database if they are an admin
    if (upsertResult && upsertResult.user) {
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 1 week
      const sessionResult = await createSession({
        userId: upsertResult.user.id,
        expiresAt,
        deletedAt: null,
      });

      // Store the session ID in a cookie
      cookieStore.set("session_id", String(sessionResult.session.id), {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }

    // Store the access token and user data in cookies
    cookieStore.set("github_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    // Also set a non-HttpOnly cookie for frontend access
    cookieStore.set("github_access_token", tokenData.access_token, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    cookieStore.set("github_user", JSON.stringify(userData), {
      httpOnly: true,
      secure: isProd,
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
