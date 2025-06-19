export async function fetchUserRepos(
  githubAccessToken: string,
  per_page: number = 20,
  page: number = 1
) {
  const response = await fetch(
    `https://api.github.com/user/repos?per_page=${per_page}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

export async function fetchUserOrgs(githubAccessToken: string) {
  const response = await fetch(`https://api.github.com/user/orgs`, {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

export async function fetchOrgRepos(
  githubAccessToken: string,
  org: string,
  per_page: number = 20,
  page: number = 1
) {
  const response = await fetch(
    `https://api.github.com/orgs/${org}/repos?per_page=${per_page}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

export async function fetchOrgContributorsNumber(
  githubAccessToken: string,
  org: string
): Promise<number> {
  // Use the existing fetchOrgRepos function to get all repos (first 100)
  const reposData = await fetchOrgRepos(githubAccessToken, org, 100, 1);
  const repoNames = reposData.map((repo: any) => repo.name);

  // Helper to fetch contributors for a repo
  async function fetchContributors(repo: string): Promise<string[]> {
    const res = await fetch(
      `https://api.github.com/repos/${org}/${repo}/contributors?per_page=100`,
      {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((contributor: any) => contributor.login);
  }

  // Main logic
  const allContributors: string[] = [];

  for (const repo of repoNames) {
    const contributors = await fetchContributors(repo);
    allContributors.push(...contributors);
  }

  // Get unique contributors
  const uniqueContributors = new Set(allContributors);
  return uniqueContributors.size;
}
