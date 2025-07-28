export type User = {
  uuid?: string;
  id: number;
  login: string;
  githubUsername: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  bio: string | null;
  email: string | null;
  username: string | null;
  developer?: boolean;
  subscription_plan: string;
};
