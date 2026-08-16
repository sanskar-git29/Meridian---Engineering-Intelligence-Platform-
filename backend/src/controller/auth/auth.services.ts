import type { Response } from "express";

import {
  generateAccessToken,
  generateCsrfToken,
  generateRefreshToken,
} from "../../utility/jwt/jwt.js";

import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setCsrfCookie,
  clearAuthCookies,
} from "../../utility/cookies/cookie.services.js";

import { AuthUser } from "./auth.type.js";
import { ApiError } from "../../utility/apiError.js";

import { prisma } from "../../config/prisma.confi.js";
import {
  hashPassword,
  hashToken,
  isPasswordValid,
} from "../../utility/jwt/token_hash.js";
import { env } from "../../config/env.js";
import { parseExpirationToMs } from "../../utility/parseExpiration.js";

export async function loginService(
  res: Response,
  email: string,
  password: string,
) {
  if (!email || !password) {
    throw ApiError.badRequest("Email and password required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const hashedPassword = user?.passwordHash as string;

  if (isPasswordValid(password, hashedPassword) === false) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const userPayload: AuthUser = {
    sub: user?.id as string,
    email: user?.email as string,
  };

  const accessToken: string = generateAccessToken(userPayload);
  const refreshToken: string = generateRefreshToken({
    sub: userPayload.sub,
  });
  const csrfToken = generateCsrfToken();

  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(
    Date.now() + parseExpirationToMs(env.jwt.JWT_REFRESH_EXPIRATION),
  );

  await prisma.refreshToken.create({
    data: {
      userId: userPayload.sub,
      tokenHash,
      expiresAt,
    },
  });

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  setCsrfCookie(res, csrfToken);

  return { csrfToken, user: userPayload };
}

export async function logoutService(res: Response, refreshToken: string) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  clearAuthCookies(res);
}

export async function registerService(
  res: Response,
  email: string,
  password: string,
) {
  if (!email || !password)
    throw ApiError.badRequest("Email and password required");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("Email already registered");

  const passwordHash = await hashPassword(password, 10);

  const user = await prisma.user.create({ data: { email, passwordHash } });

  const result = await loginService(res, user.email, password);

  return result;
}
