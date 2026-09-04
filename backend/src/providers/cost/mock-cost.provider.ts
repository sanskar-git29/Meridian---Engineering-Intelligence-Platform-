import { CostLineItem, GetCostsInput } from "./cost.type.js";
import { CostProvider } from "./cost-provider.js";
import { costScenarios } from "./cost-scenarios.js";

import { regionWeights } from "./region-weights.js";

class MockCostProvider implements CostProvider {
  async getCosts(input: GetCostsInput): Promise<CostLineItem[]> {
    const costs: CostLineItem[] = [];

    const scenario = costScenarios[input.scenario];

    // console.log("Using scenario:", scenario.name);

    const currentDate = new Date(input.startDate);

    while (currentDate <= input.endDate) {
      const day = currentDate.getDate();

      for (const [serviceName, serviceConfig] of Object.entries(
        scenario.services,
      )) {
        const variationFactor = (((day * 17) % 21) - 10) / 100;

        const variation =
          serviceConfig.baseAmount *
          serviceConfig.variationPercent *
          variationFactor;

        let totalAmount = serviceConfig.baseAmount + variation;

        if (day === serviceConfig.spike.day) {
          totalAmount *= serviceConfig.spike.multiplier;
        }

        const weights = regionWeights[scenario.regions.length];

        if (!weights) {
          throw new Error(
            `No region weights configured for ${scenario.regions.length} regions`,
          );
        }

        scenario.regions.forEach((region, index) => {
          const weight = weights[index];

          const regionalAmount = totalAmount * weight;

          costs.push({
            externalId: `mock-${input.integrationId}-${currentDate.toISOString()}-${serviceName}-${region}`,
            date: new Date(currentDate),
            service: serviceName,
            amount: regionalAmount.toFixed(2),
            currency: "USD",
            region,
          });
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return costs;
  }
}

export { MockCostProvider };
