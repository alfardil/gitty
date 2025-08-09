"use client";
import React, { useState } from "react";
import {
  Database,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/neo/spinner";
import { toast } from "sonner";

interface MigrationResult {
  total: number;
  results: Array<{
    userId: string;
    success: boolean;
    error?: string;
    result?: any;
  }>;
}

export function UserMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] =
    useState<MigrationResult | null>(null);

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const response = await fetch("/api/developer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "migrateUsersToPersonalEnterprises",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMigrationResult(result.data);
        toast.success(result.message);
      } else {
        toast.error(result.error || "Migration failed");
      }
    } catch (error) {
      console.error("Migration error:", error);
      toast.error("Failed to run migration");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">User Migration</h3>
        </div>
        <p className="text-gray-300 mb-6">
          Automatically assign personal enterprises and projects to users who
          don&apos;t have any. This ensures all users can access the roadmap and
          personal project features.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isMigrating ? (
              <>
                <Spinner size="small" />
                <span>Running Migration...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Run Migration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {migrationResult && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">
                Migrated{" "}
                {migrationResult.results?.filter((r) => r.success).length || 0}{" "}
                users
              </span>
            </div>
          )}
        </div>

        {migrationResult && (
          <div className="bg-[#0F0F0F] rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-medium text-white mb-3">
              Migration Results
            </h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {migrationResult.total}
                </div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {migrationResult.results?.filter((r) => r.success).length ||
                    0}
                </div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {migrationResult.results?.filter((r) => !r.success).length ||
                    0}
                </div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
            </div>

            {migrationResult.results?.filter((r) => !r.success).length > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Failed Migrations
                </h5>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {migrationResult.results
                    ?.filter((r) => !r.success)
                    .map((result, index) => (
                      <div
                        key={index}
                        className="text-xs text-gray-400 bg-red-900/20 p-2 rounded"
                      >
                        User ID: {result.userId} - {result.error}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#1A1A1A] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Finds users who don&apos;t belong to any enterprise</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>
              Creates a personal enterprise for each user (named &quot;
              {`{username}'s Personal`}&quot;)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>
              Creates a default &quot;Personal Project&quot; within the
              enterprise
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Assigns the user as admin of their personal enterprise</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>
              Safe to run multiple times - skips users who already have
              enterprises
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
