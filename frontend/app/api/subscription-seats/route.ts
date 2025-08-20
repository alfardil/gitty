import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { SubscriptionSeatsService } from "@/lib/services/subscription-seats";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    const currentUserGithubId = String(currentUser.id);

    const currentDbUser = await getUserByGithubId(currentUserGithubId);
    if (!currentDbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get("enterpriseId");

    let seats;
    if (enterpriseId) {
      // Get seats for specific enterprise
      seats = await SubscriptionSeatsService.getSeatsByEnterprise(enterpriseId);
    } else {
      // Get seats owned by user (fallback)
      seats = await SubscriptionSeatsService.getSeatsByOwner(currentDbUser.id);
    }

    return NextResponse.json({ seats });
  } catch (error) {
    console.error("Error fetching subscription seats:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription seats" },
      { status: 500 }
    );
  }
}
