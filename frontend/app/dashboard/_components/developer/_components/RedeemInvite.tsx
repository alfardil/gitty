import React from "react";

interface RedeemInviteFormProps {
  redeemCode: string;
  setRedeemCode: (v: string) => void;
  handleRedeemInvite: () => void;
  loading: boolean;
  redeemResult: any;
}

export function RedeemInviteForm({
  redeemCode,
  setRedeemCode,
  handleRedeemInvite,
  loading,
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
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleRedeemInvite}
        disabled={loading || !redeemCode}
      >
        Redeem
      </button>
      {redeemResult && null}
    </div>
  );
}
