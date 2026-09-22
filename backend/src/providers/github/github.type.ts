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