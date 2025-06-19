"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { fetchUserRepos, fetchUserOrgs, fetchOrgRepos } from "@/lib/fetchRepos";
import { TopNav } from "@/components/ui/dashboard/TopNav";
import { SectionToggle } from "@/components/ui/dashboard/SectionToggle";
import { RepoList } from "@/components/ui/dashboard/RepoList";
import { OrgList } from "@/components/ui/dashboard/OrgList";
import { Spinner } from "@/components/ui/neo/spinner";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/ace/sidebar";
import { LogOut, Folder, Users, LayoutDashboard } from "lucide-react";

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  const { open } = useSidebar();
  return (
    <button
      className="flex items-center gap-2 text-white hover:text-[#18CCFC] font-semibold"
      onClick={onLogout}
    >
      <LogOut color="#18CCFC" />
      {open && <span>Logout</span>}
    </button>
  );
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
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
    <div className="min-h-screen flex bg-[#191919] text-white">
      <Sidebar>
        <SidebarBody className="border-r border-[#18CCFC] h-screen bg-[#191919] flex flex-col justify-between">
          <div className="flex flex-col gap-2 mt-8">
            <SidebarLink
              link={{
                label: "Dashboard",
                href: "/dashboard",
                icon: <LayoutDashboard color="#18CCFC" />,
              }}
              className="hover:text-[#18CCFC]"
            />
            <SidebarLink
              link={{
                label: "Repos",
                href: "#repos",
                icon: <Folder color="#18CCFC" />,
              }}
              className={`hover:text-[#18CCFC] ${
                showRepos ? "text-[#18CCFC]" : ""
              }`}
            />
            <SidebarLink
              link={{
                label: "Orgs",
                href: "#orgs",
                icon: <Users color="#18CCFC" />,
              }}
              className={`hover:text-[#18CCFC] ${
                showOrgs ? "text-[#18CCFC]" : ""
              }`}
            />
          </div>
          <div className="mb-8">
            <LogoutButton onLogout={logout} />
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 p-12">
        <TopNav />
        <SectionToggle
          showRepos={showRepos}
          showOrgs={showOrgs}
          onShowRepos={() => {
            handleShowRepos();
          }}
          onShowOrgs={() => {
            setShowOrgs(true);
            setShowRepos(false);
            setExpandedRepo(null);
          }}
        />
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
      </main>
    </div>
  );
}
