import { Button } from "@/components/ui/neo/button";
import { Spinner } from "@/components/ui/neo/spinner";
import { ChevronDown } from "lucide-react";
import { RepoItem } from "./RepoItem";

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
                <div className="p-4 space-y-4">
                  {orgReposLoading[org.login] ? (
                    <div className="flex justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      {orgRepos[org.login] && orgRepos[org.login].length > 0 ? (
                        <>
                          {orgRepos[org.login].map((repo) => (
                            <RepoItem
                              key={repo.id}
                              repo={repo}
                              expanded={false}
                              onExpand={() => {}}
                              username={org.login}
                            />
                          ))}

                          <div className="flex justify-center gap-2 mt-2">
                            <Button
                              variant="noShadow"
                              disabled={(orgRepoPages[org.login] || 1) === 1}
                              onClick={() => onPrevOrgRepoPage(org.login)}
                              className="bg-blue-300"
                            >
                              Previous
                            </Button>
                            <span className="px-2 py-1">
                              Page {orgRepoPages[org.login] || 1}
                            </span>
                            <Button
                              variant="noShadow"
                              disabled={orgRepos[org.login].length < perPage}
                              onClick={() => onNextOrgRepoPage(org.login)}
                              className="bg-blue-300"
                            >
                              Next
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-500">
                          No repositories found for this organization.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
