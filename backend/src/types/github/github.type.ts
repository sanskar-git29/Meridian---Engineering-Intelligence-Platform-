import { z } from "zod";

import {
  GitHubConnectResultSchema,
  GitHubCallbackSchema,
} from "./github.schema.js";

type GitHubConnectResult = z.infer<
  typeof GitHubConnectResultSchema
>;

type GitHubCallback = z.infer<
  typeof GitHubCallbackSchema
>;

export {
  GitHubConnectResult,
  GitHubCallback,
};