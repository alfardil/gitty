import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export async function createCheckoutSession(
  quantity: number = 1,
  enterpriseId?: string
): Promise<string> {
  console.log("Creating checkout session with:", { quantity, enterpriseId });
  
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quantity, enterpriseId }),
  });

  console.log("Checkout session response status:", response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Checkout session creation failed:", errorData);
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Checkout session response data:", data);
  
  const { sessionId } = data;
  return sessionId;
}

export async function redirectToCheckout(
  enterpriseId?: string
): Promise<void> {
  try {
    console.log("Starting checkout process with enterpriseId:", enterpriseId);
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Stripe failed to load");
    }

    console.log("Stripe loaded successfully, creating checkout session...");
    const sessionId = await createCheckoutSession(1, enterpriseId); // Fixed quantity to 1
    console.log("Checkout session created:", sessionId);

    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId,
    });

    if (error) {
      console.error("Error redirecting to checkout:", error);
      alert("Failed to redirect to checkout. Please try again.");
    }
  } catch (error) {
    console.error("Error in redirectToCheckout:", error);
    alert("Failed to create checkout session. Please try again.");
  }
}
