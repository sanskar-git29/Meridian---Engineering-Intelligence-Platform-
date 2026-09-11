import type { CostProvider } from "../cost.provider.js";
import type {
  CostDateRange,
  CostLineItem,
} from "../cost.type.js";

import {
  generateMockCosts,
} from "./generator.js";

import {
  defaultMockScenario,
} from "./scenarios.js";

export class MockCostProvider implements CostProvider {
  async getCosts(
    dateRange: CostDateRange
  ): Promise<CostLineItem[]> {
    return generateMockCosts(
      dateRange.startDate,
      dateRange.endDate,
      defaultMockScenario
    );
  }
}