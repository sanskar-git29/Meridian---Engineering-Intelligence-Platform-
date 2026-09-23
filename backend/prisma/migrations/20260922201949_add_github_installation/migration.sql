-- AlterEnum
ALTER TYPE "IntegrationProvider" ADD VALUE 'GITHUB';

-- CreateTable
CREATE TABLE "GitHubInstallation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "githubInstallationId" INTEGER NOT NULL,
    "githubOrganizationId" INTEGER NOT NULL,
    "githubOrganizationLogin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubInstallation_organizationId_key" ON "GitHubInstallation"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubInstallation_integrationId_key" ON "GitHubInstallation"("integrationId");

-- CreateIndex
CREATE INDEX "GitHubInstallation_githubOrganizationId_idx" ON "GitHubInstallation"("githubOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubInstallation_organizationId_githubOrganizationId_key" ON "GitHubInstallation"("organizationId", "githubOrganizationId");

-- AddForeignKey
ALTER TABLE "GitHubInstallation" ADD CONSTRAINT "GitHubInstallation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubInstallation" ADD CONSTRAINT "GitHubInstallation_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
