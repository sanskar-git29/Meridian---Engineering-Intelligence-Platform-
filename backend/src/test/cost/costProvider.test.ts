import assert from "node:assert/strict";

import { MockCostProvider } from "../../providers/cost/mock/mock-cost.provider.js";

async function testMockProvider() {
  console.log("\n🧪 Testing Cost Provider...\n");

  const provider = new MockCostProvider();

  const startDate = new Date("2026-01-01T00:00:00.000Z");
  const endDate = new Date("2026-01-04T00:00:00.000Z");

  const costs = await provider.getCosts({
    startDate,
    endDate,
  });

  console.log(`Generated records: ${costs.length}`);

  assert.equal(
    costs.length,
    12,
    "Expected 4 services × 3 days"
  );

  assert.ok(
    costs.every((cost) => cost.currency === "USD")
  );

  assert.ok(
    costs.every((cost) => cost.amount > 0)
  );

  assert.ok(
    costs.every((cost) => cost.externalId)
  );

  assert.ok(
    costs.every((cost) => cost.service)
  );

  console.log("✅ CostLineItem shape valid");
  console.log("✅ Deterministic record count valid");
  console.log("✅ Amounts valid");
  console.log("✅ External IDs present");

  console.log("\n🎉 COST PROVIDER TEST PASSED\n");
}

testMockProvider().catch((error) => {
  console.error("\n❌ COST PROVIDER TEST FAILED\n");
  console.error(error);
  process.exit(1);
});