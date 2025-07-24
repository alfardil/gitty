"use client";
import { useEnterpriseActions } from "./hooks/useEnterpriseActions";
import { CreateEnterprise } from "./_components/CreateEnterprise";
import { InviteCodeForm } from "./_components/CreateInvite";
import { User } from "@/lib/types/User";

export default function DeveloperSection({ user }: { user: User }) {
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
        createEnterpriseLoading={actions.createEnterpriseLoading}
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
        generateMemberInviteLoading={actions.generateMemberInviteLoading}
        generateAdminInviteLoading={false}
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
        generateMemberInviteLoading={false}
        generateAdminInviteLoading={actions.generateAdminInviteLoading}
        inviteResult={actions.adminInviteResult}
      />
    </div>
  );
}
