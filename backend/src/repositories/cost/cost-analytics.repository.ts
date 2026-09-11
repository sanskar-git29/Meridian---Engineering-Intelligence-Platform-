import type { PrismaClient } from "../../generated/prisma/client.js";

type DbClient =
  | PrismaClient
  | Parameters<
      Parameters<PrismaClient["$transaction"]>[0]
    >[0];

export class CostAnalyticsRepository {
  constructor(private readonly db: DbClient) {}

  async getTotalCost(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await this.db.costRecord.aggregate({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? 0;
  }

  async getCostByService(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.db.costRecord.groupBy({
      by: ["service", "currency"],
      where: {
        organizationId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        service: "asc",
      },
    });
  }

  async getCostTrend(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.db.costRecord.groupBy({
      by: ["date", "currency"],
      where: {
        organizationId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        date: "asc",
      },
    });
  }
}