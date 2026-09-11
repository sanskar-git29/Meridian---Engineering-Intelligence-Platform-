import type { PrismaClient } from "../../generated/prisma/client.js";

type DbClient =
  | PrismaClient
  | Parameters<
      Parameters<PrismaClient["$transaction"]>[0]
    >[0];

export interface DailyCost {
  date: Date;
  amount: number;
  currency: string;
}

export class CostAnomalyRepository {
  constructor(private readonly db: DbClient) {}

  async getDailyCosts(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyCost[]> {
    const records = await this.db.costRecord.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        amount: true,
        currency: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const dailyCosts = new Map<
      string,
      DailyCost
    >();

    for (const record of records) {
      const date = record.date
        .toISOString()
        .slice(0, 10);

      const existing = dailyCosts.get(date);

      if (existing) {
        existing.amount += Number(record.amount);
      } else {
        dailyCosts.set(date, {
          date: new Date(`${date}T00:00:00.000Z`),
          amount: Number(record.amount),
          currency: record.currency,
        });
      }
    }

    return Array.from(dailyCosts.values());
  }
}