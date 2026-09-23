import { prisma } from "../../config/prisma.confi.js";

import {
  consumeGitHubOAuthState,
  createGitHubOAuthState,
} from "../../lib/githubState.js";

import { GitHubProvider } from "../../providers/github/github.provider.js";
import { GitHubRepository } from "../../repositories/github/github.repository.js";

import { ApiError } from "../../utility/apiError.js";

const githubProvider = new GitHubProvider();

export async function connectGitHubService(
  organizationId: string,
  userId: string,
) {
  const existingInstallation =
    await prisma.gitHubInstallation.findUnique({
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

  const state = await createGitHubOAuthState(
    organizationId,
    userId,
  );

  const authorizationUrl =
    githubProvider.getAuthorizationUrl(state);

  return {
    authorizationUrl,
  };
}

export async function githubCallbackService(
  code: string,
  state: string,
  installationId: number,
) {
  /*
   * 1. Validate and consume OAuth state.
   */
  const oauthState = await consumeGitHubOAuthState(state);

  if (!oauthState) {
    throw ApiError.badRequest(
      "Invalid or expired GitHub authorization state",
      "GITHUB_INVALID_STATE",
    );
  }

  /*
   * 2. Exchange GitHub authorization code
   *    for a GitHub user token.
   */
  const userToken =
    await githubProvider.exchangeCodeForUserToken(code);

  /*
   * 3. Get installations accessible
   *    by the authenticated GitHub user.
   */
  const userInstallations =
    await githubProvider.getUserInstallations(userToken);

  const authorizedInstallation =
    userInstallations.installations.find(
      (installation) =>
        installation.id === installationId,
    );

  if (!authorizedInstallation) {
    throw ApiError.forbidden(
      "GitHub installation is not authorized for this user",
      "GITHUB_INSTALLATION_NOT_AUTHORIZED",
    );
  }

  /*
   * 4. Verify the installation using
   *    GitHub App authentication.
   */
  const installation =
    await githubProvider.getInstallation(installationId);

  if (installation.account.type !== "Organization") {
    throw ApiError.badRequest(
      "GitHub installation must belong to an organization",
      "GITHUB_INVALID_ACCOUNT",
    );
  }

  /*
   * 5. Check whether this GitHub installation
   *    is already connected.
   */
  const repository = new GitHubRepository(prisma);

  const existingGitHubInstallation =
    await repository.findByGitHubInstallationId(
      installationId,
    );

  if (existingGitHubInstallation) {
    throw ApiError.conflict(
      "This GitHub installation is already connected to another organization",
      "GITHUB_INSTALLATION_ALREADY_CONNECTED",
    );
  }

  /*
   * 6. Save the connection atomically.
   */
  return prisma.$transaction(async (tx) => {
    const transactionRepository =
      new GitHubRepository(tx);

    const integration =
      await transactionRepository.createIntegration(
        oauthState.organizationId,
      );

    const githubInstallation =
      await transactionRepository.createInstallation(
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

export async function syncGitHubRepositories(
  organizationId: string,
) {
  const repository = new GitHubRepository(prisma);

  const installation =
    await repository.findInstallation(organizationId);

  if (!installation) {
    throw ApiError.notFound(
      "GitHub is not connected",
      "GITHUB_NOT_CONNECTED",
    );
  }

  const installationToken =
    await githubProvider.createInstallationToken(
      installation.githubInstallationId,
    );

  const githubRepositories =
    await githubProvider.getInstallationRepositories(
      installationToken.token,
    );

  await prisma.$transaction(async (tx) => {
    const transactionRepository =
      new GitHubRepository(tx);

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
      githubRepositories.map(
        (githubRepository) => githubRepository.id,
      ),
    );
  });

  const repositories =
    await repository.findRepositories(organizationId);

  return repositories.map((repository) => ({
    ...repository,
    githubRepositoryId:
      repository.githubRepositoryId.toString(),
  }));
}