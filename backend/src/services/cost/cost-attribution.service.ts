import { withTenant } from "../../lib/withTenant.js";

import {
  CostAttributionRepository,
  type AttributionCostRecord,
} from "../../repositories/cost/cost-attribution.repository.js";

export interface AttributionItem {
  name: string;
  actualCost: number;
  expectedCost: number;
  additionalCost: number;
  increasePercent: number;
}

export interface CostAttribution {
  date: Date;
  actualCost: number;
  expectedCost: number;
  additionalCost: number;
  currency: string;

  services: AttributionItem[];
  teams: AttributionItem[];
  projects: AttributionItem[];
  environments: AttributionItem[];
  regions: AttributionItem[];
}

export interface AttributionOptions {
  windowSize?: number;
}

const DEFAULT_WINDOW_SIZE = 7;

export class CostAttributionService {
  async getAttribution(
    organizationId: string,
    date: Date,
    options: AttributionOptions = {}
  ): Promise<CostAttribution> {
    const windowSize =
      options.windowSize ??
      DEFAULT_WINDOW_SIZE;

    if (windowSize < 1) {
      throw new Error(
        "windowSize must be greater than 0"
      );
    }

    const anomalyDate = new Date(date);

    anomalyDate.setUTCHours(
      0,
      0,
      0,
      0
    );

    const nextDate = new Date(
      anomalyDate
    );

    nextDate.setUTCDate(
      nextDate.getUTCDate() + 1
    );

    const baselineStart = new Date(
      anomalyDate
    );

    baselineStart.setUTCDate(
      baselineStart.getUTCDate() -
        windowSize
    );

    return withTenant(
      organizationId,
      async (tx) => {
        const repository =
          new CostAttributionRepository(tx);

        const [
          actualRecords,
          baselineRecords,
        ] = await Promise.all([
          repository.getCostsForDate(
            organizationId,
            anomalyDate,
            nextDate
          ),

          repository.getBaselineCosts(
            organizationId,
            baselineStart,
            anomalyDate
          ),
        ]);

        return this.calculateAttribution(
          anomalyDate,
          actualRecords,
          baselineRecords,
          windowSize
        );
      }
    );
  }

  private calculateAttribution(
    date: Date,
    actualRecords: AttributionCostRecord[],
    baselineRecords: AttributionCostRecord[],
    windowSize: number
  ): CostAttribution {
    const actualCost =
      this.sum(actualRecords);

    const baselineTotal =
      this.sum(baselineRecords);

    const expectedCost =
      baselineTotal / windowSize;

    const additionalCost =
      actualCost - expectedCost;

    const currency =
      actualRecords[0]?.currency ??
      baselineRecords[0]?.currency ??
      "USD";

    return {
      date,

      actualCost:
        this.round(actualCost),

      expectedCost:
        this.round(expectedCost),

      additionalCost:
        this.round(additionalCost),

      currency,

      services:
        this.calculateDimension(
          actualRecords,
          baselineRecords,
          "service",
          windowSize
        ),

      teams:
        this.calculateDimension(
          actualRecords,
          baselineRecords,
          "team",
          windowSize
        ),

      projects:
        this.calculateDimension(
          actualRecords,
          baselineRecords,
          "project",
          windowSize
        ),

      environments:
        this.calculateDimension(
          actualRecords,
          baselineRecords,
          "environment",
          windowSize
        ),

      regions:
        this.calculateDimension(
          actualRecords,
          baselineRecords,
          "region",
          windowSize
        ),
    };
  }

  private calculateDimension(
    actualRecords: AttributionCostRecord[],
    baselineRecords: AttributionCostRecord[],
    dimension:
      | "service"
      | "team"
      | "project"
      | "environment"
      | "region",
    windowSize: number
  ): AttributionItem[] {
    const actualMap =
      this.aggregateByDimension(
        actualRecords,
        dimension
      );

    const baselineMap =
      this.aggregateByDimension(
        baselineRecords,
        dimension
      );

    const names = new Set([
      ...actualMap.keys(),
      ...baselineMap.keys(),
    ]);

    const result: AttributionItem[] = [];

    for (const name of names) {
      const actual =
        actualMap.get(name) ?? 0;

      const baselineTotal =
        baselineMap.get(name) ?? 0;

      const expected =
        baselineTotal / windowSize;

      const additional =
        actual - expected;

      if (additional <= 0) {
        continue;
      }

      const increasePercent =
        expected > 0
          ? ((actual - expected) /
              expected) *
            100
          : 100;

      result.push({
        name,

        actualCost:
          this.round(actual),

        expectedCost:
          this.round(expected),

        additionalCost:
          this.round(additional),

        increasePercent:
          this.round(
            increasePercent
          ),
      });
    }

    return result.sort(
      (a, b) =>
        b.additionalCost -
        a.additionalCost
    );
  }

  private aggregateByDimension(
    records: AttributionCostRecord[],
    dimension:
      | "service"
      | "team"
      | "project"
      | "environment"
      | "region"
  ): Map<string, number> {
    const result =
      new Map<string, number>();

    for (const record of records) {
      const value =
        record[dimension] ??
        "Unknown";

      result.set(
        value,
        (result.get(value) ?? 0) +
          record.amount
      );
    }

    return result;
  }

  private sum(
    records: AttributionCostRecord[]
  ): number {
    return records.reduce(
      (total, record) =>
        total + record.amount,
      0
    );
  }

  private round(
    value: number
  ): number {
    return Number(
      value.toFixed(2)
    );
  }
}