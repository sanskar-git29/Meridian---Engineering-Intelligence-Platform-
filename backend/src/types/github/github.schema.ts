import * as z from "zod";

export const GitHubConnectResultSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  installationUrl: z.string(),
});
export const GitHubCallbackSchema = z.object({
  installation_id: z.coerce.number(),
});