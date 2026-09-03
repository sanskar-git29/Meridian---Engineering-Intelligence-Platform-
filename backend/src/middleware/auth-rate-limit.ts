import { createRateLimitMiddleware } from "./rate-limit.js";

import {
  loginIpLimiter,
  loginEmailLimiter,
  registerIpLimiter,
} from "../lib/rate-limiter.js";

import { createEmailRateLimitKey } from "../utility/rateLimitKey.js";

export const loginIpRateLimit = createRateLimitMiddleware(
  loginIpLimiter,
  (req) => req.ip ?? "unknown",
);

export const loginEmailRateLimit = createRateLimitMiddleware(
  loginEmailLimiter,
  (req) => createEmailRateLimitKey(req.body.email),
);

export const registerIpRateLimit = createRateLimitMiddleware(
  registerIpLimiter,
  (req) => req.ip ?? "unknown",
);