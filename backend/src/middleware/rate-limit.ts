import type { NextFunction, Request, Response } from "express";
import type { RateLimiterRedis } from "rate-limiter-flexible";

export const createRateLimitMiddleware = (
  limiter: RateLimiterRedis,
  getKey: (req: Request) => string,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const key = getKey(req);

    try {
      await limiter.consume(key);

      next();
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "msBeforeNext" in error
      ) {
        const { msBeforeNext } = error as {
          msBeforeNext: number;
        };

        const retryAfter = Math.ceil(msBeforeNext / 1000);

        res.setHeader("Retry-After", retryAfter);

        res.status(429).json({
          success: false,
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        });

        return;
      }

      next(error);
    }
  };
};