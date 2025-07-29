import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Enterprise } from "@/lib/types/business/Enterprise";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SELECTED_ENTERPRISE_KEY);
      if (stored) {
        setSelectedEnterprise(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (enterprisesData && enterprisesData.length > 0) {
      if (
        !selectedEnterprise ||
        !enterprisesData.find((e) => e.id === selectedEnterprise)
      ) {
        const newSelection = enterprisesData[0].id;
        setSelectedEnterprise(newSelection);
        if (typeof window !== "undefined") {
          localStorage.setItem(SELECTED_ENTERPRISE_KEY, newSelection);
        }
      }
    } else {
      setSelectedEnterprise(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(SELECTED_ENTERPRISE_KEY);
      }
    }
  }, [enterprisesData, selectedEnterprise]);

  const updateSelectedEnterprise = (enterpriseId: string | null) => {
    setSelectedEnterprise(enterpriseId);
    if (typeof window !== "undefined") {
      if (enterpriseId) {
        localStorage.setItem(SELECTED_ENTERPRISE_KEY, enterpriseId);
      } else {
        localStorage.removeItem(SELECTED_ENTERPRISE_KEY);
      }
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
