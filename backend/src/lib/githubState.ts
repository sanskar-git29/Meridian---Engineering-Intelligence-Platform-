import crypto from "node:crypto";

import { redisClient } from "./redis.js";

const STATE_TTL_SECONDS = 10 * 60;

interface GitHubOAuthState {
  organizationId: string;
  userId: string;
}

export async function createGitHubOAuthState(
  organizationId: string,
  userId: string,
): Promise<string> {
  const state = crypto.randomBytes(32).toString("hex");

  const data: GitHubOAuthState = {
    organizationId,
    userId,
  };

  await redisClient.set(
    `github:oauth:state:${state}`,
    JSON.stringify(data),
    "EX",
    STATE_TTL_SECONDS,
  );

  return state;
}

export async function consumeGitHubOAuthState(
  state: string,
): Promise<GitHubOAuthState | null> {
  const key = `github:oauth:state:${state}`;

  const data = await redisClient.getdel(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as GitHubOAuthState;
}