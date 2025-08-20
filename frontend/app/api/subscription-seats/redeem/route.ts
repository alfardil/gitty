import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { SubscriptionSeatsService } from "@/lib/services/subscription-seats";

export async function POST(request: NextRequest) {
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

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const success = await SubscriptionSeatsService.redeemInviteCode(inviteCode, dbUser.id);

    if (!success) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Invite code redeemed successfully" });
  } catch (error) {
    console.error("Error redeeming invite code:", error);
    return NextResponse.json(
      { error: "Failed to redeem invite code" },
      { status: 500 }
    );
  }
}

