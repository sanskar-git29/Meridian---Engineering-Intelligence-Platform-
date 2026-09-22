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

  REDIS_URL: requireEnv("REDIS_URL"),

 github: {
  GITHUB_APP_ID: requireEnv("GITHUB_APP_ID"),
  GITHUB_CLIENT_ID: requireEnv("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: requireEnv("GITHUB_CLIENT_SECRET"),
  GITHUB_PRIVATE_KEY_PATH: requireEnv("GITHUB_PRIVATE_KEY_PATH"),
  GITHUB_CALLBACK_URL: requireEnv("GITHUB_CALLBACK_URL"),
},
};


export { env };
