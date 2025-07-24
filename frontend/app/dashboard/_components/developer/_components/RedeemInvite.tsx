import React from "react";
import { Spinner } from "@/components/ui/neo/spinner";

interface RedeemInviteFormProps {
  redeemCode: string;
  setRedeemCode: (v: string) => void;
  handleRedeemInvite: () => void;
  redeemInviteLoading: boolean;
  redeemResult: any;
}

export function RedeemInviteForm({
  redeemCode,
  setRedeemCode,
  handleRedeemInvite,
  redeemInviteLoading,
  redeemResult,
}: RedeemInviteFormProps) {
  return (
    <div className="bg-[#23272f] p-6 rounded-lg border border-blue-400/20">
      <h3 className="text-lg font-semibold mb-2">Redeem Invite Code</h3>
      <input
        className="w-full p-2 rounded bg-[#181A20] border border-blue-400/20 mb-2 text-white"
        placeholder="Invite Code"
        value={redeemCode}
        onChange={(e) => setRedeemCode(e.target.value)}
      />
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center"
        onClick={handleRedeemInvite}
        disabled={redeemInviteLoading || !redeemCode}
      >
        {redeemInviteLoading ? (
          <>
            <Spinner size="small" className="mr-2" /> Redeeming...
          </>
        ) : (
          "Redeem"
        )}
      </button>
      {redeemResult && redeemResult.success && (
        <div className="mt-2 text-sm text-green-400">
          Successfully joined as {redeemResult.data?.role}!
        </div>
      )}
    </div>
  );
}
