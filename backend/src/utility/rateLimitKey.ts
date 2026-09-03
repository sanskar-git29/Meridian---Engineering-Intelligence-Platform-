import crypto from "node:crypto";

export const createEmailRateLimitKey = (email: string): string => {
  const normalizedEmail = email.trim().toLowerCase();

  const hash = crypto
    .createHash("sha256")
    .update(normalizedEmail)
    .digest("hex");

  return `email:${hash}`;
};

export const createRefreshTokenRateLimitKey = (
  refreshToken: string,
): string => {
  const hash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  return `refresh-token:${hash}`;
};