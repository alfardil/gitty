import { useEffect, useState, useCallback } from "react";
import { getUsername } from "@/app/_actions/cache";

export function useUserUsername(githubId: string) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsername = useCallback(async () => {
    if (!githubId) {
      setUsername(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const name = await getUsername(githubId);
      setUsername(name);
    } catch {
      setError("Failed to fetch username");
    } finally {
      setLoading(false);
    }
  }, [githubId]);

  useEffect(() => {
    fetchUsername();
  }, [fetchUsername]);

  return { username, loading, error, refetch: fetchUsername };
}
