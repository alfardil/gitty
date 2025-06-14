"use server";

import { cookies } from "next/headers";
import { fetchFileTree } from "@/lib/fetchFile";

export async function getRepoPageData(
  owner: string,
  repo: string,
  branch = "main"
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("github_access_token")?.value || "";
  let fileTree: any[] = [];
  try {
    fileTree = accessToken
      ? await fetchFileTree({ accessToken, owner, repo, branch })
      : [];
  } catch {
    fileTree = [];
  }
  return { fileTree };
}
