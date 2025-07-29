import { useState, useEffect } from "react";
import {
  fetchRecentCommits,
  getGithubAccessTokenFromCookie,
} from "@/lib/utils/api/fetchRepos";

export function useRecentCommits(user: any) {
  const [recentCommits, setRecentCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (user) {
        setLoading(true);
        try {
          const token = getGithubAccessTokenFromCookie();
          if (token) {
            const commitsData = await fetchRecentCommits(token, user);
            setRecentCommits(commitsData);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setRecentCommits([]);
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return { recentCommits, loading };
}
