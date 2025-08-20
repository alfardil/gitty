// Create checkout session for subscription with user metadata

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { db } from "@/server/src/db";
import { users as usersTable } from "@/server/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  console.log("=== CREATE CHECKOUT SESSION START ===");
  try {
    console.log("1. Getting cookies...");
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    console.log("2. User cookie found:", !!userCookie);
    if (!userCookie) {
      console.log("ERROR: No user cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("3. Parsing user cookie...");
    const user = JSON.parse(userCookie.value);
    console.log("4. Parsed user:", { id: user.id, login: user.login });

    console.log("5. Looking up user in database...");
    const dbUser = await getUserByGithubId(String(user.id));
    console.log(
      "6. DB user found:",
      !!dbUser,
      dbUser
        ? {
            id: dbUser.id,
            email: dbUser.email,
            stripeCustomerId: dbUser.stripeCustomerId,
          }
        : null
    );

    if (!dbUser) {
      console.log("ERROR: User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("7. Parsing request body...");
    const body = await request.json();
    console.log("8. Request body:", body);

    // Get quantity and enterpriseId from request body
    const { quantity = 1, enterpriseId } = body;
    console.log("9. Quantity:", quantity);
    console.log("9a. Enterprise ID:", enterpriseId);
    console.log("9b. Enterprise ID type:", typeof enterpriseId);
    console.log("9c. Enterprise ID truthy:", !!enterpriseId);

    // Validate that enterpriseId is provided
    if (!enterpriseId) {
      console.error("ERROR: No enterprise ID provided");
      return NextResponse.json(
        { error: "Enterprise ID is required" },
        { status: 400 }
      );
    }

    console.log("10. Checking Stripe customer ID...");
    // Check if user already has a Stripe customer ID
    let stripeCustomerId = dbUser.stripeCustomerId;
    console.log("11. Existing Stripe customer ID:", stripeCustomerId);

    // Always create a new customer to ensure it exists in Stripe
    console.log("12. Creating new Stripe customer...");
    try {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name:
          dbUser.firstName && dbUser.lastName
            ? `${dbUser.firstName} ${dbUser.lastName}`
            : dbUser.githubUsername || undefined,
        metadata: {
          githubId: dbUser.githubId,
          userId: dbUser.id,
        },
      });

      stripeCustomerId = customer.id;
      console.log("13. Created Stripe customer:", customer.id);

      // Save the customer ID to the database
      console.log("14. Saving customer ID to database...");
      await db
        .update(usersTable)
        .set({ stripeCustomerId: customer.id })
        .where(eq(usersTable.id, dbUser.id));
      console.log("15. Customer ID saved to database");
    } catch (customerError) {
      console.error("ERROR creating Stripe customer:", customerError);
      throw customerError;
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";
    const PRICE_ID = process.env.STRIPE_PRICE_ID;
    if (!PRICE_ID) {
      console.error("ERROR: STRIPE_PRICE_ID is not set");
      return NextResponse.json(
        { error: "Stripe price not configured" },
        { status: 500 }
      );
    }

    console.log("16. Creating Stripe checkout session...");
    console.log("17. Session config:", {
      customer: stripeCustomerId,
      price: PRICE_ID,
      quantity: quantity,
      mode: "subscription",
      origin: request.headers.get("origin"),
      metadata: {
        userId: dbUser.id,
        githubId: dbUser.githubId,
        quantity: quantity.toString(),
        enterpriseId: enterpriseId,
      },
    });

    // Create checkout session with the customer ID
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: PRICE_ID,
            quantity: quantity,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/dashboard?section=billing&success=true`,
        cancel_url: `${origin}/dashboard?section=billing&canceled=true`,
        metadata: {
          userId: dbUser.id,
          githubId: dbUser.githubId,
          quantity: quantity.toString(),
          enterpriseId: enterpriseId,
        },
        billing_address_collection: "auto",
        allow_promotion_codes: true,
      });

      console.log("18. Checkout session created successfully:", session.id);
      console.log("19. Session URL:", session.url);
      console.log("=== CREATE CHECKOUT SESSION SUCCESS ===");
      return NextResponse.json({ sessionId: session.id });
    } catch (sessionError) {
      console.error("ERROR creating checkout session:", sessionError);
      console.log("=== CREATE CHECKOUT SESSION FAILED ===");
      throw sessionError;
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
