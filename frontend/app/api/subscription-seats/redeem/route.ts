import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import {
  redeemInviteCodeService,
  ServiceError,
} from "@/server/src/services/enterprise.service";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const dbUser = await getUserByGithubId(String(user.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    try {
      const result = await redeemInviteCodeService({
        code: inviteCode,
        userId: dbUser.id,
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully joined enterprise as ${result.data.role}`,
          role: result.data.role,
        });
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        );
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error redeeming invite code:", error);
    return NextResponse.json(
      { error: "Failed to redeem invite code" },
      { status: 500 }
    );
  }
}
