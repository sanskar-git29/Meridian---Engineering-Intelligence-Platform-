import crypto from "node:crypto";
import assert from "node:assert/strict";

import { prisma } from "../../config/prisma.confi.js";
import { withTenant } from "../../lib/withTenant.js";

import { MockCostProvider } from "../../providers/cost/mock/mock-cost.provider.js";
import { CostIngestionService } from "../../services/cost/cost-ingestion.service.js";

const organizationId = crypto.randomUUID();
const integrationId = crypto.randomUUID();

const slug = `cost-ingestion-test-${Date.now()}`;

async function cleanup() {
  console.log("\n🧹 Cleaning test data...");

  await prisma.costRecord.deleteMany({
    where: {
      integrationId,
    },
  });

  await prisma.integration.deleteMany({
    where: {
      id: integrationId,
    },
  });

  await prisma.organization.deleteMany({
    where: {
      id: organizationId,
    },
  });

  console.log("✅ Test data removed");
}

async function testCostIngestion() {
  console.log("\n🧪 Starting Cost Ingestion test...\n");

  try {
    // -----------------------------------------------
    // Organization creation
    // -----------------------------------------------

    await prisma.organization.create({
      data: {
        id: organizationId,
        name: "Cost Ingestion Test Organization",
        slug,
      },
    });

    console.log("✅ Organization created");

    // -----------------------------------------------
    // Integration creation WITH tenant context
    // -----------------------------------------------

    await withTenant(organizationId, async (tx) => {
      await tx.integration.create({
        data: {
          id: integrationId,
          organizationId,
          name: "Mock AWS Integration",
          provider: "AWS",
          status: "ACTIVE",
        },
      });
    });

    console.log("✅ Integration created");

    // -----------------------------------------------
    // Provider
    // -----------------------------------------------

    const provider = new MockCostProvider();

    const ingestionService =
      new CostIngestionService(provider);

    const startDate = new Date(
      "2026-01-01T00:00:00.000Z"
    );

    const endDate = new Date(
      "2026-01-04T00:00:00.000Z"
    );

    // -----------------------------------------------
    // First ingestion
    // -----------------------------------------------

    const firstResult = await withTenant(
      organizationId,
      async (tx) => {
        return ingestionService.ingest(
          tx,
          organizationId,
          integrationId,
          startDate,
          endDate
        );
      }
    );

    console.log(
      `✅ First ingestion: ${firstResult.processed} records`
    );

    // -----------------------------------------------
    // Verify database
    // -----------------------------------------------

    const firstCount = await withTenant(
      organizationId,
      async (tx) => {
        return tx.costRecord.count({
          where: {
            organizationId,
            integrationId,
          },
        });
      }
    );

    console.log(
      `Database records: ${firstCount}`
    );

    assert.equal(
      firstCount,
      12,
      "Expected 12 cost records"
    );

    console.log(
      "✅ Database contains expected records"
    );

    // -----------------------------------------------
    // Second ingestion
    // -----------------------------------------------

    const secondResult = await withTenant(
      organizationId,
      async (tx) => {
        return ingestionService.ingest(
          tx,
          organizationId,
          integrationId,
          startDate,
          endDate
        );
      }
    );

    console.log(
      `✅ Second ingestion: ${secondResult.processed} records`
    );

    // -----------------------------------------------
    // Idempotency
    // -----------------------------------------------

    const secondCount = await withTenant(
      organizationId,
      async (tx) => {
        return tx.costRecord.count({
          where: {
            organizationId,
            integrationId,
          },
        });
      }
    );

    console.log(
      `Database records after second ingestion: ${secondCount}`
    );

    assert.equal(
      secondCount,
      12,
      "Duplicate cost records were created"
    );

    console.log(
      "✅ Idempotency verified"
    );

    console.log(
      "\n🎉 COST INGESTION TEST PASSED\n"
    );
  } catch (error) {
    console.error(
      "\n❌ COST INGESTION TEST FAILED\n"
    );

    console.error(error);

    throw error;
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

testCostIngestion().catch(() => {
  process.exit(1);
});