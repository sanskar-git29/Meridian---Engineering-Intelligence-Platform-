import type { PrismaClient } from "../../generated/prisma/client.js";

type DbClient = PrismaClient | Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export class GitHubRepository {
  constructor(private readonly db: DbClient) {}

  async createIntegration(organizationId: string) {
    return this.db.integration.create({
      data: {
        organizationId,
        name: "GitHub",
        provider: "GITHUB",
        status: "ACTIVE",
      },
    });
  }

  async createInstallation(
    organizationId: string,
    integrationId: string,
    githubInstallationId: number,
    githubOrganizationId: number,
    githubOrganizationLogin: string,
  ) {
    return this.db.gitHubInstallation.create({
      data: {
        organizationId,
        integrationId,
        githubInstallationId,
        githubOrganizationId,
        githubOrganizationLogin,
      },
    });
  }

  async findInstallation(organizationId: string) {
    return this.db.gitHubInstallation.findUnique({
      where: { organizationId },
    });
  }

  async findByGitHubInstallationId(githubInstallationId: number) {
    return this.db.gitHubInstallation.findFirst({
      where: { githubInstallationId },
    });
  }
}