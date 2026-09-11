import type {
  CostDateRange,
  CostLineItem,
} from "./cost.type.js";

export interface CostProvider {
  getCosts(
    dateRange: CostDateRange
  ): Promise<CostLineItem[]>;
}