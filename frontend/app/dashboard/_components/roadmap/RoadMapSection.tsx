"use client";

import React, { useState } from "react";
import {
  Plus,
  Calendar,
  User,
  Tag,
  MoreVertical,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTasks } from "@/lib/hooks/useTasks";
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
  tags?: string[];
  position: string;
  createdAt: string;
  updatedAt: string;
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
  } = useTasks();

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
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    });
    setFormErrors({});
  };

  const saveAndCloseModal = async () => {
    // Check if there are any changes to save
    if (!formData.title.trim()) {
      // If no title, just close without saving
      closeModal();
      return;
    }

    // Check if there are actual changes when editing
    if (editingTask) {
      const originalTask = {
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority,
        dueDate: editingTask.dueDate
          ? new Date(editingTask.dueDate)
          : undefined,
        tags: editingTask.tags?.join(", ") || "",
      };

      const hasChanges =
        formData.title !== originalTask.title ||
        formData.description !== originalTask.description ||
        formData.priority !== originalTask.priority ||
        formData.dueDate?.getTime() !== originalTask.dueDate?.getTime() ||
        formData.tags !== originalTask.tags;

      if (!hasChanges) {
        // No changes made, just close without saving
        closeModal();
        return;
      }
    }

    // Validate the form
    if (!validateForm(formData)) {
      // If validation fails, don't close the modal
      return;
    }

    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, formData);
      } else {
        // Create new task
        await createTask(formData);
      }
      closeModal();
    } catch (error) {
      // If save fails, don't close the modal
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

    const position = y < taskCenter ? "above" : "below";
    setDropPosition({ taskId: task.id, position });
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
    // Only clear drop target if we're leaving the drop zone entirely
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="flex gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
            <span className="text-sm text-gray-300">
              {config.label} {getStatusCount(status as Task["status"])}
            </span>
          </div>
        ))}
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
                            onClick={() => updateTaskPriority(task.id, "low")}
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
                            onClick={() => updateTaskPriority(task.id, "high")}
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

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(task.dueDate).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      )}
                      {task.assigneeName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{task.assigneeName}</span>
                        </div>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-[#353a45] text-xs text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="px-2 py-1 bg-[#353a45] text-xs text-gray-300 rounded">
                            +{task.tags.length - 2}
                          </span>
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
