import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "../../types/business/User";

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    session: {
      accessToken: string;
    };
  };
}

// Fetch user session
const fetchUserSession = async (): Promise<User> => {
  const res = await fetch("/api/auth/validate");
  if (!res.ok) {
    throw new Error("Authentication failed");
  }
  const data: AuthResponse = await res.json();
  return data.data.user;
};

// Logout function
const logoutUser = async (): Promise<void> => {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  if (!res.ok) {
    throw new Error("Logout failed");
  }
};

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query for user session
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchUserSession,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    gcTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
    refetchOnReconnect: false, // Prevent refetch on network reconnect
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear all queries from cache
      queryClient.clear();
      router.push("/login");
    },
    onError: (error) => {
      console.error("Logout failed:", error);
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user: user || null,
    loading: isLoading,
    error,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}
