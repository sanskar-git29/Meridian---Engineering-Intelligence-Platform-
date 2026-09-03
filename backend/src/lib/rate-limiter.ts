import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "./redis.js";
import { rateLimitConfig } from "../config/rate-limit.js";

export const loginIpLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login:ip",
  points: rateLimitConfig.login.ip.points,
  duration: rateLimitConfig.login.ip.duration,
});

export const loginEmailLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login:email",
  points: rateLimitConfig.login.email.points,
  duration: rateLimitConfig.login.email.duration,
});

export const registerIpLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "register:ip",
  points: rateLimitConfig.register.ip.points,
  duration: rateLimitConfig.register.ip.duration,
});