import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Link,
  Unlink,
  Plus,
  Minus,
} from "lucide-react";

interface DependencyNode {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: "dependency" | "blocker" | "current";
}

interface DependencyGraph {
  currentTask: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  dependencies: DependencyNode[];
  blockers: DependencyNode[];
  circularDependencies: string[][];
}

interface DependencyVisualizationProps {
  enterpriseId: string;
  projectId?: string;
}

const fetchDependencyData = async (
  enterpriseId: string,
  projectId?: string
): Promise<{
  tasks: DependencyGraph[];
  summary: {
    totalDependencies: number;
    totalBlockers: number;
    circularDependencies: number;
    criticalPaths: number;
  };
}> => {
  const params = new URLSearchParams({ enterpriseId });
  if (projectId) params.append("projectId", projectId);

  const response = await fetch(`/api/admin?action=getDependencyData&${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch dependency data");
  }
  const data = await response.json();
  return data.data;
};

export function DependencyVisualization({
  enterpriseId,
  projectId,
}: DependencyVisualizationProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCircularDeps, setShowCircularDeps] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dependency-data", enterpriseId, projectId],
    queryFn: () => fetchDependencyData(enterpriseId, projectId),
    enabled: !!enterpriseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
        <p className="text-gray-400">Failed to load dependency data</p>
      </div>
    );
  }

  const { tasks, summary } = data;
  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.currentTask.id === selectedTaskId)
    : tasks[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "text-green-400 bg-green-500/20";
      case "in_progress":
        return "text-yellow-400 bg-yellow-500/20";
      case "pending_pr_approval":
        return "text-orange-400 bg-orange-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
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

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "dependency":
        return <GitBranch className="w-4 h-4" />;
      case "blocker":
        return <AlertTriangle className="w-4 h-4" />;
      case "current":
        return <Target className="w-4 h-4" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white">
          Dependency Visualization
        </h3>
        <p className="text-gray-400">
          Visualize task dependencies and identify bottlenecks
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Dependencies</h4>
            <GitBranch className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {summary.totalDependencies}
          </div>
          <div className="text-sm text-gray-400">Total dependencies</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Blockers</h4>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-4xl font-bold text-red-400 mb-2">
            {summary.totalBlockers}
          </div>
          <div className="text-sm text-gray-400">Active blockers</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Circular Deps</h4>
            <Unlink className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-4xl font-bold text-orange-400 mb-2">
            {summary.circularDependencies}
          </div>
          <div className="text-sm text-gray-400">Circular dependencies</div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#3A3A3A] transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Critical Paths</h4>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-4xl font-bold text-purple-400 mb-2">
            {summary.criticalPaths}
          </div>
          <div className="text-sm text-gray-400">Critical paths</div>
        </div>
      </div>

      {/* Task Selection */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">
            Select Task to Visualize
          </h4>
          <button
            onClick={() => setShowCircularDeps(!showCircularDeps)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              showCircularDeps
                ? "bg-orange-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {showCircularDeps ? "Hide" : "Show"} Circular Dependencies
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <button
              key={task.currentTask.id}
              onClick={() => setSelectedTaskId(task.currentTask.id)}
              className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                selectedTaskId === task.currentTask.id
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-[#2A2A2A] hover:border-[#3A3A3A] bg-[#0F0F0F]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white truncate">
                  {task.currentTask.title}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span
                  className={`px-2 py-1 rounded ${getStatusColor(task.currentTask.status)}`}
                >
                  {task.currentTask.status.replace("_", " ")}
                </span>
                <span className={getPriorityColor(task.currentTask.priority)}>
                  {task.currentTask.priority}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>{task.dependencies.length} deps</span>
                <span>{task.blockers.length} blockers</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dependency Graph */}
      {selectedTask && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-6">
            Dependency Graph: {selectedTask.currentTask.title}
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dependencies */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="w-5 h-5 text-blue-400" />
                <h5 className="text-lg font-semibold text-white">
                  Dependencies
                </h5>
                <span className="text-sm text-gray-400">
                  ({selectedTask.dependencies.length})
                </span>
              </div>

              {selectedTask.dependencies.length > 0 ? (
                <div className="space-y-3">
                  {selectedTask.dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg hover:border-[#3A3A3A] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getNodeIcon(dep.type)}
                        <span className="font-medium text-white truncate">
                          {dep.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded ${getStatusColor(dep.status)}`}
                        >
                          {dep.status.replace("_", " ")}
                        </span>
                        <span className={getPriorityColor(dep.priority)}>
                          {dep.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No dependencies</p>
                </div>
              )}
            </div>

            {/* Current Task */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h5 className="text-lg font-semibold text-white">
                  Current Task
                </h5>
              </div>

              <div className="p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  {getNodeIcon("current")}
                  <span className="font-bold text-white">
                    {selectedTask.currentTask.title}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm mb-3">
                  <span
                    className={`px-2 py-1 rounded ${getStatusColor(selectedTask.currentTask.status)}`}
                  >
                    {selectedTask.currentTask.status.replace("_", " ")}
                  </span>
                  <span
                    className={getPriorityColor(
                      selectedTask.currentTask.priority
                    )}
                  >
                    {selectedTask.currentTask.priority}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  <div>Dependencies: {selectedTask.dependencies.length}</div>
                  <div>Blockers: {selectedTask.blockers.length}</div>
                </div>
              </div>
            </div>

            {/* Blockers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h5 className="text-lg font-semibold text-white">Blockers</h5>
                <span className="text-sm text-gray-400">
                  ({selectedTask.blockers.length})
                </span>
              </div>

              {selectedTask.blockers.length > 0 ? (
                <div className="space-y-3">
                  {selectedTask.blockers.map((blocker) => (
                    <div
                      key={blocker.id}
                      className="p-4 bg-[#0F0F0F] border border-red-500/30 rounded-lg hover:border-red-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getNodeIcon(blocker.type)}
                        <span className="font-medium text-white truncate">
                          {blocker.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded ${getStatusColor(blocker.status)}`}
                        >
                          {blocker.status.replace("_", " ")}
                        </span>
                        <span className={getPriorityColor(blocker.priority)}>
                          {blocker.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No blockers</p>
                </div>
              )}
            </div>
          </div>

          {/* Circular Dependencies Warning */}
          {showCircularDeps && selectedTask.circularDependencies.length > 0 && (
            <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h5 className="text-lg font-semibold text-orange-400">
                  Circular Dependencies Detected
                </h5>
              </div>
              <div className="space-y-2">
                {selectedTask.circularDependencies.map((cycle, index) => (
                  <div key={index} className="text-sm text-orange-300">
                    <span className="font-medium">Cycle {index + 1}:</span>{" "}
                    {cycle.join(" → ")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
