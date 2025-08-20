import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const dbUser = await getUserByGithubId(String(user.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripeCustomerId = dbUser.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const subscription = subscriptions.data[0];
    const price = subscription.items.data[0].price;

    // Calculate next billing date
    let nextBillingDate = new Date(
      (subscription as any).current_period_end * 1000
    );
    if ((subscription as any).cancel_at_period_end) {
      nextBillingDate = new Date((subscription as any).cancel_at * 1000);
    }

    const subscriptionDetails = {
      status: subscription.status,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000
      ).toISOString(),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000
      ).toISOString(),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      quantity: subscription.items.data[0].quantity || 1,
      priceId: price.id,
      priceAmount: (price as any).unit_amount
        ? (price as any).unit_amount / 100
        : 0,
      priceCurrency: price.currency.toUpperCase(),
      interval: price.recurring?.interval || "month",
      nextBillingDate: nextBillingDate.toISOString(),
      totalAmount:
        ((price as any).unit_amount ? (price as any).unit_amount / 100 : 0) *
        (subscription.items.data[0].quantity || 1),
    };

    return NextResponse.json({
      success: true,
      data: subscriptionDetails,
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}
