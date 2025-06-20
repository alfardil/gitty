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

import { Spinner } from "@/components/ui/neo/spinner";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/ui/dashboard/Sidebar";
import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { InsightsView } from "@/components/ui/dashboard/insights/InsightsView";
import { RepositoriesView } from "@/components/ui/dashboard/repositories/RepositoriesView";
import { OrganizationsView } from "@/components/ui/dashboard/organizations/OrganizationsView";
import { GitInsightsView } from "@/components/ui/dashboard/gitInsights/GitInsightsView";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [repos, setRepos] = useState<any[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [showSection, setShowSection] = useState("insights");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [recentCommits, setRecentCommits] = useState<any[]>([]);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [orgRepos, setOrgRepos] = useState<{ [org: string]: any[] }>({});
  const [orgReposLoading, setOrgReposLoading] = useState<{
    [org: string]: boolean;
  }>({});
  const [repoPage, setRepoPage] = useState(1);
  const [orgRepoPages, setOrgRepoPages] = useState<{ [org: string]: number }>(
    {}
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const perPage = 10;

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
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
          {showSection === "insights" && (
            <InsightsView
              repos={repos}
              orgs={orgs}
              recentCommits={recentCommits}
            />
          )}
          {showSection === "repos" && (
            <RepositoriesView
              repos={repos}
              reposLoading={reposLoading}
              expandedRepo={expandedRepo}
              handleExpandRepo={handleExpandRepo}
              userLogin={user.login}
              repoPage={repoPage}
              handlePrevRepoPage={handlePrevRepoPage}
              handleNextRepoPage={handleNextRepoPage}
              perPage={perPage}
            />
          )}
          {showSection === "orgs" && (
            <OrganizationsView
              orgs={orgs}
              orgsLoading={orgsLoading}
              expandedOrg={expandedOrg}
              handleExpandOrg={handleExpandOrg}
              orgRepos={orgRepos}
              orgReposLoading={orgReposLoading}
              orgRepoPages={orgRepoPages}
              handlePrevOrgRepoPage={handlePrevOrgRepoPage}
              handleNextOrgRepoPage={handleNextOrgRepoPage}
              perPage={perPage}
            />
          )}
          {showSection === "commits" && <GitInsightsView />}
        </main>
      </div>
    </div>
  );
}
