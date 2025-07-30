import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ProjectUser {
  id: string;
  githubId: string;
  githubUsername?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  subscriptionPlan: string;
  assignedAt?: string;
  role?: string;
  enterpriseRole?: string;
}

interface ProjectUsersResponse {
  success: boolean;
  data: {
    project: {
      id: string;
      name: string;
      description?: string;
      enterpriseId: string;
    };
    assignedUsers: ProjectUser[];
    availableUsers: ProjectUser[];
  };
}

const fetchProjectUsers = async (
  projectId: string
): Promise<ProjectUsersResponse> => {
  const response = await fetch(`/api/projects/${projectId}/users`);
  if (!response.ok) {
    throw new Error("Failed to fetch project users");
  }
  return response.json();
};

const assignUserToProject = async (
  projectId: string,
  userId: string,
  role: string = "member"
): Promise<void> => {
  const response = await fetch(`/api/projects/${projectId}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, role }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to assign user to project");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to assign user to project");
  }
};

const removeUserFromProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const response = await fetch(
    `/api/projects/${projectId}/users?userId=${userId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to remove user from project");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to remove user from project");
  }
};

export function useProjectUserManagement(projectId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["project-users", projectId],
    queryFn: () => fetchProjectUsers(projectId!),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds - shorter cache time for more responsive updates
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const assignUserMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      assignUserToProject(projectId!, userId, role),
    onSuccess: () => {
      // Invalidate the specific query and also any related project user queries
      queryClient.invalidateQueries({ queryKey: ["project-users", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-users"] });
      toast.success("User assigned to project successfully");
    },
    onError: (error) => {
      console.error("Error assigning user to project:", error);
      toast.error(error.message || "Failed to assign user to project");
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => removeUserFromProject(projectId!, userId),
    onSuccess: () => {
      // Invalidate the specific query and also any related project user queries
      queryClient.invalidateQueries({ queryKey: ["project-users", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-users"] });
      toast.success("User removed from project successfully");
    },
    onError: (error) => {
      console.error("Error removing user from project:", error);
      toast.error(error.message || "Failed to remove user from project");
    },
  });

  return {
    project: data?.data?.project,
    assignedUsers: data?.data?.assignedUsers || [],
    availableUsers: data?.data?.availableUsers || [],
    isLoading,
    error,
    refetch,
    assignUser: assignUserMutation.mutate,
    removeUser: removeUserMutation.mutate,
    isAssigning: assignUserMutation.isPending,
    isRemoving: removeUserMutation.isPending,
  };
}
