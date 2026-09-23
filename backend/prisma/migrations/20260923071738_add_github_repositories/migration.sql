-- CreateTable
CREATE TABLE "GitHubRepository" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "githubInstallationId" TEXT NOT NULL,
    "githubRepositoryId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL,
    "defaultBranch" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GitHubRepository_organizationId_idx" ON "GitHubRepository"("organizationId");

-- CreateIndex
CREATE INDEX "GitHubRepository_githubInstallationId_idx" ON "GitHubRepository"("githubInstallationId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepository_githubInstallationId_githubRepositoryId_key" ON "GitHubRepository"("githubInstallationId", "githubRepositoryId");

-- AddForeignKey
ALTER TABLE "GitHubRepository" ADD CONSTRAINT "GitHubRepository_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepository" ADD CONSTRAINT "GitHubRepository_githubInstallationId_fkey" FOREIGN KEY ("githubInstallationId") REFERENCES "GitHubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
