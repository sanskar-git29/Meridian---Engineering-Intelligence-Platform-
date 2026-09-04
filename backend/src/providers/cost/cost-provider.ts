import {
  CostLineItem,
  GetCostsInput,
} from "./cost.type.js";


interface CostProvider {
  getCosts(input: GetCostsInput): Promise<CostLineItem[]>;
}

export {
  CostProvider,
};