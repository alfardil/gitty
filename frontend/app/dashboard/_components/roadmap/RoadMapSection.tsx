"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Calendar,
  User,
  Tag,
  MoreVertical,
  X,
  Edit,
  Trash2,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { useTasks } from "@/lib/hooks/api/useTasks";
import { useUserEnterprises } from "@/lib/hooks/api/useUserEnterprises";
import { useProjects } from "@/lib/hooks/api/useProjects";
import { useProjectUsers } from "@/lib/hooks/api/useProjectUsers";
import { useProjectSelection } from "@/lib/hooks/business/useProjectSelection";
import { useTaskAnalysisStream } from "@/lib/hooks/api/useTaskAnalysisStream";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/neo/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";

// Zod validation schema
const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional(),
  tags: z.string().optional(),
  assigneeId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "pending_pr_approval" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assigneeId?: string;
  assigneeName?: string;
  completedAt?: string;
  tags?: string[];
  position: string;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  estimatedHours?: number;
  complexity?: number;
  taskType?: string;
}

const statusConfig = {
  not_started: {
    label: "Not Started",
    color: "bg-gray-500",
    textColor: "text-gray-300",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-500",
    textColor: "text-blue-300",
  },
  pending_pr_approval: {
    label: "Pending PR Approval",
    color: "bg-blue-500",
    textColor: "text-blue-300",
  },
  done: { label: "Done", color: "bg-green-500", textColor: "text-green-300" },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-green-600", textColor: "text-white" },
  medium: {
    label: "Medium",
    color: "bg-yellow-500",
    textColor: "text-white",
  },
  high: { label: "High", color: "bg-red-400", textColor: "text-white" },
};

export function RoadMapSection() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const queryClient = useQueryClient();

  const {
    enterprises,
    selectedEnterprise,
    setSelectedEnterprise,
    loading: enterprisesLoading,
  } = useUserEnterprises(user?.uuid);

  const { projects } = useProjects(selectedEnterprise || undefined);
  const {
    selectedProject,
    setSelectedProject,
    isLoading: projectSelectionLoading,
  } = useProjectSelection();

  // Fetch project users for assignee selection
  const { data: projectUsersData, isLoading: projectUsersLoading } =
    useProjectUsers(selectedProject || undefined);

  // Set up SSE for real-time task analysis updates
  useTaskAnalysisStream(
    selectedEnterprise || undefined,
    selectedProject || undefined
  );

  // Update selected project when projectId changes from URL
  React.useEffect(() => {
    if (projectId && projectId !== selectedProject) {
      setSelectedProject(projectId);
    }
  }, [projectId, selectedProject, setSelectedProject]);

  const {
    tasks,
    isLoading,
    createTask: createTaskMutation,
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation,
    updateTaskPriority: updateTaskPriorityMutation,
    reorderTask: reorderTaskMutation,
    isCreating,
    isReordering,
  } = useTasks(selectedEnterprise || undefined, selectedProject || undefined);

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dropTarget, setDropTarget] = useState<Task["status"] | null>(null);
  const [dropPosition, setDropPosition] = useState<{
    taskId: string;
    position: "above" | "below";
  } | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    dueDate: undefined,
    tags: "",
    assigneeId: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const createTask = async (taskData: TaskFormData) => {
    createTaskMutation(taskData, {
      onSuccess: () => {
        setShowNewTaskModal(false);
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          dueDate: undefined,
          tags: "",
          assigneeId: "",
        });
        setFormErrors({});
      },
    });
  };

  const updateTaskPriority = async (
    taskId: string,
    newPriority: Task["priority"]
  ) => {
    updateTaskPriorityMutation({ taskId, newPriority });
  };

  // Mutation for updating task assignee only (with optimistic update)
  const updateTaskAssigneeMutation = useMutation({
    mutationFn: async ({
      taskId,
      assigneeId,
    }: {
      taskId: string;
      assigneeId: string | null;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assigneeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task assignee");
      }

      return response.json();
    },
    onMutate: async ({ taskId, assigneeId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["tasks", selectedEnterprise, selectedProject],
      });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>([
        "tasks",
        selectedEnterprise,
        selectedProject,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Task[]>(
        ["tasks", selectedEnterprise, selectedProject],
        (old) =>
          old?.map((task) =>
            task.id === taskId
              ? { ...task, assigneeId: assigneeId || undefined }
              : task
          ) || []
      );

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ["tasks", selectedEnterprise, selectedProject],
          context.previousTasks
        );
      }
      toast.error("Failed to update task assignee. Please try again.");
    },
    onSuccess: () => {
      // Don't invalidate queries - the optimistic update is sufficient
      // Only invalidate if we need to sync with server data
    },
  });

  const updateTaskAssignee = async (
    taskId: string,
    assigneeId: string | null
  ) => {
    updateTaskAssigneeMutation.mutate({ taskId, assigneeId });
  };

  const updateTask = async (taskId: string, taskData: TaskFormData) => {
    updateTaskMutation(
      { taskId, taskData },
      {
        onSuccess: () => {
          setEditingTask(null);
          setFormData({
            title: "",
            description: "",
            priority: "medium",
            dueDate: undefined,
            tags: "",
            assigneeId: "",
          });
          setFormErrors({});
        },
      }
    );
  };

  const deleteTask = async (taskId: string) => {
    deleteTaskMutation(taskId);
  };

  const validateForm = (data: TaskFormData): boolean => {
    const result = taskSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(formData)) return;

    // Ensure a project is selected before creating/updating tasks
    if (!selectedProject) {
      toast.error("Please select a project before creating tasks");
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      createTask(formData);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      tags: task.tags?.join(", ") || "",
      assigneeId: task.assigneeId || "",
    });
    setShowNewTaskModal(true);
  };

  const closeModal = () => {
    setShowNewTaskModal(false);
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      dueDate: undefined,
      tags: "",
      assigneeId: "",
    });
    setFormErrors({});
  };

  const saveAndCloseModal = async () => {
    if (!formData.title.trim()) {
      closeModal();
      return;
    }

    if (editingTask) {
      const originalTask = {
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority,
        dueDate: editingTask.dueDate
          ? new Date(editingTask.dueDate)
          : undefined,
        tags: editingTask.tags?.join(", ") || "",
        assigneeId: editingTask.assigneeId || "",
      };

      const hasChanges =
        formData.title !== originalTask.title ||
        formData.description !== originalTask.description ||
        formData.priority !== originalTask.priority ||
        formData.dueDate?.getTime() !== originalTask.dueDate?.getTime() ||
        formData.tags !== originalTask.tags ||
        formData.assigneeId !== originalTask.assigneeId;

      if (!hasChanges) {
        closeModal();
        return;
      }
    }

    if (!validateForm(formData)) {
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await createTask(formData);
      }
      closeModal();
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    setDropTarget(null);
    setDropPosition(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(status);
  };

  const handleTaskDragOver = (e: React.DragEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY;
    const taskCenter = rect.top + rect.height / 2;

    const position: "above" | "below" = y < taskCenter ? "above" : "below";
    const newDropPosition = { taskId: task.id, position };

    // Only update state if the position has actually changed
    if (
      !dropPosition ||
      dropPosition.taskId !== newDropPosition.taskId ||
      dropPosition.position !== newDropPosition.position
    ) {
      setDropPosition(newDropPosition);
    }
  };

  const handleTaskDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropPosition(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTarget(null);
      setDropPosition(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggedTask) {
      // Use reorder endpoint for all cases - it handles status changes
      const tasksInStatus = getTasksByStatus(status);
      const targetIndex = tasksInStatus.length; // Add to the end

      reorderTaskMutation({
        taskId: draggedTask.id,
        targetIndex: targetIndex,
        status: status,
      });
    }
    setDraggedTask(null);
    setDropTarget(null);
    setDropPosition(null);
  };

  const handleTaskDrop = async (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedTask) {
      const tasksInStatus = getTasksByStatus(targetTask.status);

      // Create a new array without the dragged task
      const tasksWithoutDragged = tasksInStatus.filter(
        (t) => t.id !== draggedTask.id
      );

      // Find the target task in the filtered array
      const targetIndexInFiltered = tasksWithoutDragged.findIndex(
        (t) => t.id === targetTask.id
      );

      if (targetIndexInFiltered === -1) {
        // Target task not found, add to the end
        const newTargetIndex = tasksWithoutDragged.length;

        reorderTaskMutation({
          taskId: draggedTask.id,
          targetIndex: newTargetIndex,
          status: targetTask.status,
        });
      } else {
        // Calculate the new target index based on drop position
        let newTargetIndex: number;
        if (dropPosition?.position === "above") {
          newTargetIndex = targetIndexInFiltered;
        } else {
          newTargetIndex = targetIndexInFiltered + 1;
        }

        reorderTaskMutation({
          taskId: draggedTask.id,
          targetIndex: newTargetIndex,
          status: targetTask.status,
        });
      }
    }

    setDraggedTask(null);
    setDropTarget(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropTarget(null);
    setDropPosition(null);
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  const getStatusCount = (status: Task["status"]) => {
    return getTasksByStatus(status).length;
  };

  const isTaskOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === "done") return false;
    return new Date(task.dueDate) < new Date();
  };

  const isTaskBeingAnalyzed = (task: Task): boolean => {
    return !task.estimatedHours || !task.complexity || !task.taskType;
  };

  const toggleTagExpansion = (taskId: string) => {
    setExpandedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (
    isLoading ||
    enterprisesLoading ||
    projectSelectionLoading ||
    projectUsersLoading
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // Show message if user has no enterprises
  if (enterprises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg font-mono tracking-wider uppercase text-white/70">
          NO ENTERPRISES FOUND
        </div>
        <div className="text-xs font-mono text-white/40 text-center max-w-md">
          You need to be a member of at least one enterprise to view and manage
          tasks.
          <br />
          Contact your administrator to get invited to an enterprise.
        </div>
      </div>
    );
  }

  // Show message if no enterprise is selected
  if (!selectedEnterprise) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enterprise and Project Selectors */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tracking-wider uppercase text-white/70">
              ENTERPRISE:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white hover:border-blue-400/30 transition-colors">
                  <span className="text-xs font-mono">
                    {enterprises.find((e) => e.id === selectedEnterprise)
                      ?.name || "Select Enterprise"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white min-w-[200px]">
                {enterprises.length > 0 ? (
                  enterprises.map((enterprise) => (
                    <DropdownMenuItem
                      key={enterprise.id}
                      onClick={() => {
                        setSelectedEnterprise(enterprise.id);
                        setSelectedProject(null); // Reset project when enterprise changes
                      }}
                      className={`text-xs font-mono hover:bg-white/10 focus:bg-white/10 cursor-pointer ${
                        selectedEnterprise === enterprise.id
                          ? "bg-blue-500/20 text-blue-300"
                          : "text-white"
                      }`}
                    >
                      {enterprise.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-white/40 text-xs font-mono">
                    No enterprises available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tracking-wider uppercase text-white/70">
              PROJECT:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white hover:border-green-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedEnterprise}
                >
                  <span className="text-xs font-mono">
                    {projects.find((p) => p.id === selectedProject)?.name ||
                      "Select Project"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white min-w-[200px]">
                {selectedEnterprise && projects.length > 0 ? (
                  projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className={`text-xs font-mono hover:bg-white/10 focus:bg-white/10 cursor-pointer ${
                        selectedProject === project.id
                          ? "bg-green-500/20 text-green-300"
                          : "text-white"
                      }`}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-white/40 text-xs font-mono">
                    {!selectedEnterprise
                      ? "Select enterprise first"
                      : "No projects available"}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {enterprisesLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
        )}
      </div>

      {/* Show message if no project is selected */}
      {!selectedProject && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-lg font-mono tracking-wider uppercase text-white/70">
            SELECT A PROJECT
          </div>
          <div className="text-xs font-mono text-white/40 text-center max-w-md">
            Please select a project to view and manage tasks in the roadmap.
          </div>
        </div>
      )}

      {/* Show roadmap content only when project is selected */}
      {selectedProject && (
        <>
          {/* Status Summary and New Task Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-6">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
                  <span className="text-xs font-mono tracking-wider uppercase text-white/70">
                    {config.label}
                  </span>
                  <span className="text-xs font-mono text-white/40 bg-white/10 px-2 py-0.5 rounded">
                    {getStatusCount(status as Task["status"])}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              NEW TASK
            </button>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div
                key={status}
                className={`bg-[#0a0a0a] rounded-lg border p-4 min-h-[600px] transition-all duration-200 ${
                  dropTarget === status &&
                  draggedTask &&
                  draggedTask.status !== status
                    ? "border-blue-400 bg-[#111111] shadow-lg shadow-blue-400/20"
                    : "border-white/10"
                }`}
                onDragOver={(e) => handleDragOver(e, status as Task["status"])}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status as Task["status"])}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`font-mono tracking-wider uppercase text-xs ${config.textColor}`}
                  >
                    {config.label}
                  </h3>
                  <span className="text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded">
                    {getStatusCount(status as Task["status"])}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Drop indicator */}
                  {dropTarget === status &&
                    draggedTask &&
                    draggedTask.status !== status && (
                      <div className="h-2 bg-blue-400/30 rounded border-2 border-dashed border-blue-400/50 transition-all duration-200 animate-pulse" />
                    )}
                  {getTasksByStatus(status as Task["status"]).map((task) => (
                    <React.Fragment key={task.id}>
                      {/* Drop indicator above task */}
                      {dropPosition?.taskId === task.id &&
                        dropPosition.position === "above" &&
                        draggedTask &&
                        draggedTask.id !== task.id && (
                          <div className="h-2 bg-blue-400/30 rounded border-2 border-dashed border-blue-400/50 transition-all duration-200 animate-pulse" />
                        )}

                      <div
                        className={`bg-[#111111] rounded-lg p-4 border cursor-move transition-all duration-200 space-y-3 ${
                          draggedTask?.id === task.id
                            ? "border-blue-400 bg-[#0a0a0a] shadow-lg shadow-blue-400/20 opacity-50 scale-105 rotate-1"
                            : dropPosition?.taskId === task.id &&
                                draggedTask &&
                                draggedTask.id !== task.id
                              ? "border-blue-400 bg-[#0a0a0a] shadow-lg shadow-blue-400/20 transform scale-105"
                              : isReordering
                                ? "border-yellow-400/50 bg-[#0a0a0a] shadow-lg shadow-yellow-400/20"
                                : isTaskOverdue(task)
                                  ? "border-red-500/30 hover:border-red-500/50 border-4"
                                  : "border-white/10 hover:border-blue-400/30"
                        }`}
                        draggable={!isReordering}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragOver={(e) => handleTaskDragOver(e, task)}
                        onDragLeave={handleTaskDragLeave}
                        onDrop={(e) => handleTaskDrop(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Task header */}
                        <div className="flex items-start justify-between">
                          <h4 className="font-mono text-white text-xs line-clamp-2 flex-1 mr-2">
                            {task.title}
                          </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-white/60 hover:text-white p-1 flex-shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white">
                              <DropdownMenuItem
                                onClick={() => openEditModal(task)}
                                className="text-xs font-mono hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                EDIT
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteTask(task.id)}
                                className="text-xs font-mono text-red-400 hover:text-red-300 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                DELETE
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={`px-2 py-1 rounded text-xs font-mono tracking-wider uppercase ${priorityConfig[task.priority].color} ${priorityConfig[task.priority].textColor} hover:opacity-80 transition-opacity cursor-pointer`}
                              >
                                {priorityConfig[task.priority].label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateTaskPriority(task.id, "low")
                                }
                                className="text-xs font-mono hover:bg-green-500/20 focus:bg-green-500/20 bg-green-400/10 cursor-pointer"
                              >
                                LOW
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateTaskPriority(task.id, "medium")
                                }
                                className="text-xs font-mono hover:bg-yellow-500/20 focus:bg-yellow-500/20 bg-yellow-400/10 cursor-pointer"
                              >
                                MEDIUM
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateTaskPriority(task.id, "high")
                                }
                                className="text-xs font-mono hover:bg-red-500/20 focus:bg-red-500/20 bg-red-400/10 cursor-pointer"
                              >
                                HIGH
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <div className="text-xs font-mono text-white/60 line-clamp-2">
                            <ReactMarkdown
                              components={
                                {
                                  code({
                                    node,
                                    inline,
                                    className,
                                    children,
                                    ...props
                                  }: any) {
                                    const match = /language-(\w+)/.exec(
                                      className || ""
                                    );
                                    return !inline && match ? (
                                      <pre className="bg-[#0a0a0a] p-1 rounded text-xs overflow-x-auto">
                                        <code
                                          className={`language-${match[1]} text-xs font-mono`}
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      </pre>
                                    ) : (
                                      <code
                                        className="bg-[#0a0a0a] px-1 py-0.5 rounded text-xs font-mono"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                  pre: ({ children }: any) => (
                                    <div className="bg-[#0a0a0a] p-1 rounded text-xs overflow-x-auto">
                                      {children}
                                    </div>
                                  ),
                                  p: ({ children }: any) => (
                                    <span className="text-xs font-mono text-white/60">
                                      {children}
                                    </span>
                                  ),
                                } as any
                              }
                            >
                              {task.description}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Task metadata */}
                        <div className="flex flex-wrap gap-2">
                          {task.estimatedHours ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-mono rounded">
                              <Clock className="w-3 h-3" />
                              <span>{task.estimatedHours}h</span>
                            </div>
                          ) : null}
                          {task.complexity ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-mono rounded">
                              <span>{task.complexity}/5</span>
                            </div>
                          ) : null}
                          {task.taskType ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs font-mono tracking-wider uppercase rounded">
                              <span>{task.taskType.replace("_", " ")}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Task tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-white/10 text-white/70 text-xs font-mono rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <button
                                onClick={() => toggleTagExpansion(task.id)}
                                className="px-2 py-1 bg-white/10 text-white/70 text-xs font-mono rounded hover:bg-white/20 transition-colors"
                              >
                                +{task.tags.length - 3}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Expanded tags */}
                        {expandedTags.has(task.id) &&
                          task.tags &&
                          task.tags.length > 3 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.slice(3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white/10 text-white/70 text-xs font-mono rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                        {/* Task footer */}
                        <div className="space-y-2 text-xs font-mono text-white/40">
                          {/* Assignee and due date row */}
                          <div className="flex items-center gap-2">
                            {task.assigneeName && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{task.assigneeName}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Completion status row */}
                          {task.completedAt && (
                            <div className="flex items-center gap-1 text-green-400">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>
                                COMPLETED{" "}
                                {new Date(
                                  task.completedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Drop indicator below task */}
                      {dropPosition?.taskId === task.id &&
                        dropPosition.position === "below" &&
                        draggedTask &&
                        draggedTask.id !== task.id && (
                          <div className="h-2 bg-blue-400/30 rounded border-2 border-dashed border-blue-400/50 transition-all duration-200 animate-pulse" />
                        )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Task Modal */}
      {showNewTaskModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={saveAndCloseModal}
        >
          <div
            className="bg-[#23272f] rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h3>
              <button
                onClick={saveAndCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-3 py-2 bg-[#2d313a] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.title ? "border-red-500" : "border-[#353a45]"
                  }`}
                  required
                />
                {formErrors.title && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2d313a] border border-[#353a45] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                  rows={6}
                  style={{ whiteSpace: "pre-wrap" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Priority
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 border border-[#353a45] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between ${priorityConfig[formData.priority].color} ${priorityConfig[formData.priority].textColor}`}
                    >
                      <span className="capitalize">{formData.priority}</span>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2d313a] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white">
                    <DropdownMenuItem
                      onClick={() =>
                        setFormData({ ...formData, priority: "low" })
                      }
                      className="text-white hover:bg-green-500/20 focus:bg-green-500/20 bg-green-400/10 cursor-pointer"
                    >
                      Low
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFormData({ ...formData, priority: "medium" })
                      }
                      className="text-white hover:bg-yellow-500/20 focus:bg-yellow-500/20 bg-yellow-400/10 cursor-pointer"
                    >
                      Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFormData({ ...formData, priority: "high" })
                      }
                      className="text-white hover:bg-red-500/20 focus:bg-red-500/20 bg-red-400/10 cursor-pointer"
                    >
                      High
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Due Date
                </label>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(date) =>
                    setFormData({ ...formData, dueDate: date })
                  }
                  placeholder="Pick a due date..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2d313a] border border-[#353a45] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Outreach, School-specific tags"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Assignee
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-[#353a45] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {formData.assigneeId
                          ? projectUsersData?.data?.assignedUsers.find(
                              (user) => user.id === formData.assigneeId
                            )?.firstName ||
                            projectUsersData?.data?.assignedUsers.find(
                              (user) => user.id === formData.assigneeId
                            )?.githubUsername ||
                            "Unknown User"
                          : "Unassigned"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2d313a] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white max-h-60 overflow-y-auto">
                    <DropdownMenuItem
                      onClick={() =>
                        setFormData({ ...formData, assigneeId: "" })
                      }
                      className="text-white hover:bg-[#353a45] focus:bg-[#353a45] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-300" />
                        </div>
                        <span>Unassigned</span>
                      </div>
                    </DropdownMenuItem>
                    {projectUsersData?.data?.assignedUsers.map((user) => (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() =>
                          setFormData({ ...formData, assigneeId: user.id })
                        }
                        className={`text-white hover:bg-[#353a45] focus:bg-[#353a45] cursor-pointer ${
                          formData.assigneeId === user.id
                            ? "bg-blue-500/20 text-blue-300"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={
                                user.firstName || user.githubUsername || "User"
                              }
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-300" />
                            </div>
                          )}
                          <span className="text-sm">
                            {user.firstName
                              ? `${user.firstName} ${user.lastName || ""}`
                              : user.githubUsername || user.email}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="flex-1 px-4 py-2 border border-[#353a45] rounded-lg text-gray-300 hover:bg-[#2d313a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                >
                  {editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
