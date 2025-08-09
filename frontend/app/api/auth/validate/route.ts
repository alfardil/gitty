import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId, validateSession } from "@/server/src/db/actions";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("github_user");
  const accessToken = cookieStore.get("github_access_token");
  const sessionCookie = cookieStore.get("session_id");

  // First check if all required cookies exist
  if (!userCookie || !accessToken || !sessionCookie) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authenticated.",
      },
      { status: 401 }
    );
  }

  // Validate the session in the database
  const session = await validateSession({ sessionId: sessionCookie.value });
  if (!session) {
    // Session expired or doesn't exist - clear cookies
    cookieStore.delete("github_user");
    cookieStore.delete("github_access_token");
    cookieStore.delete("session_id");

    return NextResponse.json(
      {
        success: false,
        message: "Session expired. Please log in again.",
      },
      { status: 401 }
    );
  }

  let user = null;
  try {
    user = JSON.parse(userCookie.value);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid user session.",
      },
      { status: 401 }
    );
  }

  let dbUser = null;
  if (user && user.id) {
    dbUser = await getUserByGithubId(String(user.id));
  }
  const userWithUuid = dbUser
    ? {
        ...user,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        uuid: dbUser.id,
        developer: dbUser.developer,
        subscription_plan: dbUser.subscriptionPlan,
      }
    : user;

  return NextResponse.json({
    success: true,
    message: "You are authenticated!",
    data: {
      user: userWithUuid,
      session: {
        accessToken: accessToken.value,
      },
    },
  });
}
