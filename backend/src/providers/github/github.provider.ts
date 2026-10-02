import type {
  GitHubConnectResult,
} from "../../types/github/github.type.js";

import { env } from "../../config/env.js";
import { generateGitHubAppJwt } from "../../utility/jwt/jwt.js";
export class GitHubProvider {
  async connectGitHub(
    organizationId: string,
  ): Promise<GitHubConnectResult> {
    console.log(
      `GitHub provider called for organization: ${organizationId}`,
    );

    const installationUrl =
      `https://github.com/apps/${env.github.GITHUB_APP_SLUG}/installations/new`;

    return {
      message: "GitHub connection request received",
      organizationId,
      installationUrl,
    };
  }

  async createInstallationAccessToken(
  installationId: number,
): Promise<string> {
  const appJwt = generateGitHubAppJwt();

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appJwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Failed to create GitHub installation access token: ${error}`,
    );
  }

  const data = (await response.json()) as {
    token: string;
  };

  return data.token;
}
}



export const githubProvider =
  new GitHubProvider();