// Stripe checkout links for different environments
export const STRIPE_LINKS = {
  // Test environment (for development)
  test: {
    pro: "https://buy.stripe.com/test_00weVe5YP6Ir9v2ejscfK00",
    enterprise: "https://buy.stripe.com/test_enterprise_link_here", // Add when you have enterprise test link
  },
  // Production environment
  production: {
    pro: "https://buy.stripe.com/00weVe5YP6Ir9v2ejscfK00",
    enterprise: "https://buy.stripe.com/enterprise_link_here", // Add when you have enterprise production link
  },
};

// Get the appropriate Stripe link based on environment
export function getStripeLink(plan: "pro" | "enterprise" = "pro"): string {
  const isDevelopment = process.env.NODE_ENV === "development";
  const environment = isDevelopment ? "test" : "production";

  return STRIPE_LINKS[environment][plan];
}

// Helper function to redirect to Stripe checkout
export function redirectToStripeCheckout(
  plan: "pro" | "enterprise" = "pro"
): void {
  const link = getStripeLink(plan);
  window.location.href = link;
}
