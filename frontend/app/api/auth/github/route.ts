import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  const isProd = process.env.NODE_ENV === "production";

  const cookieStore = await cookies();
  cookieStore.set("github_oauth_state", state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: isProd
      ? process.env.PROD_GITHUB_CLIENT_ID!
      : process.env.DEV_GITHUB_CLIENT_ID!,
    redirect_uri: isProd
      ? process.env.PROD_GITHUB_CALLBACK_URL!
      : process.env.DEV_GITHUB_CALLBACK_URL!,
    state,
    scope: "read:user user:email repo read:org",
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(githubAuthUrl);
}
