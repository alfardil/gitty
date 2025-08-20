import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Enterprise } from "@/lib/types/business/Enterprise";

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

  // Select the first enterprise by default
  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(
    null
  );

  // Set default selected enterprise when enterprisesData changes
  useEffect(() => {
    if (enterprisesData && enterprisesData.length > 0 && !selectedEnterprise) {
      setSelectedEnterprise(enterprisesData[0].id);
    } else if (enterprisesData && enterprisesData.length === 0) {
      setSelectedEnterprise(null);
    }
  }, [enterprisesData, selectedEnterprise]);

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
    setSelectedEnterprise,
    users: usersData ?? [],
    loading: enterprisesLoading || usersLoading,
    enterprisesError,
    usersError,
  };
}
