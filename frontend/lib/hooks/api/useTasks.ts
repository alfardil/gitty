import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "pending_pr_approval" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assigneeId?: string;
  assigneeName?: string;
  enterpriseId?: string;
  completedAt?: string;
  tags?: string[];
  position: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskFormData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  tags?: string;
}

// Fetch tasks
const fetchTasks = async (enterpriseId?: string): Promise<Task[]> => {
  const url = enterpriseId
    ? `/api/tasks?enterpriseId=${enterpriseId}`
    : "/api/tasks";

  const response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  const data = await response.json();
  return data.tasks || [];
};

// Create task
const createTask = async (
  taskData: TaskFormData,
  enterpriseId?: string
): Promise<Task> => {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...taskData,
      enterpriseId,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : null,
      tags: taskData.tags
        ? taskData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to create task");
  }
  return response.json();
};

// Update task
const updateTask = async ({
  taskId,
  taskData,
}: {
  taskId: string;
  taskData: TaskFormData;
}): Promise<Task> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...taskData,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : null,
      tags: taskData.tags
        ? taskData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to update task");
  }
  return response.json();
};

// Delete task
const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete task");
  }
};

// Update task priority
const updateTaskPriority = async ({
  taskId,
  newPriority,
}: {
  taskId: string;
  newPriority: Task["priority"];
}): Promise<Task> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ priority: newPriority }),
  });
  if (!response.ok) {
    throw new Error("Failed to update task priority");
  }
  return response.json();
};

// Reorder task
const reorderTask = async ({
  taskId,
  targetIndex,
  status,
}: {
  taskId: string;
  targetIndex: number;
  status: Task["status"];
}): Promise<void> => {
  const response = await fetch("/api/tasks/reorder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId,
      targetIndex,
      status,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to reorder task");
  }
};

export function useTasks(enterpriseId?: string) {
  const queryClient = useQueryClient();

  // Query for fetching tasks
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", enterpriseId],
    queryFn: () => fetchTasks(enterpriseId),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Mutation for creating tasks
  const createTaskMutation = useMutation({
    mutationFn: (taskData: TaskFormData) => createTask(taskData, enterpriseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", enterpriseId] });
      toast.success("Task created successfully!");
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast.error("Failed to create task. Please try again.");
    },
  });

  // Mutation for updating tasks
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", enterpriseId] });
      toast.success("Task updated successfully!");
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Failed to update task. Please try again.");
    },
  });

  // Mutation for deleting tasks
  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", enterpriseId] });
      toast.success("Task deleted successfully!");
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task. Please try again.");
    },
  });

  // Mutation for updating task priority
  const updateTaskPriorityMutation = useMutation({
    mutationFn: updateTaskPriority,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", enterpriseId] });
      toast.success("Priority updated successfully!");
    },
    onError: (error) => {
      console.error("Error updating task priority:", error);
      toast.error("Failed to update task priority. Please try again.");
    },
  });

  // Mutation for reordering tasks
  const reorderTaskMutation = useMutation({
    mutationFn: reorderTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", enterpriseId] });
      toast.success("Task reordered successfully!");
    },
    onError: (error) => {
      console.error("Error reordering task:", error);
      toast.error("Failed to reorder task. Please try again.");
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    updateTaskPriority: updateTaskPriorityMutation.mutate,
    reorderTask: reorderTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isReordering: reorderTaskMutation.isPending,
  };
}
