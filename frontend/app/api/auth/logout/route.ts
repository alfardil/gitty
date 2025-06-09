import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete("github_user");
  cookieStore.delete("github_access_token");
  cookieStore.delete("github_oauth_state");

  return NextResponse.json({ success: true });
}
