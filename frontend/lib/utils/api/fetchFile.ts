export async function fetchFile({
  accessToken: githubAccessToken,
  owner,
  repo,
  branch = "main",
  filePath,
}: {
  accessToken: string;
  owner: string;
  repo: string;
  branch?: string;
  filePath: string;
}): Promise<string | null> {
  const query = `{
    repository(owner: \"${owner}\", name: \"${repo}\") {
      object(expression: \"${branch}:${filePath}\") {
        ... on Blob {
          text
        }
      }
    }
  }`;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    console.error("GitHub API error:", response.status, response.statusText);
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  if (data.errors) {
    console.error("GitHub GraphQL errors:", data.errors);
    throw new Error("GitHub GraphQL error: " + JSON.stringify(data.errors));
  }
  if (!data?.data?.repository?.object) {
    console.warn("File not found or object is null:", data);
    return null;
  }
  return data.data.repository.object.text ?? null;
}

// Fetch the file tree from GitHub REST API (server-side)
export async function fetchFileTree({
  accessToken,
  owner,
  repo,
  branch = "main",
}: {
  accessToken: string;
  owner: string;
  repo: string;
  branch?: string;
}) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.tree?.filter((item: any) => item.type === "blob");
}
