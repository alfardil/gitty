import { useEffect, useState } from "react";
import {
  getAnalyzedReposCount,
  getSubscriptionPlan,
} from "@/app/_actions/cache";

export function useUserStats(githubId: string) {
  const [analyzedReposCount, setAnalyzedReposCount] = useState<number | null>(
    null
  );
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!githubId) {
      setAnalyzedReposCount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getAnalyzedReposCount(githubId)
      .then((count) => {
        setAnalyzedReposCount(count);
      })
      .catch(() => {
        setError("Failed to fetch subscription plan");
      })
      .finally(() => {
        setLoading(false);
      });
    getSubscriptionPlan(githubId)
      .then((plan: string | null) => {
        setSubscriptionPlan(plan);
      })
      .catch(() => {
        setError("Failed to fetch subscription plan");
      });
  }, [githubId]);

  return { analyzedReposCount, loading, error, subscriptionPlan };
}
