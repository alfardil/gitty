"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, CreditCard, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/lib/utils/stripe-checkout";
import { useSubscriptionSeats } from "@/lib/hooks/api/useSubscriptionSeats";

interface PaymentGateProps {
  children: React.ReactNode;
  subscriptionPlan?: string | null;
  isAdmin?: boolean;
  isDeveloper?: boolean;
  section: "insights" | "roadmap" | "analysis" | "admin";
  isLoading?: boolean;
}

export function PaymentGate({
  children,
  subscriptionPlan,
  isAdmin = false,
  isDeveloper = false,
  section,
  isLoading = false,
}: PaymentGateProps) {
  const router = useRouter();
  const { data: seats } = useSubscriptionSeats();
  const [quantity, setQuantity] = useState(1);

  // If still loading, show a loading state instead of the gate
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user has paid (not FREE plan), is admin, or is developer
  const hasPaid = subscriptionPlan && subscriptionPlan !== "FREE";

  // Check if user has access through a seat assignment
  const hasSeatAccess =
    seats &&
    seats.some((seat) => seat.status === "assigned" && seat.assignedToUserId);

  // Allow access if: paid subscription OR developer OR (admin with paid subscription) OR has seat access
  const canAccess =
    hasPaid || isDeveloper || (isAdmin && hasPaid) || hasSeatAccess;

  // Debug logging
  console.log("PaymentGate Debug:", {
    subscriptionPlan,
    subscriptionPlanType: typeof subscriptionPlan,
    hasPaid,
    isAdmin,
    isAdminType: typeof isAdmin,
    isDeveloper,
    isDeveloperType: typeof isDeveloper,
    hasSeatAccess,
    seatsCount: seats?.length || 0,
    canAccess,
    section,
    isLoading,
    reason: canAccess
      ? hasPaid
        ? "PAID"
        : hasSeatAccess
          ? "SEAT_ACCESS"
          : isAdmin
            ? "ADMIN"
            : "DEVELOPER"
      : "SHOW_GATE",
  });

  // If user has paid or is admin, render children normally
  if (canAccess) {
    return <>{children}</>;
  }

  const sectionInfo = {
    insights: {
      title: "Insights & Analytics",
      description:
        "Unlock detailed insights, performance metrics, and advanced analytics for your repositories.",
      icon: Zap,
      features: [
        "Repository analytics",
        "Performance metrics",
        "Trend analysis",
        "Custom dashboards",
      ],
    },
    roadmap: {
      title: "Project Roadmap",
      description:
        "Access advanced project planning tools, timeline visualization, and strategic roadmapping.",
      icon: Users,
      features: [
        "Timeline visualization",
        "Strategic planning",
        "Milestone tracking",
        "Team collaboration",
      ],
    },
    analysis: {
      title: "Code Analysis",
      description:
        "Get deep code insights, dependency analysis, and comprehensive repository scanning.",
      icon: Zap,
      features: [
        "Deep code analysis",
        "Dependency mapping",
        "Security scanning",
        "Performance insights",
      ],
    },
    admin: {
      title: "Admin Dashboard",
      description:
        "Manage your enterprise, set up team seats, and configure advanced settings.",
      icon: Users,
      features: [
        "Team management",
        "Seat allocation",
        "Enterprise settings",
        "Billing management",
      ],
    },
  };

  const currentSection = sectionInfo[section];

  return (
    <div className="relative">
      {/* Blurred content underneath */}
      <div className="filter blur-sm pointer-events-none opacity-30">
        {children}
      </div>

      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-20">
        <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl p-8 max-w-md mx-4 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full"></div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-white/20">
              <Lock className="w-8 h-8 text-white/80" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3">
              {currentSection.title}
            </h2>

            {/* Description */}
            <p className="text-white/70 mb-6 text-sm leading-relaxed">
              {currentSection.description}
            </p>

            {/* Features */}
            <div className="mb-8">
              <h3 className="text-white/80 font-semibold mb-3 text-sm">
                What you&apos;ll get:
              </h3>
              <ul className="space-y-2">
                {currentSection.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-center gap-2 text-white/60 text-sm"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Seat Selection */}
            <div className="mb-6 w-full flex flex-col items-center justify-center">
              <label className="block text-white/80 text-sm font-medium mb-2 text-center w-full">
                Number of Seats
              </label>
              <div className="flex items-center justify-center gap-2 mb-3 w-full">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  size="sm"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  -
                </Button>
                <span className="text-white font-mono text-lg min-w-[3rem] text-center">
                  {quantity}
                </span>
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  variant="outline"
                  size="sm"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  +
                </Button>
              </div>
              <p className="text-white/50 text-xs text-center w-full">
                ${(quantity * 99.99).toFixed(2)}/month total
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => redirectToCheckout(quantity)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade to Pro ({quantity} seat{quantity > 1 ? "s" : ""})
              </Button>

              <Button
                onClick={() => router.push("/dashboard?section=billing")}
                variant="outline"
                className="w-full border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                View Plans & Pricing
              </Button>
            </div>

            {/* Admin note */}
            {section === "admin" && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-xs">
                  💡 <strong>Enterprise Tip:</strong> Admins can set up team
                  seats and manage billing for the entire organization.
                </p>
              </div>
            )}

            {/* Developer note */}
            {isDeveloper && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-300 text-xs">
                  🔧 <strong>Developer Access:</strong> You have special
                  developer access to all features.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
