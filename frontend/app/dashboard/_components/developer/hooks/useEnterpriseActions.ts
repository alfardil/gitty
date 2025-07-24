import { useState } from "react";
import { showApiErrorToast } from "./useToastError";
import { toast } from "sonner";

export function useEnterpriseActions(user: any) {
  const [enterpriseName, setEnterpriseName] = useState("");
  const [enterpriseResult, setEnterpriseResult] = useState<any>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemResult, setRedeemResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
    try {
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
      if (data?.error) {
        showApiErrorToast(data.error);
      } else if (data?.success) {
        setEnterpriseName("");
      }
      setEnterpriseResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showApiErrorToast(msg || "Failed to create enterprise");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemInvite = async () => {
    setLoading(true);
    setRedeemResult(null);
    try {
      const res = await fetch("/api/developer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "redeemInviteCode",
          code: redeemCode,
          userId: user.uuid,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText).error;
        } catch {
          errorData = `HTTP ${res.status}: ${errorText}`;
        }
        showApiErrorToast(errorData);
        setRedeemResult(null);
        return;
      }
      const data = await res.json();
      if (data?.error) {
        showApiErrorToast(data.error);
        setRedeemResult(null);
        return;
      }
      setRedeemResult(data);
      // Show toast if joined as member or admin
      if (data.success && data.role) {
        if (data.role === "admin") {
          toast.success("Successfully joined as admin!");
        } else if (data.role === "member") {
          toast.success("Successfully joined as member!");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showApiErrorToast(msg || "Failed to redeem invite code");
      setRedeemResult(null);
    } finally {
      setLoading(false);
    }
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
    try {
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
      if (data?.error) {
        showApiErrorToast(data.error);
      }
      setMemberInviteResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showApiErrorToast(msg || "Failed to generate member invite");
    } finally {
      setLoading(false);
    }
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
    try {
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
      if (data?.error) {
        showApiErrorToast(data.error);
      }
      setAdminInviteResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showApiErrorToast(msg || "Failed to generate admin invite");
    } finally {
      setLoading(false);
    }
  };

  return {
    enterpriseName,
    setEnterpriseName,
    enterpriseResult,
    redeemCode,
    setRedeemCode,
    redeemResult,
    loading,
    memberInviteEnterpriseId,
    setMemberInviteEnterpriseId,
    memberInviteExpiresDate,
    setMemberInviteExpiresDate,
    memberInviteResult,
    adminInviteEnterpriseId,
    setAdminInviteEnterpriseId,
    adminInviteExpiresDate,
    setAdminInviteExpiresDate,
    adminInviteResult,
    memberCalendarOpen,
    setMemberCalendarOpen,
    adminCalendarOpen,
    setAdminCalendarOpen,
    handleCreateEnterprise,
    handleRedeemInvite,
    handleGenerateMemberInvite,
    handleGenerateAdminInvite,
  };
}
