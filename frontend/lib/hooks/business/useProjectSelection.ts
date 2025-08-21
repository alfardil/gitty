import { useState, useEffect } from "react";
import { localStorageUtils } from "@/lib/utils/localStorage";

const PROJECT_SELECTION_KEY = "thestral-selected-project";

export function useProjectSelection() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected project from localStorage on mount
  useEffect(() => {
    const stored = localStorageUtils.getItem(PROJECT_SELECTION_KEY);
    if (stored) {
      setSelectedProject(stored);
    }
    setIsLoading(false);
  }, []);

  // Update localStorage when selected project changes
  const updateSelectedProject = (projectId: string | null) => {
    setSelectedProject(projectId);
    if (projectId) {
      localStorageUtils.setItem(PROJECT_SELECTION_KEY, projectId);
    } else {
      localStorageUtils.removeItem(PROJECT_SELECTION_KEY);
    }
  };

  // Clear project selection (useful when enterprise changes)
  const clearProjectSelection = () => {
    setSelectedProject(null);
    localStorageUtils.removeItem(PROJECT_SELECTION_KEY);
  };

  return {
    selectedProject,
    setSelectedProject: updateSelectedProject,
    clearProjectSelection,
    isLoading,
  };
}
