import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("github_user");
  const accessToken = cookieStore.get("github_access_token");

  if (!userCookie || !accessToken) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authenticated.",
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
  return NextResponse.json({
    success: true,
    message: "You are authenticated!",
    data: {
      user,
      session: {
        accessToken: accessToken.value,
      },
    },
  });
}
