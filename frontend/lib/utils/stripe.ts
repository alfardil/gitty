import { stripe } from "@/lib/stripe";
import { db } from "@/server/src/db";
import { users as usersTable } from "@/server/src/db/schema";
import { eq } from "drizzle-orm";

export async function createOrGetStripeCustomer(
  userId: string,
  userData: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    githubUsername?: string | null;
    githubId: string;
  }
) {
  try {
    // Check if user already has a Stripe customer ID
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].stripeCustomerId) {
      return existingUser[0].stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: userData.email,
      name:
        userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.githubUsername || undefined,
      metadata: {
        githubId: userData.githubId,
        userId: userId,
      },
    });

    // Save customer ID to database
    await db
      .update(usersTable)
      .set({ stripeCustomerId: customer.id })
      .where(eq(usersTable.id, userId));

    console.log(`Created Stripe customer ${customer.id} for user ${userId}`);
    return customer.id;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

export async function getStripeCustomerId(
  userId: string
): Promise<string | null> {
  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    return user.length > 0 ? user[0].stripeCustomerId : null;
  } catch (error) {
    console.error("Error getting Stripe customer ID:", error);
    return null;
  }
}
