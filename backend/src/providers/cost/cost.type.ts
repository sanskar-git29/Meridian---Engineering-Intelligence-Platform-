import { z } from "zod";
import {
  CostLineItemSchema,
  GetCostsSchema,
} from "./cost.schema.js";

type CostLineItem = z.infer<typeof CostLineItemSchema>;
type GetCostsInput = z.infer<typeof GetCostsSchema>;

export {
  CostLineItem,
  GetCostsInput,
};