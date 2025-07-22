import { useState, useEffect } from "react";
import {
  fetchUserRepos,
  getGithubAccessTokenFromCookie,
} from "@/lib/fetchRepos";

export function useUserRepos(user: any) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        setLoading(true);
        try {
          const token = getGithubAccessTokenFromCookie();
          if (token) {
            const reposData = await fetchUserRepos(token, 100, 1);
            setRepos(
              [...reposData].sort(
                (a, b) => b.stargazers_count - a.stargazers_count
              )
            );
          }
        } finally {
          setLoading(false);
        }
      } else {
        setRepos([]);
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const totalRepos = repos.length;

  return { repos, loading, totalRepos };
}
