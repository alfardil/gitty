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

export async function fetchRecentCommits(
  githubAccessToken: string,
  user: { login: string; name?: string | null }
) {
  if (!user || !user.login) {
    return [];
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const response = await fetch(
    `https://api.github.com/users/${user.login}/events/public`,
    {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
      },
    }
  );

  if (!response.ok) {
    // Not critical, so just log and return empty
    console.error(
      `GitHub API error fetching events: ${response.status} ${response.statusText}`
    );
    return [];
  }

  const events = await response.json();
  const recentCommits: any[] = [];
  const addedShas = new Set<string>();

  for (const event of events) {
    const eventDate = new Date(event.created_at);
    if (eventDate < sevenDaysAgo) {
      continue; // Skip events older than 7 days
    }

    if (event.type === "PushEvent" && event.payload.commits) {
      for (const commit of event.payload.commits) {
        // Check if the commit author matches the user
        const isAuthoredByUser =
          commit.author.name === user.login ||
          (user.name && commit.author.name === user.name);

        if (isAuthoredByUser && !addedShas.has(commit.sha)) {
          recentCommits.push({
            sha: commit.sha,
            message: commit.message,
            repo: event.repo.name,
            date: event.created_at,
          });
          addedShas.add(commit.sha);
        }
      }
    }
  }

  return recentCommits;
}
