import { MockCostProvider } from "../providers/cost/mock-cost.provider.js";

const provider = new MockCostProvider();

const startDate = new Date("2026-09-01");
const endDate = new Date("2026-12-01");

const costs = await provider.getCosts({
  integrationId: "test-production",
  scenario: "production",
  startDate,
  endDate,
});

console.log("Total records:", costs.length);

console.log(
  costs.filter(
    (cost) =>
      cost.service === "EC2" &&
      ["2026-09-05", "2026-09-06", "2026-09-07"].includes(
        cost.date.toISOString().slice(0, 10),
      ),
  ),
);
