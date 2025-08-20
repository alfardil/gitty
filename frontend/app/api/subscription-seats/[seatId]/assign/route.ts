import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { SubscriptionSeatsService } from "@/lib/services/subscription-seats";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seatId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seatId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await SubscriptionSeatsService.assignSeat(seatId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning seat:", error);
    return NextResponse.json(
      { error: "Failed to assign seat" },
      { status: 500 }
    );
  }
}
