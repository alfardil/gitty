// "use client";

// import { useState } from "react";
// import { Spinner } from "@/components/ui/neo/spinner";
// import { Button } from "@/components/ui/button";
// import { redirectToCheckout } from "@/lib/utils/stripe-checkout";

// export default function PaymentPage() {
//   const [loading, setLoading] = useState(false);
//   const [quantity, setQuantity] = useState(1);

//   // const handleSubscribe = async () => {
//   //   setLoading(true);
//   //   try {
//   //     await redirectToCheckout(quantity);
//   //   } catch (error) {
//   //     console.error("Error creating checkout session:", error);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
//       <div className="max-w-md mx-auto py-12 px-4 sm:px-0 flex flex-col items-center">
//         <div className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-8 flex flex-col items-center relative overflow-hidden group">
//           <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full"></div>

//           <div className="relative z-10 text-center">
//             <h1 className="text-3xl font-bold mb-6 text-white">
//               Manage Your Subscription
//             </h1>
//             <p className="text-white/60 mb-8 text-sm">
//               Upgrade to Pro to unlock advanced features and priority support
//             </p>

//             {/* Seat Selection */}
//             <div className="mb-6">
//               <label className="block text-white/80 text-sm font-medium mb-2">
//                 Number of Seats
//               </label>
//               <div className="flex items-center gap-2">
//                 <Button
//                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                   variant="outline"
//                   size="sm"
//                   className="text-white border-white/20 hover:bg-white/10"
//                 >
//                   -
//                 </Button>
//                 <span className="text-white font-mono text-lg min-w-[3rem] text-center">
//                   {quantity}
//                 </span>
//                 <Button
//                   onClick={() => setQuantity(quantity + 1)}
//                   variant="outline"
//                   size="sm"
//                   className="text-white border-white/20 hover:bg-white/10"
//                 >
//                   +
//                 </Button>
//               </div>
//               <p className="text-white/50 text-xs mt-1">
//                 ${(quantity * 99.99).toFixed(2)}/month total
//               </p>
//             </div>

//             <button
//               onClick={handleSubscribe}
//               disabled={loading}
//               className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-lg mb-4 flex items-center justify-center gap-2 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
//             >
//               {loading ? (
//                 <>
//                   <Spinner size="small" />
//                   Redirecting...
//                 </>
//               ) : (
//                 `Subscribe (${quantity} seat${quantity > 1 ? "s" : ""})`
//               )}
//             </button>

//             <div className="mt-6 text-xs text-white/40">
//               You&apos;ll be redirected to Stripe to complete your payment
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
