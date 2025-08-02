import { useState, useEffect } from "react";

interface SidebarState {
  sidebarOpen: boolean;
  sidebarMobile: boolean;
}

const SIDEBAR_STORAGE_KEY = "gitty-sidebar-state";

export function useSidebarState() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [sidebarMobile, setSidebarMobile] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored) {
        const parsedState: SidebarState = JSON.parse(stored);
        setSidebarOpen(parsedState.sidebarOpen);
        setSidebarMobile(parsedState.sidebarMobile);
      }
    } catch (error) {
      console.warn("Failed to load sidebar state from localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;

    try {
      const state: SidebarState = {
        sidebarOpen,
        sidebarMobile,
      };
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to save sidebar state to localStorage:", error);
    }
  }, [sidebarOpen, sidebarMobile, isInitialized]);

  return {
    sidebarOpen,
    setSidebarOpen,
    sidebarMobile,
    setSidebarMobile,
  };
}
