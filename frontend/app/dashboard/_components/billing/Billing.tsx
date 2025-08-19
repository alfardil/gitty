"use client";
import { useUserStats } from "@/lib/hooks/api/useUserStats";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { useAdminEnterprises } from "@/app/dashboard/_components/admin/hooks/useAdminEnterprises";
import { Spinner } from "@/components/ui/neo/spinner";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
    features: ["Core features", "Community support", "User management", "Basic analytics"],
    description: "Basic plan with per-seat pricing.",
    maxSeats: 10,
  },
  ENTERPRISE: {
    price: "$50",
    pricePerSeat: "$15",
    label: "ENTERPRISE",
    features: ["All Basic features", "Advanced analytics", "Priority support", "Custom integrations"],
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
  const { enterprises, users: enterpriseUsers, loading: enterprisesLoading } = useAdminEnterprises(
    user?.uuid || ""
  );
  
  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(null);
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Auto-select first enterprise
  useEffect(() => {
    if (enterprises.length > 0 && !selectedEnterprise) {
      setSelectedEnterprise(enterprises[0].id);
    }
  }, [enterprises, selectedEnterprise]);

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

  // Determine current plan with proper type safety and fallback
  let currentPlan: PlanType = "BASIC"; // Default to BASIC
  
  if (subscriptionPlan) {
    const upperPlan = subscriptionPlan.toUpperCase();
    if (upperPlan === "BASIC" || upperPlan === "ENTERPRISE") {
      currentPlan = upperPlan as PlanType;
    }
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

  const currentEnterprise = enterprises.find((e: Enterprise) => e.id === selectedEnterprise);
  // Since enterpriseUsers are already filtered by the selected enterprise in the hook
  const currentUsers = enterpriseUsers;

  const handleRemoveUser = async (userId: string) => {
    if (!selectedEnterprise) return;
    
    setIsRemovingUser(userId);
    try {
      const response = await fetch(`/api/admin?action=removeEnterpriseUser&enterpriseId=${selectedEnterprise}&userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success("User removed successfully. Billing will be updated on next cycle.");
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

  const handleManageBilling = () => {
    window.open("https://dashboard.stripe.com/billing", "_blank");
  };

  const handleViewInvoices = () => {
    window.open("https://dashboard.stripe.com/invoices", "_blank");
  };

  const handleManageSubscription = () => {
    window.open("https://dashboard.stripe.com/subscriptions", "_blank");
  };

  const currentMonthCost = currentUsers.length * parseFloat(plan.pricePerSeat.replace("$", ""));
  const nextMonthCost = (currentUsers.length - 1) * parseFloat(plan.pricePerSeat.replace("$", ""));

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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground font-mono">Plan Summary</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-foreground/10 text-foreground/80 border border-border">
                    {plan.label} Plan
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-foreground/60 font-mono">Price per Seat</span>
                    <span className="font-semibold text-foreground font-mono">{plan.pricePerSeat}/seat</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-foreground/60 font-mono">Active Users</span>
                    <span className="font-semibold text-foreground font-mono">
                      {currentUsers.length}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-foreground/60 font-mono">Status</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground/80 border border-border">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-foreground/60 font-mono">Next Bill</span>
                    <span className="font-semibold text-foreground font-mono">Aug 14, 2025</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-foreground/60 font-mono">Cycle</span>
                    <span className="font-semibold text-foreground font-mono">Monthly</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise Selection Card */}
            <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-chart-3/5 to-transparent rounded-full"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 font-mono">Enterprise</h2>
                
                {enterprises.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <span className="text-foreground/60 font-mono">Selected Enterprise</span>
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
                      <span className="text-foreground/60 font-mono">Enterprise ID</span>
                      <span className="font-semibold text-foreground font-mono text-xs">
                        {currentEnterprise?.id?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground/60 font-mono">No enterprises found</p>
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
                <h2 className="text-xl font-semibold text-foreground mb-6 font-mono">Billing Summary</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-background/50 rounded-md border border-border">
                    <h3 className="text-sm font-medium text-foreground/60 mb-2 font-mono">Current Month</h3>
                    <p className="text-2xl font-bold text-foreground font-mono">${currentMonthCost.toFixed(2)}</p>
                    <p className="text-xs text-foreground/40 font-mono">{currentUsers.length} seats x {plan.pricePerSeat}</p>
                  </div>
                  
                  <div className="p-4 bg-background/50 rounded-md border border-border">
                    <h3 className="text-sm font-medium text-foreground/60 mb-2 font-mono">Next Month</h3>
                    <p className="text-2xl font-bold text-foreground font-mono">${currentMonthCost.toFixed(2)}</p>
                    <p className="text-xs text-foreground/40 font-mono">Same as current month</p>
                  </div>
                  
                  <div className="p-4 bg-background/50 rounded-md border border-border">
                    <h3 className="text-sm font-medium text-foreground/60 mb-2 font-mono">Plan</h3>
                    <p className="text-lg font-semibold text-foreground font-mono">{plan.label}</p>
                    <p className="text-xs text-foreground/40 font-mono">{plan.price}/month base</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stripe Management */}
            <div className="bg-secondary-background border border-border rounded-lg shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-chart-1/5 to-transparent rounded-full"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-foreground mb-6 font-mono">Stripe Management</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={handleManageBilling}
                    className="p-4 bg-background/50 border border-border rounded-md hover:bg-background hover:border-main/30 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground font-mono">Billing Dashboard</h3>
                      <svg className="w-5 h-5 text-foreground/40 group-hover:text-main transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/60 font-mono">Manage payment methods, billing cycles, and subscription details</p>
                  </button>
                  
                  <button
                    onClick={handleManageSubscription}
                    className="p-4 bg-background/50 border border-border rounded-md hover:bg-background hover:border-main/30 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground font-mono">Subscription</h3>
                      <svg className="w-5 h-5 text-foreground/40 group-hover:text-main transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/60 font-mono">View and modify your subscription plan and features</p>
                  </button>
                  
                  <button
                    onClick={handleViewInvoices}
                    className="p-4 bg-background/50 border border-border rounded-md hover:bg-background hover:border-main/30 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground font-mono">Invoices</h3>
                      <svg className="w-5 h-5 text-foreground/40 group-hover:text-main transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/60 font-mono">Download invoices and view payment history</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "seats" && (
          <div className="space-y-6">
            

            {/* Seat Management */}
            {currentEnterprise && (
              <div className="bg-secondary-background shadow-lg p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-chart-5/5 to-transparent rounded-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground/60 font-mono">
                        {currentUsers.length} active seats
                      </span>
                    </div>
                  </div>
                  
                  {currentUsers.length > 0 ? (
                    <div className="space-y-3">
                      {currentUsers.map((user: EnterpriseUser) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-main/20 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-main font-mono">
                                {user.firstName?.[0] || user.githubUsername?.[0] || "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground font-mono">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.githubUsername || `User ${user.id.slice(0, 8)}`
                                }
                              </p>
                              <p className="text-xs text-foreground/60 font-mono">{user.role}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground/80 border border-border">
                              {user.role}
                            </span>
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              disabled={isRemovingUser === user.id}
                              className="px-3 py-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                            >
                              {isRemovingUser === user.id ? "Removing..." : "Remove Seat"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-foreground/60 font-mono text-center py-8">No active seats in this enterprise</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
