import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useInviteCodes() {
  return useQuery({
    queryKey: ["invite-codes"],
    queryFn: async () => {
      const response = await fetch("/api/subscription-seats/invite-codes");
      if (!response.ok) {
        throw new Error("Failed to fetch invite codes");
      }
      const data = await response.json();
      return data.inviteCodes;
    },
  });
}

export function useRedeemInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await fetch("/api/subscription-seats/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to redeem invite code");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Invite code redeemed successfully!");
      queryClient.invalidateQueries({ queryKey: ["subscription-seats"] });
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

