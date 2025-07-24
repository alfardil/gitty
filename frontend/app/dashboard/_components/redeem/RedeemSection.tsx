import { RedeemInviteForm } from "./_components/RedeemInvite";
import { useEnterpriseActions } from "../developer/hooks/useEnterpriseActions";
import { User } from "@/lib/types/User";

export default function RedeemSection({ user }: { user: User }) {
  const actions = useEnterpriseActions(user);

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Redeem Invite</h2>
      <RedeemInviteForm
        redeemCode={actions.redeemCode}
        setRedeemCode={actions.setRedeemCode}
        handleRedeemInvite={actions.handleRedeemInvite}
        redeemInviteLoading={actions.redeemInviteLoading}
        redeemResult={actions.redeemResult}
      />
    </div>
  );
}
