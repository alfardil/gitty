import { useQuery } from "@tanstack/react-query";

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  isAssignee: boolean;
  isCreator: boolean;
  isOverdue: boolean;
  daysOverdue: number;
  estimatedHours?: number;
  complexity?: number;
  taskType?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RecentTasksResponse {
  tasks: RecentTask[];
  pagination: PaginationInfo;
}

export function useUserRecentTasks(
  userId: string | null,
  page: number = 1,
  limit: number = 5,
  enterpriseId?: string
) {
  return useQuery({
    queryKey: ["userRecentTasks", userId, page, limit, enterpriseId],
    queryFn: async (): Promise<RecentTasksResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const url = enterpriseId
        ? `/api/users/${userId}/recent-tasks?page=${page}&limit=${limit}&enterpriseId=${enterpriseId}`
        : `/api/users/${userId}/recent-tasks?page=${page}&limit=${limit}`;

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
