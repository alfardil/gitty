import { useState, useEffect } from "react";
import {
  fetchUserOrgs,
  getGithubAccessTokenFromCookie,
} from "@/lib/fetchRepos";

export function useUserOrgs(user: any) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (user) {
        setLoading(true);
        try {
          const token = getGithubAccessTokenFromCookie();
          if (token) {
            const orgsData = await fetchUserOrgs(token);
            setOrgs(orgsData);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setOrgs([]);
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return { orgs, loading };
}
