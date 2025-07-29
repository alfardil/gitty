import { useQuery } from "@tanstack/react-query";

interface UserProfileData {
  user: {
    id: string;
    githubUsername: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
    joinedAt: string;
    subscriptionPlan: string;
  };
  statistics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    pendingApprovalTasks: number;
    assignedTasks: number;
    createdTasks: number;
    completionRate: number;
    averageCompletionTime: number | null;
    priorityBreakdown: {
      high: number;
      medium: number;
      low: number;
    };
    overdueTasks: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    completedAt: string | null;
    createdAt: string;
    isAssignee: boolean;
    isCreator: boolean;
  }>;
  completionHistory: Array<{
    date: string;
    count: number;
  }>;
  assignmentHistory: Array<{
    id: string;
    taskId: string;
    assignedAt: string;
    unassignedAt: string | null;
    assignedBy: string;
    taskTitle: string;
  }>;
  enterprises: Array<{
    enterpriseId: string;
    enterpriseName: string;
  }>;
  enterpriseContext?: {
    enterpriseId: string;
    enterpriseName: string;
    isFiltered: boolean;
  } | null;
}

export function useUserProfile(userId: string | null, enterpriseId?: string) {
  return useQuery({
    queryKey: ["userProfile", userId, enterpriseId],
    queryFn: async (): Promise<UserProfileData> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const url = enterpriseId
        ? `/api/users/${userId}/profile?enterpriseId=${enterpriseId}`
        : `/api/users/${userId}/profile`;

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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
