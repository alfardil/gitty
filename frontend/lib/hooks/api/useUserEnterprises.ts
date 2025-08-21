import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Enterprise } from "@/lib/types/business/Enterprise";
import { localStorageUtils } from "@/lib/utils/localStorage";

const SELECTED_ENTERPRISE_KEY = "selected-enterprise-id";

export function useUserEnterprises(userId?: string) {
  const {
    data: enterprisesData,
    isLoading: enterprisesLoading,
    error: enterprisesError,
  } = useQuery({
    queryKey: ["user-enterprises", userId],
    queryFn: async (): Promise<Enterprise[]> => {
      if (!userId) return [];
      const res = await fetch(
        `/api/admin?action=getUserEnterprises&userId=${userId}`
      );
      const data = await res.json();
      if (data.success && data.data?.enterprises) {
        return data.data.enterprises;
      }
      return [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(
    null
  );

  // Load selected enterprise from localStorage on mount
  useEffect(() => {
    const stored = localStorageUtils.getItem(SELECTED_ENTERPRISE_KEY);
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
        localStorageUtils.setItem(SELECTED_ENTERPRISE_KEY, newSelection);
      }
    } else if (enterprisesData && enterprisesData.length === 0) {
      // Clear selection if no enterprises available
      setSelectedEnterprise(null);
      localStorageUtils.removeItem(SELECTED_ENTERPRISE_KEY);
    }
  }, [enterprisesData]); // Remove selectedEnterprise from dependencies to prevent loops

  const updateSelectedEnterprise = (enterpriseId: string | null) => {
    setSelectedEnterprise(enterpriseId);
    if (enterpriseId) {
      localStorageUtils.setItem(SELECTED_ENTERPRISE_KEY, enterpriseId);
    } else {
      localStorageUtils.removeItem(SELECTED_ENTERPRISE_KEY);
    }
  };

  return {
    enterprises: enterprisesData ?? [],
    selectedEnterprise,
    setSelectedEnterprise: updateSelectedEnterprise,
    loading: enterprisesLoading,
    error: enterprisesError,
  };
}
