import type {
  GitHubConnectResult,
} from "../../types/github/github.type.js";

import { env } from "../../config/env.js";

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
}

export const githubProvider =
  new GitHubProvider();