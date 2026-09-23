import type { PrismaClient } from "../../generated/prisma/client.js";
// import type { GitHubRepositoryData } from "../../providers/github/github.type.js";
import type {
  GitHubRepositoryData,
  GitHubTeamData,
  GitHubUserData,
} from "../../providers/github/github.type.js";

type DbClient =
  | PrismaClient
  | Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

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

  async findByGitHubInstallationId(githubInstallationId: number) {
    return this.db.gitHubInstallation.findFirst({
      where: {
        githubInstallationId,
      },
    });
  }
  async upsertUser(
    organizationId: string,
    githubInstallationId: string,
    user: GitHubUserData,
  ) {
    return this.db.gitHubUser.upsert({
      where: {
        githubInstallationId_githubUserId: {
          githubInstallationId,
          githubUserId: BigInt(user.id),
        },
      },

      create: {
        organizationId,
        githubInstallationId,
        githubUserId: BigInt(user.id),
        login: user.login,
        avatarUrl: user.avatar_url,
        htmlUrl: user.html_url,
        type: user.type,
        siteAdmin: user.site_admin,
        isActive: true,
      },

      update: {
        organizationId,
        login: user.login,
        avatarUrl: user.avatar_url,
        htmlUrl: user.html_url,
        type: user.type,
        siteAdmin: user.site_admin,
        isActive: true,
      },
    });
  }

  async upsertTeam(
    organizationId: string,
    githubInstallationId: string,
    team: GitHubTeamData,
  ) {
    return this.db.gitHubTeam.upsert({
      where: {
        githubInstallationId_githubTeamId: {
          githubInstallationId,
          githubTeamId: BigInt(team.id),
        },
      },

      create: {
        organizationId,
        githubInstallationId,
        githubTeamId: BigInt(team.id),
        name: team.name,
        slug: team.slug,
        description: team.description,
        privacy: team.privacy,
        permission: team.permission,
        htmlUrl: team.html_url,
        isActive: true,
      },

      update: {
        organizationId,
        name: team.name,
        slug: team.slug,
        description: team.description,
        privacy: team.privacy,
        permission: team.permission,
        htmlUrl: team.html_url,
        isActive: true,
      },
    });
  }

  async upsertTeamMembership(
    teamId: string,
    githubUserId: string,
    role: string,
    isInherited: boolean,
  ) {
    return this.db.gitHubTeamMembership.upsert({
      where: {
        teamId_githubUserId: {
          teamId,
          githubUserId,
        },
      },

      create: {
        teamId,
        githubUserId,
        role,
        isInherited,
        isActive: true,
      },

      update: {
        role,
        isInherited,
        isActive: true,
      },
    });
  }

  async deactivateUsersNotIn(
    organizationId: string,
    githubInstallationId: string,
    githubUserIds: number[],
  ) {
    return this.db.gitHubUser.updateMany({
      where: {
        organizationId,
        githubInstallationId,
        isActive: true,

        ...(githubUserIds.length
          ? {
              githubUserId: {
                notIn: githubUserIds.map((id) => BigInt(id)),
              },
            }
          : {}),
      },

      data: {
        isActive: false,
      },
    });
  }

  async deactivateTeamsNotIn(
    organizationId: string,
    githubInstallationId: string,
    githubTeamIds: number[],
  ) {
    return this.db.gitHubTeam.updateMany({
      where: {
        organizationId,
        githubInstallationId,
        isActive: true,

        ...(githubTeamIds.length
          ? {
              githubTeamId: {
                notIn: githubTeamIds.map((id) => BigInt(id)),
              },
            }
          : {}),
      },

      data: {
        isActive: false,
      },
    });
  }

  async deactivateTeamMembershipsNotIn(
    teamId: string,
    githubUserIds: string[],
  ) {
    return this.db.gitHubTeamMembership.updateMany({
      where: {
        teamId,
        isActive: true,

        ...(githubUserIds.length
          ? {
              githubUserId: {
                notIn: githubUserIds,
              },
            }
          : {}),
      },

      data: {
        isActive: false,
      },
    });
  }

  async deactivateMembershipsForInactiveTeams(
    organizationId: string,
    githubInstallationId: string,
  ) {
    const inactiveTeams = await this.db.gitHubTeam.findMany({
      where: {
        organizationId,
        githubInstallationId,
        isActive: false,
      },

      select: {
        id: true,
      },
    });

    if (!inactiveTeams.length) {
      return {
        count: 0,
      };
    }

    return this.db.gitHubTeamMembership.updateMany({
      where: {
        teamId: {
          in: inactiveTeams.map((team) => team.id),
        },
        isActive: true,
      },

      data: {
        isActive: false,
      },
    });
  }

  async findActiveUsers(organizationId: string) {
    return this.db.gitHubUser.findMany({
      where: {
        organizationId,
        isActive: true,
      },

      orderBy: {
        login: "asc",
      },
    });
  }

  async findActiveTeams(organizationId: string) {
    return this.db.gitHubTeam.findMany({
      where: {
        organizationId,
        isActive: true,
      },

      orderBy: {
        name: "asc",
      },

      include: {
        memberships: {
          where: {
            isActive: true,
            githubUser: {
              isActive: true,
            },
          },

          include: {
            githubUser: true,
          },

          orderBy: {
            githubUser: {
              login: "asc",
            },
          },
        },

        repositoryPermissions: {
          where: {
            isActive: true,
            repository: {
              isActive: true,
            },
          },

          include: {
            repository: true,
          },
        },
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
  async findRepositoryByGithubId(
    githubInstallationId: string,
    githubRepositoryId: number | bigint,
  ) {
    return this.db.gitHubRepository.findFirst({
      where: {
        githubInstallationId,
        githubRepositoryId: BigInt(githubRepositoryId),
        isActive: true,
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

  async upsertTeamRepositoryPermission(
    teamId: string,
    repositoryId: string,
    permission: string,
  ) {
    return this.db.gitHubTeamRepository.upsert({
      where: {
        teamId_repositoryId: {
          teamId,
          repositoryId,
        },
      },
      create: {
        teamId,
        repositoryId,
        permission,
        isActive: true,
      },
      update: {
        permission,
        isActive: true,
      },
    });
  }
  async deactivateTeamRepositoryPermissionsNotIn(
    teamId: string,
    repositoryIds: string[],
  ) {
    return this.db.gitHubTeamRepository.updateMany({
      where: {
        teamId,
        isActive: true,
        ...(repositoryIds.length
          ? {
              repositoryId: {
                notIn: repositoryIds,
              },
            }
          : {}),
      },
      data: {
        isActive: false,
      },
    });
  }
  async deactivatePermissionsForInactiveTeams(
    organizationId: string,
    githubInstallationId: string,
  ) {
    const inactiveTeams = await this.db.gitHubTeam.findMany({
      where: {
        organizationId,
        githubInstallationId,
        isActive: false,
      },
      select: {
        id: true,
      },
    });

    if (!inactiveTeams.length) {
      return { count: 0 };
    }

    return this.db.gitHubTeamRepository.updateMany({
      where: {
        teamId: {
          in: inactiveTeams.map((team) => team.id),
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }
}
