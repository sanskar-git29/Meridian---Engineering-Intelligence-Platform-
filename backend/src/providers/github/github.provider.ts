import fs from "node:fs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { ApiError } from "../../utility/apiError.js";

import type {
  GitHubInstallation,
  GitHubInstallationToken,
  GitHubRepositoryData,
} from "./github.type.js";

export class GitHubProvider {
  private readonly appId: string;
  private readonly privateKey: string;

  constructor() {
    this.appId = env.github.GITHUB_APP_ID;

    try {
      this.privateKey = fs.readFileSync(
        env.github.GITHUB_PRIVATE_KEY_PATH,
        "utf8",
      );
    } catch {
      throw ApiError.internal(
        "GitHub App private key could not be loaded",
        "GITHUB_PRIVATE_KEY_LOAD_FAILED",
      );
    }
  }

  private createAppJwt(): string {
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        iat: now - 60,
        exp: now + 9 * 60,
        iss: this.appId,
      },
      this.privateKey,
      {
        algorithm: "RS256",
      },
    );
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`https://api.github.com${path}`, {
        ...options,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...options.headers,
        },
      });
    } catch {
      throw ApiError.internal(
        "Unable to connect to GitHub",
        "GITHUB_API_UNAVAILABLE",
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw ApiError.unauthorized(
          "GitHub authorization failed",
          "GITHUB_AUTHORIZATION_FAILED",
        );
      }

      if (response.status === 403) {
        throw ApiError.forbidden(
          "GitHub App does not have sufficient permissions",
          "GITHUB_PERMISSION_DENIED",
        );
      }

      if (response.status === 404) {
        throw ApiError.notFound(
          "GitHub resource not found",
          "GITHUB_RESOURCE_NOT_FOUND",
        );
      }

      if (response.status === 429) {
        throw ApiError.tooManyRequests(
          "GitHub API rate limit exceeded",
          "GITHUB_RATE_LIMIT_EXCEEDED",
        );
      }

      throw ApiError.internal(
        "GitHub API request failed",
        "GITHUB_API_REQUEST_FAILED",
      );
    }

    return response.json() as Promise<T>;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      state,
    });

    return `https://github.com/apps/medit-development/installations/new?${params.toString()}`;
  }

  async exchangeCodeForUserToken(code: string): Promise<string> {
    let response: Response;

    try {
      response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: env.github.GITHUB_CLIENT_ID,
            client_secret: env.github.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: env.github.GITHUB_CALLBACK_URL,
          }),
        },
      );
    } catch {
      throw ApiError.internal(
        "Unable to connect to GitHub",
        "GITHUB_API_UNAVAILABLE",
      );
    }

    if (!response.ok) {
      throw ApiError.internal(
        "GitHub authorization failed",
        "GITHUB_AUTHORIZATION_FAILED",
      );
    }

    const data = (await response.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!data.access_token) {
      throw ApiError.unauthorized(
        "GitHub authorization failed",
        "GITHUB_AUTHORIZATION_FAILED",
      );
    }

    return data.access_token;
  }

  async getUserInstallations(userToken: string) {
    return this.request<{
      installations: Array<{
        id: number;
        account: {
          login: string;
          id: number;
          type: string;
        };
      }>;
    }>("/user/installations", {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });
  }

  async getInstallation(
    installationId: number,
  ): Promise<GitHubInstallation> {
    const appJwt = this.createAppJwt();

    return this.request<GitHubInstallation>(
      `/app/installations/${installationId}`,
      {
        headers: {
          Authorization: `Bearer ${appJwt}`,
        },
      },
    );
  }

  async createInstallationToken(
    installationId: number,
  ): Promise<GitHubInstallationToken> {
    const appJwt = this.createAppJwt();

    const response = await this.request<{
      token: string;
      expires_at: string;
    }>(
      `/app/installations/${installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${appJwt}`,
        },
      },
    );

    return {
      token: response.token,
      expiresAt: new Date(response.expires_at),
    };
  }

  async getInstallationRepositories(
  installationToken: string,
): Promise<GitHubRepositoryData[]> {
  const repositories: GitHubRepositoryData[] = [];

  let page = 1;

  while (true) {
    const response = await this.request<{
      total_count: number;
      repositories: GitHubRepositoryData[];
    }>(
      `/installation/repositories?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${installationToken}`,
        },
      },
    );

    repositories.push(...response.repositories);

    if (response.repositories.length < 100) {
      break;
    }

    page++;
  }

  return repositories;
}
}