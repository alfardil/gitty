import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Enterprise } from "@/lib/types/business/Enterprise";
import { localStorageUtils } from "@/lib/utils/localStorage";

const ADMIN_SELECTED_ENTERPRISE_KEY = "admin-selected-enterprise-id";

interface EnterpriseUser {
  id: string;
  githubId: string | null;
  githubUsername: string | null;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  subscription_plan: string | null;
  role: string;
}

export function useAdminEnterprises(userId: string, projectId?: string) {
  const {
    data: enterprisesData,
    isLoading: enterprisesLoading,
    error: enterprisesError,
  } = useQuery({
    queryKey: ["admin-enterprises", userId],
    queryFn: async (): Promise<Enterprise[]> => {
      if (!userId) return [];

      const res = await fetch(
        `/api/admin?action=getAdminEnterprises&userId=${userId}`
      );
      const data = await res.json();
      if (data.success && data.data?.enterprises) {
        return data.data.enterprises;
      }
      return [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes (increased from 2)
    gcTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });

  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(
    null
  );

  // Load selected enterprise from localStorage on mount
  useEffect(() => {
    const stored = localStorageUtils.getItem(ADMIN_SELECTED_ENTERPRISE_KEY);
    if (stored) {
      setSelectedEnterprise(stored);
    }
  }, []);

  // Handle enterprise data changes and validate stored selection
  useEffect(() => {
    if (enterprisesData && enterprisesData.length > 0) {
      // Check if current selection is valid
      const isValidSelection =
        selectedEnterprise &&
        enterprisesData.find((e) => e.id === selectedEnterprise);

      if (!isValidSelection) {
        // Select first enterprise if current selection is invalid
        const newSelection = enterprisesData[0].id;
        setSelectedEnterprise(newSelection);
        localStorageUtils.setItem(ADMIN_SELECTED_ENTERPRISE_KEY, newSelection);
      }
    } else if (enterprisesData && enterprisesData.length === 0) {
      // Clear selection if no enterprises available
      setSelectedEnterprise(null);
      localStorageUtils.removeItem(ADMIN_SELECTED_ENTERPRISE_KEY);
    }
  }, [enterprisesData]); // Remove selectedEnterprise from dependencies to prevent loops

  const updateSelectedEnterprise = (enterpriseId: string | null) => {
    setSelectedEnterprise(enterpriseId);
    if (enterpriseId) {
      localStorageUtils.setItem(ADMIN_SELECTED_ENTERPRISE_KEY, enterpriseId);
    } else {
      localStorageUtils.removeItem(ADMIN_SELECTED_ENTERPRISE_KEY);
    }
  };

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["enterprise-users", selectedEnterprise, projectId],
    queryFn: async (): Promise<EnterpriseUser[]> => {
      if (!selectedEnterprise) return [];

      const params = new URLSearchParams({ enterpriseId: selectedEnterprise });
      if (projectId) params.append("projectId", projectId);

      const res = await fetch(`/api/admin?action=getEnterpriseUsers&${params}`);
      const data = await res.json();
      if (data.success && data.data?.users) {
        return data.data.users;
      }
      return [];
    },
    enabled: !!selectedEnterprise,
    staleTime: 5 * 60 * 1000, // 5 minutes (increased from 2)
    gcTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });

  return {
    enterprises: enterprisesData ?? [],
    selectedEnterprise,
    setSelectedEnterprise: updateSelectedEnterprise,
    users: usersData ?? [],
    loading: enterprisesLoading || usersLoading,
    enterprisesError,
    usersError,
  };
}
