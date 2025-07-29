"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useUserProfile } from "@/lib/hooks/api/useUserProfile";
import { useUserRecentTasks } from "@/lib/hooks/api/useUserRecentTasks";
import { useUserAssignmentHistory } from "@/lib/hooks/api/useUserAssignmentHistory";
import { useIsAdminOfAnyEnterprise } from "@/lib/hooks/business/useIsAdminOfAnyEnterprise";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { Spinner } from "@/components/ui/neo/spinner";
import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  User,
  Mail,
  Github,
  ArrowLeft,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const enterpriseId = searchParams.get("enterpriseId");

  const { user: currentUser } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } =
    useIsAdminOfAnyEnterprise(currentUser?.uuid);
  const {
    data: profile,
    isLoading,
    error,
  } = useUserProfile(userId, enterpriseId || undefined);

  // Pagination state
  const [recentTasksPage, setRecentTasksPage] = useState(1);
  const [assignmentHistoryPage, setAssignmentHistoryPage] = useState(1);

  // Paginated data queries
  const { data: recentTasksData, isLoading: recentTasksLoading } =
    useUserRecentTasks(userId, recentTasksPage, 5, enterpriseId || undefined);
  const { data: assignmentHistoryData, isLoading: assignmentHistoryLoading } =
    useUserAssignmentHistory(
      userId,
      assignmentHistoryPage,
      10,
      enterpriseId || undefined
    );

  // Show loading while checking admin status
  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-400 mb-4">
            Please log in to access this page.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Early access check for non-admin users
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">
            You don&apos;t have permission to view user profiles. Only
            enterprise admins can access this feature.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !profile) {
    // Check if it's an authorization error
    const isAuthError =
      error &&
      (error.message?.includes("403") ||
        error.message?.includes("Forbidden") ||
        error.message?.includes("Unauthorized"));

    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {isAuthError ? "Access Denied" : "Error Loading Profile"}
          </h1>
          <p className="text-gray-400 mb-4">
            {isAuthError
              ? "You don&apos;t have permission to view this user&apos;s profile. Only enterprise admins can access user profiles."
              : "Unable to load user profile data."}
          </p>
          <Link
            href="/dashboard?section=admin"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  const { user: profileUser, statistics, completionHistory } = profile;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "text-green-400";
      case "in_progress":
        return "text-yellow-400";
      case "pending_pr_approval":
        return "text-orange-400";
      case "not_started":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "pending_pr_approval":
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case "not_started":
        return <Target className="w-4 h-4 text-gray-400" />;
      default:
        return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatOverdueDays = (days: number) => {
    if (days < 1) return "Today";
    if (days === 1) return "1 day";
    if (days < 7) return `${Math.floor(days)} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days / 30)} months`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard?section=admin"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
          </div>

          {/* User Info Header */}
          <div className="flex items-center gap-6">
            {profileUser.avatarUrl && (
              <img
                src={profileUser.avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full border-2 border-[#2A2A2A]"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {profileUser.firstName && profileUser.lastName
                  ? `${profileUser.firstName} ${profileUser.lastName}`
                  : profileUser.githubUsername || "Unknown User"}
              </h1>
              <div className="flex items-center gap-6 text-gray-400">
                {profileUser.githubUsername && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    <span>@{profileUser.githubUsername}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profileUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {format(new Date(profileUser.joinedAt), "MMM yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="uppercase">
                    {profileUser.subscriptionPlan}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Filter Indicator */}
          {profile.enterpriseContext && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm font-medium">
                  Viewing insights for:{" "}
                  <span className="text-blue-200 font-semibold">
                    {profile.enterpriseContext.enterpriseName}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Tasks</h3>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {statistics.totalTasks}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {statistics.assignedTasks} assigned, {statistics.createdTasks}{" "}
              created
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Completion Rate</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {statistics.completionRate}%
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {statistics.completedTasks} of {statistics.totalTasks} completed
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Avg. Completion</h3>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {statistics.averageCompletionTime
                ? `${statistics.averageCompletionTime}d`
                : "N/A"}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Average days to complete
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overdue Tasks</h3>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {statistics.overdueTasks}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {statistics.overdueTasks > 0
                ? `${statistics.overdueTasks} task${statistics.overdueTasks === 1 ? "" : "s"} past due`
                : "All tasks on schedule"}
            </div>
          </div>
        </div>

        {/* Overdue Tasks Alert */}
        {statistics.overdueTasks > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-semibold text-red-400">
                Overdue Tasks Alert
              </h3>
            </div>
            <p className="text-gray-300 mb-4">
              {statistics.overdueTasks} task
              {statistics.overdueTasks === 1 ? "" : "s"}{" "}
              {statistics.overdueTasks === 1 ? "is" : "are"} currently overdue.
              Please review and update the status of these tasks.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                Last updated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        )}

        {/* Task Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              Task Status Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {statistics.completedTasks}
                  </span>
                  <span className="text-gray-400">
                    (
                    {statistics.totalTasks > 0
                      ? Math.round(
                          (statistics.completedTasks / statistics.totalTasks) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {statistics.inProgressTasks}
                  </span>
                  <span className="text-gray-400">
                    (
                    {statistics.totalTasks > 0
                      ? Math.round(
                          (statistics.inProgressTasks / statistics.totalTasks) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <span>Pending Approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {statistics.pendingApprovalTasks}
                  </span>
                  <span className="text-gray-400">
                    (
                    {statistics.totalTasks > 0
                      ? Math.round(
                          (statistics.pendingApprovalTasks /
                            statistics.totalTasks) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  <span>Not Started</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {statistics.notStartedTasks}
                  </span>
                  <span className="text-gray-400">
                    (
                    {statistics.totalTasks > 0
                      ? Math.round(
                          (statistics.notStartedTasks / statistics.totalTasks) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Priority Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>High Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {statistics.priorityBreakdown.high}
                  </span>
                  <span className="text-gray-400">
                    (
                    {statistics.assignedTasks > 0
                      ? Math.round(
                          (statistics.priorityBreakdown.high /
                            statistics.assignedTasks) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>Medium Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {statistics.priorityBreakdown.medium}
                  </span>
                  <span className="text-gray-400">
                    (
                    {statistics.assignedTasks > 0
                      ? Math.round(
                          (statistics.priorityBreakdown.medium /
                            statistics.assignedTasks) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Low Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {statistics.priorityBreakdown.low}
                  </span>
                  <span className="text-gray-400">
                    (
                    {statistics.assignedTasks > 0
                      ? Math.round(
                          (statistics.priorityBreakdown.low /
                            statistics.assignedTasks) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Recent Tasks</h3>
          <div className="space-y-3 min-h-[400px]">
            {recentTasksLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="medium" />
              </div>
            ) : recentTasksData?.tasks && recentTasksData.tasks.length > 0 ? (
              <>
                {recentTasksData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border ${
                      task.isOverdue
                        ? "border-red-500/50 bg-red-500/5"
                        : "border-[#2A2A2A]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-400">
                          {task.isAssignee ? "Assigned" : "Created"} •{" "}
                          {format(new Date(task.createdAt), "MMM d, yyyy")}
                          {task.dueDate && (
                            <span
                              className={
                                task.isOverdue ? "text-red-400 font-medium" : ""
                              }
                            >
                              {task.isOverdue
                                ? ` • Overdue ${formatOverdueDays(task.daysOverdue)}`
                                : ` • Due ${format(new Date(task.dueDate), "MMM d, yyyy")}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.isOverdue && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                          OVERDUE
                        </span>
                      )}
                      <span
                        className={`text-sm ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`text-sm ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Fill remaining space with empty slots to maintain consistent height */}
                {Array.from({
                  length: Math.max(0, 5 - recentTasksData.tasks.length),
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A] opacity-20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-4 bg-gray-700 rounded"></div>
                      <div className="w-12 h-4 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No recent tasks found
              </div>
            )}

            {/* Pagination Controls */}
            {recentTasksData?.pagination &&
              recentTasksData.pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#2A2A2A]">
                  <div className="text-sm text-gray-400">
                    Page {recentTasksData.pagination.page} of{" "}
                    {recentTasksData.pagination.totalPages}(
                    {recentTasksData.pagination.total} total tasks)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setRecentTasksPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={!recentTasksData.pagination.hasPrevPage}
                      className="px-3 py-1 text-sm bg-[#2A2A2A] text-white rounded hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setRecentTasksPage((prev) => prev + 1)}
                      disabled={!recentTasksData.pagination.hasNextPage}
                      className="px-3 py-1 text-sm bg-[#2A2A2A] text-white rounded hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Assignment History */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Assignment History</h3>
          <div className="space-y-3 min-h-[400px]">
            {assignmentHistoryLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="medium" />
              </div>
            ) : assignmentHistoryData?.assignments &&
              assignmentHistoryData.assignments.length > 0 ? (
              <>
                {assignmentHistoryData.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A]"
                  >
                    <div className="flex items-center gap-4">
                      <Zap className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-medium">
                          {assignment.taskTitle}
                        </div>
                        <div className="text-sm text-gray-400">
                          Assigned{" "}
                          {format(
                            new Date(assignment.assignedAt),
                            "MMM d, yyyy"
                          )}
                          {assignment.unassignedAt &&
                            ` • Unassigned ${format(new Date(assignment.unassignedAt), "MMM d, yyyy")}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      by {assignment.assignedBy}
                    </div>
                  </div>
                ))}
                {/* Fill remaining space with empty slots to maintain consistent height */}
                {Array.from({
                  length: Math.max(
                    0,
                    10 - assignmentHistoryData.assignments.length
                  ),
                }).map((_, index) => (
                  <div
                    key={`empty-assignment-${index}`}
                    className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A] opacity-20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="w-16 h-4 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No assignment history found
              </div>
            )}

            {/* Pagination Controls */}
            {assignmentHistoryData?.pagination &&
              assignmentHistoryData.pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#2A2A2A]">
                  <div className="text-sm text-gray-400">
                    Page {assignmentHistoryData.pagination.page} of{" "}
                    {assignmentHistoryData.pagination.totalPages}(
                    {assignmentHistoryData.pagination.total} total assignments)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setAssignmentHistoryPage((prev) =>
                          Math.max(1, prev - 1)
                        )
                      }
                      disabled={!assignmentHistoryData.pagination.hasPrevPage}
                      className="px-3 py-1 text-sm bg-[#2A2A2A] text-white rounded hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setAssignmentHistoryPage((prev) => prev + 1)
                      }
                      disabled={!assignmentHistoryData.pagination.hasNextPage}
                      className="px-3 py-1 text-sm bg-[#2A2A2A] text-white rounded hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
