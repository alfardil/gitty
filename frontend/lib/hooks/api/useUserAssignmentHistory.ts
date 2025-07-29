import { useQuery } from "@tanstack/react-query";

interface AssignmentHistoryItem {
  id: string;
  taskId: string;
  assignedAt: string;
  unassignedAt: string | null;
  assignedBy: string;
  taskTitle: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AssignmentHistoryResponse {
  assignments: AssignmentHistoryItem[];
  pagination: PaginationInfo;
}

export function useUserAssignmentHistory(
  userId: string | null,
  page: number = 1,
  limit: number = 10,
  enterpriseId?: string
) {
  return useQuery({
    queryKey: ["userAssignmentHistory", userId, page, limit, enterpriseId],
    queryFn: async (): Promise<AssignmentHistoryResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const url = enterpriseId
        ? `/api/users/${userId}/assignment-history?page=${page}&limit=${limit}&enterpriseId=${enterpriseId}`
        : `/api/users/${userId}/assignment-history?page=${page}&limit=${limit}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
