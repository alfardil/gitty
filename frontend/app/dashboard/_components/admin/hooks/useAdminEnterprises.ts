import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function useAdminEnterprises(userId: string) {
  const { data: enterprisesData, isLoading: enterprisesLoading } = useQuery({
    queryKey: ["admin-enterprises", userId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin?action=getAdminEnterprises&userId=${userId}`
      );
      const data = await res.json();
      if (data.success && data.data?.enterprises?.length > 0) {
        return data.data.enterprises;
      }
      return [];
    },
    enabled: !!userId,
  });

  // Select the first enterprise by default
  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(
    null
  );

  // Set default selected enterprise when enterprisesData changes
  useEffect(() => {
    if (enterprisesData && enterprisesData.length > 0) {
      setSelectedEnterprise((prev) => prev ?? enterprisesData[0].id);
    } else {
      setSelectedEnterprise(null);
    }
  }, [enterprisesData]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["enterprise-users", selectedEnterprise],
    queryFn: async () => {
      if (!selectedEnterprise) return [];
      const res = await fetch(
        `/api/admin?action=getEnterpriseUsers&enterpriseId=${selectedEnterprise}`
      );
      const data = await res.json();
      if (data.success && data.data?.users) {
        return data.data.users;
      }
      return [];
    },
    enabled: !!selectedEnterprise,
  });

  return {
    enterprises: enterprisesData ?? [],
    selectedEnterprise,
    setSelectedEnterprise,
    users: usersData ?? [],
    loading: enterprisesLoading || usersLoading,
  };
}
