import { Button } from "@/components/ui/neo/button";
import { Spinner } from "@/components/ui/neo/spinner";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { RepoList } from "../repositories/RepoList";
import { RepoItem } from "../repositories/RepoItem";

type OrgListProps = {
  orgs: any[];
  loading: boolean;
  expandedOrg: string | null;
  onExpandOrg: (orgLogin: string) => void;
  orgRepos: { [org: string]: any[] };
  orgReposLoading: { [org: string]: boolean };
  orgRepoPages: { [org: string]: number };
  onPrevOrgRepoPage: (org: string) => void;
  onNextOrgRepoPage: (org: string) => void;
  perPage: number;
};

export function OrgList({
  orgs,
  loading,
  expandedOrg,
  onExpandOrg,
  orgRepos,
  orgReposLoading,
  orgRepoPages,
  onPrevOrgRepoPage,
  onNextOrgRepoPage,
  perPage,
}: OrgListProps) {
  // Track expanded repo per org
  const [expandedRepoByOrg, setExpandedRepoByOrg] = useState<{
    [org: string]: string | null;
  }>({});

  const handleExpandRepo = (org: string, repoId: string) => {
    setExpandedRepoByOrg((prev) => ({
      ...prev,
      [org]: prev[org] === repoId ? null : repoId,
    }));
  };

  return (
    <div className="space-y-4 mb-8">
      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {orgs.length === 0 && (
            <div className="text-center text-gray-500">
              No organizations found or none have been authorized yet.
            </div>
          )}
          {orgs.map((org) => (
            <div key={org.id}>
              <Button
                variant="noShadow"
                className="w-full justify-between cursor-default bg-blue-200"
                onClick={() => onExpandOrg(org.login)}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={org.avatar_url}
                    alt={org.login}
                    className="w-6 h-6 rounded-full border"
                  />
                  <span className="font-semibold">{org.login}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedOrg === org.login ? "rotate-180" : ""
                  }`}
                />
              </Button>
              {expandedOrg === org.login && (
                <div className="pl-4 pt-4">
                  {orgReposLoading[org.login] && (
                    <div className="flex justify-center">
                      <Spinner />
                    </div>
                  )}
                  {!orgReposLoading[org.login] &&
                    (orgRepos[org.login] || []).map((repo: any) => (
                      <RepoItem
                        key={repo.id}
                        repo={repo}
                        username={org.login}
                        expanded={expandedRepoByOrg[org.login] === repo.id}
                        onExpand={() => handleExpandRepo(org.login, repo.id)}
                      />
                    ))}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => onPrevOrgRepoPage(org.login)}
                      disabled={(orgRepoPages[org.login] || 1) === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {orgRepoPages[org.login] || 1}
                    </span>
                    <button
                      onClick={() => onNextOrgRepoPage(org.login)}
                      disabled={(orgRepos[org.login] || []).length < perPage}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
