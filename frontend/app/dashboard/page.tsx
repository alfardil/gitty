"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { GitHubLoginButton } from "@/components/LoginButton";
import { useEffect, useMemo, useState } from "react";
import {
  fetchUserRepos,
  fetchUserOrgs,
  fetchOrgRepos,
  fetchRecentCommits,
} from "@/lib/fetchRepos";
import { SystemDesign as TopNav } from "@/components/ui/dashboard/TopNav";
import { RepoList } from "@/components/ui/dashboard/RepoList";
import { OrgList } from "@/components/ui/dashboard/OrgList";
import { Spinner } from "@/components/ui/neo/spinner";
import { Menu, ChevronDown, Plus } from "lucide-react";
import { Sidebar } from "@/components/ui/dashboard/Sidebar";
import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { CommitActivityChart } from "@/components/ui/dashboard/CommitActivityChart";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [repos, setRepos] = useState<any[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [showSection, setShowSection] = useState("insights");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [recentCommits, setRecentCommits] = useState<any[]>([]);
  const [commitsExpanded, setCommitsExpanded] = useState(false);
  const [commitPage, setCommitPage] = useState(1);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [orgRepos, setOrgRepos] = useState<{ [org: string]: any[] }>({});
  const [orgReposLoading, setOrgReposLoading] = useState<{
    [org: string]: boolean;
  }>({});
  const [repoPage, setRepoPage] = useState(1);
  const [orgRepoPages, setOrgRepoPages] = useState<{ [org: string]: number }>(
    {}
  );
  const perPage = 20;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  const commitsPerPage = 10;
  const displayedCommits = commitsExpanded
    ? recentCommits.slice(
        (commitPage - 1) * commitsPerPage,
        commitPage * commitsPerPage
      )
    : recentCommits.slice(0, 3);

  const totalCommitPages = Math.ceil(recentCommits.length / commitsPerPage);

  const commitActivityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
      })
      .reverse();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const chartData = last7Days.map((day) => {
      const dayString = day.toISOString().split("T")[0];
      return {
        name: dayNames[day.getDay()],
        date: dayString,
        commits: 0,
      };
    });

    recentCommits.forEach((commit) => {
      const commitDate = new Date(commit.date).toISOString().split("T")[0];
      const dayData = chartData.find((d) => d.date === commitDate);
      if (dayData) {
        dayData.commits += 1;
      }
    });

    return chartData;
  }, [recentCommits]);

  useEffect(() => {
    async function loadRepos() {
      if (user) {
        setReposLoading(true);
        try {
          const githubAccessToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("github_access_token="))
            ?.split("=")[1];
          if (githubAccessToken) {
            const reposData = await fetchUserRepos(
              githubAccessToken,
              perPage,
              repoPage
            );
            setRepos(reposData);
          }
        } catch (error) {
          console.error("Error fetching repos:", error);
        } finally {
          setReposLoading(false);
        }
      }
    }
    loadRepos();
  }, [user, repoPage]);

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

  useEffect(() => {
    async function loadRecentCommits() {
      if (user && user.login) {
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
        }
      }
    }
    loadRecentCommits();
  }, [user]);

  async function handleExpandOrg(orgLogin: string) {
    setExpandedOrg(expandedOrg === orgLogin ? null : orgLogin);
  }

  useEffect(() => {
    async function fetchOrgReposForExpandedOrg() {
      if (expandedOrg) {
        setOrgReposLoading((prev) => ({ ...prev, [expandedOrg]: true }));
        try {
          const githubAccessToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("github_access_token="))
            ?.split("=")[1];
          if (githubAccessToken) {
            let page = orgRepoPages[expandedOrg] || 1;
            let repos = await fetchOrgRepos(
              githubAccessToken,
              expandedOrg,
              perPage,
              page
            );
            while (repos.length === 0 && page > 1) {
              page -= 1;
              repos = await fetchOrgRepos(
                githubAccessToken,
                expandedOrg,
                perPage,
                page
              );
            }
            setOrgRepoPages((prev) => ({ ...prev, [expandedOrg]: page }));
            setOrgRepos((prev) => ({ ...prev, [expandedOrg]: repos }));
          }
        } catch (error) {
          console.error("Error fetching org repos:", error);
        } finally {
          setOrgReposLoading((prev) => ({ ...prev, [expandedOrg]: false }));
        }
      }
    }
    if (expandedOrg) {
      fetchOrgReposForExpandedOrg();
    }
  }, [expandedOrg, expandedOrg ? orgRepoPages[expandedOrg] : undefined]);

  function handleSidebarNav(key: string) {
    setShowSection(key);
    setSidebarMobile(false);
  }

  function handleExpandRepo(id: string) {
    setExpandedRepo(expandedRepo === id ? null : id);
  }

  function handlePrevRepoPage() {
    setRepoPage((p) => Math.max(1, p - 1));
  }
  function handleNextRepoPage() {
    setRepoPage((p) => p + 1);
  }

  function handlePrevOrgRepoPage(org: string) {
    setOrgRepoPages((prev) => ({
      ...prev,
      [org]: Math.max(1, (prev[org] || 1) - 1),
    }));
  }
  function handleNextOrgRepoPage(org: string) {
    setOrgRepoPages((prev) => ({ ...prev, [org]: (prev[org] || 1) + 1 }));
  }

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

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarMobile={sidebarMobile}
        setSidebarMobile={setSidebarMobile}
        showSection={showSection}
        handleSidebarNav={handleSidebarNav}
        logout={logout}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        {/* Top Bar */}
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
          </div>
        </header>
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
          {showSection === "insights" && (
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Stat cards */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between">
                  <div className="text-md font-semibold text-gray-600 mb-2">
                    Total Repos
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {repos.length}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between">
                  <div className="text-md font-semibold text-gray-600 mb-2">
                    Total Orgs
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {orgs.length}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between">
                  <div className="text-md font-semibold text-gray-600 mb-2">
                    Recent Commits
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {recentCommits.length}
                  </div>
                </div>
              </div>

              {/* Recent Commits List */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Latest Commits
                </h3>
                <div className="space-y-4">
                  {recentCommits.length > 0 ? (
                    displayedCommits.map((commit) => (
                      <div
                        key={commit.sha}
                        className="flex items-center gap-4 p-3 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-gray-800 truncate"
                            title={commit.message}
                          >
                            {commit.message}
                          </p>
                          <p className="text-sm text-gray-500">
                            to{" "}
                            <span className="font-semibold">{commit.repo}</span>
                          </p>
                        </div>
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(commit.date).toLocaleDateString()}
                        </div>
                        <a
                          href={`https://github.com/${commit.repo}/commit/${commit.sha}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">
                      No recent public commits found.
                    </p>
                  )}
                </div>

                {/* Controls for commits */}
                <div className="mt-6 flex justify-between items-center">
                  <div>
                    {!commitsExpanded && recentCommits.length > 3 && (
                      <button
                        onClick={() => setCommitsExpanded(true)}
                        className="text-sm font-semibold text-blue-600 hover:underline hover:cursor-pointer"
                      >
                        See more
                      </button>
                    )}
                    {commitsExpanded && (
                      <button
                        onClick={() => {
                          setCommitsExpanded(false);
                          setCommitPage(1);
                        }}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        See less
                      </button>
                    )}
                  </div>

                  {commitsExpanded && recentCommits.length > commitsPerPage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCommitPage((p) => Math.max(1, p - 1))}
                        disabled={commitPage === 1}
                        className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {commitPage} of {totalCommitPages}
                      </span>
                      <button
                        onClick={() =>
                          setCommitPage((p) =>
                            Math.min(totalCommitPages, p + 1)
                          )
                        }
                        disabled={commitPage === totalCommitPages}
                        className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[300px] flex flex-col mb-8">
                <div className="font-semibold text-gray-900 mb-2">
                  Commit Activity (Last 7 Days)
                </div>
                <div className="flex-1 -ml-6">
                  <CommitActivityChart data={commitActivityData} />
                </div>
              </div>
            </section>
          )}
          {showSection === "repos" && (
            <section>
              <TopNav />
              <RepoList
                repos={repos}
                loading={reposLoading}
                expandedRepo={expandedRepo}
                onExpandRepo={handleExpandRepo}
                username={user.login}
                page={repoPage}
                onPrevPage={handlePrevRepoPage}
                onNextPage={handleNextRepoPage}
                perPage={perPage}
              />
            </section>
          )}
          {showSection === "orgs" && (
            <section>
              <OrgList
                orgs={orgs}
                loading={orgsLoading}
                expandedOrg={expandedOrg}
                onExpandOrg={handleExpandOrg}
                orgRepos={orgRepos}
                orgReposLoading={orgReposLoading}
                orgRepoPages={orgRepoPages}
                onPrevOrgRepoPage={handlePrevOrgRepoPage}
                onNextOrgRepoPage={handleNextOrgRepoPage}
                perPage={perPage}
              />
            </section>
          )}
          {showSection === "commits" && (
            <section>
              <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[300px] flex flex-col mb-8">
                <div className="font-semibold text-gray-900 mb-2">
                  Git Insights (Coming Soon)
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  [Git Insights Placeholder]
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
