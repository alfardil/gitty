"use client";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/neo/dropdown-menu";
import { Calendar as CalendarIcon } from "lucide-react";
import { Copy } from "lucide-react";

export function DeveloperSection({ user }: { user: any }) {
  const [enterpriseName, setEnterpriseName] = useState("");
  const [enterpriseResult, setEnterpriseResult] = useState<any>(null);
  const [inviteEnterpriseId, setInviteEnterpriseId] = useState("");
  const [inviteExpiresDate, setInviteExpiresDate] = useState<Date | undefined>(
    undefined
  );
  const [inviteCode, setInviteCode] = useState("");
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemResult, setRedeemResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [memberInviteEnterpriseId, setMemberInviteEnterpriseId] = useState("");
  const [memberInviteExpiresDate, setMemberInviteExpiresDate] = useState<
    Date | undefined
  >(undefined);
  const [memberInviteResult, setMemberInviteResult] = useState<any>(null);
  const [adminInviteEnterpriseId, setAdminInviteEnterpriseId] = useState("");
  const [adminInviteExpiresDate, setAdminInviteExpiresDate] = useState<
    Date | undefined
  >(undefined);
  const [adminInviteResult, setAdminInviteResult] = useState<any>(null);
  const [memberCalendarOpen, setMemberCalendarOpen] = useState(false);
  const [adminCalendarOpen, setAdminCalendarOpen] = useState(false);

  const handleCreateEnterprise = async () => {
    setLoading(true);
    setEnterpriseResult(null);
    const res = await fetch("/api/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createEnterprise",
        name: enterpriseName,
        ownerUserId: user.uuid,
      }),
    });
    const data = await res.json();
    if (data?.error?.fieldErrors || data?.error?.formErrors) {
      toast.error(
        Object.values(data.error.fieldErrors || {})
          .flat()
          .join(", ")
      );
    } else if (typeof data?.error === "string") {
      toast.error(data.error);
    } else if (data?.error?.message) {
      toast.error(data.error.message);
    } else if (data?.success) {
      toast.success("Enterprise created successfully!");
      setEnterpriseName("");
    }
    setEnterpriseResult(data);
    setLoading(false);
  };

  const handleGenerateInvite = async () => {
    setLoading(true);
    setInviteResult(null);
    let expiresAt: string | undefined = undefined;
    if (inviteExpiresDate) {
      const endOfDay = new Date(inviteExpiresDate);
      endOfDay.setHours(23, 59, 59, 999);
      expiresAt = endOfDay.toISOString();
    }
    const res = await fetch("/api/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generateInviteCode",
        enterpriseId: inviteEnterpriseId,
        expiresAt,
      }),
    });
    const data = await res.json();
    if (data?.error?.fieldErrors || data?.error?.formErrors) {
      toast.error(
        Object.values(data.error.fieldErrors || {})
          .flat()
          .join(", ")
      );
    } else if (typeof data?.error === "string") {
      toast.error(data.error);
    } else if (data?.error?.message) {
      toast.error(data.error.message);
    } else if (data?.success) {
      toast.success("Invite code generated!");
    }
    setInviteResult(data);
    if (data.code) setInviteCode(data.code);
    setLoading(false);
  };

  const handleRedeemInvite = async () => {
    setLoading(true);
    setRedeemResult(null);
    const res = await fetch("/api/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "redeemInviteCode",
        code: redeemCode,
        userId: user.uuid,
      }),
    });
    const data = await res.json();
    if (data?.error?.fieldErrors || data?.error?.formErrors) {
      toast.error(
        Object.values(data.error.fieldErrors || {})
          .flat()
          .join(", ")
      );
    } else if (typeof data?.error === "string") {
      toast.error(data.error);
    } else if (data?.error?.message) {
      toast.error(data.error.message);
    } else if (data?.error?.code === "ALREADY_MEMBER") {
      toast.error("You are already a member of this enterprise.");
      setRedeemResult(null);
    } else if (
      data?.error?.message === "Invite code already used" ||
      data?.error === "Invite code already used"
    ) {
      toast.error("Invite code already used.");
      setRedeemResult(null);
    } else if (data?.success) {
      toast.success("Successfully joined enterprise!");
      setRedeemResult(data);
    } else {
      setRedeemResult(data);
    }
    setLoading(false);
  };

  const handleGenerateMemberInvite = async () => {
    setLoading(true);
    setMemberInviteResult(null);
    let expiresAt: string | undefined = undefined;
    if (memberInviteExpiresDate) {
      const endOfDay = new Date(memberInviteExpiresDate);
      endOfDay.setHours(23, 59, 59, 999);
      expiresAt = endOfDay.toISOString();
    }
    const res = await fetch("/api/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generateMemberInviteCode",
        enterpriseId: memberInviteEnterpriseId,
        expiresAt,
      }),
    });
    const data = await res.json();
    if (data?.error?.fieldErrors || data?.error?.formErrors) {
      toast.error(
        Object.values(data.error.fieldErrors || {})
          .flat()
          .join(", ")
      );
    } else if (typeof data?.error === "string") {
      toast.error(data.error);
    } else if (data?.error?.message) {
      toast.error(data.error.message);
    } else if (data?.success) {
      toast.success("Member invite code generated!");
    }
    setMemberInviteResult(data);
    setLoading(false);
  };

  const handleGenerateAdminInvite = async () => {
    setLoading(true);
    setAdminInviteResult(null);
    let expiresAt: string | undefined = undefined;
    if (adminInviteExpiresDate) {
      const endOfDay = new Date(adminInviteExpiresDate);
      endOfDay.setHours(23, 59, 59, 999);
      expiresAt = endOfDay.toISOString();
    }
    const res = await fetch("/api/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generateAdminInviteCode",
        enterpriseId: adminInviteEnterpriseId,
        expiresAt,
      }),
    });
    const data = await res.json();
    if (data?.error?.fieldErrors || data?.error?.formErrors) {
      toast.error(
        Object.values(data.error.fieldErrors || {})
          .flat()
          .join(", ")
      );
    } else if (typeof data?.error === "string") {
      toast.error(data.error);
    } else if (data?.error?.message) {
      toast.error(data.error.message);
    } else if (data?.success) {
      toast.success("Admin invite code generated!");
    }
    setAdminInviteResult(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Developer: Enterprise Management
      </h2>
      {/* Create Enterprise */}
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
              <span className="font-mono">
                {enterpriseResult.enterprise?.id}
              </span>
              <button
                className="ml-1 p-1 rounded bg-blue-400/20 hover:bg-blue-400/40 text-blue-200 inline-flex items-center"
                onClick={() => {
                  navigator.clipboard.writeText(
                    enterpriseResult.enterprise?.id || ""
                  );
                  toast.success("Enterprise ID copied!");
                }}
                title="Copy ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Generate Invite Code for Members */}
      <div className="bg-[#23272f] p-6 rounded-lg border border-blue-400/20">
        <h3 className="text-lg font-semibold mb-2">
          Generate Invite Code for Members
        </h3>
        <input
          className="w-full p-2 rounded bg-[#181A20] border border-blue-400/20 mb-2 text-white"
          placeholder="Enterprise ID"
          value={memberInviteEnterpriseId}
          onChange={(e) => setMemberInviteEnterpriseId(e.target.value)}
        />
        <div className="mb-2">
          <label className="flex text-sm font-medium text-white mb-1 items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Expiration Date
          </label>
          <DropdownMenu
            open={memberCalendarOpen}
            onOpenChange={setMemberCalendarOpen}
          >
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between rounded bg-[#181A20] border border-blue-400/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setMemberCalendarOpen((v) => !v)}
              >
                {memberInviteExpiresDate ? (
                  <span>{memberInviteExpiresDate.toLocaleDateString()}</span>
                ) : (
                  <span className="text-gray-400">Select date…</span>
                )}
                <CalendarIcon className="w-4 h-4 ml-2 text-blue-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="p-0 mt-2 bg-[#181A20] border border-blue-400/20 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              <Calendar
                mode="single"
                selected={memberInviteExpiresDate}
                onSelect={(date) => {
                  setMemberInviteExpiresDate(date);
                  setMemberCalendarOpen(false);
                }}
                className="rounded bg-[#181A20] text-white"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleGenerateMemberInvite}
          disabled={loading || !memberInviteEnterpriseId}
        >
          Generate Member Invite
        </button>
        {memberInviteResult && memberInviteResult.success && (
          <div className="mt-2 text-sm text-white flex items-center gap-2">
            Invite Code:{" "}
            <span className="font-mono">{memberInviteResult.code}</span>
            <button
              className="ml-1 p-1 rounded bg-blue-400/20 hover:bg-blue-400/40 text-blue-200 inline-flex items-center"
              onClick={() => {
                navigator.clipboard.writeText(memberInviteResult.code || "");
                toast.success("Invite code copied!");
              }}
              title="Copy Invite Code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {/* Generate Invite Code for Admins */}
      <div className="bg-[#23272f] p-6 rounded-lg border border-blue-400/20">
        <h3 className="text-lg font-semibold mb-2">
          Generate Invite Code for Admins
        </h3>
        <input
          className="w-full p-2 rounded bg-[#181A20] border border-blue-400/20 mb-2 text-white"
          placeholder="Enterprise ID"
          value={adminInviteEnterpriseId}
          onChange={(e) => setAdminInviteEnterpriseId(e.target.value)}
        />
        <div className="mb-2">
          <label className="flex text-sm font-medium text-white mb-1 items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Expiration Date
          </label>
          <DropdownMenu
            open={adminCalendarOpen}
            onOpenChange={setAdminCalendarOpen}
          >
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between rounded bg-[#181A20] border border-blue-400/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setAdminCalendarOpen((v) => !v)}
              >
                {adminInviteExpiresDate ? (
                  <span>{adminInviteExpiresDate.toLocaleDateString()}</span>
                ) : (
                  <span className="text-gray-400">Select date…</span>
                )}
                <CalendarIcon className="w-4 h-4 ml-2 text-blue-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="p-0 mt-2 bg-[#181A20] border border-blue-400/20 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              <Calendar
                mode="single"
                selected={adminInviteExpiresDate}
                onSelect={(date) => {
                  setAdminInviteExpiresDate(date);
                  setAdminCalendarOpen(false);
                }}
                className="rounded bg-[#181A20] text-white"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleGenerateAdminInvite}
          disabled={loading || !adminInviteEnterpriseId}
        >
          Generate Admin Invite
        </button>
        {adminInviteResult && adminInviteResult.success && (
          <div className="mt-2 text-sm text-white flex items-center gap-2">
            Invite Code:{" "}
            <span className="font-mono">{adminInviteResult.code}</span>
            <button
              className="ml-1 p-1 rounded bg-blue-400/20 hover:bg-blue-400/40 text-blue-200 inline-flex items-center"
              onClick={() => {
                navigator.clipboard.writeText(adminInviteResult.code || "");
                toast.success("Invite code copied!");
              }}
              title="Copy Invite Code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {/* Redeem Invite Code */}
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
        {redeemResult && (
          <div className="mt-2 text-sm text-white">
            {redeemResult.success ? <>Successfully joined enterprise!</> : null}
          </div>
        )}
      </div>
    </div>
  );
}
