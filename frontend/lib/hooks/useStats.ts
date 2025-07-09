import { useState, useEffect } from "react";
import { fetchRowCount, getDiagramAndUserStats } from "@/app/_actions/cache";

export function useStats() {
  const [stats, setStats] = useState<{
    totalDiagrams: number;
    totalUsers: number;
    rowCount: number;
  } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [diagramStats, rowCountData] = await Promise.all([
          getDiagramAndUserStats(),
          fetchRowCount(),
        ]);

        if (diagramStats && rowCountData.success) {
          setStats({
            ...diagramStats,
            rowCount: rowCountData.count,
          });
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();
  }, []);

  return stats;
}
