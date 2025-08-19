import { useQuery } from "@tanstack/react-query";

interface TeamMetrics {
  averageCompletionRate: number;
  averageTaskVelocity: number;
  averageTaskComplexity: number;
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  totalTasksOverdue: number;
  averageTimeToComplete: number;
}

interface UserPerformance {
  userId: string;
  username: string;
  avatarUrl: string | null;
  completionRate: number;
  taskVelocity: number;
  averageTaskComplexity: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOverdue: number;
  averageTimeToComplete: number;
  lastActiveAt: string | null;
}

interface PerformanceTrends {
  weeklyVelocity: Array<{
    week: string;
    tasksCompleted: number;
    averageTimeToComplete: number;
  }>;
  monthlyCompletionRates: Array<{
    month: string;
    completionRate: number;
    totalTasks: number;
  }>;
}

interface TeamPerformanceAnalytics {
  enterpriseId: string;
  totalUsers: number;
  activeUsers: number;
  teamMetrics: TeamMetrics;
  userPerformance: UserPerformance[];
  performanceTrends: PerformanceTrends;
}

const fetchTeamPerformanceAnalytics = async (
  enterpriseId: string
): Promise<TeamPerformanceAnalytics> => {
  const params = new URLSearchParams({ enterpriseId });

  const response = await fetch(
    `/api/admin?action=getTeamPerformanceAnalytics&${params}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch team performance analytics");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch team performance analytics");
  }

  return data.data;
};

export function useTeamPerformanceAnalytics(enterpriseId: string | null) {
  return useQuery({
    queryKey: ["team-performance-analytics", enterpriseId],
    queryFn: () => fetchTeamPerformanceAnalytics(enterpriseId!),
    enabled: !!enterpriseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
