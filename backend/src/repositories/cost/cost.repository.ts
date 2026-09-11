import type { PrismaClient } from "../../generated/prisma/client.js";
import type { CostLineItem } from "../../providers/cost/cost.type.js";

type DbClient = PrismaClient | Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export class CostRepository {
  constructor(private readonly db: DbClient) {}

  async findIntegration(
    organizationId: string,
    integrationId: string
  ) {
    return this.db.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
      },
    });
  }

  async upsertCost(
    organizationId: string,
    integrationId: string,
    cost: CostLineItem
  ) {
    return this.db.costRecord.upsert({
      where: {
        integrationId_externalId: {
          integrationId,
          externalId: cost.externalId,
        },
      },
      create: {
        organizationId,
        integrationId,
        externalId: cost.externalId,
        service: cost.service,
        team: cost.team,
        project: cost.project,
        environment: cost.environment,
        amount: cost.amount,
        currency: cost.currency,
        date: cost.date,
        region: cost.region,
      },
      update: {
        service: cost.service,
        team: cost.team,
        project: cost.project,
        environment: cost.environment,
        amount: cost.amount,
        currency: cost.currency,
        date: cost.date,
        region: cost.region,
      },
    });
  }
}