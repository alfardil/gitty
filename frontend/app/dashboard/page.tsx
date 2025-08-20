"use client";

import { GitHubLoginButton } from "@/components/features/auth/LoginButton";
import { InsightsView } from "@/app/dashboard/_components/insights/InsightsView";
import { Sidebar } from "@/app/dashboard/_components/Sidebar";
import { PageSpinner, Spinner } from "@/components/ui/neo/spinner";
import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { useRecentCommits } from "@/lib/hooks/api/useRecentCommits";
import { useScopeRepos } from "@/lib/hooks/api/useScopeRepos";
import { useUserOrgs } from "@/lib/hooks/api/useUserOrgs";
import { useUserRepos } from "@/lib/hooks/api/useUserRepos";
import { ChevronDown, Lock, Menu, Search, Unlock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Billing } from "@/app/dashboard/_components/billing/Billing";
import { Settings } from "@/app/dashboard/_components/settings/Settings";
import { Suspense } from "react";
import DeveloperSection from "@/app/dashboard/_components/developer";
import AdminSection from "@/app/dashboard/_components/admin/AdminSection";
import { useIsAdminOfAnyEnterprise } from "@/lib/hooks/business/useIsAdminOfAnyEnterprise";
import { useSidebarState } from "@/lib/hooks/ui/useSidebarState";
import { useUserStats } from "@/lib/hooks/api/useUserStats";
import { PaymentGate } from "@/components/ui/PaymentGate";

import { RoadMapSection } from "@/app/dashboard/_components/roadmap/RoadMapSection";

interface Repository {
  id: number;
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  owner: {
    login: string;
  };
  private: boolean;
}

function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const section = searchParams.get("section") || "insights";
  const [selectedScope, setSelectedScope] = useState<string>("Personal");
  const { sidebarOpen, setSidebarOpen, sidebarMobile, setSidebarMobile } =
    useSidebarState();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { data: isAdminOfAnyEnterprise, isLoading: isAdminLoading } =
    useIsAdminOfAnyEnterprise(user?.uuid);
  const { subscriptionPlan, loading: statsLoading } = useUserStats(
    user ? user.id.toString() : ""
  );

  // Use the subscription plan from the user object directly, fallback to stats
  const currentSubscriptionPlan = user?.subscription_plan || subscriptionPlan;

  // Debug logging
  console.log("Dashboard Debug:", {
    userUuid: user?.uuid,
    userId: user?.id,
    subscriptionPlan,
    currentSubscriptionPlan,
    isAdminOfAnyEnterprise,
    userDeveloper: user?.developer,
    userSubscriptionPlan: user?.subscription_plan,
    isAdminLoading,
    statsLoading,
    user: user,
  });

  const { repos, loading: reposLoading } = useUserRepos(user);
  const { orgs, loading: orgsLoading } = useUserOrgs(user) as {
    orgs: any[];
    loading: boolean;
  };
  const { recentCommits, loading: commitsLoading } = useRecentCommits(user);
  const { scopeRepos } = useScopeRepos(user, selectedScope) as {
    scopeRepos: Repository[];
  };

  const handleRepoClick = (owner: string, repo: string) => {
    router.push(`/${owner}/${repo}`);
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-2xl font-bold">Please login to continue</div>
        <GitHubLoginButton />
      </div>
    );
  }

  const isInsightsLoading = reposLoading || orgsLoading || commitsLoading;

  const shouldRenderAdminSection =
    section === "admin" &&
    typeof user.uuid === "string" &&
    isAdminOfAnyEnterprise;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarMobile={sidebarMobile}
        setSidebarMobile={setSidebarMobile}
        showSection={section}
        handleSidebarNav={() => {}}
        logout={logout}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <header className="flex items-center justify-between w-full px-4 md:px-8 py-4 bg-transparent">
          <div className="flex items-center gap-3 w-full">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setSidebarMobile(true)}
            >
              <Menu className="w-6 h-6 text-gray-200" />
            </button>

            {section === "analysis" && (
              <div className="ml-auto relative">
                <div className="relative inline-block text-left">
                  <button
                    className="inline-flex justify-center items-center px-4 py-2 border border-blue-400/20 shadow-sm text-sm font-medium rounded-md text-gray-100 bg-[#23272f] hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      const dropdown =
                        document.getElementById("scope-dropdown");
                      if (dropdown) {
                        dropdown.classList.toggle("hidden");
                      }
                    }}
                  >
                    {selectedScope}
                    <ChevronDown className="ml-2 h-4 w-4 text-blue-400" />
                  </button>
                  <div
                    id="scope-dropdown"
                    className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[#23272f] ring-1 ring-blue-400/20 z-10"
                  >
                    <div className="py-1" role="menu">
                      {orgs.map((org) => (
                        <button
                          key={org.login}
                          className={`${
                            selectedScope === org.login
                              ? "bg-blue-400/10 text-white"
                              : "text-gray-200"
                          } block w-full text-left px-4 py-2 text-sm hover:bg-blue-400/10`}
                          onClick={() => {
                            setSelectedScope(org.login);
                            const dropdown =
                              document.getElementById("scope-dropdown");
                            if (dropdown) {
                              dropdown.classList.add("hidden");
                            }
                          }}
                        >
                          {org.login}
                        </button>
                      ))}
                      <button
                        className={`${
                          selectedScope === "Personal"
                            ? "bg-blue-400/10 text-white"
                            : "text-gray-200"
                        } block w-full text-left px-4 py-2 text-sm hover:bg-blue-400/10`}
                        onClick={() => {
                          setSelectedScope("Personal");
                          const dropdown =
                            document.getElementById("scope-dropdown");
                          if (dropdown) {
                            dropdown.classList.add("hidden");
                          }
                        }}
                      >
                        Personal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 bg-background text-foreground">
          {shouldRenderAdminSection && (
            <PaymentGate
              subscriptionPlan={currentSubscriptionPlan}
              isAdmin={isAdminOfAnyEnterprise}
              isDeveloper={user.developer}
              section="admin"
              isLoading={isAdminLoading || statsLoading}
            >
              <AdminSection userId={user.uuid as string} />
            </PaymentGate>
          )}
          {section === "insights" && (
            <PaymentGate
              subscriptionPlan={currentSubscriptionPlan}
              isAdmin={isAdminOfAnyEnterprise}
              isDeveloper={user.developer}
              section="insights"
              isLoading={isAdminLoading || statsLoading}
            >
              <div>
                {isInsightsLoading ? (
                  <div className="flex justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <InsightsView
                    repos={selectedScope === "Personal" ? repos : scopeRepos}
                    orgs={orgs}
                    recentCommits={recentCommits}
                  />
                )}
              </div>
            </PaymentGate>
          )}
          {section === "analysis" && (
            <PaymentGate
              subscriptionPlan={currentSubscriptionPlan}
              isAdmin={isAdminOfAnyEnterprise}
              isDeveloper={user.developer}
              section="analysis"
              isLoading={isAdminLoading || statsLoading}
            >
              <>
                {/* Search section */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Search className="w-5 h-5 text-white/60" />
                      Repository Search
                    </h3>
                    <button
                      className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200"
                      onClick={() => setShowSearch((prev) => !prev)}
                      aria-label="Toggle search"
                    >
                      <Search
                        className={`w-5 h-5 text-white transition-transform duration-300 ${
                          showSearch ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      showSearch
                        ? "max-w-xl w-full h-14 opacity-100"
                        : "max-w-0 w-0 h-0 opacity-0"
                    }`}
                    style={{
                      transitionProperty: "max-width, width, height, opacity",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search repositories..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
                      autoFocus={showSearch}
                      style={{ minWidth: showSearch ? 200 : 0 }}
                    />
                  </div>
                </div>

                {/* Repository grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(search
                    ? scopeRepos.filter((repo) =>
                        repo.name.toLowerCase().includes(search.toLowerCase())
                      )
                    : scopeRepos
                  ).map((repo) => (
                    <div
                      key={repo.id}
                      className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                      onClick={() =>
                        handleRepoClick(repo.owner.login, repo.name)
                      }
                    >
                      {/* Background accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full"></div>

                      <div className="relative z-10">
                        {/* Title and Lock/Unlock Icon Row */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                            {repo.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {repo.private ? (
                              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                                <Lock className="w-4 h-4 text-red-400" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                                <Unlock className="w-4 h-4 text-green-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-white/70 flex-1 mb-4 leading-relaxed">
                          {repo.description || "No description available"}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                              <span className="font-mono text-white/60">
                                {repo.stargazers_count}
                              </span>
                            </span>
                            <span className="font-mono">
                              {repo.language || "No language"}
                            </span>
                          </div>
                          <div className="text-blue-400 font-mono text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                            ANALYZE
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loading state */}
                {reposLoading ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center gap-2 text-white/60">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                      <span className="font-mono text-sm">
                        LOADING REPOSITORIES
                      </span>
                    </div>
                  </div>
                ) : scopeRepos.length === 0 ? (
                  <div className="text-center py-16 text-white/40">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-40" />
                    <p className="text-lg mb-2">No repositories found</p>
                    <p className="text-sm">
                      Try switching to a different organization or scope
                    </p>
                  </div>
                ) : null}
              </>
            </PaymentGate>
          )}
          {section === "roadmap" && (
            <PaymentGate
              subscriptionPlan={currentSubscriptionPlan}
              isAdmin={isAdminOfAnyEnterprise}
              isDeveloper={user.developer}
              section="roadmap"
              isLoading={isAdminLoading || statsLoading}
            >
              <RoadMapSection />
            </PaymentGate>
          )}

          {section === "billing" && <Billing />}
          {section === "settings" && <Settings />}
          {section === "developer" && user.developer && (
            <DeveloperSection user={user} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <DashboardPage />
    </Suspense>
  );
}
