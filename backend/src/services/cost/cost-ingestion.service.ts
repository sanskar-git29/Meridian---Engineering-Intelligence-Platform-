import type { CostProvider } from "../../providers/cost/cost.provider.js";
import type { CostLineItem } from "../../providers/cost/cost.type.js";
import { CostRepository } from "../../repositories/cost/cost.repository.js";

export class CostIngestionService {
  constructor(
    private readonly provider: CostProvider
  ) {}

  async ingest(
    db: ConstructorParameters<typeof CostRepository>[0],
    organizationId: string,
    integrationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const repository = new CostRepository(db);

    const integration =
      await repository.findIntegration(
        organizationId,
        integrationId
      );

    if (!integration) {
      throw new Error(
        "Integration not found for organization"
      );
    }

    const costs = await this.provider.getCosts({
      startDate,
      endDate,
    });

    this.validateCosts(costs);

    for (const cost of costs) {
      await repository.upsertCost(
        organizationId,
        integrationId,
        cost
      );
    }

    return {
      processed: costs.length,
    };
  }

  private validateCosts(
    costs: CostLineItem[]
  ): void {
    for (const cost of costs) {
      if (!cost.externalId) {
        throw new Error(
          "Cost record requires externalId"
        );
      }

      if (!cost.service) {
        throw new Error(
          "Cost record requires service"
        );
      }

      if (!Number.isFinite(cost.amount)) {
        throw new Error(
          `Invalid cost amount: ${cost.externalId}`
        );
      }

      if (cost.amount < 0) {
        throw new Error(
          `Cost amount cannot be negative: ${cost.externalId}`
        );
      }

      if (!cost.currency) {
        throw new Error(
          `Cost record requires currency: ${cost.externalId}`
        );
      }

      if (Number.isNaN(cost.date.getTime())) {
        throw new Error(
          `Invalid cost date: ${cost.externalId}`
        );
      }
    }
  }
}