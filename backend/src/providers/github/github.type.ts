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

export interface GitHubRepositoryData {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  html_url: string;
}