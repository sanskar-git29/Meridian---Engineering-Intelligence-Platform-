-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('AWS');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "team" TEXT,
    "project" TEXT,
    "environment" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceUtilization" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "cpuUtilization" DECIMAL(65,30),
    "memoryUtilization" DECIMAL(65,30),
    "networkUtilization" DECIMAL(65,30),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceUtilization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Integration_organizationId_idx" ON "Integration"("organizationId");

-- CreateIndex
CREATE INDEX "Integration_organizationId_provider_idx" ON "Integration"("organizationId", "provider");

-- CreateIndex
CREATE INDEX "CostRecord_organizationId_date_idx" ON "CostRecord"("organizationId", "date");

-- CreateIndex
CREATE INDEX "CostRecord_organizationId_service_date_idx" ON "CostRecord"("organizationId", "service", "date");

-- CreateIndex
CREATE INDEX "CostRecord_organizationId_team_date_idx" ON "CostRecord"("organizationId", "team", "date");

-- CreateIndex
CREATE INDEX "CostRecord_organizationId_project_date_idx" ON "CostRecord"("organizationId", "project", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CostRecord_integrationId_externalId_key" ON "CostRecord"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "ResourceUtilization_organizationId_service_idx" ON "ResourceUtilization"("organizationId", "service");

-- CreateIndex
CREATE INDEX "ResourceUtilization_organizationId_resourceType_idx" ON "ResourceUtilization"("organizationId", "resourceType");

-- CreateIndex
CREATE INDEX "ResourceUtilization_organizationId_periodStart_idx" ON "ResourceUtilization"("organizationId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUtilization_integrationId_resourceId_periodStart_pe_key" ON "ResourceUtilization"("integrationId", "resourceId", "periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRecord" ADD CONSTRAINT "CostRecord_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUtilization" ADD CONSTRAINT "ResourceUtilization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUtilization" ADD CONSTRAINT "ResourceUtilization_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
