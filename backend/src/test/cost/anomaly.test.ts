import { prisma } from "../../config/prisma.confi.js";
import { withTenant } from "../../lib/withTenant.js";

import {
  CostAnomalyService,
} from "../../services/cost/cost-anomaly.service.js";

const service =
  new CostAnomalyService();

const organizationId =
  crypto.randomUUID();

const integrationId =
  crypto.randomUUID();

async function testCostAnomaly() {
  console.log(
    "\n🚨 Starting Cost Anomaly test...\n"
  );

  try {
    // -----------------------------------------
    // Organization
    // -----------------------------------------

    await prisma.organization.create({
      data: {
        id: organizationId,
        name: "Anomaly Test Organization",
        slug: `anomaly-test-${Date.now()}`,
      },
    });

    console.log(
      "✅ Organization created"
    );

    // -----------------------------------------
    // AWS Integration
    // -----------------------------------------

    await withTenant(
      organizationId,
      async (tx) => {
        await tx.integration.create({
          data: {
            id: integrationId,
            organizationId,
            name: "AWS Anomaly Test",
            provider: "AWS",
            status: "ACTIVE",
          },
        });
      }
    );

    console.log(
      "✅ AWS integration created"
    );

    // -----------------------------------------
    // Cost data
    // -----------------------------------------

    const costs = [
      100,
      105,
      98,
      102,
      101,
      99,
      103,
      180,
      185,
    ];

    await withTenant(
      organizationId,
      async (tx) => {
        await tx.costRecord.createMany({
          data: costs.map(
            (amount, index) => ({
              organizationId,
              integrationId,

              externalId:
                `anomaly-test-${index}-${Date.now()}`,

              service: "EC2",

              amount,

              currency: "USD",

              date: new Date(
                Date.UTC(
                  2026,
                  0,
                  index + 1
                )
              ),
            })
          ),
        });
      }
    );

    console.log(
      "✅ Cost data created"
    );

    // -----------------------------------------
    // Detect anomalies
    // -----------------------------------------

    const anomalies =
      await service.detectAnomalies(
        organizationId,
        new Date("2026-01-01"),
        new Date("2026-01-10"),
        {
          windowSize: 7,
          thresholdPercent: 25,
        }
      );

    console.log(
      `Detected anomalies: ${anomalies.length}`
    );

    if (anomalies.length !== 2) {
      throw new Error(
        `Expected 2 anomalies, got ${anomalies.length}`
      );
    }

    // -----------------------------------------
    // First anomaly
    // -----------------------------------------

    const first =
      anomalies[0];

    console.log(
      "\n🔴 First anomaly:"
    );

    console.log({
      date: first.date,
      actualCost: first.actualCost,
      expectedCost: first.expectedCost,
      increasePercent:
        first.increasePercent,
      additionalCost:
        first.additionalCost,
      severity: first.severity,
    });

    if (first.actualCost !== 180) {
      throw new Error(
        `Expected actual cost 180, got ${first.actualCost}`
      );
    }

    if (first.expectedCost !== 101.14) {
      throw new Error(
        `Expected cost should be 101.14, got ${first.expectedCost}`
      );
    }

    if (first.severity !== "HIGH") {
      throw new Error(
        `Expected HIGH severity, got ${first.severity}`
      );
    }

    console.log(
      "✅ Rolling average detection passed"
    );

    console.log(
      "✅ Severity calculation passed"
    );

    console.log(
      "\n🎉 COST ANOMALY TEST PASSED\n"
    );
  } catch (error) {
    console.error(
      "\n❌ COST ANOMALY TEST FAILED\n"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    // -----------------------------------------
    // Cleanup
    // -----------------------------------------

    console.log(
      "🧹 Cleaning test data..."
    );

    try {
      await prisma.costRecord.deleteMany({
        where: {
          organizationId,
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

      console.log(
        "✅ Test data removed"
      );
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

testCostAnomaly();