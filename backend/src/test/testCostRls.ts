import { prisma } from "../config/prisma.confi.js";
import { withTenant } from "../lib/withTenant.js";

async function testCostRls() {
  console.log("\n🔐 Starting Cost RLS test...\n");

  const orgAId = crypto.randomUUID();
  const orgBId = crypto.randomUUID();

  const integrationAId = crypto.randomUUID();
  const integrationBId = crypto.randomUUID();

  const costAId = crypto.randomUUID();
  const costBId = crypto.randomUUID();

  try {
    // --------------------------------------------------
    // Create Organizations
    // --------------------------------------------------

    await prisma.organization.create({
      data: {
        id: orgAId,
        name: "RLS Test Organization A",
        slug: `rls-test-a-${Date.now()}`,
      },
    });

    console.log("✅ Created Organization A");

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
    // Tenant context MUST be set
    // --------------------------------------------------

    await withTenant(orgAId, async (tx) => {
      await tx.integration.create({
        data: {
          id: integrationAId,
          organizationId: orgAId,
          name: "AWS Test A",
          provider: "AWS",
          status: "ACTIVE",
        },
      });
    });

    console.log("✅ Created Integration A");

    // --------------------------------------------------
    // Create Integration B
    // --------------------------------------------------

    await withTenant(orgBId, async (tx) => {
      await tx.integration.create({
        data: {
          id: integrationBId,
          organizationId: orgBId,
          name: "AWS Test B",
          provider: "AWS",
          status: "ACTIVE",
        },
      });
    });

    console.log("✅ Created Integration B");

    // --------------------------------------------------
    // Create Cost Record A
    // --------------------------------------------------

    await withTenant(orgAId, async (tx) => {
      await tx.costRecord.create({
        data: {
          id: costAId,
          organizationId: orgAId,
          integrationId: integrationAId,
          externalId: `rls-cost-a-${Date.now()}`,
          service: "EC2",
          team: "Backend",
          project: "Platform",
          environment: "production",
          amount: 100,
          currency: "USD",
          date: new Date(),
          region: "us-east-1",
        },
      });
    });

    console.log("✅ Created Cost A");

    // --------------------------------------------------
    // Create Cost Record B
    // --------------------------------------------------

    await withTenant(orgBId, async (tx) => {
      await tx.costRecord.create({
        data: {
          id: costBId,
          organizationId: orgBId,
          integrationId: integrationBId,
          externalId: `rls-cost-b-${Date.now()}`,
          service: "RDS",
          team: "Data",
          project: "Analytics",
          environment: "production",
          amount: 200,
          currency: "USD",
          date: new Date(),
          region: "us-west-2",
        },
      });
    });

    console.log("✅ Created Cost B");

    // ==================================================
    // ORGANIZATION A
    // ==================================================

    console.log("\n🔎 Testing Organization A...");

    await withTenant(orgAId, async (tx) => {
      const integrations = await tx.integration.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      const costs = await tx.costRecord.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      console.log(
        `Organization A integrations: ${integrations.length}`
      );

      console.log(
        `Organization A costs: ${costs.length}`
      );

      // Should only see Organization A
      if (integrations.length !== 1) {
        throw new Error(
          `Expected 1 integration for Organization A, got ${integrations.length}`
        );
      }

      if (integrations[0].organizationId !== orgAId) {
        throw new Error(
          "Organization A can see another organization's integration"
        );
      }

      if (costs.length !== 1) {
        throw new Error(
          `Expected 1 cost record for Organization A, got ${costs.length}`
        );
      }

      if (costs[0].organizationId !== orgAId) {
        throw new Error(
          "Organization A can see another organization's cost"
        );
      }

      console.log("✅ Organization A isolation passed");
    });

    // ==================================================
    // ORGANIZATION B
    // ==================================================

    console.log("\n🔎 Testing Organization B...");

    await withTenant(orgBId, async (tx) => {
      const integrations = await tx.integration.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      const costs = await tx.costRecord.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      console.log(
        `Organization B integrations: ${integrations.length}`
      );

      console.log(
        `Organization B costs: ${costs.length}`
      );

      // Should only see Organization B
      if (integrations.length !== 1) {
        throw new Error(
          `Expected 1 integration for Organization B, got ${integrations.length}`
        );
      }

      if (integrations[0].organizationId !== orgBId) {
        throw new Error(
          "Organization B can see another organization's integration"
        );
      }

      if (costs.length !== 1) {
        throw new Error(
          `Expected 1 cost record for Organization B, got ${costs.length}`
        );
      }

      if (costs[0].organizationId !== orgBId) {
        throw new Error(
          "Organization B can see another organization's cost"
        );
      }

      console.log("✅ Organization B isolation passed");
    });

    // ==================================================
    // CROSS-TENANT INSERT TEST
    // ==================================================

    console.log(
      "\n🔎 Testing cross-tenant INSERT protection..."
    );

    let crossTenantInsertBlocked = false;

    try {
      await withTenant(orgAId, async (tx) => {
        await tx.costRecord.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: orgBId,
            integrationId: integrationBId,
            externalId: `cross-tenant-${Date.now()}`,
            service: "S3",
            amount: 500,
            currency: "USD",
            date: new Date(),
            region: "us-east-1",
          },
        });
      });
    } catch {
      crossTenantInsertBlocked = true;
    }

    if (!crossTenantInsertBlocked) {
      throw new Error(
        "Cross-tenant INSERT was not blocked by RLS"
      );
    }

    console.log("✅ Cross-tenant INSERT blocked");

    // ==================================================
    // SUCCESS
    // ==================================================

    console.log("\n🎉 COST RLS TEST PASSED\n");
  } catch (error) {
    console.error("\n❌ COST RLS TEST FAILED\n");
    console.error(error);

    process.exitCode = 1;
  } finally {
    // ==================================================
    // CLEANUP
    // Only delete records created by this test
    // ==================================================

    console.log("🧹 Cleaning test data...");

    try {
      // Cost records first because they reference integrations
      await prisma.costRecord.deleteMany({
        where: {
          id: {
            in: [costAId, costBId],
          },
        },
      });

      // Integrations
      await prisma.integration.deleteMany({
        where: {
          id: {
            in: [integrationAId, integrationBId],
          },
        },
      });

      // Organizations
      await prisma.organization.deleteMany({
        where: {
          id: {
            in: [orgAId, orgBId],
          },
        },
      });

      console.log("✅ Test data removed");
    } catch (cleanupError) {
      console.error(
        "⚠️ Cleanup failed:",
        cleanupError
      );

      process.exitCode = 1;
    }

    await prisma.$disconnect();
  }
}

testCostRls();