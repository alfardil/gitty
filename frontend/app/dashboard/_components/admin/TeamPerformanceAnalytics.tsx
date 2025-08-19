"use client";

import React from "react";
import { useTeamPerformanceAnalytics } from "@/lib/hooks/api/useTeamPerformanceAnalytics";
import { Spinner } from "@/components/ui/neo/spinner";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
} from "lucide-react";

interface TeamPerformanceAnalyticsProps {
  enterpriseId: string;
}

export function TeamPerformanceAnalytics({
  enterpriseId,
}: TeamPerformanceAnalyticsProps) {
  const router = useRouter();
  const {
    data: analytics,
    isLoading,
    error,
  } = useTeamPerformanceAnalytics(enterpriseId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-semibold text-red-400">
            Error Loading Analytics
          </h3>
        </div>
        <p className="text-gray-300">
          Failed to load team performance analytics. Please try again later.
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-gray-400 py-8">
        No analytics data available
      </div>
    );
  }

  const { teamMetrics, userPerformance, totalUsers, activeUsers } = analytics;

  return (
    <div className="space-y-8">
      {/* Header with {} styling */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white/30 font-mono text-lg">{"{"}</span>
          <div>
            <h3 className="text-lg font-mono text-white/90 tracking-wide mb-1">
              enterprise_performance_analytics
            </h3>
            <p className="text-xs font-mono text-white/50 tracking-wider">
              insights_for_enterprise_timeline_predictions
            </p>
          </div>
          <span className="text-white/30 font-mono text-lg">{"}"}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
            <span>{totalUsers} total_users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
            <span>{activeUsers} active</span>
          </div>
        </div>
      </div>

      {/* Team Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono text-white/60 tracking-wider uppercase">
              completion_rate
            </h4>
            <div className="w-2 h-2 bg-green-500/60 rounded-full"></div>
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {teamMetrics.averageCompletionRate.toFixed(1)}%
          </div>
          <div className="text-xs font-mono text-white/40">
            enterprise_average
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono text-white/60 tracking-wider uppercase">
              task_velocity
            </h4>
            <div className="w-2 h-2 bg-blue-500/60 rounded-full"></div>
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {teamMetrics.averageTaskVelocity.toFixed(1)}
          </div>
          <div className="text-xs font-mono text-white/40">tasks_per_month</div>
        </div>

        <div className="bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono text-white/60 tracking-wider uppercase">
              avg_time
            </h4>
            <div className="w-2 h-2 bg-yellow-500/60 rounded-full"></div>
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {teamMetrics.averageTimeToComplete > 0
              ? `${teamMetrics.averageTimeToComplete.toFixed(1)}h`
              : "N/A"}
          </div>
          <div className="text-xs font-mono text-white/40">per_task</div>
        </div>

        <div className="bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono text-white/60 tracking-wider uppercase">
              complexity
            </h4>
            <div className="w-2 h-2 bg-purple-500/60 rounded-full"></div>
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {teamMetrics.averageTaskComplexity.toFixed(1)}
          </div>
          <div className="text-xs font-mono text-white/40">avg_difficulty</div>
        </div>
      </div>

      {/* Task Status Overview */}
      <div className="bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-white/30 font-mono text-sm">{"{"}</span>
          <h4 className="text-sm font-mono text-white/80 tracking-wide">
            enterprise_task_status_overview
          </h4>
          <span className="text-white/30 font-mono text-sm">{"}"}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
              <div className="w-1.5 h-1.5 bg-green-500/60 rounded-full"></div>
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-white">
                {teamMetrics.totalTasksCompleted}
              </div>
              <div className="text-xs font-mono text-white/50 tracking-wider">
                completed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
              <div className="w-1.5 h-1.5 bg-blue-500/60 rounded-full"></div>
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-white">
                {teamMetrics.totalTasksInProgress}
              </div>
              <div className="text-xs font-mono text-white/50 tracking-wider">
                in_progress
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
              <div className="w-1.5 h-1.5 bg-red-500/60 rounded-full"></div>
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-white">
                {teamMetrics.totalTasksOverdue}
              </div>
              <div className="text-xs font-mono text-white/50 tracking-wider">
                overdue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Performance */}
      <div className="bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-white/30 font-mono text-sm">{"{"}</span>
          <h4 className="text-sm font-mono text-white/80 tracking-wide">
            enterprise_individual_performance
          </h4>
          <span className="text-white/30 font-mono text-sm">{"}"}</span>
        </div>
        <div className="space-y-3">
          {userPerformance.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-black/30 hover:border-white/20 transition-all cursor-pointer"
              onClick={() =>
                router.push(
                  `/users/${user.userId}?enterpriseId=${enterpriseId}`
                )
              }
            >
              <div className="flex items-center gap-4">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-white/10"
                  />
                )}
                <div>
                  <div className="font-mono font-medium text-white/90 text-sm">
                    {user.username}
                  </div>
                  <div className="text-xs font-mono text-white/50 tracking-wider">
                    {user.tasksCompleted} completed • {user.tasksInProgress}{" "}
                    in_progress
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono">
                <div className="text-center">
                  <div className="font-bold text-white">
                    {user.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-white/50 tracking-wider">completion</div>
                </div>

                <div className="text-center">
                  <div className="font-bold text-white">
                    {user.taskVelocity.toFixed(1)}
                  </div>
                  <div className="text-white/50 tracking-wider">velocity</div>
                </div>

                <div className="text-center">
                  <div className="font-bold text-white">
                    {user.averageTimeToComplete > 0
                      ? `${user.averageTimeToComplete.toFixed(1)}h`
                      : "N/A"}
                  </div>
                  <div className="text-white/50 tracking-wider">avg_time</div>
                </div>

                {user.tasksOverdue > 0 && (
                  <div className="text-center">
                    <div className="font-bold text-red-400">
                      {user.tasksOverdue}
                    </div>
                    <div className="text-white/50 tracking-wider">overdue</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
