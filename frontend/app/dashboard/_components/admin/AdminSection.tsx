import { Spinner } from "@/components/ui/neo/spinner";
import React, { useEffect } from "react";
import { useAdminEnterprises } from "./hooks/useAdminEnterprises";
import { Enterprise } from "@/lib/types/Enterprise";
import { User } from "@/lib/types/User";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/neo/dropdown-menu";
import { InviteCodeForm } from "../developer/_components/CreateInvite";
import { useEnterpriseActions } from "../developer/hooks/useEnterpriseActions";

interface AdminSectionProps {
  userId: string;
}

function AdminSection({ userId }: AdminSectionProps) {
  const {
    enterprises,
    selectedEnterprise,
    setSelectedEnterprise,
    users,
    loading,
  } = useAdminEnterprises(userId);

  // Fake user object for useEnterpriseActions (only uuid is needed)
  const user = { uuid: userId } as User;
  const actions = useEnterpriseActions(user);

  // Sync selected enterprise to invite forms
  useEffect(() => {
    if (selectedEnterprise) {
      actions.setMemberInviteEnterpriseId(selectedEnterprise);
      actions.setAdminInviteEnterpriseId(selectedEnterprise);
    }
  }, [selectedEnterprise]);

  if (loading) return <Spinner size="large" />;
  if (!enterprises.length) return null;

  const selectedEnt = enterprises.find(
    (ent: Enterprise) => ent.id === selectedEnterprise
  );

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <div className="mb-4">
        <label htmlFor="enterprise-select" className="mr-2 font-medium">
          Select Enterprise:
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="enterprise-select"
              className="border border-blue-400/20 rounded px-2 py-1 min-w-[160px] text-left bg-[#181A20] text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {selectedEnt?.name || "Select..."}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#23272f] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white max-h-[400px] overflow-y-auto">
            {enterprises.map((ent: Enterprise) => (
              <DropdownMenuItem
                key={ent.id}
                onSelect={() => setSelectedEnterprise(ent.id)}
                className={`px-4 py-2 rounded cursor-pointer text-white hover:bg-[#23272f] focus:bg-[#23272f] transition-colors ${ent.id === selectedEnterprise ? "font-bold bg-[#181A20] text-blue-400" : "bg-[#181A20]"}`}
              >
                {ent.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Invite forms for members and admins, above users list */}
      {selectedEnt && (
        <div className="mb-8 flex justify-center">
          <div className="flex gap-8">
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
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold mb-2">Users in Enterprise</h3>
        <ul className="space-y-2">
          {users.map((user: User) => (
            <li
              key={user.id}
              className="flex items-center space-x-4 p-2 border rounded"
            >
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.githubUsername}
                </div>
                <div className="text-sm text-gray-500">
                  {user.subscription_plan}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default AdminSection;
