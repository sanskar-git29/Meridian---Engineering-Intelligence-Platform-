import { withTenant } from "../../lib/withTenant.js";
import { CostAnalyticsRepository } from "../../repositories/cost/cost-analytics.repository.js";

export interface CostAnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

export class CostAnalyticsService {
  async getSummary(
    organizationId: string,
    dateRange: CostAnalyticsDateRange
  ) {
    return withTenant(organizationId, async (tx) => {
      const repository =
        new CostAnalyticsRepository(tx);

      const [
        totalCost,
        serviceBreakdown,
      ] = await Promise.all([
        repository.getTotalCost(
          organizationId,
          dateRange.startDate,
          dateRange.endDate
        ),

        repository.getCostByService(
          organizationId,
          dateRange.startDate,
          dateRange.endDate
        ),
      ]);

      return {
        totalCost: Number(totalCost),
        currency:
          serviceBreakdown[0]?.currency ?? "USD",
        services: serviceBreakdown.map((item) => ({
          service: item.service,
          cost: Number(item._sum.amount ?? 0),
          currency: item.currency,
        })),
      };
    });
  }

  async getTrend(
    organizationId: string,
    dateRange: CostAnalyticsDateRange
  ) {
    return withTenant(organizationId, async (tx) => {
      const repository =
        new CostAnalyticsRepository(tx);

      const trend =
        await repository.getCostTrend(
          organizationId,
          dateRange.startDate,
          dateRange.endDate
        );

      return {
        currency: trend[0]?.currency ?? "USD",
        trend: trend.map((item) => ({
          date: item.date,
          cost: Number(item._sum.amount ?? 0),
          currency: item.currency,
        })),
      };
    });
  }
}