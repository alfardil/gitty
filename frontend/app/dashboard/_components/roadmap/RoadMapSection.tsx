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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
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
        <div className="text-lg font-medium text-gray-300">
          No Enterprises Found
        </div>
        <div className="text-sm text-gray-500 text-center max-w-md">
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
            <span className="text-sm font-medium text-gray-300">
              Enterprise:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 bg-[#2d313a] border border-[#353a45] rounded-lg text-white hover:border-blue-400/30 transition-colors">
                  <span className="text-sm">
                    {enterprises.find((e) => e.id === selectedEnterprise)
                      ?.name || "Select Enterprise"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#2d313a] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white min-w-[200px]">
                {enterprises.length > 0 ? (
                  enterprises.map((enterprise) => (
                    <DropdownMenuItem
                      key={enterprise.id}
                      onClick={() => {
                        setSelectedEnterprise(enterprise.id);
                        setSelectedProject(null); // Reset project when enterprise changes
                      }}
                      className={`text-white hover:bg-[#353a45] focus:bg-[#353a45] cursor-pointer ${
                        selectedEnterprise === enterprise.id
                          ? "bg-blue-500/20 text-blue-300"
                          : ""
                      }`}
                    >
                      {enterprise.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    No enterprises available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">Project:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-[#2d313a] border border-[#353a45] rounded-lg text-white hover:border-green-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedEnterprise}
                >
                  <span className="text-sm">
                    {projects.find((p) => p.id === selectedProject)?.name ||
                      "Select Project"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#2d313a] border border-green-400/20 rounded-lg shadow-lg p-1 text-white min-w-[200px]">
                {selectedEnterprise && projects.length > 0 ? (
                  projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className={`text-white hover:bg-[#353a45] focus:bg-[#353a45] cursor-pointer ${
                        selectedProject === project.id
                          ? "bg-green-500/20 text-green-300"
                          : ""
                      }`}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm">
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
          <div className="text-lg font-medium text-gray-300">
            Select a Project
          </div>
          <div className="text-sm text-gray-500 text-center max-w-md">
            Please select a project to view and manage tasks in the roadmap.
          </div>
        </div>
      )}

      {/* Show roadmap content only when project is selected */}
      {selectedProject && (
        <>
          {/* Status Summary and New Task Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <span className="text-sm text-gray-300">
                    {config.label} {getStatusCount(status as Task["status"])}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div
                key={status}
                className={`bg-[#23272f] rounded-lg border p-4 min-h-[600px] transition-all duration-200 ${
                  dropTarget === status &&
                  draggedTask &&
                  draggedTask.status !== status
                    ? "border-blue-400 bg-[#1a1d23] shadow-lg shadow-blue-400/20"
                    : "border-[#353a45]"
                }`}
                onDragOver={(e) => handleDragOver(e, status as Task["status"])}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status as Task["status"])}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${config.textColor}`}>
                    {config.label}
                  </h3>
                  <span className="text-sm text-gray-400">
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
                        className={`bg-[#2d313a] rounded-lg p-4 border cursor-move transition-all duration-200 ${
                          draggedTask?.id === task.id
                            ? "border-blue-400 bg-[#1a1d23] shadow-lg shadow-blue-400/20 opacity-50 scale-105 rotate-1"
                            : dropPosition?.taskId === task.id &&
                                draggedTask &&
                                draggedTask.id !== task.id
                              ? "border-blue-400 bg-[#1a1d23] shadow-lg shadow-blue-400/20 transform scale-105"
                              : isReordering
                                ? "border-yellow-400/50 bg-[#1a1d23] shadow-lg shadow-yellow-400/20"
                                : isTaskOverdue(task)
                                  ? "border-red-500/30 hover:border-red-500/50 border-4"
                                  : "border-[#353a45] hover:border-blue-400/30"
                        }`}
                        draggable={!isReordering}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragOver={(e) => handleTaskDragOver(e, task)}
                        onDragLeave={handleTaskDragLeave}
                        onDrop={(e) => handleTaskDrop(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white text-sm line-clamp-2 flex-1 mr-2">
                            {task.title}
                          </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-gray-400 hover:text-white p-1">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2d313a] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white">
                              <DropdownMenuItem
                                onClick={() => openEditModal(task)}
                                className="text-white hover:bg-[#353a45] focus:bg-[#353a45] cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteTask(task.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-[#353a45] focus:bg-[#353a45] cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[task.priority].color} ${priorityConfig[task.priority].textColor} hover:opacity-80 transition-opacity cursor-pointer`}
                              >
                                {priorityConfig[task.priority].label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2d313a] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateTaskPriority(task.id, "low")
                                }
                                className="text-white hover:bg-green-500/20 focus:bg-green-500/20 bg-green-400/10 cursor-pointer"
                              >
                                Low
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateTaskPriority(task.id, "medium")
                                }
                                className="text-white hover:bg-yellow-500/20 focus:bg-yellow-500/20 bg-yellow-400/10 cursor-pointer"
                              >
                                Medium
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateTaskPriority(task.id, "high")
                                }
                                className="text-white hover:bg-red-500/20 focus:bg-red-500/20 bg-red-400/10 cursor-pointer"
                              >
                                High
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {task.description && (
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Task metadata */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {task.estimatedHours ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                              <Clock className="w-3 h-3" />
                              <span>{task.estimatedHours}h</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                              <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                              <span>Analyzing...</span>
                            </div>
                          )}
                          {task.complexity ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                              <span>⚡</span>
                              <span>{task.complexity}/5</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                              <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                              <span>Analyzing...</span>
                            </div>
                          )}
                          {task.taskType ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                              <span>📋</span>
                              <span className="capitalize">
                                {task.taskType.replace("_", " ")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                              <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                              <span>Analyzing...</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(task.dueDate).toLocaleString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 hover:bg-[#353a45] rounded px-1 py-0.5 transition-colors">
                                  <User className="w-3 h-3" />
                                  <span className="text-xs">
                                    {task.assigneeId
                                      ? projectUsersData?.data?.assignedUsers.find(
                                          (user) => user.id === task.assigneeId
                                        )?.firstName ||
                                        projectUsersData?.data?.assignedUsers.find(
                                          (user) => user.id === task.assigneeId
                                        )?.githubUsername ||
                                        task.assigneeName ||
                                        "Unknown User"
                                      : "Unassigned"}
                                  </span>
                                  <ChevronDown className="w-2 h-2 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#2d313a] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white max-h-60 overflow-y-auto min-w-[200px]">
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateTaskAssignee(task.id, null)
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
                                {projectUsersData?.data?.assignedUsers.map(
                                  (user) => (
                                    <DropdownMenuItem
                                      key={user.id}
                                      onClick={() =>
                                        updateTaskAssignee(task.id, user.id)
                                      }
                                      className={`text-white hover:bg-[#353a45] focus:bg-[#353a45] cursor-pointer ${
                                        task.assigneeId === user.id
                                          ? "bg-blue-500/20 text-blue-300"
                                          : ""
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {user.avatarUrl ? (
                                          <img
                                            src={user.avatarUrl}
                                            alt={
                                              user.firstName ||
                                              user.githubUsername ||
                                              "User"
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
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(expandedTags.has(task.id)
                              ? task.tags
                              : task.tags.slice(0, 2)
                            ).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-[#353a45] text-xs text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 &&
                              !expandedTags.has(task.id) && (
                                <button
                                  onClick={() =>
                                    setExpandedTags(
                                      (prev) => new Set([...prev, task.id])
                                    )
                                  }
                                  className="px-2 py-1 bg-[#353a45] text-xs text-gray-300 rounded hover:bg-[#404550] transition-colors cursor-pointer"
                                >
                                  +{task.tags.length - 2}
                                </button>
                              )}
                            {expandedTags.has(task.id) && (
                              <button
                                onClick={() =>
                                  setExpandedTags((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(task.id);
                                    return newSet;
                                  })
                                }
                                className="px-2 py-1 bg-[#353a45] text-xs text-gray-300 rounded hover:bg-[#404550] transition-colors cursor-pointer"
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        )}
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

                  {/* Empty state indicator when dragging */}
                  {getTasksByStatus(status as Task["status"]).length === 0 &&
                    dropTarget === status &&
                    draggedTask &&
                    draggedTask.status !== status && (
                      <div className="flex items-center justify-center h-32 border-2 border-dashed border-blue-400/50 rounded-lg bg-blue-400/10">
                        <span className="text-blue-400 text-sm font-medium">
                          Drop here
                        </span>
                      </div>
                    )}

                  <button
                    onClick={() => setShowNewTaskModal(true)}
                    disabled={isCreating}
                    className="w-full p-3 border-2 border-dashed border-[#353a45] rounded-lg text-gray-400 hover:border-blue-400/30 hover:text-blue-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {isCreating ? "Creating..." : "New task"}
                    </span>
                  </button>
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
                  className="w-full px-3 py-2 bg-[#2d313a] border border-[#353a45] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
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
