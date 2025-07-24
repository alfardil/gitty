import { useState } from "react";
import { showApiErrorToast } from "./useToastError";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export function useEnterpriseActions(user: any) {
  const [enterpriseName, setEnterpriseName] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [memberInviteEnterpriseId, setMemberInviteEnterpriseId] = useState("");
  const [memberInviteExpiresDate, setMemberInviteExpiresDate] = useState<
    Date | undefined
  >(undefined);
  const [adminInviteEnterpriseId, setAdminInviteEnterpriseId] = useState("");
  const [adminInviteExpiresDate, setAdminInviteExpiresDate] = useState<
    Date | undefined
  >(undefined);
  const [memberCalendarOpen, setMemberCalendarOpen] = useState(false);
  const [adminCalendarOpen, setAdminCalendarOpen] = useState(false);

  // Create Enterprise Mutation
  const createEnterpriseMutation = useMutation({
    mutationFn: async () => {
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
        throw new Error(data.error);
      }
      toast.success("Enterprise created successfully!");
      return data;
    },
    onSuccess: (data) => {
      setEnterpriseName("");
    },
    onError: (error: any) => {
      showApiErrorToast(error.message || "Failed to create enterprise");
    },
  });

  // Redeem Invite Mutation
  const redeemInviteMutation = useMutation({
    mutationFn: async () => {
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
        throw new Error(errorData);
      }
      const data = await res.json();
      if (data?.error) {
        throw new Error(data.error);
      }
      // Show toast if joined as member or admin
      if (data.success && data.role) {
        if (data.role === "admin") {
          toast.success("Successfully joined as admin!");
        } else if (data.role === "member") {
          toast.success("Successfully joined as member!");
        }
      }
      return data;
    },
    onError: (error: any) => {
      showApiErrorToast(error.message || "Failed to redeem invite code");
    },
  });

  // Generate Member Invite Mutation
  const generateMemberInviteMutation = useMutation({
    mutationFn: async () => {
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
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    },
    onError: (error: any) => {
      showApiErrorToast(error.message || "Failed to generate member invite");
    },
  });

  // Generate Admin Invite Mutation
  const generateAdminInviteMutation = useMutation({
    mutationFn: async () => {
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
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    },
    onError: (error: any) => {
      showApiErrorToast(error.message || "Failed to generate admin invite");
    },
  });

  return {
    enterpriseName,
    setEnterpriseName,
    enterpriseResult: createEnterpriseMutation.data,
    redeemCode,
    setRedeemCode,
    redeemResult: redeemInviteMutation.data,
    createEnterpriseLoading: createEnterpriseMutation.isPending,
    redeemInviteLoading: redeemInviteMutation.isPending,
    generateMemberInviteLoading: generateMemberInviteMutation.isPending,
    generateAdminInviteLoading: generateAdminInviteMutation.isPending,
    memberInviteEnterpriseId,
    setMemberInviteEnterpriseId,
    memberInviteExpiresDate,
    setMemberInviteExpiresDate,
    memberInviteResult: generateMemberInviteMutation.data,
    adminInviteEnterpriseId,
    setAdminInviteEnterpriseId,
    adminInviteExpiresDate,
    setAdminInviteExpiresDate,
    adminInviteResult: generateAdminInviteMutation.data,
    memberCalendarOpen,
    setMemberCalendarOpen,
    adminCalendarOpen,
    setAdminCalendarOpen,
    handleCreateEnterprise: createEnterpriseMutation.mutate,
    handleRedeemInvite: redeemInviteMutation.mutate,
    handleGenerateMemberInvite: generateMemberInviteMutation.mutate,
    handleGenerateAdminInvite: generateAdminInviteMutation.mutate,
  };
}
