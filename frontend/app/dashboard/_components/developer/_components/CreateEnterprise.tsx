import React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface CreateEnterpriseProps {
  enterpriseName: string;
  setEnterpriseName: (v: string) => void;
  handleCreateEnterprise: () => void;
  loading: boolean;
  enterpriseResult: any;
}

export function CreateEnterprise({
  enterpriseName,
  setEnterpriseName,
  handleCreateEnterprise,
  loading,
  enterpriseResult,
}: CreateEnterpriseProps) {
  return (
    <div className="bg-[#23272f] p-6 rounded-lg border border-blue-400/20">
      <h3 className="text-lg font-semibold mb-2">Create Enterprise</h3>
      <input
        className="w-full p-2 rounded bg-[#181A20] border border-blue-400/20 mb-2 text-white"
        placeholder="Enterprise Name"
        value={enterpriseName}
        onChange={(e) => setEnterpriseName(e.target.value)}
      />
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleCreateEnterprise}
        disabled={loading || !enterpriseName}
      >
        Create
      </button>
      {enterpriseResult && enterpriseResult.success && (
        <div className="mt-2 text-sm text-white">
          <div>Created: {enterpriseResult.enterprise?.name}</div>
          <div className="flex items-center gap-2 mt-1">
            Enterprise ID:{" "}
            <span className="font-mono">{enterpriseResult.enterprise?.id}</span>
            <button
              className="ml-1 p-1 rounded bg-blue-400/20 hover:bg-blue-400/40 text-blue-200 inline-flex items-center"
              onClick={() => {
                navigator.clipboard.writeText(
                  enterpriseResult.enterprise?.id || ""
                );
                toast.success("Copied to clipboard");
              }}
              title="Copy ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
