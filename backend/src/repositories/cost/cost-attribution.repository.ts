import type { PrismaClient } from "../../generated/prisma/client.js";

type DbClient =
  | PrismaClient
  | Parameters<
      Parameters<PrismaClient["$transaction"]>[0]
    >[0];

export interface AttributionCostRecord {
  service: string;
  team: string | null;
  project: string | null;
  environment: string | null;
  region: string | null;
  amount: number;
  currency: string;
}

export class CostAttributionRepository {
  constructor(private readonly db: DbClient) {}

  async getCostsForDate(
    organizationId: string,
    date: Date,
    nextDate: Date
  ): Promise<AttributionCostRecord[]> {
    const records =
      await this.db.costRecord.findMany({
        where: {
          organizationId,
          date: {
            gte: date,
            lt: nextDate,
          },
        },
        select: {
          service: true,
          team: true,
          project: true,
          environment: true,
          region: true,
          amount: true,
          currency: true,
        },
      });

    return records.map((record) => ({
      service: record.service,
      team: record.team,
      project: record.project,
      environment: record.environment,
      region: record.region,
      amount: Number(record.amount),
      currency: record.currency,
    }));
  }

  async getBaselineCosts(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttributionCostRecord[]> {
    const records =
      await this.db.costRecord.findMany({
        where: {
          organizationId,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        select: {
          service: true,
          team: true,
          project: true,
          environment: true,
          region: true,
          amount: true,
          currency: true,
        },
      });

    return records.map((record) => ({
      service: record.service,
      team: record.team,
      project: record.project,
      environment: record.environment,
      region: record.region,
      amount: Number(record.amount),
      currency: record.currency,
    }));
  }
}