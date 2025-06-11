import { getRepoPageData } from "@/lib/server/fetchRepoData";
import RepoClientPage from "@/components/RepoClientPage";

export default async function RepoPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const { owner, repo } = await params;
  const { fileTree } = await getRepoPageData(owner, repo);
  return <RepoClientPage owner={owner} repo={repo} fileTree={fileTree} />;
}
