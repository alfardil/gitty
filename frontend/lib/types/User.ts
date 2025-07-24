export type User = {
  id: number;
  login: string;
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
  uuid?: string;
  developer?: boolean;
  subscription_plan: string;
};
