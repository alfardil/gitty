"use client";

import { OrgList } from "./OrgList";

export function OrganizationsView({
  orgs,
  orgsLoading,
  expandedOrg,
  handleExpandOrg,
  orgRepos,
  orgReposLoading,
  orgRepoPages,
  handlePrevOrgRepoPage,
  handleNextOrgRepoPage,
  perPage,
}: {
  orgs: any[];
  orgsLoading: boolean;
  expandedOrg: string | null;
  handleExpandOrg: (orgLogin: string) => void;
  orgRepos: { [org: string]: any[] };
  orgReposLoading: { [org: string]: boolean };
  orgRepoPages: { [org: string]: number };
  handlePrevOrgRepoPage: (org: string) => void;
  handleNextOrgRepoPage: (org: string) => void;
  perPage: number;
}) {
  return (
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
  );
}
