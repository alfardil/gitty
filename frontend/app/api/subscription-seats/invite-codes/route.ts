import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { SubscriptionSeatsService } from "@/lib/services/subscription-seats";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = JSON.parse(userCookie.value);
    const dbUser = await getUserByGithubId(String(user.id));

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const inviteCodes = await SubscriptionSeatsService.getInviteCodes(dbUser.id);

    return NextResponse.json({ inviteCodes });
  } catch (error) {
    console.error("Error fetching invite codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite codes" },
      { status: 500 }
    );
  }
}

