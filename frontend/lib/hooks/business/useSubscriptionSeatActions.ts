import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/types/business/User";

export function useSubscriptionSeatActions(user: User) {
  const queryClient = useQueryClient();
  const [redeemCode, setRedeemCode] = useState("");

  // Redeem Subscription Seat Invite Mutation
  const redeemInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subscription-seats/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: redeemCode,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to redeem invite code");
      }

      const data = await res.json();
      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Successfully redeemed subscription seat invite!");
      return data;
    },
    onSuccess: () => {
      setRedeemCode("");
      // Invalidate user stats to refresh subscription plan
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      // Also invalidate auth validation to refresh user data
      queryClient.invalidateQueries({ queryKey: ["auth"] });
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
