import * as z from "zod";

export const GitHubCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  installation_id: z.coerce.number().int().positive(),
});