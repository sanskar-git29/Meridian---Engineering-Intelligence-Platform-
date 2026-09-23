export interface GitHubInstallation {
  id: number;

  account: {
    login: string;
    id: number;
    type: string;
  };
}

export interface GitHubInstallationToken {
  token: string;
  expiresAt: Date;
}

export interface GitHubTeamRepositoryData {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  html_url: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
    maintain?: boolean;
    triage?: boolean;
  };
}
export interface GitHubRepositoryData {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  html_url: string;
}

export interface GitHubUserData {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
}
export interface GitHubTeamRepositoryData {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  html_url: string;

  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
    maintain?: boolean;
    triage?: boolean;
  };
}

export interface GitHubTeamData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  privacy: string | null;
  permission: string | null;
  html_url: string;
}

export interface GitHubTeamMemberData {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
  role: "member" | "maintainer";
  inherited: boolean;
}