import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
} from "lucide-react";

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  estimatedHours: number;
  actualHours: number;
  startedAt: string;
  completedAt?: string;
  estimationAccuracy: number;
  status: string;
  assigneeName: string;
}

interface TimeAnalytics {
  totalEstimatedHours: number;
  totalActualHours: number;
  averageEstimationAccuracy: number;
  tasksWithTimeTracking: number;
  averageTimePerTask: number;
  estimationTrend: "improving" | "declining" | "stable";
}

interface TimeTrackingDashboardProps {
  enterpriseId: string;
  projectId?: string;
}

const fetchTimeTrackingData = async (
  enterpriseId: string,
  projectId?: string
): Promise<{
  analytics: TimeAnalytics;
  entries: TimeEntry[];
}> => {
  const params = new URLSearchParams({ enterpriseId });
  if (projectId) params.append("projectId", projectId);

  const response = await fetch(
    `/api/admin?action=getTimeTrackingData&${params}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch time tracking data");
  }
  const data = await response.json();
  return data.data;
};

const updateTaskTime = async (
  taskId: string,
  actualHours: number
): Promise<void> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actualHours }),
  });

  if (!response.ok) {
    throw new Error("Failed to update task time");
  }
};

export function TimeTrackingDashboard({
  enterpriseId,
  projectId,
}: TimeTrackingDashboardProps) {
  const queryClient = useQueryClient();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingHours, setEditingHours] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["time-tracking", enterpriseId, projectId],
    queryFn: () => fetchTimeTrackingData(enterpriseId, projectId),
    enabled: !!enterpriseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateTimeMutation = useMutation({
    mutationFn: ({
      taskId,
      actualHours,
    }: {
      taskId: string;
      actualHours: number;
    }) => updateTaskTime(taskId, actualHours),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["time-tracking", enterpriseId, projectId],
      });
      toast.success("Time updated successfully");
      setEditingTaskId(null);
      setEditingHours("");
    },
    onError: () => {
      toast.error("Failed to update time");
    },
  });

  const handleEditTime = (taskId: string, currentHours: number) => {
    setEditingTaskId(taskId);
    setEditingHours(currentHours.toString());
  };

  const handleSaveTime = (taskId: string) => {
    const hours = parseFloat(editingHours);
    if (isNaN(hours) || hours < 0) {
      toast.error("Please enter a valid number of hours");
      return;
    }
    updateTimeMutation.mutate({ taskId, actualHours: hours });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Failed to load time tracking data</p>
      </div>
    );
  }

  const { analytics, entries } = data;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-400";
    if (accuracy >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 90)
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (accuracy >= 70) return <Target className="w-4 h-4 text-yellow-400" />;
    return <AlertTriangle className="w-4 h-4 text-red-400" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case "declining":
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <BarChart3 className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white">
          Time Tracking Dashboard
        </h3>
        <p className="text-gray-400">
          Monitor estimation accuracy and time analytics
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">
              Estimation Accuracy
            </h4>
            {getAccuracyIcon(analytics.averageEstimationAccuracy)}
          </div>
          <div
            className={`text-4xl font-bold mb-2 ${getAccuracyColor(analytics.averageEstimationAccuracy)}`}
          >
            {analytics.averageEstimationAccuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Average accuracy</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Total Hours</h4>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {analytics.totalActualHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-400">
            Est: {analytics.totalEstimatedHours.toFixed(1)}h
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Avg Time/Task</h4>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-4xl font-bold text-purple-400 mb-2">
            {analytics.averageTimePerTask.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-400">Per task average</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">
              Estimation Trend
            </h4>
            {getTrendIcon(analytics.estimationTrend)}
          </div>
          <div className="text-4xl font-bold text-green-400 mb-2 capitalize">
            {analytics.estimationTrend}
          </div>
          <div className="text-sm text-gray-400">Team performance</div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          Task Time Tracking
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">
                  Task
                </th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">
                  Assignee
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Estimated
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Actual
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Accuracy
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-[#2A2A2A] hover:bg-[#0F0F0F]"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">
                      {entry.taskTitle}
                    </div>
                    <div className="text-sm text-gray-400">
                      Started: {new Date(entry.startedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-300">{entry.assigneeName}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-blue-400 font-medium">
                      {entry.estimatedHours}h
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {editingTaskId === entry.taskId ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editingHours}
                          onChange={(e) => setEditingHours(e.target.value)}
                          className="w-16 px-2 py-1 bg-[#0F0F0F] border border-gray-600 rounded text-white text-center"
                          min="0"
                          step="0.5"
                        />
                        <span className="text-sm text-gray-400">h</span>
                      </div>
                    ) : (
                      <span className="text-green-400 font-medium">
                        {entry.actualHours || 0}h
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`font-bold ${getAccuracyColor(entry.estimationAccuracy)}`}
                      >
                        {entry.estimationAccuracy.toFixed(1)}%
                      </span>
                      {getAccuracyIcon(entry.estimationAccuracy)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        entry.status === "done"
                          ? "bg-green-500/20 text-green-400"
                          : entry.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {entry.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {editingTaskId === entry.taskId ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveTime(entry.taskId)}
                          disabled={updateTimeMutation.isPending}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingTaskId(null);
                            setEditingHours("");
                          }}
                          className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleEditTime(entry.taskId, entry.actualHours || 0)
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Edit Time
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
