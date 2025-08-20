"use client";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { Edit3, LogOut, Linkedin, User, Save, X, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/neo/spinner";
import { useUserStats } from "@/lib/hooks/api/useUserStats";
import { useState, useEffect } from "react";
import { setUsername } from "@/app/_actions/cache";
import { useUserUsername } from "@/lib/hooks/api/useUserUsername";
import { RedeemInviteForm } from "./RedeemInvite";
import { useRedeemInviteCode } from "@/lib/hooks/business/useRedeemInviteCode";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function Settings() {
  const { user, loading, logout } = useAuth();
  const { subscriptionPlan, analyzedReposCount } = useUserStats(
    user ? user.id.toString() : ""
  );
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // New state for LinkedIn, role, and email
  const [editingProfile, setEditingProfile] = useState(false);
  const [linkedinInput, setLinkedinInput] = useState(user?.linkedin || "");
  const [roleInput, setRoleInput] = useState(user?.role || "");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setLinkedinInput(user.linkedin || "");
      setRoleInput(user.role || "");
      setEmailInput(user.email || "");
    }
  }, [user]);

  // Always call the hook, even if user is not ready
  const { username, refetch: refetchUsername } = useUserUsername(
    user ? user.id.toString() : ""
  );

  // Get redeem invite code functionality
  const actions = useRedeemInviteCode(user!);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  async function handleUsernameSave() {
    setUsernameLoading(true);
    setUsernameError(null);
    const newUsername = usernameInput.trim();
    await setUsername(user!.id.toString(), newUsername);
    setEditing(false);
    setUsernameInput(newUsername);
    refetchUsername();
    setUsernameLoading(false);
  }

  async function handleProfileSave() {
    setProfileLoading(true);
    try {
      // Use the user's database ID (uuid) for the API call
      const userId = user?.uuid;
      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await fetch(`/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkedin: linkedinInput.trim() || null,
          role: roleInput.trim() || null,
          email: emailInput.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const result = await response.json();

      // Refresh the user data from the database
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });

      setEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Account Settings
          </h1>
          <p className="text-white/60">Manage your profile and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 sticky top-8">
              {/* Avatar Section */}
              <div className="text-center mb-8">
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[#0a0a0a]"></div>
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                  {username || user.login}
                </h2>
                {username && (
                  <p className="text-white/60 text-sm mb-4">@{user.login}</p>
                )}

                {/* Username Edit */}
                {editing ? (
                  <div className="space-y-3">
                    <input
                      className="w-full py-3 px-4 rounded-xl bg-[#111111] text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/30 transition-all"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter new username"
                      disabled={usernameLoading}
                      maxLength={32}
                    />
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
                        onClick={handleUsernameSave}
                        disabled={usernameLoading}
                      >
                        {usernameLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="flex-1 py-2 rounded-xl bg-[#111111] text-white font-semibold hover:bg-white/10 transition-all border border-white/10"
                        onClick={() => {
                          setEditing(false);
                          setUsernameError(null);
                        }}
                        disabled={usernameLoading}
                      >
                        Cancel
                      </button>
                    </div>
                    {usernameError && (
                      <div className="text-red-400 text-sm">
                        {usernameError}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="w-full py-3 px-6 rounded-xl bg-[#111111] text-white font-medium flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all"
                    onClick={() => {
                      setEditing(true);
                      setUsernameInput(user.username || "");
                    }}
                  >
                    <Edit3 className="w-4 h-4 text-blue-400" />
                    Edit Username
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="p-4 bg-[#111111] rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Current Plan</span>
                    <span className="text-blue-400 font-semibold">
                      {subscriptionPlan}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-[#111111] rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">
                      Repos Analyzed
                    </span>
                    <span className="text-blue-400 font-semibold">
                      {analyzedReposCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Section */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  Profile Information
                </h3>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
                  >
                    <Edit3 className="w-4 h-4 mr-2 inline" />
                    Edit Profile
                  </button>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={linkedinInput}
                      onChange={(e) => setLinkedinInput(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-4 py-3 rounded-xl bg-[#111111] text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/30 transition-all"
                      disabled={profileLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-[#111111] text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/30 transition-all"
                      disabled={profileLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Role / Position
                    </label>
                    <input
                      type="text"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder="e.g., Senior Developer, Product Manager"
                      className="w-full px-4 py-3 rounded-xl bg-[#111111] text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/30 transition-all"
                      disabled={profileLoading}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleProfileSave}
                      disabled={profileLoading}
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      {profileLoading ? (
                        <>
                          <Spinner size="small" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setLinkedinInput(user?.linkedin || "");
                        setRoleInput(user?.role || "");
                        setEmailInput(user?.email || "");
                      }}
                      disabled={profileLoading}
                      className="flex-1 py-3 rounded-xl bg-[#111111] text-white font-semibold hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-[#111111] rounded-xl border border-white/5">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Linkedin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/60 text-sm mb-1">
                        LinkedIn Profile
                      </p>
                      <p className="text-white">
                        {user?.linkedin ? (
                          <a
                            href={user.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition"
                          >
                            {user.linkedin}
                          </a>
                        ) : (
                          <span className="text-white/40">Not set</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-[#111111] rounded-xl border border-white/5">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/60 text-sm mb-1">
                        Email Address
                      </p>
                      <p className="text-white">
                        {user?.email ? (
                          user.email
                        ) : (
                          <span className="text-white/40">Not set</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-[#111111] rounded-xl border border-white/5">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/60 text-sm mb-1">
                        Role / Position
                      </p>
                      <p className="text-white">
                        {user?.role || (
                          <span className="text-white/40">Not set</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Redeem Invite Section */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Redeem Invite Code
                </h3>
              </div>
              <RedeemInviteForm
                redeemCode={actions.redeemCode}
                setRedeemCode={actions.setRedeemCode}
                handleRedeemInvite={actions.handleRedeemInvite}
                redeemInviteLoading={actions.redeemInviteLoading}
                redeemResult={actions.redeemResult}
              />
            </div>

            {/* Logout Section */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Account Actions
                </h3>
              </div>
              <button
                className="w-full py-4 rounded-xl bg-red-500/10 text-red-400 font-semibold flex items-center justify-center gap-3 border border-red-500/20 hover:bg-red-500/20 transition-all"
                onClick={logout}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
