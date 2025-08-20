"use client";
import { useUserStats } from "@/lib/hooks/api/useUserStats";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { useAdminEnterprises } from "@/app/dashboard/_components/admin/hooks/useAdminEnterprises";
import { usePaymentHistory } from "@/lib/hooks/api/usePaymentHistory";
import { useSubscriptionDetails } from "@/lib/hooks/api/useSubscriptionDetails";
import { redirectToCheckout } from "@/lib/utils/stripe-checkout";
import { SubscriptionSeats } from "./SubscriptionSeats";
import { Spinner } from "@/components/ui/neo/spinner";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

type PlanType = "BASIC" | "ENTERPRISE";

interface PlanDetails {
  price: string;
  pricePerSeat: string;
  label: string;
  features: string[];
  description: string;
  maxSeats: number;
}

interface EnterpriseUser {
  id: string;
  githubId: string | null;
  githubUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  subscription_plan: string | null;
  role: string;
}

interface Enterprise {
  id: string;
  name: string;
}

const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  BASIC: {
    price: "$20",
    pricePerSeat: "$20",
    label: "BASIC",
    features: [
      "Core features",
      "Community support",
      "User management",
      "Basic analytics",
    ],
    description: "Basic plan with per-seat pricing.",
    maxSeats: 10,
  },
  ENTERPRISE: {
    price: "$50",
    pricePerSeat: "$15",
    label: "ENTERPRISE",
    features: [
      "All Basic features",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
    ],
    description: "Enterprise plan with volume pricing.",
    maxSeats: 100,
  },
};

type TabType = "overview" | "billing" | "seats";

export function Billing() {
  const { user, loading } = useAuth();
  const { subscriptionPlan, error } = useUserStats(
    user ? user.id.toString() : ""
  );
  const {
    enterprises,
    users: enterpriseUsers,
    loading: enterprisesLoading,
  } = useAdminEnterprises(user?.uuid || "");
  const { data: paymentHistory, isLoading: paymentHistoryLoading } =
    usePaymentHistory();
  const { data: subscriptionDetails, isLoading: subscriptionLoading } =
    useSubscriptionDetails();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(
    null
  );
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [quantity, setQuantity] = useState(1);

  // Auto-select first enterprise
  useEffect(() => {
    if (enterprises.length > 0 && !selectedEnterprise) {
      setSelectedEnterprise(enterprises[0].id);
    }
  }, [enterprises, selectedEnterprise]);

  // Check for successful payment and refresh data
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      console.log("🎉 Payment successful! Refreshing data...");
      toast.success("Payment successful! Your seats are being created.");

      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["subscription-seats"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });

      // Remove the success parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, queryClient]);

  if (loading || enterprisesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user || error) {
    return (
      <div className="text-red-500">
        You may not be logged in. Reauthenticate and try again.
      </div>
    );
  }

  // Use actual subscription data instead of hardcoded plans
  const hasActiveSubscription =
    subscriptionDetails && subscriptionDetails.status === "active";
  const hasDatabaseSubscription =
    user?.subscription_plan === "PRO" ||
    user?.subscription_plan === "ENTERPRISE";
  const isEnterpriseUser = user?.subscription_plan === "ENTERPRISE";

  // Determine current plan based on actual subscription data or database field
  let currentPlan: PlanType = "BASIC"; // Default to BASIC
  if (hasActiveSubscription || hasDatabaseSubscription) {
    currentPlan = isEnterpriseUser ? "ENTERPRISE" : "BASIC";
  }

  const plan: PlanDetails = PLAN_DETAILS[currentPlan];

  // Ensure plan is always defined
  if (!plan) {
    return (
      <div className="text-red-500">
        Error loading plan information. Please refresh the page.
      </div>
    );
  }

  const currentEnterprise = enterprises.find(
    (e: Enterprise) => e.id === selectedEnterprise
  );
  // Since enterpriseUsers are already filtered by the selected enterprise in the hook
  const currentUsers = enterpriseUsers;

  const handleRemoveUser = async (userId: string) => {
    if (!selectedEnterprise) return;

    setIsRemovingUser(userId);
    try {
      const response = await fetch(
        `/api/admin?action=removeEnterpriseUser&enterpriseId=${selectedEnterprise}&userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success(
          "User removed successfully. Billing will be updated on next cycle."
        );
        // Refresh the page to update user list
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to remove user");
      }
    } catch (error) {
      toast.error("Failed to remove user");
    } finally {
      setIsRemovingUser(null);
    }
  };

  // Payment history handlers can be added here when implementing real data
  const handleDownloadInvoice = (invoiceId: string) => {
    // TODO: Implement invoice download functionality
    console.log("Downloading invoice:", invoiceId);
  };

  const currentMonthCost =
    currentUsers.length * parseFloat(plan.pricePerSeat.replace("$", ""));
  const nextMonthCost =
    (currentUsers.length - 1) * parseFloat(plan.pricePerSeat.replace("$", ""));

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-1 bg-secondary-background p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 font-mono ${
              activeTab === "overview"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 font-mono ${
              activeTab === "billing"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab("seats")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 font-mono ${
              activeTab === "seats"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Seats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Summary Card */}
            <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-main/5 to-transparent rounded-full"></div>

              <div className="relative z-10">
                {subscriptionLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="large" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-foreground font-mono">
                        Plan Summary
                      </h2>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-foreground/10 text-foreground/80 border border-border">
                        {hasDatabaseSubscription
                          ? `${user?.subscription_plan || "PRO"} Plan`
                          : hasActiveSubscription
                            ? `${subscriptionDetails?.interval?.charAt(0)?.toUpperCase() || "M"}${subscriptionDetails?.interval?.slice(1) || "onthly"} Plan`
                            : "No Active Plan"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-foreground/60 font-mono">
                          Price per Seat
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {hasDatabaseSubscription
                            ? "$99.99"
                            : hasActiveSubscription
                              ? `$${subscriptionDetails.priceAmount.toFixed(2)}`
                              : "Free"}
                          /seat
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-foreground/60 font-mono">
                          Active Users
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {hasDatabaseSubscription || hasActiveSubscription
                            ? hasDatabaseSubscription
                              ? 1
                              : subscriptionDetails?.quantity || 1
                            : currentUsers.length}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-foreground/60 font-mono">
                          Subscription Status
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            hasDatabaseSubscription || hasActiveSubscription
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}
                        >
                          {hasDatabaseSubscription || hasActiveSubscription
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-foreground/60 font-mono">
                          Status
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            subscriptionDetails?.status === "active"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : subscriptionDetails?.status === "canceled"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : subscriptionDetails?.status === "past_due"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-foreground/10 text-foreground/80 border-border"
                          }`}
                        >
                          {subscriptionDetails?.status
                            ? subscriptionDetails.status
                                .charAt(0)
                                .toUpperCase() +
                              subscriptionDetails.status
                                .slice(1)
                                .replace("_", " ")
                            : "Active"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-foreground/60 font-mono">
                          Next Bill
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {hasActiveSubscription
                            ? new Date(
                                subscriptionDetails.nextBillingDate
                              ).toLocaleDateString()
                            : "No active subscription"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3">
                        <span className="text-foreground/60 font-mono">
                          Cycle
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {hasActiveSubscription
                            ? subscriptionDetails.interval
                                .charAt(0)
                                .toUpperCase() +
                              subscriptionDetails.interval.slice(1)
                            : "No active subscription"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Enterprise Selection Card */}
            <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-chart-3/5 to-transparent rounded-full"></div>

              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 font-mono">
                  Enterprise
                </h2>

                {enterprises.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <span className="text-foreground/60 font-mono">
                        Selected Enterprise
                      </span>
                      <select
                        value={selectedEnterprise || ""}
                        onChange={(e) => setSelectedEnterprise(e.target.value)}
                        className="bg-background border border-border rounded px-2 py-1 text-foreground text-sm font-mono"
                      >
                        {enterprises.map((enterprise: Enterprise) => (
                          <option key={enterprise.id} value={enterprise.id}>
                            {enterprise.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <span className="text-foreground/60 font-mono">
                        Enterprise ID
                      </span>
                      <span className="font-semibold text-foreground font-mono text-xs">
                        {currentEnterprise?.id?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground/60 font-mono">
                    No enterprises found
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Billing Summary */}
            <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-main/5 to-transparent rounded-full"></div>

              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-foreground mb-6 font-mono">
                  Billing Summary
                </h2>

                {subscriptionLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="large" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-background/50 rounded-md border border-border">
                      <h3 className="text-sm font-medium text-foreground/60 mb-2 font-mono">
                        Current Month
                      </h3>
                      <p className="text-2xl font-bold text-foreground font-mono">
                        $
                        {hasActiveSubscription
                          ? subscriptionDetails.totalAmount.toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-xs text-foreground/40 font-mono">
                        {hasActiveSubscription
                          ? `${subscriptionDetails.quantity} seats x $${subscriptionDetails.priceAmount.toFixed(2)}`
                          : "No active subscription"}
                      </p>
                    </div>

                    <div className="p-4 bg-background/50 rounded-md border border-border">
                      <h3 className="text-sm font-medium text-foreground/60 mb-2 font-mono">
                        Next Month
                      </h3>
                      <p className="text-2xl font-bold text-foreground font-mono">
                        $
                        {hasActiveSubscription
                          ? subscriptionDetails.cancelAtPeriodEnd
                            ? "0.00"
                            : subscriptionDetails.totalAmount.toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-xs text-foreground/40 font-mono">
                        {hasActiveSubscription
                          ? subscriptionDetails.cancelAtPeriodEnd
                            ? "Subscription ending"
                            : "Same as current month"
                          : "No active subscription"}
                      </p>
                    </div>

                    <div className="p-4 bg-background/50 rounded-md border border-border">
                      <h3 className="text-sm font-medium text-foreground/60 mb-2 font-mono">
                        Plan
                      </h3>
                      <p className="text-lg font-semibold text-foreground font-mono">
                        {hasActiveSubscription
                          ? `${subscriptionDetails.interval.charAt(0).toUpperCase() + subscriptionDetails.interval.slice(1)} Plan`
                          : "Free Plan"}
                      </p>
                      <p className="text-xs text-foreground/40 font-mono">
                        {hasActiveSubscription
                          ? `$${subscriptionDetails.priceAmount.toFixed(2)}/${subscriptionDetails.interval}`
                          : "No active subscription"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* No Active Subscription Notice */}
            {!hasActiveSubscription &&
              !hasDatabaseSubscription &&
              !subscriptionLoading && (
                <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/5 to-transparent rounded-full"></div>

                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 font-mono">
                      No Active Subscription
                    </h3>
                    <p className="text-foreground/60 mb-4 font-mono">
                      You don&apos;t have an active subscription. Upgrade to
                      access premium features.
                    </p>

                    {/* Seat Selection */}
                    <div className="mb-4 flex flex-col items-center">
                      <label className="block text-foreground/80 text-sm font-medium mb-2 font-mono text-center">
                        Number of Seats
                      </label>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-1 text-sm border border-border rounded hover:bg-background/50 transition-colors font-mono"
                        >
                          -
                        </button>
                        <span className="text-foreground font-mono text-lg min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-3 py-1 text-sm border border-border rounded hover:bg-background/50 transition-colors font-mono"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-foreground/50 text-xs font-mono text-center">
                        ${(quantity * 99.99).toFixed(2)}/month total
                      </p>
                    </div>

                    <button
                      onClick={() => redirectToCheckout(quantity)}
                      className="px-6 py-2 bg-main text-white rounded-md hover:bg-main/90 transition-colors font-mono"
                    >
                      Upgrade to Pro ({quantity} seat{quantity > 1 ? "s" : ""})
                    </button>
                  </div>
                </div>
              )}

            {/* Payment History */}
            <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-chart-1/5 to-transparent rounded-full"></div>

              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-foreground mb-6 font-mono">
                  Payment History
                </h2>

                {paymentHistoryLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="large" />
                  </div>
                ) : paymentHistory && paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 bg-background/50 border border-border rounded-md"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground font-mono">
                                {payment.description}
                              </h3>
                              <p className="text-sm text-foreground/60 font-mono">
                                {payment.type === "subscription"
                                  ? "Subscription payment"
                                  : "One-time payment"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground font-mono">
                              ${payment.amount} {payment.currency}
                            </p>
                            <p className="text-xs text-foreground/40 font-mono">
                              {new Date(payment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-foreground/60">
                          <span>
                            {payment.invoiceNumber
                              ? `Invoice #${payment.invoiceNumber}`
                              : "Payment completed"}
                          </span>
                          {payment.pdfUrl && (
                            <button
                              onClick={() =>
                                window.open(payment.pdfUrl!, "_blank")
                              }
                              className="text-blue-400 hover:text-blue-300 transition-colors font-mono"
                            >
                              Download PDF
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground/40">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 opacity-40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="font-mono text-sm">
                      {hasActiveSubscription
                        ? "No payment history found"
                        : "No payment history - upgrade to see your billing activity"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "seats" && (
          <div className="space-y-6">
            {/* Enterprise Selection for Seats */}
            {enterprises.length > 0 && (
              <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 font-mono">
                  Enterprise Selection
                </h2>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-foreground/60 font-mono">
                    Selected Enterprise
                  </span>
                  <select
                    value={selectedEnterprise || ""}
                    onChange={(e) => setSelectedEnterprise(e.target.value)}
                    className="bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-mono"
                  >
                    {enterprises.map((enterprise: Enterprise) => (
                      <option key={enterprise.id} value={enterprise.id}>
                        {enterprise.name}
                      </option>
                    ))}
                  </select>
                </div>
                {currentEnterprise && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-foreground/60 font-mono">
                      Enterprise ID
                    </span>
                    <span className="font-semibold text-foreground font-mono text-xs">
                      {currentEnterprise.id}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Buy More Seats Section */}
            {selectedEnterprise && (
              <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 font-mono">
                  Buy More Seats
                </h2>
                <p className="text-sm text-foreground/60 mb-4 font-mono">
                  Add more seats to your enterprise subscription
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="font-mono text-lg min-w-[2rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-sm text-foreground/60 font-mono">
                    ${(quantity * 99.99).toFixed(2)}/month
                  </div>
                  <Button
                    onClick={() =>
                      redirectToCheckout(quantity, selectedEnterprise)
                    }
                    className="bg-green-800 hover:bg-green-900 text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy {quantity} More Seat{quantity > 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            )}

            {/* Subscription Seats */}
            {selectedEnterprise ? (
              <SubscriptionSeats
                selectedEnterprise={selectedEnterprise || undefined}
              />
            ) : (
              <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4 font-mono">
                  Select an Enterprise
                </h2>
                <p className="text-foreground/60 font-mono">
                  Please select an enterprise above to view and manage
                  subscription seats.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
