import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/src/db";
import { users as usersTable } from "@/server/src/db/schema";
import { eq } from "drizzle-orm";
import { SubscriptionSeatsService } from "@/lib/services/subscription-seats";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    console.log("Webhook received:", request.url);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("Webhook event verified:", event.type, event.id);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case "invoice.payment_succeeded":
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log("=== HANDLING CHECKOUT SESSION COMPLETED ===");
  console.log("Session ID:", session.id);
  console.log("Session metadata:", session.metadata);
  console.log("Session subscription:", session.subscription);
  console.log("Session line_items:", session.line_items);

  const userId = session.metadata?.userId;
  if (!userId) {
    console.log("❌ No userId in session metadata");
    return;
  }

  // Get the subscription from the session
  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    console.log("❌ No subscription ID in session");
    return;
  }

  console.log("✅ Found userId:", userId);
  console.log("✅ Found subscriptionId:", subscriptionId);

  // Update user subscription plan
  await db
    .update(usersTable)
    .set({ subscriptionPlan: "PRO" })
    .where(eq(usersTable.id, userId));

  console.log(
    `✅ User ${userId} subscription activated with subscription ID: ${subscriptionId}`
  );

  // Create seats for the subscription
  try {
    const quantity = session.metadata?.quantity
      ? parseInt(session.metadata.quantity)
      : session.line_items?.data?.[0]?.quantity || 1;

    console.log("📊 Quantity from metadata:", session.metadata?.quantity);
    console.log(
      "📊 Quantity from line_items:",
      session.line_items?.data?.[0]?.quantity
    );
    console.log("📊 Final quantity:", quantity);
    console.log(
      "📊 Enterprise ID from session:",
      session.metadata?.enterpriseId
    );
    console.log(
      `🪑 Creating ${quantity} seats for subscription ${subscriptionId}`
    );

    await SubscriptionSeatsService.createSeatsForSubscription(
      subscriptionId,
      userId,
      quantity,
      session.metadata?.enterpriseId
    );

    console.log(
      `✅ Successfully created ${quantity} seats for subscription ${subscriptionId}`
    );
  } catch (error) {
    console.error("❌ Error creating seats:", error);
  }

  console.log("=== CHECKOUT SESSION COMPLETED HANDLED ===");
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log("🔄 Processing subscription update:", subscription.id);
  console.log("🔄 Subscription metadata:", subscription.metadata);

  const customerId = subscription.customer;

  // Find user by Stripe customer ID
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (!user.length) return;

  const status = subscription.status;
  let subscriptionPlan: "FREE" | "PRO" | "ENTERPRISE" = "FREE";

  if (status === "active" || status === "trialing") {
    subscriptionPlan = "PRO";

    // Create seats for the subscription if they don't exist
    const quantity = subscription.items.data[0].quantity || 1;

    // Get enterprise ID from subscription metadata
    const enterpriseId = subscription.metadata?.enterpriseId;
    console.log("🔍 Subscription metadata:", subscription.metadata);
    console.log("🔍 Enterprise ID from metadata:", enterpriseId);
    console.log("🔍 Enterprise ID type:", typeof enterpriseId);
    console.log("🔍 Enterprise ID truthy:", !!enterpriseId);
    console.log(
      "🔍 Raw metadata keys:",
      Object.keys(subscription.metadata || {})
    );
    console.log(
      `Creating ${quantity} seats for subscription ${subscription.id}, user ${user[0].id}, enterprise ${enterpriseId}`
    );

    await SubscriptionSeatsService.createSeatsForSubscription(
      subscription.id,
      user[0].id,
      quantity,
      enterpriseId || undefined
    );
  } else if (
    status === "past_due" ||
    status === "unpaid" ||
    status === "canceled"
  ) {
    subscriptionPlan = "FREE";
  }

  await db
    .update(usersTable)
    .set({ subscriptionPlan })
    .where(eq(usersTable.id, user[0].id));

  console.log(`User ${user[0].id} subscription updated to ${subscriptionPlan}`);
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (!user.length) return;

  await db
    .update(usersTable)
    .set({ subscriptionPlan: "FREE" })
    .where(eq(usersTable.id, user[0].id));

  console.log(`User ${user[0].id} subscription cancelled`);
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (!user.length) return;

  console.log(
    `Payment succeeded for user ${user[0].id}, invoice ${invoice.id}`
  );
}

async function handleInvoicePaymentFailed(invoice: any) {
  const customerId = invoice.customer;

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (!user.length) return;

  // Downgrade user to FREE if payment fails
  await db
    .update(usersTable)
    .set({ subscriptionPlan: "FREE" })
    .where(eq(usersTable.id, user[0].id));

  console.log(
    `Payment failed for user ${user[0].id}, invoice ${invoice.id} - downgraded to FREE`
  );
}
