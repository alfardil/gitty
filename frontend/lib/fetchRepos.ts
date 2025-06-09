export async function fetchRepos(githubAccessToken: string) {
  const response = await fetch(`https://api.github.com/user/repos`, {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
    },
  });
  const data = await response.json();
  return data;
}
