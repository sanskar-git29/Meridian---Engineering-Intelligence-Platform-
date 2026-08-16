import dotenv from "dotenv";
import { requireEnv } from "./envRequireCheck.js";
import type { Env } from "./env.types.js";
dotenv.config();

const env: Env = {
  nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
  port: process.env.PORT ? Number(process.env.PORT) : undefined,
  DATABASE_URL: process.env.DATABASE_URL!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  
  jwt: {
    JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION ?? "15m",
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION ?? "7d",
  },
};

export default env;
export { env };
