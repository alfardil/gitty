import { useState, useEffect } from "react";
import {
  fetchUserRepos,
  fetchOrgRepos,
  getGithubAccessTokenFromCookie,
} from "@/lib/fetchRepos";

export function useScopeRepos(user: any, selectedScope: string) {
  const [scopeRepos, setScopeRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (user && selectedScope) {
        setLoading(true);
        try {
          const token = getGithubAccessTokenFromCookie();
          if (token) {
            let reposData = [];
            if (selectedScope === "Personal") {
              reposData = await fetchUserRepos(token, 100, 1);
            } else {
              reposData = await fetchOrgRepos(token, selectedScope, 100, 1);
            }
            setScopeRepos(
              [...reposData].sort(
                (a, b) => b.stargazers_count - a.stargazers_count
              )
            );
          }
        } finally {
          setLoading(false);
        }
      } else {
        setScopeRepos([]);
        setLoading(false);
      }
    }
    load();
  }, [user, selectedScope]);

  return { scopeRepos, loading };
}
