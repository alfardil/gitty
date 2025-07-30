import { useQuery } from "@tanstack/react-query";

interface ProjectUser {
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

export function useProjectUsers(projectId?: string) {
  return useQuery({
    queryKey: ["projectUsers", projectId],
    queryFn: () => fetchProjectUsers(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
