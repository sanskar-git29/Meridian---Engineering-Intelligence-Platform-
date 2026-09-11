import { withTenant } from "../../lib/withTenant.js";

import {
  CostAnomalyRepository,
  type DailyCost,
} from "../../repositories/cost/cost-anomaly.repository.js";

export type AnomalySeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface CostAnomaly {
  date: Date;
  actualCost: number;
  expectedCost: number;
  increasePercent: number;
  additionalCost: number;
  severity: AnomalySeverity;
  currency: string;
}

export interface AnomalyOptions {
  windowSize?: number;
  thresholdPercent?: number;
}

export class CostAnomalyService {
  async detectAnomalies(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    options: AnomalyOptions = {}
  ): Promise<CostAnomaly[]> {
    const windowSize = options.windowSize ?? 7;

    const thresholdPercent =
      options.thresholdPercent ?? 25;

    if (windowSize < 1) {
      throw new Error(
        "windowSize must be greater than 0"
      );
    }

    if (thresholdPercent < 0) {
      throw new Error(
        "thresholdPercent cannot be negative"
      );
    }

    return withTenant(
      organizationId,
      async (tx) => {
        const repository =
          new CostAnomalyRepository(tx);

        const dailyCosts =
          await repository.getDailyCosts(
            organizationId,
            startDate,
            endDate
          );

        return this.calculateAnomalies(
          dailyCosts,
          windowSize,
          thresholdPercent
        );
      }
    );
  }

  private calculateAnomalies(
    dailyCosts: DailyCost[],
    windowSize: number,
    thresholdPercent: number
  ): CostAnomaly[] {
    const anomalies: CostAnomaly[] = [];

    if (dailyCosts.length <= windowSize) {
      return anomalies;
    }

    for (
      let index = windowSize;
      index < dailyCosts.length;
      index++
    ) {
      const current = dailyCosts[index];

      const previousCosts = dailyCosts.slice(
        index - windowSize,
        index
      );

      const expectedCost =
        previousCosts.reduce(
          (sum, item) => sum + item.amount,
          0
        ) / previousCosts.length;

      if (expectedCost <= 0) {
        continue;
      }

      const increasePercent =
        ((current.amount - expectedCost) /
          expectedCost) *
        100;

      if (
        increasePercent < thresholdPercent
      ) {
        continue;
      }

      const additionalCost =
        current.amount - expectedCost;

      anomalies.push({
        date: current.date,

        actualCost: Number(
          current.amount.toFixed(2)
        ),

        expectedCost: Number(
          expectedCost.toFixed(2)
        ),

        increasePercent: Number(
          increasePercent.toFixed(2)
        ),

        additionalCost: Number(
          additionalCost.toFixed(2)
        ),

        severity:
          this.getSeverity(increasePercent),

        currency: current.currency,
      });
    }

    return anomalies;
  }

  private getSeverity(
    increasePercent: number
  ): AnomalySeverity {
    if (increasePercent >= 50) {
      return "HIGH";
    }

    if (increasePercent >= 25) {
      return "MEDIUM";
    }

    return "LOW";
  }
}