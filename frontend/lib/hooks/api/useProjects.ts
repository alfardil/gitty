import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Project } from "@/lib/types/business/Project";

interface ProjectFormData {
  name: string;
  description?: string;
  enterpriseId: string;
  startDate?: Date;
  targetEndDate?: Date;
  estimatedTotalHours?: number;
}

// Fetch projects for an enterprise
const fetchProjects = async (enterpriseId: string): Promise<Project[]> => {
  const response = await fetch(`/api/projects?enterpriseId=${enterpriseId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  const data = await response.json();
  return data.projects;
};

// Create a new project
const createProject = async (
  projectData: ProjectFormData
): Promise<Project> => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...projectData,
      startDate: projectData.startDate?.toISOString(),
      targetEndDate: projectData.targetEndDate?.toISOString(),
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to create project");
  }
  const data = await response.json();
  return data.project;
};

export function useProjects(enterpriseId?: string) {
  const queryClient = useQueryClient();

  // Query for fetching projects
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", enterpriseId],
    queryFn: () => fetchProjects(enterpriseId!),
    enabled: !!enterpriseId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Mutation for creating projects
  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", enterpriseId] });
      toast.success("Project created successfully!");
    },
    onError: (error) => {
      console.error("Error creating project:", error);
      toast.error("Failed to create project. Please try again.");
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProjectMutation.mutate,
    isCreating: createProjectMutation.isPending,
    refetch,
  };
}
