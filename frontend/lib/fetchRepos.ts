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
