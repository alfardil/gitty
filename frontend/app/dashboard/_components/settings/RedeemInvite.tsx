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
    <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10">
      <h3 className="text-lg font-semibold mb-4 text-center text-white">
        Redeem Invite Code
      </h3>
      <input
        className="w-full p-2 rounded-lg bg-[#111111] border border-white/10 mb-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/30"
        placeholder="Invite Code"
        value={redeemCode}
        onChange={(e) => setRedeemCode(e.target.value)}
      />
      <div className="flex justify-center">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center justify-center transition"
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
      </div>
    </div>
  );
}
