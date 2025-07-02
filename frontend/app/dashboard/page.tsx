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
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
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
        <header className="flex items-center justify-between w-full px-4 md:px-8 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 w-full">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-200"
              onClick={() => setSidebarMobile(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
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
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      const dropdown =
                        document.getElementById("scope-dropdown");
                      if (dropdown) {
                        dropdown.classList.toggle("hidden");
                      }
                    }}
                  >
                    {selectedScope}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </button>
                  <div
                    id="scope-dropdown"
                    className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                  >
                    <div className="py-1" role="menu">
                      <button
                        className={`${
                          selectedScope === "Personal"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700"
                        } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
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
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
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

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
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
                <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-4">
                  Select a Repo to Analyze
                </h2>
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 hover:bg-indigo-100 transition mb-2 shadow-sm"
                  onClick={() => setShowSearch((prev) => !prev)}
                  aria-label="Show search"
                  style={{ outline: "none" }}
                >
                  <Search
                    className={`w-7 h-7 text-indigo-400 transition-transform duration-300 ${
                      showSearch ? "rotate-90" : ""
                    }`}
                  />
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition bg-white text-lg"
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
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-6 flex flex-col gap-4 cursor-pointer group"
                    onClick={() => handleRepoClick(repo.owner.login, repo.name)}
                  >
                    {/* Title and Lock/Unlock Icon Row */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {repo.name}
                      </h3>
                      <div>
                        {repo.private ? (
                          <Lock className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Unlock className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                    </div>
                    {/* Description */}
                    <p className="text-sm text-gray-500 flex-1">
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
            <div className="max-w-4xl mx-auto mt-8">
              <h2 className="text-2xl font-bold mb-8 text-gray-900">
                All Plans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Member (Free) Plan */}
                <div className="bg-white border-2 border-blue-400 rounded-2xl shadow p-6 flex flex-col items-center relative h-full pb-6">
                  <div className="absolute -top-3 -right-3 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow z-10 border-2 border-white">
                    Your plan
                  </div>
                  <h3 className="text-xl font-bold text-blue-700 mb-2">
                    Member
                  </h3>
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">
                    $0
                  </div>
                  <div className="text-gray-500 mb-4">
                    For individuals getting started
                  </div>
                  <ul className="text-gray-700 text-sm mb-6 space-y-1 w-full">
                    <li>✓ Access to basic features</li>
                    <li>✓ Community support</li>
                    <li>✓ 1 user</li>
                  </ul>
                  <div className="flex-1" />
                  <button
                    className="w-full py-3 rounded-lg bg-blue-100 text-blue-700 font-bold cursor-default text-lg mt-2"
                    disabled
                  >
                    Current Plan
                  </button>
                </div>
                {/* Pro Plan */}
                <div className="bg-white border-2 border-blue-400 rounded-2xl shadow p-6 flex flex-col items-center h-full pb-6">
                  <h3 className="text-xl font-bold text-blue-700 mb-2">Pro</h3>
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">
                    $20<span className="text-lg font-normal">/mo</span>
                  </div>
                  <div className="text-gray-500 mb-4">
                    For power users and small teams
                  </div>
                  <ul className="text-gray-700 text-sm mb-6 space-y-1 w-full">
                    <li>✓ Everything in Member</li>
                    <li>✓ Priority support</li>
                    <li>✓ Up to 5 users</li>
                    <li>✓ Advanced analytics</li>
                  </ul>
                  <div className="flex-1" />
                  <button className="w-full py-3 rounded-lg bg-blue-700 text-white font-bold hover:bg-blue-800 transition text-lg mt-2">
                    Upgrade
                  </button>
                </div>
                {/* Enterprise Plan */}
                <div className="bg-white border-2 border-blue-400 rounded-2xl shadow p-6 flex flex-col items-center h-full pb-6">
                  <h3 className="text-xl font-bold text-blue-700 mb-2">
                    Enterprise
                  </h3>
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">
                    Let&apos;s talk!
                  </div>
                  <div className="text-gray-500 mb-4">
                    For organizations with advanced needs
                  </div>
                  <ul className="text-gray-700 text-sm mb-6 space-y-1 w-full">
                    <li>✓ Everything in Pro</li>
                    <li>✓ Dedicated support</li>
                    <li>✓ Custom integrations</li>
                    <li>✓ Unlimited users</li>
                  </ul>
                  <div className="flex-1" />
                  <button className="w-full py-3 rounded-lg bg-blue-700 text-white font-bold hover:bg-blue-800 transition text-lg mt-2">
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
