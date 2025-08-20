import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/types/business/User";

export function useRedeemInviteCode(user: User) {
  const queryClient = useQueryClient();
  const [redeemCode, setRedeemCode] = useState("");

  // Redeem Invite Code Mutation - tries both subscription seats and enterprise invites
  const redeemInviteMutation = useMutation({
    mutationFn: async () => {
      console.log("🔍 Attempting to redeem invite code:", redeemCode);

      // First, try to redeem as a subscription seat invite code
      try {
        console.log("🪑 Trying subscription seat redemption...");
        const seatResponse = await fetch("/api/subscription-seats/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteCode: redeemCode,
          }),
        });

        if (seatResponse.ok) {
          const seatData = await seatResponse.json();
          if (seatData.success) {
            console.log("✅ Successfully redeemed as subscription seat invite");
            return { type: "subscription_seat", data: seatData };
          }
        }
      } catch (error) {
        // Continue to try enterprise invite if subscription seat fails
        console.log(
          "❌ Subscription seat redemption failed, trying enterprise invite..."
        );
      }

      // If subscription seat redemption failed, try enterprise invite code
      try {
        console.log("🏢 Trying enterprise invite redemption...");
        const enterpriseResponse = await fetch("/api/developer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "redeemInviteCode",
            code: redeemCode,
            userId: user.uuid,
          }),
        });

        if (enterpriseResponse.ok) {
          const enterpriseData = await enterpriseResponse.json();
          if (enterpriseData.success) {
            console.log("✅ Successfully redeemed as enterprise invite");
            return { type: "enterprise", data: enterpriseData };
          }
        }

        // If enterprise response was not ok, throw the error
        if (!enterpriseResponse.ok) {
          const errorData = await enterpriseResponse.json();
          throw new Error(
            errorData.error || "Failed to redeem enterprise invite code"
          );
        }
      } catch (error) {
        throw new Error("Failed to redeem invite code");
      }

      throw new Error("Invalid or expired invite code");
    },
    onSuccess: (result) => {
      setRedeemCode("");

      if (result.type === "subscription_seat") {
        toast.success("Successfully redeemed subscription seat invite!");
        // Invalidate user stats to refresh subscription plan
        queryClient.invalidateQueries({ queryKey: ["user-stats"] });
        // Also invalidate auth validation to refresh user data
        queryClient.invalidateQueries({ queryKey: ["auth"] });
      } else if (result.type === "enterprise") {
        const role = result.data.data?.role;
        if (role === "admin") {
          toast.success("Successfully joined enterprise as admin!");
        } else if (role === "member") {
          toast.success("Successfully joined enterprise as member!");
        } else {
          toast.success("Successfully joined enterprise!");
        }
        // Invalidate enterprise-related queries
        queryClient.invalidateQueries({ queryKey: ["admin-enterprises"] });
        queryClient.invalidateQueries({ queryKey: ["enterprise-users"] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to redeem invite code");
    },
  });

  return {
    redeemCode,
    setRedeemCode,
    redeemResult: redeemInviteMutation.data,
    redeemInviteLoading: redeemInviteMutation.isPending,
    handleRedeemInvite: redeemInviteMutation.mutate,
  };
}
