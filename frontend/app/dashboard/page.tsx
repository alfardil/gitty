"use client";

import { GitHubLoginButton } from "@/components/LoginButton";
import { InsightsView } from "@/app/dashboard/_components/insights/InsightsView";
import { Sidebar } from "@/app/dashboard/_components/Sidebar";
import { PageSpinner, Spinner } from "@/components/ui/neo/spinner";
import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRecentCommits } from "@/lib/hooks/useRecentCommits";
import { useScopeRepos } from "@/lib/hooks/useScopeRepos";
import { useUserOrgs } from "@/lib/hooks/useUserOrgs";
import { useUserRepos } from "@/lib/hooks/useUserRepos";
import { ChevronDown, Lock, Menu, Search, Unlock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Billing } from "@/app/dashboard/_components/billing/Billing";
import { Settings } from "@/app/dashboard/_components/settings/Settings";
import { Suspense } from "react";
import DeveloperSection from "@/app/dashboard/_components/developer";
import AdminSection from "@/app/dashboard/_components/admin/AdminSection";
import { useIsAdminOfAnyEnterprise } from "@/lib/hooks/useIsAdminOfAnyEnterprise";
import RedeemSection from "@/app/dashboard/_components/redeem/RedeemSection";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { data: isAdminOfAnyEnterprise } = useIsAdminOfAnyEnterprise(
    user?.uuid
  );

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
    <div className="min-h-screen flex bg-[#181A20] text-gray-100">
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
        <header className="flex items-center justify-between w-full px-4 md:px-8 py-4 bg-[#20232a] border-b border-blue-400/10">
          <div className="flex items-center gap-3 w-full">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-blue-400/10"
              onClick={() => setSidebarMobile(true)}
            >
              <Menu className="w-6 h-6 text-gray-200" />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {SIDEBAR_SECTIONS.find((s) => s.key === section)?.label ||
                "Dashboard"}
            </h1>
            <div className="ml-auto relative">
              <div className="relative inline-block text-left">
                <button
                  className="inline-flex justify-center items-center px-4 py-2 border border-blue-400/20 shadow-sm text-sm font-medium rounded-md text-gray-100 bg-[#23272f] hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    const dropdown = document.getElementById("scope-dropdown");
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 bg-[#181A20] text-gray-100">
          {shouldRenderAdminSection && (
            <AdminSection userId={user.uuid as string} />
          )}
          {section === "insights" && (
            <div>
              {isInsightsLoading ? (
                <div className="flex justify-center">
                  <Spinner />
                </div>
              ) : (
                <InsightsView
                  repos={repos}
                  orgs={orgs}
                  recentCommits={recentCommits}
                />
              )}
            </div>
          )}
          {section === "analysis" && (
            <>
              {/* Large centered header with animated search bar below */}
              <div className="flex flex-col items-center mb-10">
                <h2 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-4">
                  Select a Repo to Analyze
                </h2>
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[#2d313a] hover:bg-[#353a45] transition mb-2 shadow-sm"
                  onClick={() => setShowSearch((prev) => !prev)}
                  aria-label="Show search"
                  style={{ outline: "none" }}
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#353a45]">
                    <Search
                      className={`w-7 h-7 text-white transition-transform duration-300 ${
                        showSearch ? "rotate-90" : ""
                      }`}
                    />
                  </span>
                </button>
                <div
                  className={`flex justify-center items-center transition-all duration-500 ease-in-out overflow-hidden ${
                    showSearch
                      ? "max-w-xl w-full h-14 opacity-100 mt-2"
                      : "max-w-0 w-0 h-0 opacity-0 mt-0"
                  }`}
                  style={{
                    transitionProperty:
                      "max-width, width, height, opacity, margin-top",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#353a45] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-[#2d313a] text-white text-lg placeholder-gray-400"
                    autoFocus={showSearch}
                    style={{ minWidth: showSearch ? 200 : 0 }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(search
                  ? scopeRepos.filter((repo) =>
                      repo.name.toLowerCase().includes(search.toLowerCase())
                    )
                  : scopeRepos
                ).map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-[#23272f] rounded-2xl border border-[#353a45] shadow-sm hover:shadow-lg transition-shadow p-6 flex flex-col gap-4 cursor-pointer group"
                    onClick={() => handleRepoClick(repo.owner.login, repo.name)}
                  >
                    {/* Title and Lock/Unlock Icon Row */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white truncate">
                        {repo.name}
                      </h3>
                      <div>
                        {repo.private ? (
                          <Lock className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Unlock className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </div>
                    {/* Description */}
                    <p className="text-sm text-gray-300 flex-1">
                      {repo.description || "No description available"}
                    </p>
                    {/* Metadata */}
                    <div className="flex items-center text-xs text-gray-400 mt-2">
                      <span className="mr-4">⭐ {repo.stargazers_count}</span>
                      <span>{repo.language || "No language specified"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {section === "roadmap" && <RoadMapSection />}
          {section === "redeem" && <RedeemSection user={user} />}
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
