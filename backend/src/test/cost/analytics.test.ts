import { prisma } from "../../config/prisma.confi.js";
import { withTenant } from "../../lib/withTenant.js";
import { CostAnalyticsService } from "../../services/cost/cost-analytics.service.js";

const service = new CostAnalyticsService();

const orgAId = crypto.randomUUID();
const orgBId = crypto.randomUUID();

const integrationAId = crypto.randomUUID();
const integrationBId = crypto.randomUUID();

async function testCostAnalytics() {
  console.log("\n📊 Starting Cost Analytics test...\n");

  try {
    // ---------------------------------------------
    // Organizations
    // ---------------------------------------------

    await prisma.organization.create({
      data: {
        id: orgAId,
        name: "Analytics Test A",
        slug: `analytics-test-a-${Date.now()}`,
      },
    });

    console.log("✅ Organization A created");

    await prisma.organization.create({
      data: {
        id: orgBId,
        name: "Analytics Test B",
        slug: `analytics-test-b-${Date.now()}`,
      },
    });

    console.log("✅ Organization B created");

    // ---------------------------------------------
    // Integration A
    // ---------------------------------------------

    await withTenant(orgAId, async (tx) => {
      await tx.integration.create({
        data: {
          id: integrationAId,
          organizationId: orgAId,
          name: "Analytics AWS A",
          provider: "AWS",
          status: "ACTIVE",
        },
      });
    });

    // ---------------------------------------------
    // Integration B
    // ---------------------------------------------

    await withTenant(orgBId, async (tx) => {
      await tx.integration.create({
        data: {
          id: integrationBId,
          organizationId: orgBId,
          name: "Analytics AWS B",
          provider: "AWS",
          status: "ACTIVE",
        },
      });
    });

    console.log("✅ Integrations created");

    // ---------------------------------------------
    // Cost data A
    // ---------------------------------------------

    await withTenant(orgAId, async (tx) => {
      await tx.costRecord.createMany({
        data: [
          {
            organizationId: orgAId,
            integrationId: integrationAId,
            externalId: `analytics-a-1-${Date.now()}`,
            service: "EC2",
            amount: 100,
            currency: "USD",
            date: new Date("2026-01-01"),
          },
          {
            organizationId: orgAId,
            integrationId: integrationAId,
            externalId: `analytics-a-2-${Date.now()}`,
            service: "EC2",
            amount: 150,
            currency: "USD",
            date: new Date("2026-01-02"),
          },
          {
            organizationId: orgAId,
            integrationId: integrationAId,
            externalId: `analytics-a-3-${Date.now()}`,
            service: "RDS",
            amount: 200,
            currency: "USD",
            date: new Date("2026-01-03"),
          },
        ],
      });
    });

    // ---------------------------------------------
    // Cost data B
    // ---------------------------------------------

    await withTenant(orgBId, async (tx) => {
      await tx.costRecord.createMany({
        data: [
          {
            organizationId: orgBId,
            integrationId: integrationBId,
            externalId: `analytics-b-1-${Date.now()}`,
            service: "EC2",
            amount: 9999,
            currency: "USD",
            date: new Date("2026-01-01"),
          },
        ],
      });
    });

    console.log("✅ Cost data created");

    // ---------------------------------------------
    // Summary A
    // ---------------------------------------------

    const summaryA =
      await service.getSummary(
        orgAId,
        {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-01-04"),
        }
      );

    console.log(
      "Organization A total:",
      summaryA.totalCost
    );

    if (summaryA.totalCost !== 450) {
      throw new Error(
        `Expected Organization A total to be 450, got ${summaryA.totalCost}`
      );
    }

    if (summaryA.services.length !== 2) {
      throw new Error(
        "Organization A service breakdown is incorrect"
      );
    }

    console.log(
      "✅ Organization A summary passed"
    );

    // ---------------------------------------------
    // Summary B
    // ---------------------------------------------

    const summaryB =
      await service.getSummary(
        orgBId,
        {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-01-04"),
        }
      );

    console.log(
      "Organization B total:",
      summaryB.totalCost
    );

    if (summaryB.totalCost !== 9999) {
      throw new Error(
        `Expected Organization B total to be 9999, got ${summaryB.totalCost}`
      );
    }

    console.log(
      "✅ Organization B summary passed"
    );

    // ---------------------------------------------
    // Trend A
    // ---------------------------------------------

    const trendA =
      await service.getTrend(
        orgAId,
        {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-01-04"),
        }
      );

    if (trendA.trend.length !== 3) {
      throw new Error(
        `Expected 3 trend points, got ${trendA.trend.length}`
      );
    }

    const trendTotal =
      trendA.trend.reduce(
        (total, item) => total + item.cost,
        0
      );

    if (trendTotal !== 450) {
      throw new Error(
        `Expected trend total to be 450, got ${trendTotal}`
      );
    }

    console.log(
      "✅ Organization A trend passed"
    );

    console.log(
      "\n🎉 COST ANALYTICS TEST PASSED\n"
    );
  } catch (error) {
    console.error(
      "\n❌ COST ANALYTICS TEST FAILED\n"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    // ---------------------------------------------
    // Cleanup
    // ---------------------------------------------

    console.log("🧹 Cleaning test data...");

    try {
      await prisma.costRecord.deleteMany({
        where: {
          organizationId: {
            in: [orgAId, orgBId],
          },
        },
      });

      await prisma.integration.deleteMany({
        where: {
          id: {
            in: [
              integrationAId,
              integrationBId,
            ],
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

testCostAnalytics();