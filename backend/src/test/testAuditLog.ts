import { prisma } from "../config/prisma.confi.js";
import { withTenant } from "../lib/withTenant.js";
import { createAuditLog } from "../lib/auditLog.js";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";

async function main() {
  console.log("Starting AuditLog integration test...");

  // --------------------------------------------------
  // Test 1: Org A can create its own audit log
  // --------------------------------------------------

  await withTenant(ORG_A, async (tx) => {
    await createAuditLog(tx, {
      organizationId: ORG_A,
      action: "test.audit_created",
      resourceType: "Test",
      resourceId: "test-resource-a",
      metadata: {
        test: true,
        organization: "A",
      },
    });
  });

  console.log("✓ Org A can create its own audit log");

  // --------------------------------------------------
  // Test 2: Org A cannot create an Org B audit log
  // --------------------------------------------------

  try {
    await withTenant(ORG_A, async (tx) => {
      await createAuditLog(tx, {
        organizationId: ORG_B,
        action: "test.cross_tenant_write",
        resourceType: "Test",
        resourceId: "test-resource-b",
        metadata: {
          test: true,
          attack: true,
        },
      });
    });

    throw new Error(
      "❌ Security failure: Org A was able to create an Org B audit log",
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Security failure")
    ) {
      throw error;
    }

    console.log("✓ Org A cannot create an Org B audit log");
  }

  // --------------------------------------------------
  // Test 3: Org B can create its own audit log
  // --------------------------------------------------

  await withTenant(ORG_B, async (tx) => {
    await createAuditLog(tx, {
      organizationId: ORG_B,
      action: "test.audit_created",
      resourceType: "Test",
      resourceId: "test-resource-b",
      metadata: {
        test: true,
        organization: "B",
      },
    });
  });

  console.log("✓ Org B can create its own audit log");

  // --------------------------------------------------
  // Test 4: Org A can see its own logs
  //        but cannot see Org B's logs
  // --------------------------------------------------

  const orgAOwnLogs = await withTenant(ORG_A, async (tx) => {
    return tx.auditLog.findMany({
      where: {
        resourceId: "test-resource-a",
      },
    });
  });

  if (orgAOwnLogs.length === 0) {
    throw new Error(
      "❌ Security failure: Org A cannot see its own audit log",
    );
  }

  console.log("✓ Org A can see its own audit log");

  const orgACrossTenantLogs = await withTenant(ORG_A, async (tx) => {
    return tx.auditLog.findMany({
      where: {
        resourceId: "test-resource-b",
      },
    });
  });

  if (orgACrossTenantLogs.length !== 0) {
    throw new Error(
      "❌ Security failure: Org A can see Org B's audit log",
    );
  }

  console.log("✓ Org A cannot see Org B's audit log");

  // --------------------------------------------------
  // Test 5: Org B can see its own logs
  //        but cannot see Org A's logs
  // --------------------------------------------------

  const orgBOwnLogs = await withTenant(ORG_B, async (tx) => {
    return tx.auditLog.findMany({
      where: {
        resourceId: "test-resource-b",
      },
    });
  });

  if (orgBOwnLogs.length === 0) {
    throw new Error(
      "❌ Security failure: Org B cannot see its own audit log",
    );
  }

  console.log("✓ Org B can see its own audit log");

  const orgBCrossTenantLogs = await withTenant(ORG_B, async (tx) => {
    return tx.auditLog.findMany({
      where: {
        resourceId: "test-resource-a",
      },
    });
  });

  if (orgBCrossTenantLogs.length !== 0) {
    throw new Error(
      "❌ Security failure: Org B can see Org A's audit log",
    );
  }

  console.log("✓ Org B cannot see Org A's audit log");

  // --------------------------------------------------
  // All tests passed
  // --------------------------------------------------

  console.log("");
  console.log("🎉 AuditLog integration test PASSED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });