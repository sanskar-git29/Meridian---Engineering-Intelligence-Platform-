-- CreateTable
CREATE TABLE "GitHubTeamRepository" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubTeamRepository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GitHubTeamRepository_teamId_idx" ON "GitHubTeamRepository"("teamId");

-- CreateIndex
CREATE INDEX "GitHubTeamRepository_repositoryId_idx" ON "GitHubTeamRepository"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubTeamRepository_teamId_repositoryId_key" ON "GitHubTeamRepository"("teamId", "repositoryId");

-- AddForeignKey
ALTER TABLE "GitHubTeamRepository" ADD CONSTRAINT "GitHubTeamRepository_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "GitHubTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubTeamRepository" ADD CONSTRAINT "GitHubTeamRepository_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitHubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
