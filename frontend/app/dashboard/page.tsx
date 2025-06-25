"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { GitHubLoginButton } from "@/components/LoginButton";
import { useEffect, useState } from "react";
import {
  fetchUserRepos,
  fetchUserOrgs,
  fetchOrgRepos,
  fetchRecentCommits,
} from "@/lib/fetchRepos";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/neo/spinner";
import { Menu, ChevronDown } from "lucide-react";
import { Sidebar } from "@/components/ui/dashboard/Sidebar";
import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { InsightsView } from "@/components/ui/dashboard/insights/InsightsView";
import { AnalysisView } from "@/components/ui/dashboard/analysis/AnalysisView";

interface Repository {
  id: number;
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  owner: {
    login: string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [showSection, setShowSection] = useState("insights");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string>("Personal");
  const [scopeRepos, setScopeRepos] = useState<Repository[]>([]);
  const [recentCommits, setRecentCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  // Fetch user's repositories
  useEffect(() => {
    async function loadUserRepos() {
      if (user) {
        setReposLoading(true);
        try {
          const githubAccessToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("github_access_token="))
            ?.split("=")[1];
          if (githubAccessToken) {
            const reposData = (await fetchUserRepos(
              githubAccessToken,
              100,
              1
            )) as Repository[];
            const sortedRepos = [...reposData].sort(
              (a, b) => b.stargazers_count - a.stargazers_count
            );
            setRepos(sortedRepos);
          }
        } catch (error) {
          console.error("Error fetching user repos:", error);
        } finally {
          setReposLoading(false);
        }
      }
    }
    loadUserRepos();
  }, [user]);

  // Fetch user's organizations
  useEffect(() => {
    async function loadOrgs() {
      if (user) {
        setOrgsLoading(true);
        try {
          const githubAccessToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("github_access_token="))
            ?.split("=")[1];
          if (githubAccessToken) {
            const orgsData = await fetchUserOrgs(githubAccessToken);
            setOrgs(orgsData);
          }
        } catch (error) {
          console.error("Error fetching orgs:", error);
        } finally {
          setOrgsLoading(false);
        }
      }
    }
    loadOrgs();
  }, [user]);

  // Fetch recent commits
  useEffect(() => {
    async function loadRecentCommits() {
      if (user) {
        setCommitsLoading(true);
        try {
          const githubAccessToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("github_access_token="))
            ?.split("=")[1];
          if (githubAccessToken) {
            const commitsData = await fetchRecentCommits(
              githubAccessToken,
              user
            );
            setRecentCommits(commitsData);
          }
        } catch (error) {
          console.error("Error fetching recent commits:", error);
        } finally {
          setCommitsLoading(false);
        }
      }
    }
    loadRecentCommits();
  }, [user]);

  // Fetch repositories for analysis view based on selected scope
  useEffect(() => {
    async function loadScopeRepos() {
      if (user && selectedScope) {
        setReposLoading(true);
        try {
          const githubAccessToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("github_access_token="))
            ?.split("=")[1];
          if (githubAccessToken) {
            if (selectedScope === "Personal") {
              const reposData = (await fetchUserRepos(
                githubAccessToken,
                100,
                1
              )) as Repository[];
              const sortedRepos = [...reposData].sort(
                (a, b) => b.stargazers_count - a.stargazers_count
              );
              setScopeRepos(sortedRepos);
            } else {
              const reposData = (await fetchOrgRepos(
                githubAccessToken,
                selectedScope,
                100,
                1
              )) as Repository[];
              const sortedRepos = [...reposData].sort(
                (a, b) => b.stargazers_count - a.stargazers_count
              );
              setScopeRepos(sortedRepos);
            }
          }
        } catch (error) {
          console.error("Error fetching repos:", error);
        } finally {
          setReposLoading(false);
        }
      }
    }
    loadScopeRepos();
  }, [user, selectedScope]);

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
              {SIDEBAR_SECTIONS.find((s) => s.key === showSection)?.label ||
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reposLoading ? (
                <div className="col-span-full flex justify-center">
                  <Spinner />
                </div>
              ) : (
                scopeRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleRepoClick(repo.owner.login, repo.name)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {repo.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {repo.description || "No description available"}
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-4">⭐ {repo.stargazers_count}</span>
                      <span>{repo.language || "No language specified"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
