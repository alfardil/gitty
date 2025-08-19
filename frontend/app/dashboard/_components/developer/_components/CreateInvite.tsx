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
  const isLoading = generateMemberInviteLoading || generateAdminInviteLoading;
  
  return (
    <div className="bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-lg p-5 space-y-4">
      {/* Header with {} styling */}
      <div className="flex items-center gap-2">
        <span className="text-white/40 font-mono text-sm">{"{"}</span>
        <h3 className="text-sm font-mono text-white/80 tracking-wide">
          {role === "member" ? "member" : "admin"}_access
        </h3>
        <span className="text-white/40 font-mono text-sm">{"}"}</span>
      </div>

      {/* Enterprise ID Input */}
      <div>
        <label className="block text-xs font-mono text-white/60 mb-2 tracking-wider">
          ENTERPRISE_ID
        </label>
        <input
          className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white/90 font-mono text-sm focus:outline-none focus:border-white/20 hover:border-white/15 transition-all"
          placeholder="enter_enterprise_id"
          value={enterpriseId}
          onChange={(e) => setEnterpriseId(e.target.value)}
        />
      </div>

      {/* Expiration Date */}
      <div>
        <label className="block text-xs font-mono text-white/60 mb-2 tracking-wider">
          EXPIRES_DATE
        </label>
        <DropdownMenu open={calendarOpen} onOpenChange={setCalendarOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 bg-black/30 border border-white/10 rounded-lg text-white/90 font-mono text-sm focus:outline-none focus:border-white/20 hover:border-white/15 transition-all"
              onClick={() => setCalendarOpen(!calendarOpen)}
            >
              {expiresDate ? (
                <span>{expiresDate.toLocaleDateString()}</span>
              ) : (
                <span className="text-white/50">select_date</span>
              )}
              <CalendarIcon className="w-4 h-4 text-white/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="p-0 mt-2 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            <Calendar
              mode="single"
              selected={expiresDate}
              onSelect={(date) => {
                setExpiresDate(date);
                setCalendarOpen(false);
              }}
              className="rounded bg-black/90 text-white"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Generate Button */}
      <button
        className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/80 hover:text-white font-mono text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleGenerateInvite}
        disabled={isLoading || !enterpriseId}
      >
        {isLoading ? (
          <>
            <Spinner size="small" />
            <span>generating...</span>
          </>
        ) : (
          <>
            <span>{"{"}</span>
            <span>generate_invite</span>
            <span>{"}"}</span>
          </>
        )}
      </button>

      {/* Result Display */}
      {isLoading ? (
        <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 text-white/50 font-mono text-xs">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
            <span>processing_request...</span>
          </div>
        </div>
      ) : inviteResult && inviteResult.success ? (
        <div className="space-y-2">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <div className="text-xs font-mono text-white/60 mb-1">INVITE_CODE:</div>
            <div className="font-mono text-sm text-white/90 break-all bg-black/30 p-2 rounded border border-white/5">
              {inviteResult.data?.code}
            </div>
          </div>
          <button
            className="w-full p-2 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white font-mono text-xs transition-all flex items-center justify-center gap-2"
            onClick={() => {
              navigator.clipboard.writeText(inviteResult.data?.code || "");
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="w-3 h-3" />
            <span>copy_to_clipboard</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
