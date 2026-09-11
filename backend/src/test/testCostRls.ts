
import crypto from "node:crypto";
import { prisma } from "../config/prisma.confi.js";

const orgAId = crypto.randomUUID();
const orgBId = crypto.randomUUID();

const integrationAId = crypto.randomUUID();
const integrationBId = crypto.randomUUID();

async function cleanup() {
  console.log("\n🧹 Cleaning test data...");

  // CostRecord first because it depends on Integration
  await prisma.costRecord.deleteMany({
    where: {
      integrationId: {
        in: [integrationAId, integrationBId],
      },
    },
  });

  await prisma.integration.deleteMany({
    where: {
      id: {
        in: [integrationAId, integrationBId],
      },
    },
  });

  await prisma.organization.deleteMany({
    where: {
      id: {
        in: [orgAId, orgBId],
      },
    },
  });

  console.log("✅ Test data removed");
}

async function testCostRls() {
  console.log("\n🔐 Starting Cost RLS test...\n");

  try {
    // --------------------------------------------------
    // Create Organization A
    // --------------------------------------------------

    await prisma.organization.create({
      data: {
        id: orgAId,
        name: "RLS Test Organization A",
        slug: `rls-test-a-${Date.now()}`,
      },
    });

    console.log("✅ Created Organization A");

    // --------------------------------------------------
    // Create Organization B
    // --------------------------------------------------

    await prisma.organization.create({
      data: {
        id: orgBId,
        name: "RLS Test Organization B",
        slug: `rls-test-b-${Date.now()}`,
      },
    });

    console.log("✅ Created Organization B");

    // --------------------------------------------------
    // Create Integration A
    // --------------------------------------------------

    await prisma.integration.create({
      data: {
        id: integrationAId,
        organizationId: orgAId,
        name: "AWS Test A",
        provider: "AWS",
        status: "ACTIVE",
      },
    });

    console.log("✅ Created Integration A");

    // --------------------------------------------------
    // Create Integration B
    // --------------------------------------------------

    await prisma.integration.create({
      data: {
        id: integrationBId,
        organizationId: orgBId,
        name: "AWS Test B",
        provider: "AWS",
        status: "ACTIVE",
      },
    });

    console.log("✅ Created Integration B");

    // --------------------------------------------------
    // Create Cost A
    // --------------------------------------------------

    await prisma.costRecord.create({
      data: {
        organizationId: orgAId,
        integrationId: integrationAId,
        externalId: `test-cost-a-${Date.now()}`,
        service: "EC2",
        amount: 100,
        currency: "USD",
        date: new Date(),
      },
    });

    console.log("✅ Created Cost A");

    // --------------------------------------------------
    // Create Cost B
    // --------------------------------------------------

    await prisma.costRecord.create({
      data: {
        organizationId: orgBId,
        integrationId: integrationBId,
        externalId: `test-cost-b-${Date.now()}`,
        service: "RDS",
        amount: 200,
        currency: "USD",
        date: new Date(),
      },
    });

    console.log("✅ Created Cost B");

    // --------------------------------------------------
    // RLS TEST
    // --------------------------------------------------

    console.log("\n🔎 Testing Organization A...");

    const orgAResult = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SET LOCAL ROLE "meridian_app"
      `;

      await tx.$executeRaw`
        SELECT set_config(
          'app.current_org_id',
          ${orgAId},
          true
        )
      `;

      const integrations = await tx.integration.findMany();
      const costs = await tx.costRecord.findMany();

      return { integrations, costs };
    });

    console.log(
      `Organization A integrations: ${orgAResult.integrations.length}`
    );

    console.log(
      `Organization A costs: ${orgAResult.costs.length}`
    );

    if (
      orgAResult.integrations.length !== 1 ||
      orgAResult.integrations[0]?.organizationId !== orgAId
    ) {
      throw new Error("❌ Organization A RLS isolation failed");
    }

    if (
      orgAResult.costs.length !== 1 ||
      orgAResult.costs[0]?.organizationId !== orgAId
    ) {
      throw new Error("❌ Organization A cost isolation failed");
    }

    console.log("✅ Organization A isolation passed");

    // --------------------------------------------------
    // Organization B
    // --------------------------------------------------

    console.log("\n🔎 Testing Organization B...");

    const orgBResult = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SET LOCAL ROLE "meridian_app"
      `;

      await tx.$executeRaw`
        SELECT set_config(
          'app.current_org_id',
          ${orgBId},
          true
        )
      `;

      const integrations = await tx.integration.findMany();
      const costs = await tx.costRecord.findMany();

      return { integrations, costs };
    });

    console.log(
      `Organization B integrations: ${orgBResult.integrations.length}`
    );

    console.log(
      `Organization B costs: ${orgBResult.costs.length}`
    );

    if (
      orgBResult.integrations.length !== 1 ||
      orgBResult.integrations[0]?.organizationId !== orgBId
    ) {
      throw new Error("❌ Organization B RLS isolation failed");
    }

    if (
      orgBResult.costs.length !== 1 ||
      orgBResult.costs[0]?.organizationId !== orgBId
    ) {
      throw new Error("❌ Organization B cost isolation failed");
    }

    console.log("✅ Organization B isolation passed");

    console.log("\n🎉 COST RLS TEST PASSED\n");
  } catch (error) {
    console.error("\n❌ COST RLS TEST FAILED\n");
    console.error(error);
    throw error;
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

testCostRls().catch(() => {
  process.exit(1);
});

