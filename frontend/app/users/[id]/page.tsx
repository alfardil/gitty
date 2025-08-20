"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useUserProfile } from "@/lib/hooks/api/useUserProfile";
import { useUserRecentTasks } from "@/lib/hooks/api/useUserRecentTasks";
import { useIsAdminOfAnyEnterprise } from "@/lib/hooks/business/useIsAdminOfAnyEnterprise";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { Spinner } from "@/components/ui/neo/spinner";
import { Skeleton } from "@/components/ui/skeleton";
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
  Menu,
  FileSearch,
} from "lucide-react";
import Link from "next/link";
import { AIInsightsSection } from "./_components/AIInsightsSection";
import { Sidebar } from "@/app/dashboard/_components/Sidebar";
import { useSidebarState } from "@/lib/hooks/ui/useSidebarState";

// Skeleton components for loading states
const RecentTasksSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10 min-h-[80px]"
      >
        <div className="flex items-center gap-4">
          <Skeleton width={20} height={20} rounded="full" />
          <div className="flex-1">
            <Skeleton width="60%" height={20} className="mb-2" />
            <Skeleton width="80%" height={16} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width={70} height={16} />
          <Skeleton width={90} height={16} />
        </div>
      </div>
    ))}
  </div>
);

export default function UserProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const enterpriseId = searchParams.get("enterpriseId");

  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } =
    useIsAdminOfAnyEnterprise(currentUser?.uuid);
  const {
    data: profile,
    isLoading,
    error,
  } = useUserProfile(userId, enterpriseId || undefined);

  // Sidebar state
  const { sidebarOpen, setSidebarOpen, sidebarMobile, setSidebarMobile } =
    useSidebarState();

  // Pagination state
  const [recentTasksPage, setRecentTasksPage] = useState(1);

  // Paginated data queries
  const { data: recentTasksData, isLoading: recentTasksLoading } =
    useUserRecentTasks(userId, recentTasksPage, 5, enterpriseId || undefined);

  // Show loading while checking admin status
  if (isAdminLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-300 mb-4">
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
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-300 mb-4">
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
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">
            {isAuthError ? "Access Denied" : "Error Loading Profile"}
          </h1>
          <p className="text-gray-300 mb-4">
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
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar
        user={currentUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarMobile={sidebarMobile}
        setSidebarMobile={setSidebarMobile}
        showSection="admin"
        handleSidebarNav={() => {}}
        logout={logout}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <header className="flex items-center justify-between w-full px-4 md:px-8 py-4 bg-transparent">
          <div className="flex items-center gap-3 w-full">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setSidebarMobile(true)}
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full">
          {/* Header */}
          <div className="border-b border-white/10 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* User Info Header */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {profileUser.avatarUrl ? (
                    <img
                      src={profileUser.avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full border border-white/10 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border border-white/10 bg-[#0a0a0a] flex items-center justify-center shadow-lg">
                      <User className="w-12 h-12 text-white/60" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3 text-white font-mono tracking-wide">
                    {profileUser.firstName && profileUser.lastName
                      ? `${profileUser.firstName} ${profileUser.lastName}`
                      : profileUser.githubUsername || "Unknown User"}
                  </h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white/70">
                    {profileUser.githubUsername && (
                      <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-white/10">
                        <Github className="w-4 h-4 text-blue-400" />
                        <span className="font-medium font-mono text-sm tracking-wide">
                          @{profileUser.githubUsername}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-white/10">
                      <Mail className="w-4 h-4 text-green-400" />
                      <span className="font-medium font-mono text-xs tracking-wide truncate">{profileUser.email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-white/10">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="font-medium font-mono text-sm tracking-wide">
                        Joined{" "}
                        {format(new Date(profileUser.joinedAt), "MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 shadow-lg relative overflow-hidden group">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white font-mono tracking-wide">
                      Total Tasks
                    </h3>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2 font-mono">
                    {statistics.totalTasks}
                  </div>
                  <div className="text-sm text-white/60 font-mono tracking-wide">
                    {statistics.assignedTasks} assigned,{" "}
                    {statistics.createdTasks} created
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 shadow-lg relative overflow-hidden group">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-full"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white font-mono tracking-wide">
                      Completion Rate
                    </h3>
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2 font-mono">
                    {statistics.completionRate}%
                  </div>
                  <div className="text-sm text-white/60 font-mono tracking-wide">
                    {statistics.completedTasks} of {statistics.totalTasks}{" "}
                    completed
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 shadow-lg relative overflow-hidden group">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/5 to-transparent rounded-full"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white font-mono tracking-wide">
                      Avg. Completion
                    </h3>
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2 font-mono">
                    {statistics.averageCompletionTime
                      ? `${statistics.averageCompletionTime}d`
                      : "N/A"}
                  </div>
                  <div className="text-sm text-white/60 font-mono tracking-wide">
                    Average days to complete
                  </div>
                </div>
              </div>

              <div
                className={`bg-[#0a0a0a] border rounded-lg p-6 hover:border-white/20 transition-all duration-300 shadow-lg relative overflow-hidden group ${
                  statistics.overdueTasks > 0
                    ? "border-red-500/40"
                    : "border-white/10"
                }`}
              >
                {/* Background accent */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-full ${
                    statistics.overdueTasks > 0
                      ? "from-red-500/10 to-transparent"
                      : "from-red-500/5 to-transparent"
                  }`}
                ></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-semibold font-mono tracking-wide ${
                        statistics.overdueTasks > 0
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      Overdue Tasks
                    </h3>
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                        statistics.overdueTasks > 0
                          ? "bg-red-500/20 border-red-500/30"
                          : "bg-red-500/10 border-red-500/20"
                      }`}
                    >
                      <AlertCircle
                        className={`w-6 h-6 ${
                          statistics.overdueTasks > 0
                            ? "text-red-300"
                            : "text-red-400"
                        }`}
                      />
                    </div>
                  </div>
                  <div
                    className={`text-4xl font-bold mb-2 font-mono ${
                      statistics.overdueTasks > 0
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {statistics.overdueTasks}
                  </div>
                  <div className="text-sm text-white/60 font-mono tracking-wide">
                    {statistics.overdueTasks > 1
                      ? `${statistics.overdueTasks} tasks past due`
                      : statistics.overdueTasks === 1
                        ? "1 task past due"
                        : "All tasks on schedule"}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="mb-8">
              <AIInsightsSection
                userId={userId}
                enterpriseId={enterpriseId || undefined}
                projectId={searchParams.get("projectId") || undefined}
              />
            </div>

            {/* Task Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 shadow-lg">
                <h3 className="text-xl font-semibold mb-6 text-white font-mono tracking-wide">
                  Task Status Breakdown
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <span className="font-medium text-white font-mono tracking-wide">Completed</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white font-mono">
                        {statistics.completedTasks}
                      </span>
                      <span className="text-sm text-white/60 bg-[#0a0a0a] px-2 py-1 rounded font-mono">
                        {statistics.totalTasks > 0
                          ? Math.round(
                              (statistics.completedTasks /
                                statistics.totalTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
                        <Clock className="w-6 h-6 text-yellow-400" />
                      </div>
                      <span className="font-medium text-white font-mono tracking-wide">
                        In Progress
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white font-mono">
                        {statistics.inProgressTasks}
                      </span>
                      <span className="text-sm text-white/60 bg-[#0a0a0a] px-2 py-1 rounded font-mono">
                        {statistics.totalTasks > 0
                          ? Math.round(
                              (statistics.inProgressTasks /
                                statistics.totalTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20">
                        <AlertCircle className="w-6 h-6 text-orange-400" />
                      </div>
                      <span className="font-medium text-white font-mono tracking-wide">
                        Pending Approval
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white font-mono">
                        {statistics.pendingApprovalTasks}
                      </span>
                      <span className="text-sm text-white/60 bg-[#0a0a0a] px-2 py-1 rounded font-mono">
                        {statistics.totalTasks > 0
                          ? Math.round(
                              (statistics.pendingApprovalTasks /
                                statistics.totalTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                        <Target className="w-6 h-6 text-white/60" />
                      </div>
                      <span className="font-medium text-white font-mono tracking-wide">
                        Not Started
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white font-mono">
                        {statistics.notStartedTasks}
                      </span>
                      <span className="text-sm text-white/60 bg-[#0a0a0a] px-2 py-1 rounded font-mono">
                        {statistics.totalTasks > 0
                          ? Math.round(
                              (statistics.notStartedTasks /
                                statistics.totalTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 shadow-lg">
                <h3 className="text-xl font-semibold mb-6 text-white font-mono tracking-wide">
                  Priority Breakdown
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      </div>
                      <span className="font-medium text-white font-mono tracking-wide">
                        High Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white font-mono">
                        {statistics.priorityBreakdown.high}
                      </span>
                      <span className="text-sm text-white/60 bg-[#0a0a0a] px-2 py-1 rounded font-mono">
                        {statistics.assignedTasks > 0
                          ? Math.round(
                              (statistics.priorityBreakdown.high /
                                statistics.assignedTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      </div>
                      <span className="font-medium text-white font-mono tracking-wide">
                        Medium Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white font-mono">
                        {statistics.priorityBreakdown.medium}
                      </span>
                      <span className="text-sm text-white/60 bg-[#0a0a0a] px-2 py-1 rounded font-mono">
                        {statistics.assignedTasks > 0
                          ? Math.round(
                              (statistics.priorityBreakdown.medium /
                                statistics.assignedTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <span className="font-medium text-white font-mono tracking-wide">
                        Low Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white font-mono">
                        {statistics.priorityBreakdown.low}
                      </span>
                      <span className="text-sm text-white/60 bg-[#0a0a0a] px-2 py-1 rounded font-mono">
                        {statistics.assignedTasks > 0
                          ? Math.round(
                              (statistics.priorityBreakdown.low /
                                statistics.assignedTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-mono tracking-wide">
                Recent Tasks
              </h3>
              <div className="space-y-3">
                {recentTasksData?.tasks &&
                  recentTasksData.tasks.length > 0 ? (
                  <>
                    {recentTasksData.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-all duration-200 hover:border-white/20 ${
                          task.isOverdue
                            ? "border-red-500/50 bg-red-500/5"
                            : "border-white/10 bg-[#111111]"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-white font-mono tracking-wide truncate">
                                {task.title}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-mono tracking-wide rounded ${
                                task.complexity && task.complexity >= 4
                                  ? "bg-red-500/20 text-red-400"
                                  : task.complexity && task.complexity >= 3
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-300"
                              }`}>
                                {task.complexity}/5
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-white/60">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimatedHours}h</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileSearch className="w-3 h-3" />
                                <span>{task.taskType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {task.isOverdue && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-mono tracking-wide rounded">
                                Overdue
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-mono tracking-wide rounded ${
                              task.priority === "high"
                                ? "bg-red-500/20 text-red-400"
                                : task.priority === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-300"
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-mono tracking-wide rounded ${
                              task.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : task.status === "in_progress"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center text-white/40 py-8 font-mono tracking-wide">
                    No recent tasks found
                  </div>
                )}
              </div>
            </div>

            {/* Page Info - Centered at bottom */}
            {recentTasksData?.pagination &&
              recentTasksData.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6 pt-4 border-t border-white/10">
                  <div className="text-sm text-white/60 font-mono tracking-wide">
                    Page {recentTasksData.pagination.page} of{" "}
                    {recentTasksData.pagination.totalPages} (
                    {recentTasksData.pagination.total} total tasks)
                  </div>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}
