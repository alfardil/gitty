export type GithubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  bio: string | null;
  email: string | null;
};
