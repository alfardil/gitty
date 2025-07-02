"use client";

import { GitHubLoginButton } from "@/components/LoginButton";
import { InsightsView } from "@/components/ui/dashboard/insights/InsightsView";
import { SettingsView } from "@/components/ui/dashboard/SettingsView";
import { Sidebar } from "@/components/ui/dashboard/Sidebar";
import { Spinner } from "@/components/ui/neo/spinner";
import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRecentCommits } from "@/lib/hooks/useRecentCommits";
import { useScopeRepos } from "@/lib/hooks/useScopeRepos";
import { useUserOrgs } from "@/lib/hooks/useUserOrgs";
import { useUserRepos } from "@/lib/hooks/useUserRepos";
import { ChevronDown, Lock, Menu, Search, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [showSection, setShowSection] = useState("insights");
  const [selectedScope, setSelectedScope] = useState<string>("Personal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { repos, loading: reposLoading } = useUserRepos(user);
  const { orgs, loading: orgsLoading } = useUserOrgs(user) as {
    orgs: any[];
    loading: boolean;
  };
  const { recentCommits, loading: commitsLoading } = useRecentCommits(user);
  const { scopeRepos, loading: scopeReposLoading } = useScopeRepos(
    user,
    selectedScope
  ) as {
    scopeRepos: Repository[];
    loading: boolean;
  };

  const handleRepoClick = (owner: string, repo: string) => {
    router.push(`/${owner}/${repo}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
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

  return (
    <div className="min-h-screen flex bg-[#181A20] text-gray-100">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarMobile={sidebarMobile}
        setSidebarMobile={setSidebarMobile}
        showSection={showSection}
        handleSidebarNav={setShowSection}
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
              {showSection === "settings"
                ? "Settings"
                : showSection === "billing"
                ? "Billing"
                : SIDEBAR_SECTIONS.find((s) => s.key === showSection)?.label ||
                  "Dashboard"}
            </h1>
            {showSection === "analysis" && (
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
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 bg-[#181A20] text-gray-100">
          {showSection === "insights" && (
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
          {showSection === "analysis" && (
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
          {showSection === "settings" && (
            <SettingsView handleSidebarNav={setShowSection} />
          )}
          {showSection === "billing" && (
            <div className="max-w-2xl mx-auto mt-8 flex flex-col gap-6">
              <h2 className="text-3xl font-extrabold text-white mb-2">
                Billing
              </h2>
              {/* Main Plan Card */}
              <div className="bg-[#23272f] border border-blue-700/30 rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-white">$0</span>
                    <span className="text-lg text-gray-300">/ month</span>
                    <span
                      className="ml-2 text-blue-400 cursor-pointer"
                      title="Info"
                    >
                      ℹ️
                    </span>
                  </div>
                  <div className="text-gray-400 mb-2 text-sm">
                    Current plan:{" "}
                    <span className="text-blue-400 font-semibold">Member</span>
                  </div>
                  <ul className="text-gray-300 text-sm mb-2 ml-4 list-disc">
                    <li>Access to basic features</li>
                    <li>Community support</li>
                    <li>1 user</li>
                  </ul>
                  <div className="text-xs text-gray-500 mt-2">
                    Upgrade to unlock more features and users.
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[220px]">
                  <div className="text-white font-bold text-lg">
                    Pro: $20/mo
                  </div>
                  <div className="text-gray-400 text-sm">
                    Everything in Member, plus:
                  </div>
                  <ul className="text-gray-300 text-sm ml-4 list-disc">
                    <li>Priority support</li>
                    <li>Up to 5 users</li>
                    <li>Advanced analytics</li>
                  </ul>
                  <div className="text-white font-bold text-lg mt-4">
                    Enterprise: Let&apos;s talk!
                  </div>
                  <div className="text-gray-400 text-sm">
                    Everything in Pro, plus:
                  </div>
                  <ul className="text-gray-300 text-sm ml-4 list-disc">
                    <li>Dedicated support</li>
                    <li>Custom integrations</li>
                    <li>Unlimited users</li>
                  </ul>
                </div>
              </div>
              {/* Next Payment Card */}
              <div className="bg-[#23272f] border border-blue-700/30 rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-white font-semibold text-lg mb-2 md:mb-0">
                  Next payment
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-200 text-lg">2025-07-16</span>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a5 5 0 00-10 0v2M5 20h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"
                      />
                    </svg>
                    Update Payment Method
                  </button>
                  <button className="ml-2 text-gray-400 hover:text-blue-400 transition text-xl">
                    •••
                  </button>
                </div>
              </div>
              {/* Credits Used Card */}
              <div className="bg-[#23272f] border border-blue-700/30 rounded-2xl shadow p-6 flex flex-col gap-2">
                <div className="text-white font-semibold text-lg mb-2">
                  Usage
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-gray-300 text-sm font-semibold">
                      Current Period
                    </div>
                    <div className="text-gray-400 text-sm">Repos analyzed</div>
                  </div>
                  <div className="text-gray-200 text-sm">
                    12 repos <span className="text-gray-400">(this month)</span>
                  </div>
                  <div className="text-white font-bold text-base">
                    Total 120 repos{" "}
                    <span className="text-blue-400 cursor-pointer" title="Info">
                      ⓘ
                    </span>
                  </div>
                </div>
              </div>
              {/* Invoices Card */}
              <div className="bg-[#23272f] border border-blue-700/30 rounded-2xl shadow p-6 flex flex-col gap-2">
                <div className="text-white font-semibold text-lg mb-2">
                  Invoices
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full">
                    COMPLETED
                  </span>
                  <span className="text-gray-200 text-base">2025-06-16</span>
                  <span className="text-gray-400 text-base">
                    $0.00 + $0.00 tax
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
