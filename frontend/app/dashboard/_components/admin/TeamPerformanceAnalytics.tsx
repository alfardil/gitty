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
  projectId?: string;
}

export function TeamPerformanceAnalytics({
  enterpriseId,
  projectId,
}: TeamPerformanceAnalyticsProps) {
  const router = useRouter();
  const {
    data: analytics,
    isLoading,
    error,
  } = useTeamPerformanceAnalytics(enterpriseId, projectId);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Team Performance Analytics
          </h3>
          <p className="text-gray-400">
            Insights for timeline predictions and project planning
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{totalUsers} total users</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>{activeUsers} active</span>
          </div>
        </div>
      </div>

      {/* Team Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Completion Rate</h4>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {teamMetrics.averageCompletionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400 mt-2">Team average</div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Task Velocity</h4>
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {teamMetrics.averageTaskVelocity.toFixed(1)}
          </div>
          <div className="text-sm text-gray-400 mt-2">Tasks per month</div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Avg. Time</h4>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {teamMetrics.averageTimeToComplete > 0
              ? `${teamMetrics.averageTimeToComplete.toFixed(1)}h`
              : "N/A"}
          </div>
          <div className="text-sm text-gray-400 mt-2">Per task</div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Complexity</h4>
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {teamMetrics.averageTaskComplexity.toFixed(1)}
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Avg. difficulty (1-5)
          </div>
        </div>
      </div>

      {/* Task Status Overview */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Task Status Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {teamMetrics.totalTasksCompleted}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {teamMetrics.totalTasksInProgress}
              </div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {teamMetrics.totalTasksOverdue}
              </div>
              <div className="text-sm text-gray-400">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Performance */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Individual Performance</h4>
        <div className="space-y-4">
          {userPerformance.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
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
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-white">{user.username}</div>
                  <div className="text-sm text-gray-400">
                    {user.tasksCompleted} completed • {user.tasksInProgress} in
                    progress
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-white">
                    {user.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-gray-400">Completion</div>
                </div>

                <div className="text-center">
                  <div className="font-semibold text-white">
                    {user.taskVelocity.toFixed(1)}
                  </div>
                  <div className="text-gray-400">Velocity</div>
                </div>

                <div className="text-center">
                  <div className="font-semibold text-white">
                    {user.averageTimeToComplete > 0
                      ? `${user.averageTimeToComplete.toFixed(1)}h`
                      : "N/A"}
                  </div>
                  <div className="text-gray-400">Avg. Time</div>
                </div>

                {user.tasksOverdue > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-red-400">
                      {user.tasksOverdue}
                    </div>
                    <div className="text-gray-400">Overdue</div>
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
