import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/server/src/db/actions";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  cookieStore.delete("github_user");
  cookieStore.delete("github_access_token");
  cookieStore.delete("github_oauth_state");

  if (sessionId) {
    await deleteSession({ id: sessionId });
  }

  cookieStore.delete("session_id");

  return NextResponse.json({ success: true });
}
