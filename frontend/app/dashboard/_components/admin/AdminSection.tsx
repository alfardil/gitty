import { Spinner } from "@/components/ui/neo/spinner";
import React from "react";
import {
  Enterprise,
  useAdminEnterprises,
  User,
} from "./hooks/useAdminEnterprises";

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

  if (loading) return <Spinner size="large" />;
  if (!enterprises.length) return null;

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <div className="mb-4">
        <label htmlFor="enterprise-select" className="mr-2 font-medium">
          Select Enterprise:
        </label>
        <select
          id="enterprise-select"
          value={selectedEnterprise || ""}
          onChange={(e) => setSelectedEnterprise(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {enterprises.map((ent: Enterprise) => (
            <option key={ent.id} value={ent.id}>
              {ent.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Users in Enterprise</h3>
        <ul className="space-y-2">
          {users.map((user: User) => (
            <li
              key={user.id}
              className="flex items-center space-x-4 p-2 border rounded"
            >
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {user.subscriptionPlan}
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
