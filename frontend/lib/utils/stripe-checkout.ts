import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export async function createCheckoutSession(
  quantity: number = 1,
  enterpriseId?: string
): Promise<string> {
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quantity, enterpriseId }),
  });

  if (!response.ok) {
    throw new Error("Failed to create checkout session");
  }

  const { sessionId } = await response.json();
  return sessionId;
}

export async function redirectToCheckout(
  quantity: number = 1,
  enterpriseId?: string
): Promise<void> {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Stripe failed to load");
    }

    const sessionId = await createCheckoutSession(quantity, enterpriseId);

    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId,
    });

    if (error) {
      console.error("Error redirecting to checkout:", error);
      alert("Failed to redirect to checkout. Please try again.");
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    alert("Failed to create checkout session. Please try again.");
  }
}
