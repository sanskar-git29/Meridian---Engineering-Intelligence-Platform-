import { z } from "zod";

export const costDateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.startDate < data.endDate,
  {
    message: "startDate must be before endDate",
    path: ["startDate"],
  }
);

export type CostDateRangeQuery = z.infer<
  typeof costDateRangeSchema
>;