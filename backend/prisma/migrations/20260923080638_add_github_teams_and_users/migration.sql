-- CreateTable
CREATE TABLE "GitHubUser" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "githubInstallationId" TEXT NOT NULL,
    "githubUserId" BIGINT NOT NULL,
    "login" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "siteAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubTeam" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "githubInstallationId" TEXT NOT NULL,
    "githubTeamId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "privacy" TEXT,
    "permission" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubTeamMembership" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isInherited" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubTeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GitHubUser_organizationId_idx" ON "GitHubUser"("organizationId");

-- CreateIndex
CREATE INDEX "GitHubUser_githubInstallationId_idx" ON "GitHubUser"("githubInstallationId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubUser_githubInstallationId_githubUserId_key" ON "GitHubUser"("githubInstallationId", "githubUserId");

-- CreateIndex
CREATE INDEX "GitHubTeam_organizationId_idx" ON "GitHubTeam"("organizationId");

-- CreateIndex
CREATE INDEX "GitHubTeam_githubInstallationId_idx" ON "GitHubTeam"("githubInstallationId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubTeam_githubInstallationId_githubTeamId_key" ON "GitHubTeam"("githubInstallationId", "githubTeamId");

-- CreateIndex
CREATE INDEX "GitHubTeamMembership_teamId_idx" ON "GitHubTeamMembership"("teamId");

-- CreateIndex
CREATE INDEX "GitHubTeamMembership_githubUserId_idx" ON "GitHubTeamMembership"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubTeamMembership_teamId_githubUserId_key" ON "GitHubTeamMembership"("teamId", "githubUserId");

-- AddForeignKey
ALTER TABLE "GitHubUser" ADD CONSTRAINT "GitHubUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubUser" ADD CONSTRAINT "GitHubUser_githubInstallationId_fkey" FOREIGN KEY ("githubInstallationId") REFERENCES "GitHubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubTeam" ADD CONSTRAINT "GitHubTeam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubTeam" ADD CONSTRAINT "GitHubTeam_githubInstallationId_fkey" FOREIGN KEY ("githubInstallationId") REFERENCES "GitHubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubTeamMembership" ADD CONSTRAINT "GitHubTeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "GitHubTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubTeamMembership" ADD CONSTRAINT "GitHubTeamMembership_githubUserId_fkey" FOREIGN KEY ("githubUserId") REFERENCES "GitHubUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
