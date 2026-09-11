import crypto from "node:crypto";

import type { CostLineItem } from "../cost.type.js";
import type { MockCostScenario } from "./scenarios.js";

const SERVICES = [
  "EC2",
  "RDS",
  "S3",
  "Lambda",
];

const TEAMS = [
  "Backend",
  "Frontend",
  "Data",
];

const PROJECTS = [
  "Platform",
  "Analytics",
  "Dashboard",
];

const ENVIRONMENTS = [
  "production",
  "staging",
];

const REGIONS = [
  "us-east-1",
  "us-west-2",
];

function deterministicAmount(
  dayIndex: number,
  serviceIndex: number
): number {
  const base = [100, 60, 25, 15][serviceIndex];

  const trend = dayIndex * 2;

  return base + trend;
}

export function generateMockCosts(
  startDate: Date,
  endDate: Date,
  scenario: MockCostScenario
): CostLineItem[] {
  const records: CostLineItem[] = [];

  const current = new Date(startDate);
  let dayIndex = 0;

  while (current < endDate) {
    SERVICES.forEach((service, serviceIndex) => {
      const isSpike =
        scenario.spikeServices?.includes(service) ?? false;

      const multiplier = isSpike
        ? scenario.spikeMultiplier ?? 1
        : 1;

      const amount =
        deterministicAmount(dayIndex, serviceIndex) *
        multiplier;

      records.push({
        externalId: crypto
          .createHash("sha256")
          .update(
            `${current.toISOString()}-${service}`
          )
          .digest("hex"),

        service,

        team: TEAMS[serviceIndex % TEAMS.length],

        project:
          PROJECTS[serviceIndex % PROJECTS.length],

        environment:
          ENVIRONMENTS[dayIndex % ENVIRONMENTS.length],

        amount: Number(amount.toFixed(2)),

        currency: "USD",

        date: new Date(current),

        region:
          REGIONS[serviceIndex % REGIONS.length],
      });
    });

    current.setUTCDate(current.getUTCDate() + 1);
    dayIndex++;
  }

  return records;
}