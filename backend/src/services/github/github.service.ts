import { githubProvider, GitHubProvider } from "../../providers/github/github.provider.js";

export class GitHubService {
  constructor(
    private readonly githubProvider: GitHubProvider,
  ) {}

  async connectGitHub(
    organizationId: string,
  ) {
    return this.githubProvider.connectGitHub(
      organizationId,
    );
  }
}

export const githubService =
  new GitHubService(
    githubProvider,
  );