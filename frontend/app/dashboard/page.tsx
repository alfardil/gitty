"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { fetchUserRepos, fetchUserOrgs, fetchOrgRepos } from "@/lib/fetchRepos";
import { SystemDesign } from "@/components/ui/dashboard/TopNav";
import { RepoList } from "@/components/ui/dashboard/RepoList";
import { OrgList } from "@/components/ui/dashboard/OrgList";
import { CustomSidebar } from "@/components/ui/dashboard/CustomSidebar";
import { Spinner } from "@/components/ui/neo/spinner";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [repos, setRepos] = useState<any[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("repos");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
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

  useEffect(() => {
    async function loadRepos() {
      if (user && activeTab === "repos") {
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
  }, [user, activeTab, repoPage]);

  useEffect(() => {
    async function loadOrgs() {
      if (user && activeTab === "orgs") {
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
  }, [user, activeTab]);

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

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setExpandedRepo(null);
    setExpandedOrg(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <div className="text-2xl font-bold">Please login to continue</div>
        <button
          className="mt-4 px-6 py-2 bg-[#18CCFC] text-black rounded font-semibold"
          onClick={logout}
        >
          Login with GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <CustomSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={logout}
      />

      <main className="p-12 ml-0 transition-all duration-300">
        <SystemDesign />

        {activeTab === "repos" && (
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
        )}

        {activeTab === "orgs" && (
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
        )}

        {activeTab === "git-insights" && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Git Insights</h2>
            <p className="text-gray-600">Git insights feature coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}
