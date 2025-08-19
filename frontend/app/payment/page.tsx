"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/neo/spinner";

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    window.location.href =
      "https://buy.stripe.com/test_dRmcN764M3KwbSW0Ho6wE03";
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto py-12 px-4 sm:px-0 flex flex-col items-center">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-8 flex flex-col items-center relative overflow-hidden group">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full"></div>

          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-bold mb-6 text-white">
              Manage Your Subscription
            </h1>
            <p className="text-white/60 mb-8 text-sm">
              Upgrade to Pro to unlock advanced features and priority support
            </p>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-lg mb-4 flex items-center justify-center gap-2 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              {loading ? (
                <>
                  <Spinner size="small" />
                  Redirecting...
                </>
              ) : (
                "Subscribe"
              )}
            </button>

            <div className="mt-6 text-xs text-white/40">
              You'll be redirected to Stripe to complete your payment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
