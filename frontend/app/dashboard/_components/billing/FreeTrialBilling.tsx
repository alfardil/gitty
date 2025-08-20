"use client";

import { useAuth } from "@/lib/hooks/business/useAuth";
import { useAdminEnterprises } from "@/app/dashboard/_components/admin/hooks/useAdminEnterprises";
import { Spinner } from "@/components/ui/neo/spinner";
import { Button } from "@/components/ui/button";
import { CreditCard, Users, Clock, Crown, Zap, Shield } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, memo } from "react";

interface Enterprise {
  id: string;
  name: string;
}

interface EnterpriseUser {
  id: string;
  githubId: string | null;
  githubUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

// Memoized team member card component
const TeamMemberCard = memo(({ member }: { member: EnterpriseUser }) => (
  <div className="bg-background/50 border border-border rounded-md p-4 hover:bg-background/70 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-foreground/10 rounded-full flex items-center justify-center">
        <Users className="w-4 h-4 text-foreground/60" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          {member.firstName && member.lastName
            ? `${member.firstName} ${member.lastName}`
            : member.githubUsername || "Unknown User"}
        </div>
        <div className="text-sm text-foreground/60 truncate">{member.role}</div>
      </div>
    </div>
  </div>
));

TeamMemberCard.displayName = "TeamMemberCard";

// Memoized features list component
const FeaturesList = memo(() => (
  <div className="space-y-2">
    {[
      "Unlimited Analysis",
      "AI Insights",
      "Team Collaboration",
      "Priority Support",
    ].map((feature) => (
      <div key={feature} className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full"></div>
        <span className="text-sm text-foreground">{feature}</span>
      </div>
    ))}
  </div>
));

FeaturesList.displayName = "FeaturesList";

export function FreeTrialBilling() {
  const { user, loading } = useAuth();
  const {
    enterprises,
    users: enterpriseUsers,
    loading: enterprisesLoading,
  } = useAdminEnterprises(user?.uuid || "");

  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(
    null
  );

  // Memoized enterprise selection handler
  const handleEnterpriseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedEnterprise(e.target.value);
    },
    []
  );

  // Auto-select first enterprise with useCallback to prevent unnecessary re-renders
  useEffect(() => {
    if (enterprises.length > 0 && !selectedEnterprise) {
      setSelectedEnterprise(enterprises[0].id);
    }
  }, [enterprises, selectedEnterprise]);

  // Memoized derived values to prevent unnecessary recalculations
  const currentEnterprise = useMemo(
    () => enterprises.find((e: Enterprise) => e.id === selectedEnterprise),
    [enterprises, selectedEnterprise]
  );

  const currentUsers = useMemo(() => enterpriseUsers || [], [enterpriseUsers]);
  const totalTeamMembers = useMemo(() => currentUsers.length, [currentUsers]);

  // Early returns for loading and error states
  if (loading || enterprisesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="large" />
          <p className="mt-4 text-foreground/60">
            Loading billing information...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-foreground/60">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-medium mb-2">Authentication Required</h2>
          <p className="text-sm">Please log in to view billing information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">
          Billing & Subscription
        </h1>
        <p className="text-foreground/60 text-sm">
          Manage your free trial and team access
        </p>
      </div>

      {/* Plan Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-5 h-5 text-foreground/60" />
            <h3 className="font-medium text-foreground">Current Plan</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-foreground/60">Plan Type</span>
              <span className="font-medium text-foreground">Free Trial</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-foreground/60">Price</span>
              <span className="font-medium text-foreground">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-foreground/60">Status</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-foreground/60" />
            <h3 className="font-medium text-foreground">Team Members</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-foreground/60">Total Members</span>
              <span className="font-medium text-foreground">
                {totalTeamMembers}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-foreground/60">
                Seats Available
              </span>
              <span className="font-medium text-foreground">Unlimited</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-foreground/60">Cost</span>
              <span className="font-medium text-foreground">$0.00</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-foreground/60" />
            <h3 className="font-medium text-foreground">Features</h3>
          </div>
          <FeaturesList />
        </div>
      </div>

      {/* Enterprise Selection */}
      {enterprises.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-medium text-foreground mb-4">
            Enterprise Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-foreground/60 mb-2">
                Selected Enterprise
              </label>
              <select
                value={selectedEnterprise || ""}
                onChange={handleEnterpriseChange}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {enterprises.map((enterprise: Enterprise) => (
                  <option key={enterprise.id} value={enterprise.id}>
                    {enterprise.name}
                  </option>
                ))}
              </select>
            </div>
            {currentEnterprise && (
              <div>
                <label className="block text-sm text-foreground/60 mb-2">
                  Enterprise ID
                </label>
                <div className="bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm font-mono">
                  {currentEnterprise.id}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Members List */}
      {selectedEnterprise && currentUsers.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-medium text-foreground mb-4">
            Team Members ({totalTeamMembers})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUsers.map((member: EnterpriseUser) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
