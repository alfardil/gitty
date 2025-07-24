import React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/neo/dropdown-menu";
import { Calendar as CalendarIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/neo/spinner";

interface InviteCodeFormProps {
  role: "member" | "admin";
  enterpriseId: string;
  setEnterpriseId: (v: string) => void;
  expiresDate: Date | undefined;
  setExpiresDate: (v: Date | undefined) => void;
  calendarOpen: boolean;
  setCalendarOpen: (v: boolean) => void;
  handleGenerateInvite: () => void;
  generateMemberInviteLoading: boolean;
  generateAdminInviteLoading: boolean;
  inviteResult: any;
}

export function InviteCodeForm({
  role,
  enterpriseId,
  setEnterpriseId,
  expiresDate,
  setExpiresDate,
  calendarOpen,
  setCalendarOpen,
  handleGenerateInvite,
  generateMemberInviteLoading,
  generateAdminInviteLoading,
  inviteResult,
}: InviteCodeFormProps) {
  return (
    <div className="bg-[#23272f] p-6 rounded-lg border border-blue-400/20">
      <h3 className="text-lg font-semibold mb-2">
        Generate Invite Code for {role === "member" ? "Members" : "Admins"}
      </h3>
      <input
        className="w-full p-2 rounded bg-[#181A20] border border-blue-400/20 mb-2 text-white"
        placeholder="Enterprise ID"
        value={enterpriseId}
        onChange={(e) => setEnterpriseId(e.target.value)}
      />
      <div className="mb-2">
        <label className="flex text-sm font-medium text-white mb-1 items-center gap-2">
          <CalendarIcon className="w-4 h-4" /> Expiration Date
        </label>
        <DropdownMenu open={calendarOpen} onOpenChange={setCalendarOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between rounded bg-[#181A20] border border-blue-400/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setCalendarOpen(!calendarOpen)}
            >
              {expiresDate ? (
                <span>{expiresDate.toLocaleDateString()}</span>
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
              selected={expiresDate}
              onSelect={(date) => {
                setExpiresDate(date);
                setCalendarOpen(false);
              }}
              className="rounded bg-[#181A20] text-white"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center"
        onClick={handleGenerateInvite}
        disabled={
          generateMemberInviteLoading ||
          generateAdminInviteLoading ||
          !enterpriseId
        }
      >
        {generateMemberInviteLoading || generateAdminInviteLoading ? (
          <>
            <Spinner size="small" className="mr-2" /> Generating...
          </>
        ) : (
          "Generate Invite"
        )}
      </button>
      {generateMemberInviteLoading || generateAdminInviteLoading ? (
        <div className="mt-2 text-sm text-white">
          <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-2" />
        </div>
      ) : inviteResult && inviteResult.success ? (
        <div className="mt-2 text-sm text-white flex items-center gap-2">
          Invite Code:{" "}
          <span className="font-mono">{inviteResult.data?.code}</span>
          <button
            className="ml-1 p-1 rounded bg-blue-400/20 hover:bg-blue-400/40 text-blue-200 inline-flex items-center"
            onClick={() => {
              navigator.clipboard.writeText(inviteResult.data?.code || "");
              toast.success("Copied to clipboard");
            }}
            title="Copy Invite Code"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
