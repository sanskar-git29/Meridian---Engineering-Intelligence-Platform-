import { z } from "zod";

export const CostLineItemSchema = z.object({
  externalId: z.string(),
  date: z.date(),
  service: z.string(),
  amount: z.string(),
  currency: z.string(),
  region: z.string().optional(),
});

export const GetCostsSchema = z.object({
  integrationId: z.string().uuid(),
  scenario: z.enum(["production", "development", "sandbox"]),
  startDate: z.date(),
  endDate: z.date(),
});