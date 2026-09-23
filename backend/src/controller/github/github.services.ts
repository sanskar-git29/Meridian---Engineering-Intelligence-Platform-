import { prisma } from "../../config/prisma.confi.js";

import {
  consumeGitHubOAuthState,
  createGitHubOAuthState,
} from "../../lib/githubState.js";
import { createAuditLog } from "../../lib/auditLog.js";
import { AuditAction } from "../../lib/auditActions.js";

import { GitHubProvider } from "../../providers/github/github.provider.js";
import type { GitHubUserData } from "../../providers/github/github.type.js";

import { GitHubRepository } from "../../repositories/github/github.repository.js";

import { ApiError } from "../../utility/apiError.js";

const githubProvider = new GitHubProvider();

export async function connectGitHubService(
  organizationId: string,
  userId: string,
) {
  const existingInstallation = await prisma.gitHubInstallation.findUnique({
    where: {
      organizationId,
    },
  });

  if (existingInstallation) {
    throw ApiError.conflict(
      "GitHub is already connected",
      "GITHUB_ALREADY_CONNECTED",
    );
  }

  const state = await createGitHubOAuthState(organizationId, userId);

  const authorizationUrl = githubProvider.getAuthorizationUrl(state);

  return {
    authorizationUrl,
  };
}

export async function githubCallbackService(
  code: string,
  state: string,
  installationId: number,
) {
  const oauthState = await consumeGitHubOAuthState(state);

  if (!oauthState) {
    throw ApiError.badRequest(
      "Invalid or expired GitHub authorization state",
      "GITHUB_INVALID_STATE",
    );
  }

  const userToken = await githubProvider.exchangeCodeForUserToken(code);

  const userInstallations =
    await githubProvider.getUserInstallations(userToken);

  const authorizedInstallation = userInstallations.installations.find(
    (installation) => installation.id === installationId,
  );

  if (!authorizedInstallation) {
    throw ApiError.forbidden(
      "GitHub installation is not authorized for this user",
      "GITHUB_INSTALLATION_NOT_AUTHORIZED",
    );
  }

  const installation = await githubProvider.getInstallation(installationId);

  if (installation.account.type !== "Organization") {
    throw ApiError.badRequest(
      "GitHub installation must belong to an organization",
      "GITHUB_INVALID_ACCOUNT",
    );
  }

  const repository = new GitHubRepository(prisma);

  const existingGitHubInstallation =
    await repository.findByGitHubInstallationId(installationId);

  if (existingGitHubInstallation) {
    throw ApiError.conflict(
      "This GitHub installation is already connected to another organization",
      "GITHUB_INSTALLATION_ALREADY_CONNECTED",
    );
  }

  return prisma.$transaction(async (tx) => {
    const transactionRepository = new GitHubRepository(tx);

    const integration = await transactionRepository.createIntegration(
      oauthState.organizationId,
    );

    const githubInstallation = await transactionRepository.createInstallation(
      oauthState.organizationId,
      integration.id,
      installation.id,
      installation.account.id,
      installation.account.login,
    );

    return {
      integration,
      githubInstallation,
    };
  });
}

export async function syncGitHubRepositories(organizationId: string) {
  const repository = new GitHubRepository(prisma);

  const installation = await repository.findInstallation(organizationId);

  if (!installation) {
    throw ApiError.notFound("GitHub is not connected", "GITHUB_NOT_CONNECTED");
  }

  const installationToken = await githubProvider.createInstallationToken(
    installation.githubInstallationId,
  );

  const githubRepositories = await githubProvider.getInstallationRepositories(
    installationToken.token,
  );

  await prisma.$transaction(async (tx) => {
    const transactionRepository = new GitHubRepository(tx);

    for (const githubRepository of githubRepositories) {
      await transactionRepository.upsertRepository(
        organizationId,
        installation.id,
        githubRepository,
      );
    }

    await transactionRepository.deactivateRepositoriesNotIn(
      organizationId,
      installation.id,
      githubRepositories.map((githubRepository) => githubRepository.id),
    );
  });

  const repositories = await repository.findRepositories(organizationId);

  return repositories.map((repository) => ({
    ...repository,

    githubRepositoryId: repository.githubRepositoryId.toString(),
  }));
}

export async function syncGitHubTeamsAndUsers(organizationId: string) {
  const repository = new GitHubRepository(prisma);

  const installation = await repository.findInstallation(organizationId);

  if (!installation) {
    throw ApiError.notFound("GitHub is not connected", "GITHUB_NOT_CONNECTED");
  }

  const installationToken = await githubProvider.createInstallationToken(
    installation.githubInstallationId,
  );

  const [githubUsers, githubTeams] = await Promise.all([
    githubProvider.getOrganizationMembers(
      installationToken.token,
      installation.githubOrganizationLogin,
    ),

    githubProvider.getOrganizationTeams(
      installationToken.token,
      installation.githubOrganizationLogin,
    ),
  ]);

  /*
   * Fetch team members
   */
  const teamMembers = await Promise.all(
    githubTeams.map(async (team) => ({
      team,

      members: await githubProvider.getTeamMembers(
        installationToken.token,
        installation.githubOrganizationLogin,
        team.slug,
      ),
    })),
  );

  /*
   * Fetch team repositories
   * and their permissions
   */
  const teamRepositories = await Promise.all(
    githubTeams.map(async (team) => ({
      team,

      repositories: await githubProvider.getTeamRepositories(
        installationToken.token,
        installation.githubOrganizationLogin,
        team.slug,
      ),
    })),
  );

  /*
   * Merge organization users and
   * team-only users.
   */
  const usersById = new Map<number, GitHubUserData>();

  for (const user of githubUsers) {
    usersById.set(user.id, user);
  }

  for (const { members } of teamMembers) {
    for (const member of members) {
      if (!usersById.has(member.id)) {
        usersById.set(member.id, {
          id: member.id,
          login: member.login,
          avatar_url: member.avatar_url,
          html_url: member.html_url,
          type: member.type,
          site_admin: member.site_admin,
        });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    const transactionRepository = new GitHubRepository(tx);

    /*
     * Sync users
     */
    const localUsers = new Map<number, string>();

    for (const user of usersById.values()) {
      const localUser = await transactionRepository.upsertUser(
        organizationId,
        installation.id,
        user,
      );

      localUsers.set(user.id, localUser.id);
    }

    await transactionRepository.deactivateUsersNotIn(
      organizationId,
      installation.id,
      Array.from(usersById.keys()),
    );

    /*
     * Sync teams
     */
    const localTeams = new Map<number, string>();

    for (const team of githubTeams) {
      const localTeam = await transactionRepository.upsertTeam(
        organizationId,
        installation.id,
        team,
      );

      localTeams.set(team.id, localTeam.id);
    }

    await transactionRepository.deactivateTeamsNotIn(
      organizationId,
      installation.id,
      githubTeams.map((team) => team.id),
    );

    /*
     * Sync team memberships
     */
    for (const { team, members } of teamMembers) {
      const localTeamId = localTeams.get(team.id);

      if (!localTeamId) {
        continue;
      }

      const activeLocalUserIds: string[] = [];

      for (const member of members) {
        const localUserId = localUsers.get(member.id);

        if (!localUserId) {
          continue;
        }

        await transactionRepository.upsertTeamMembership(
          localTeamId,
          localUserId,
          member.role,
          member.inherited,
        );

        activeLocalUserIds.push(localUserId);
      }

      await transactionRepository.deactivateTeamMembershipsNotIn(
        localTeamId,
        activeLocalUserIds,
      );
    }

    /*
     * Sync team repository permissions
     */
    for (const { team, repositories } of teamRepositories) {
      const localTeamId = localTeams.get(team.id);

      if (!localTeamId) {
        continue;
      }

      const activeRepositoryIds: string[] = [];

      for (const githubRepository of repositories) {
        const localRepository =
          await transactionRepository.findRepositoryByGithubId(
            installation.id,
            githubRepository.id,
          );

        if (!localRepository) {
          continue;
        }

        let permission = "pull";

        if (githubRepository.permissions?.admin) {
          permission = "admin";
        } else if (githubRepository.permissions?.maintain) {
          permission = "maintain";
        } else if (githubRepository.permissions?.push) {
          permission = "push";
        } else if (githubRepository.permissions?.triage) {
          permission = "triage";
        }

        await transactionRepository.upsertTeamRepositoryPermission(
          localTeamId,
          localRepository.id,
          permission,
        );

        activeRepositoryIds.push(localRepository.id);
      }

      await transactionRepository.deactivateTeamRepositoryPermissionsNotIn(
        localTeamId,
        activeRepositoryIds,
      );
    }

    /*
     * Deactivate memberships belonging
     * to teams that no longer exist.
     */
    await transactionRepository.deactivateMembershipsForInactiveTeams(
      organizationId,
      installation.id,
    );

    /*
     * Deactivate repository permissions
     * belonging to inactive teams.
     */
    await transactionRepository.deactivatePermissionsForInactiveTeams(
      organizationId,
      installation.id,
    );
    await createAuditLog(tx, {
      organizationId,
      action: AuditAction.GITHUB_SYNC,
      resourceType: "github_installation",
      resourceId: installation.id,
      metadata: {
        usersSynced: usersById.size,
        teamsSynced: githubTeams.length,
        teamMembershipsSynced: teamMembers.reduce(
          (total, item) => total + item.members.length,
          0,
        ),
        teamRepositoriesSynced: teamRepositories.reduce(
          (total, item) => total + item.repositories.length,
          0,
        ),
      },
    });
  });

  /*
   * Read synchronized data.
   */
  const [users, teams] = await Promise.all([
    repository.findActiveUsers(organizationId),

    repository.findActiveTeams(organizationId),
  ]);

  /*
   * Do not spread Prisma objects here.
   * Convert BigInt values explicitly.
   */
  return {
    users: users.map((user) => ({
      id: user.id,
      organizationId: user.organizationId,
      githubInstallationId: user.githubInstallationId,
      githubUserId: user.githubUserId.toString(),
      login: user.login,
      avatarUrl: user.avatarUrl,
      htmlUrl: user.htmlUrl,
      type: user.type,
      siteAdmin: user.siteAdmin,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),

    teams: teams.map((team) => ({
      id: team.id,
      organizationId: team.organizationId,
      githubInstallationId: team.githubInstallationId,
      githubTeamId: team.githubTeamId.toString(),
      name: team.name,
      slug: team.slug,
      description: team.description,
      privacy: team.privacy,
      permission: team.permission,
      htmlUrl: team.htmlUrl,
      isActive: team.isActive,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,

      members: team.memberships.map((membership) => ({
        id: membership.githubUser.id,

        githubUserId: membership.githubUser.githubUserId.toString(),

        login: membership.githubUser.login,

        avatarUrl: membership.githubUser.avatarUrl,

        htmlUrl: membership.githubUser.htmlUrl,

        role: membership.role,

        isInherited: membership.isInherited,
      })),

      repositories: team.repositoryPermissions.map((permission) => ({
        id: permission.repository.id,

        githubRepositoryId: permission.repository.githubRepositoryId.toString(),

        name: permission.repository.name,

        fullName: permission.repository.fullName,

        private: permission.repository.private,

        defaultBranch: permission.repository.defaultBranch,

        htmlUrl: permission.repository.htmlUrl,

        permission: permission.permission,

        isActive: permission.isActive,
      })),
    })),
  };
}

export async function getGitHubMembers(organizationId: string) {
  const repository = new GitHubRepository(prisma);

  const members = await repository.findActiveUsers(organizationId);

  return members.map((member) => ({
    id: member.id,

    organizationId: member.organizationId,

    githubInstallationId: member.githubInstallationId,

    githubUserId: member.githubUserId.toString(),

    login: member.login,

    avatarUrl: member.avatarUrl,

    htmlUrl: member.htmlUrl,

    type: member.type,

    siteAdmin: member.siteAdmin,

    isActive: member.isActive,

    createdAt: member.createdAt,

    updatedAt: member.updatedAt,
  }));
}

export async function getGitHubTeams(organizationId: string) {
  const repository = new GitHubRepository(prisma);

  const teams = await repository.findActiveTeams(organizationId);

  return teams.map((team) => ({
    id: team.id,

    organizationId: team.organizationId,

    githubInstallationId: team.githubInstallationId,

    githubTeamId: team.githubTeamId.toString(),

    name: team.name,

    slug: team.slug,

    description: team.description,

    privacy: team.privacy,

    permission: team.permission,

    htmlUrl: team.htmlUrl,

    isActive: team.isActive,

    createdAt: team.createdAt,

    updatedAt: team.updatedAt,

    members: team.memberships.map((membership) => ({
      id: membership.githubUser.id,

      githubUserId: membership.githubUser.githubUserId.toString(),

      login: membership.githubUser.login,

      avatarUrl: membership.githubUser.avatarUrl,

      htmlUrl: membership.githubUser.htmlUrl,

      role: membership.role,

      isInherited: membership.isInherited,
    })),

    repositories: team.repositoryPermissions.map((permission) => ({
      id: permission.repository.id,

      githubRepositoryId: permission.repository.githubRepositoryId.toString(),

      name: permission.repository.name,

      fullName: permission.repository.fullName,

      private: permission.repository.private,

      defaultBranch: permission.repository.defaultBranch,

      htmlUrl: permission.repository.htmlUrl,

      permission: permission.permission,

      isActive: permission.isActive,
    })),
  }));
}
