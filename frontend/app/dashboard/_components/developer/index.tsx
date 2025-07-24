"use client";
import { useEnterpriseActions } from "./hooks/useEnterpriseActions";
import { CreateEnterprise } from "./_components/CreateEnterprise";
import { InviteCodeForm } from "./_components/CreateInvite";
import { RedeemInviteForm } from "./_components/RedeemInvite";

export default function DeveloperSection({ user }: { user: any }) {
  const actions = useEnterpriseActions(user);

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Developer: Enterprise Management
      </h2>
      <CreateEnterprise
        enterpriseName={actions.enterpriseName}
        setEnterpriseName={actions.setEnterpriseName}
        handleCreateEnterprise={actions.handleCreateEnterprise}
        loading={actions.loading}
        enterpriseResult={actions.enterpriseResult}
      />
      <InviteCodeForm
        role="member"
        enterpriseId={actions.memberInviteEnterpriseId}
        setEnterpriseId={actions.setMemberInviteEnterpriseId}
        expiresDate={actions.memberInviteExpiresDate}
        setExpiresDate={actions.setMemberInviteExpiresDate}
        calendarOpen={actions.memberCalendarOpen}
        setCalendarOpen={actions.setMemberCalendarOpen}
        handleGenerateInvite={actions.handleGenerateMemberInvite}
        loading={actions.loading}
        inviteResult={actions.memberInviteResult}
      />
      <InviteCodeForm
        role="admin"
        enterpriseId={actions.adminInviteEnterpriseId}
        setEnterpriseId={actions.setAdminInviteEnterpriseId}
        expiresDate={actions.adminInviteExpiresDate}
        setExpiresDate={actions.setAdminInviteExpiresDate}
        calendarOpen={actions.adminCalendarOpen}
        setCalendarOpen={actions.setAdminCalendarOpen}
        handleGenerateInvite={actions.handleGenerateAdminInvite}
        loading={actions.loading}
        inviteResult={actions.adminInviteResult}
      />
      <RedeemInviteForm
        redeemCode={actions.redeemCode}
        setRedeemCode={actions.setRedeemCode}
        handleRedeemInvite={actions.handleRedeemInvite}
        loading={actions.loading}
        redeemResult={actions.redeemResult}
      />
    </div>
  );
}
