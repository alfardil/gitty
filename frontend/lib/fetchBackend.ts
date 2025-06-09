interface CostApiResponse {
  error?: string;
  cost?: string;
}

export async function getCost(
  username: string,
  repo: string,
  githubAccessToken: string,
  instructions: string
): Promise<CostApiResponse> {
  try {
    console.log(
      "Trying with the following githubAccessToken: ",
      githubAccessToken
    );
    const baseUrl = "http://localhost:8000";
    const url = new URL(`${baseUrl}/generate/cost`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        repo,
        githubAccessToken,
        instructions: instructions ?? "",
      }),
    });

    if (response.status === 429) {
      return { error: "Rate limit exceeded. Please try again later." };
    }

    const data = (await response.json()) as CostApiResponse;

    return { cost: data.cost, error: data.error };
  } catch (error) {
    console.error("Error getting generation cost:", error);
    return { error: "Failed to get cost estimate." };
  }
}
