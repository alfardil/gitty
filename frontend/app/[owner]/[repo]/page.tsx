import { getRepoPageData } from "./actions";
import RepoClientPage from "../_components/RepoClientPage";

export default async function RepoPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const { fileTree } = await getRepoPageData(owner, repo);

  return <RepoClientPage owner={owner} repo={repo} fileTree={fileTree} />;
}
