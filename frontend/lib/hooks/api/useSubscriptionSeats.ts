import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SeatAssignment } from "@/lib/services/subscription-seats";

export function useSubscriptionSeats(enterpriseId?: string) {
  return useQuery({
    queryKey: ["subscription-seats", enterpriseId],
    queryFn: async (): Promise<SeatAssignment[]> => {
      const url = enterpriseId
        ? `/api/subscription-seats?enterpriseId=${enterpriseId}`
        : "/api/subscription-seats";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch subscription seats");
      }
      const data = await response.json();
      return data.seats;
    },
    enabled: true, // Always fetch, but filter by enterprise if provided
  });
}

export function useAssignSeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      seatId,
      userId,
    }: {
      seatId: string;
      userId: string;
    }) => {
      const response = await fetch(`/api/subscription-seats/${seatId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign seat");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-seats"] });
    },
  });
}

export function useUnassignSeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seatId: string) => {
      const response = await fetch(
        `/api/subscription-seats/${seatId}/unassign`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unassign seat");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-seats"] });
    },
  });
}
