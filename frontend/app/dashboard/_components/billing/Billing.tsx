"use client";
import { useUserStats } from "@/lib/hooks/api/useUserStats";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { Spinner } from "@/components/ui/neo/spinner";
import Link from "next/link";

const PLAN_DETAILS: Record<
  string,
  { price: string; label: string; features: string[]; description: string }
> = {
  FREE: {
    price: "$0",
    label: "FREE",
    features: ["Access to basic features", "Community support", "1 user"],
    description: "Upgrade to unlock more features and users.",
  },
  PRO: {
    price: "$20",
    label: "PRO",
    features: ["Priority support", "Up to 5 users", "Advanced analytics"],
    description: "You are on the PRO plan.",
  },
  ENTERPRISE: {
    price: "Custom",
    label: "ENTERPRISE",
    features: [
      "Everything in Pro, plus:",
      "Dedicated support",
      "Custom integrations",
      "Unlimited users",
    ],
    description: "Contact us for Enterprise features.",
  },
};

export function Billing() {
  const { user, loading } = useAuth();
  const { subscriptionPlan, error } = useUserStats(
    user ? user.id.toString() : ""
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary text-white">
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

  const currentPlan = subscriptionPlan?.toUpperCase() as
    | keyof typeof PLAN_DETAILS
    | undefined;
  const plan = currentPlan ? PLAN_DETAILS[currentPlan] : null;

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground py-8">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center">
          Billing
        </h2>
        {/* Current Plan Card */}
        {plan ? (
          <div className="bg-[#0a0a0a] border border-green-500/30 rounded-lg shadow-lg p-6 flex flex-col gap-2 relative overflow-hidden group">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-full"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-lg text-white/60">/ month</span>
              </div>
              <div className="text-white/60 mb-2 text-sm">
                Current plan:{" "}
                <span className="text-blue-400 font-semibold">
                  {plan.label}
                </span>
              </div>
              <ul className="text-white/70 text-sm mb-2 ml-4 list-disc">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              <div className="text-xs text-white/40 mt-2">
                {plan.description}
              </div>
            </div>
          </div>
        ) : (
          // SKELETON LOADING
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-6 h-[180px] animate-pulse flex flex-col gap-4">
            <div className="h-6 w-32 bg-white/20 rounded" />
            <div className="h-4 w-40 bg-white/20 rounded" />
            <div className="h-3 w-48 bg-white/20 rounded" />
            <div className="h-3 w-36 bg-white/20 rounded" />
            <div className="h-3 w-24 bg-white/20 rounded" />
          </div>
        )}
        {/* Pro Card with upgrade logic and Enterprise info as part of Pro card */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-6 flex flex-col gap-2 min-w-[220px] relative overflow-hidden group">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full"></div>

          <div className="relative z-10">
            <div className="text-white font-bold text-lg">Pro: $20/mo</div>
            <div className="text-white/60 text-sm">
              Everything in Member, plus:
            </div>
            <ul className="text-white/70 text-sm ml-4 list-disc">
              <li>Priority support</li>
              <li>Up to 5 users</li>
              <li>Advanced analytics</li>
            </ul>
            {subscriptionPlan !== "PRO" ? (
              <Link
                href="/payment"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a5 5 0 00-10 0v2M5 20h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"
                  />
                </svg>
                Upgrade Now!
              </Link>
            ) : (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111] text-white font-semibold text-sm opacity-60 cursor-not-allowed select-none border border-white/10"
                title="You are already on the PRO plan"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a5 5 0 00-10 0v2M5 20h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"
                  />
                </svg>
                You are on the PRO plan!
              </div>
            )}
            <div className="text-white font-bold text-lg mt-4">
              Enterprise: Let&apos;s talk!
            </div>
            <div className="text-white/60 text-sm">
              Everything in Pro, plus:
            </div>
            <ul className="text-white/70 text-sm ml-4 list-disc">
              <li>Dedicated support</li>
              <li>Custom integrations</li>
              <li>Unlimited users</li>
            </ul>
            <Link
              href="mailto:devboard.ai@gmail.com"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a5 5 0 00-10 0v2M5 20h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"
                />
              </svg>
              Contact Us
            </Link>
          </div>
        </div>
        <Link
          href="/payment"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a5 5 0 00-10 0v2M5 20h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"
            />
          </svg>
          Update Payment Method
        </Link>
      </div>
    </div>
  );
}
