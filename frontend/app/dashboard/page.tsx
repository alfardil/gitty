"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import Header from "@/components/Header";
import { GitHubLoginButton } from "@/components/LoginButton";
import { useEffect, useState } from "react";
import { fetchUserRepos, fetchUserOrgs, fetchOrgRepos } from "@/lib/fetchRepos";
import { TopNav } from "@/components/ui/dashboard/TopNav";
import { SectionToggle } from "@/components/ui/dashboard/SectionToggle";
import { RepoList } from "@/components/ui/dashboard/RepoList";
import { OrgList } from "@/components/ui/dashboard/OrgList";
import { Spinner } from "@/components/ui/neo/spinner";
import { fetchFile } from "@/lib/fetchFile";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [repos, setRepos] = useState<any[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [showRepos, setShowRepos] = useState(false);
  const [showOrgs, setShowOrgs] = useState(false);
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
  const [testFileContent, setTestFileContent] = useState<string | null>(null);

  useEffect(() => {
    async function loadRepos() {
      if (user && showRepos) {
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
  }, [user, showRepos, repoPage]);

  useEffect(() => {
    async function loadOrgs() {
      if (user && showOrgs) {
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
  }, [user, showOrgs]);

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
            // If empty and not on first page, go back until non-empty or page 1
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

  function handleShowRepos() {
    setShowRepos((prev) => !prev);
    setShowOrgs(false);
    setExpandedOrg(null);
  }
  function handleShowOrgs() {
    setShowOrgs((prev) => !prev);
    setShowRepos(false);
    setExpandedRepo(null);
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
    <div className="min-h-screen bg-primary mb-10">
      <Header />
      <div className="container mx-auto px-4 pt-32 max-w-3xl">
        <TopNav />
        <SectionToggle
          showRepos={showRepos}
          showOrgs={showOrgs}
          onShowRepos={handleShowRepos}
          onShowOrgs={handleShowOrgs}
        />
        {/* {testFileContent && (
          <div className="mb-6 p-4 bg-white border rounded text-xs text-gray-700 whitespace-pre-wrap">
            <div className="font-bold mb-2">First repo README.md:</div>
            {testFileContent}
          </div>
        )} */}
        {showRepos && (
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
        {showOrgs && (
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
      </div>
    </div>
  );
}
