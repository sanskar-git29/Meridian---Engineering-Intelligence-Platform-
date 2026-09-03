import { createRateLimitMiddleware } from "./rate-limit.js";

import {
  loginIpLimiter,
  loginEmailLimiter,
  registerIpLimiter,
  refreshTokenLimiter,
} from "../lib/rate-limiter.js";

import {
  createEmailRateLimitKey,
  createRefreshTokenRateLimitKey,
} from "../utility/rateLimitKey.js";

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

export const refreshTokenRateLimit = createRateLimitMiddleware(
  refreshTokenLimiter,
  (req) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return `missing-refresh-token:${req.ip ?? "unknown"}`;
    }

    return createRefreshTokenRateLimitKey(refreshToken);
  },
);