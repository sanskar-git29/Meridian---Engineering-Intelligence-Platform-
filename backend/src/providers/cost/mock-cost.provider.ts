import {
  CostLineItem,
  GetCostsInput,
} from "./cost.type.js";
import { CostProvider } from "./cost-provider.js";
import { costScenarios } from "./cost-scenarios.js";

class MockCostProvider implements CostProvider {
  async getCosts(input: GetCostsInput): Promise<CostLineItem[]> {
    const costs: CostLineItem[] = [];

    const scenario = costScenarios[input.scenario];

    console.log("Using scenario:", scenario.name);

    const currentDate = new Date(input.startDate);

    while (currentDate <= input.endDate) {
      const day = currentDate.getDate();

      for (const [serviceName, baseAmount] of Object.entries(
        scenario.services,
      )) {
        const variation = (day % 5) - 2;
        const amount = Number(baseAmount) + variation;

        costs.push({
          externalId: `mock-${input.integrationId}-${currentDate.toISOString()}-${serviceName}`,
          date: new Date(currentDate),
          service: serviceName,
          amount: amount.toFixed(2),
          currency: "USD",
          region: "us-east-1",
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return costs;
  }
}

export {
  MockCostProvider,
};