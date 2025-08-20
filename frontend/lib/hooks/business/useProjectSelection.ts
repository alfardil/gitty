import { useState, useEffect } from "react";

const PROJECT_SELECTION_KEY = "thestral-selected-project";

export function useProjectSelection() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected project from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROJECT_SELECTION_KEY);
      if (stored) {
        setSelectedProject(stored);
      }
    } catch (error) {
      console.error(
        "Failed to load project selection from localStorage:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update localStorage when selected project changes
  const updateSelectedProject = (projectId: string | null) => {
    setSelectedProject(projectId);
    try {
      if (projectId) {
        localStorage.setItem(PROJECT_SELECTION_KEY, projectId);
      } else {
        localStorage.removeItem(PROJECT_SELECTION_KEY);
      }
    } catch (error) {
      console.error("Failed to save project selection to localStorage:", error);
    }
  };

  return {
    selectedProject,
    setSelectedProject: updateSelectedProject,
    isLoading,
  };
}
