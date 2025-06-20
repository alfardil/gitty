"use client";

import { SystemDiagramButton } from "../TopNav";
import { RepoList } from "./RepoList";

export function RepositoriesView({
  repos,
  reposLoading,
  expandedRepo,
  handleExpandRepo,
  userLogin,
  repoPage,
  handlePrevRepoPage,
  handleNextRepoPage,
  perPage,
}: {
  repos: any[];
  reposLoading: boolean;
  expandedRepo: string | null;
  handleExpandRepo: (id: string) => void;
  userLogin: string;
  repoPage: number;
  handlePrevRepoPage: () => void;
  handleNextRepoPage: () => void;
  perPage: number;
}) {
  return (
    <section>
      <SystemDiagramButton />
      <RepoList
        repos={repos}
        loading={reposLoading}
        expandedRepo={expandedRepo}
        onExpandRepo={handleExpandRepo}
        username={userLogin}
        page={repoPage}
        onPrevPage={handlePrevRepoPage}
        onNextPage={handleNextRepoPage}
        perPage={perPage}
      />
    </section>
  );
}
