import { useQuery } from "@tanstack/react-query";

export function useIsAdminOfAnyEnterprise(userUuid?: string) {
  return useQuery({
    queryKey: ["is-admin-of-any-enterprise", userUuid],
    queryFn: async () => {
      if (!userUuid) return false;
      const res = await fetch(
        `/api/admin?action=getAdminEnterprises&userId=${userUuid}`
      );
      const data = await res.json();
      return data.success && data.data?.enterprises?.length > 0;
    },
    enabled: !!userUuid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
