import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { SubscriptionSeatsService } from "@/lib/services/subscription-seats";

export async function POST(
  request: NextRequest,
  { params }: { params: { seatId: string } }
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seatId } = params;

    await SubscriptionSeatsService.unassignSeat(seatId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unassigning seat:", error);
    return NextResponse.json(
      { error: "Failed to unassign seat" },
      { status: 500 }
    );
  }
}
