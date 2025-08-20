import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/business/useAuth";

export interface SubscriptionDetails {
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  quantity: number;
  priceId: string;
  priceAmount: number;
  priceCurrency: string;
  interval: "month" | "year";
  nextBillingDate: string;
  totalAmount: number;
}

interface SubscriptionResponse {
  success: boolean;
  data: SubscriptionDetails | null;
}

const fetchSubscriptionDetails = async (
  stripeCustomerId: string | null
): Promise<SubscriptionDetails | null> => {
  if (!stripeCustomerId) {
    return null;
  }

  const response = await fetch(
    `/api/billing/subscription-details?customerId=${stripeCustomerId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch subscription details");
  }
  const data: SubscriptionResponse = await response.json();
  return data.data;
};

export function useSubscriptionDetails() {
  const { user } = useAuth();
  const stripeCustomerId = user?.stripeCustomerId;

  return useQuery({
    queryKey: ["subscription-details", stripeCustomerId],
    queryFn: () => fetchSubscriptionDetails(stripeCustomerId),
    enabled: !!stripeCustomerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
