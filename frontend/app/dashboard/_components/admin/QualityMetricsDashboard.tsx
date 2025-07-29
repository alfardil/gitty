import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Award,
} from "lucide-react";

interface QualityMetrics {
  reworkCount: number;
  approvalCount: number;
  scopeChanges: number;
  qualityScore: number;
}

interface TaskMetrics {
  id: string;
  title: string;
  reworkCount: number;
  approvalCount: number;
  scopeChanges: number;
  qualityScore: number;
  status: string;
  priority: string;
}

interface QualityMetricsDashboardProps {
  enterpriseId: string;
  projectId?: string;
}

const fetchQualityMetrics = async (
  enterpriseId: string,
  projectId?: string
): Promise<{
  overall: QualityMetrics;
  tasks: TaskMetrics[];
}> => {
  const params = new URLSearchParams({ enterpriseId });
  if (projectId) params.append("projectId", projectId);

  const response = await fetch(`/api/admin?action=getQualityMetrics&${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch quality metrics");
  }
  const data = await response.json();
  return data.data;
};

export function QualityMetricsDashboard({
  enterpriseId,
  projectId,
}: QualityMetricsDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "week" | "month" | "quarter"
  >("month");

  const { data, isLoading, error } = useQuery({
    queryKey: ["quality-metrics", enterpriseId, projectId, selectedTimeframe],
    queryFn: () => fetchQualityMetrics(enterpriseId, projectId),
    enabled: !!enterpriseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateTaskMetrics = async (
    taskId: string,
    action: string,
    value?: number
  ) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value }),
      });

      if (!response.ok) throw new Error("Failed to update metrics");

      toast.success("Metrics updated successfully");
    } catch (error) {
      toast.error("Failed to update metrics");
    }
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
        <p className="text-gray-400">Failed to load quality metrics</p>
      </div>
    );
  }

  const { overall, tasks } = data;

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getQualityScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="w-5 h-5 text-green-400" />;
    if (score >= 60) return <Target className="w-5 h-5 text-yellow-400" />;
    return <AlertTriangle className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            Quality Metrics Dashboard
          </h3>
          <p className="text-gray-400">
            Track rework, approvals, and process quality
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "quarter"] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Quality Score</h4>
            {getQualityScoreIcon(overall.qualityScore)}
          </div>
          <div
            className={`text-4xl font-bold mb-2 ${getQualityScoreColor(overall.qualityScore)}`}
          >
            {overall.qualityScore}
          </div>
          <div className="text-sm text-gray-400">Overall team quality</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Rework Count</h4>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-4xl font-bold text-red-400 mb-2">
            {overall.reworkCount}
          </div>
          <div className="text-sm text-gray-400">Tasks requiring rework</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Approvals</h4>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-4xl font-bold text-green-400 mb-2">
            {overall.approvalCount}
          </div>
          <div className="text-sm text-gray-400">Successful approvals</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Scope Changes</h4>
            <BarChart3 className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-4xl font-bold text-orange-400 mb-2">
            {overall.scopeChanges}
          </div>
          <div className="text-sm text-gray-400">Scope modifications</div>
        </div>
      </div>

      {/* Task-Level Metrics Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          Task-Level Quality Metrics
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">
                  Task
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Quality Score
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Rework
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Approvals
                </th>
                <th className="text-center py-3 px-4 text-gray-300 font-medium">
                  Scope Changes
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
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-[#2A2A2A] hover:bg-[#0F0F0F]"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{task.title}</div>
                    <div className="text-sm text-gray-400 capitalize">
                      {task.priority}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div
                      className={`font-bold ${getQualityScoreColor(task.qualityScore)}`}
                    >
                      {task.qualityScore}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-red-400 font-medium">
                        {task.reworkCount}
                      </span>
                      <button
                        onClick={() =>
                          updateTaskMetrics(task.id, "increment_rework")
                        }
                        className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                        title="Increment rework count"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-400 font-medium">
                        {task.approvalCount}
                      </span>
                      <button
                        onClick={() =>
                          updateTaskMetrics(task.id, "increment_approval")
                        }
                        className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                        title="Increment approval count"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-orange-400 font-medium">
                        {task.scopeChanges}
                      </span>
                      <button
                        onClick={() =>
                          updateTaskMetrics(task.id, "increment_scope")
                        }
                        className="p-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                        title="Increment scope changes"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        task.status === "done"
                          ? "bg-green-500/20 text-green-400"
                          : task.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() =>
                        updateTaskMetrics(task.id, "set_rework", 0)
                      }
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                      title="Reset rework count"
                    >
                      Reset
                    </button>
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
