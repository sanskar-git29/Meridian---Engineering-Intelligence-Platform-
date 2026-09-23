import type { PrismaClient } from "../../generated/prisma/client.js";
import type { GitHubRepositoryData } from "../../providers/github/github.type.js";

type DbClient =
  | PrismaClient
  | Parameters<
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
      where: {
        organizationId,
      },
    });
  }

  async findByGitHubInstallationId(
    githubInstallationId: number,
  ) {
    return this.db.gitHubInstallation.findFirst({
      where: {
        githubInstallationId,
      },
    });
  }

  async upsertRepository(
    organizationId: string,
    githubInstallationId: string,
    repository: GitHubRepositoryData,
  ) {
    return this.db.gitHubRepository.upsert({
      where: {
        githubInstallationId_githubRepositoryId: {
          githubInstallationId,
          githubRepositoryId: BigInt(repository.id),
        },
      },
      create: {
        organizationId,
        githubInstallationId,
        githubRepositoryId: BigInt(repository.id),
        name: repository.name,
        fullName: repository.full_name,
        private: repository.private,
        defaultBranch: repository.default_branch,
        htmlUrl: repository.html_url,
        isActive: true,
      },
      update: {
        organizationId,
        name: repository.name,
        fullName: repository.full_name,
        private: repository.private,
        defaultBranch: repository.default_branch,
        htmlUrl: repository.html_url,
        isActive: true,
      },
    });
  }

  async deactivateRepositoriesNotIn(
    organizationId: string,
    githubInstallationId: string,
    repositoryIds: number[],
  ) {
    if (repositoryIds.length === 0) {
      return this.db.gitHubRepository.updateMany({
        where: {
          organizationId,
          githubInstallationId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    return this.db.gitHubRepository.updateMany({
      where: {
        organizationId,
        githubInstallationId,
        githubRepositoryId: {
          notIn: repositoryIds.map(BigInt),
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  async findRepositories(organizationId: string) {
    return this.db.gitHubRepository.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}