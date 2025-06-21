"use client";

import { RepositoriesView } from "../repositories/RepositoriesView";

export function AnalysisView({
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
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Select a Repository for Analysis
      </h2>
      <RepositoriesView
        repos={repos}
        reposLoading={reposLoading}
        expandedRepo={expandedRepo}
        handleExpandRepo={handleExpandRepo}
        userLogin={userLogin}
        repoPage={repoPage}
        handlePrevRepoPage={handlePrevRepoPage}
        handleNextRepoPage={handleNextRepoPage}
        perPage={perPage}
      />
    </section>
  );
}
