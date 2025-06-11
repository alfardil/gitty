import { RepoItem } from "./RepoItem";
import { Spinner } from "@/components/ui/neo/spinner";
import { Button } from "@/components/ui/neo/button";

type RepoListProps = {
  repos: any[];
  loading: boolean;
  expandedRepo: string | null;
  onExpandRepo: (id: string) => void;
  username: string;
  page: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  perPage: number;
};

export function RepoList({
  repos,
  loading,
  expandedRepo,
  onExpandRepo,
  username,
  page,
  onPrevPage,
  onNextPage,
  perPage,
}: RepoListProps) {
  return (
    <div className="space-y-2 mb-8">
      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {repos.map((repo) => (
            <RepoItem
              key={repo.id}
              repo={repo}
              expanded={expandedRepo === repo.id}
              onExpand={() => onExpandRepo(repo.id)}
              username={username}
            />
          ))}
          {/* Pagination Controls */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="noShadow"
              disabled={page === 1}
              onClick={onPrevPage}
              className="bg-blue-300"
            >
              Previous
            </Button>
            <span className="px-2 py-1">Page {page}</span>
            <Button
              variant="noShadow"
              disabled={repos.length < perPage}
              onClick={onNextPage}
              className="bg-blue-300"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
