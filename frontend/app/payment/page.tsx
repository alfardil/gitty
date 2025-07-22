"use client";

import { useState } from "react";

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price_id: "price_1RnOzmRwByLP4b065nOWSVwa" }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError("Failed to create checkout session");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#181A20] text-white">
      <h1 className="text-3xl font-bold mb-6">Manage Your Subscription</h1>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="px-6 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition text-lg mb-4"
      >
        {loading ? "Redirecting..." : "Subscribe"}
      </button>
      {error && <div className="text-red-400 mt-2">{error}</div>}
    </div>
  );
}
