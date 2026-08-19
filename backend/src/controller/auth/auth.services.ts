import type { Response } from "express";

import {
  generateAccessToken,
  generateCsrfToken,
  generateRefreshToken,
  verifyRefreshToken,
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


export async function refreshService(
  res: Response,
  refreshToken?: string,
  
) {
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token missing");
  }

  // 1. Verify the JWT
  const decoded = verifyRefreshToken(refreshToken);

  // 2. Hash the raw refresh token
  const tokenHash = hashToken(refreshToken);

  // 3. Find the refresh-token session in DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!storedToken) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  // 4. Check whether the token was revoked
  if (storedToken.revokedAt) {
    throw ApiError.unauthorized("Refresh token revoked");
  }

  // 5. Check database expiration
  if (storedToken.expiresAt <= new Date()) {
    throw ApiError.unauthorized("Refresh token expired");
  }

  // 6. Find the user
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.sub,
    },
  });

  if (!user) {
    throw ApiError.unauthorized("User not found");
  }

  // 7. Create NEW access token
  const accessPayload: AuthUser = {
    sub: user.id,
    email: user.email,
  };

  const newAccessToken = generateAccessToken(accessPayload);

  // 8. Create NEW refresh token
  const newRefreshToken = generateRefreshToken({
    sub: user.id,
  });

  // 9. Hash NEW refresh token
  const newTokenHash = hashToken(newRefreshToken);

  // 10. Calculate new expiration
  const newExpiresAt = new Date(
    Date.now() +
      parseExpirationToMs(env.jwt.JWT_REFRESH_EXPIRATION),
  );

  // 11. Revoke OLD refresh token
  await prisma.refreshToken.update({
    where: {
      id: storedToken.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  // 12. Store NEW refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    },
  });

  // 13. New CSRF token
  const csrfToken = generateCsrfToken();

  // 14. Replace cookies
  setAccessTokenCookie(res, newAccessToken);
  setRefreshTokenCookie(res, newRefreshToken);
  setCsrfCookie(res, csrfToken);

  // Do not return anything — tokens are set in cookies
}
 
export async function registerService(
  res: Response,
  email: string,
  password: string,
  organizationName?:string
) {
  if (!email || !password || !organizationName) {
    throw ApiError.badRequest(
      "Email, password and organization name required",
    );
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("Email already registered");

  const passwordHash = await hashPassword(password, 10);
  

 await prisma.$transaction(async (tx) => {
    // 1. Create the user
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // 2. Create the organization
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug: organizationName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-"),
      },
    });

    // 3. Create the membership
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });
  });

  const result = await loginService(res, email, password);

  return result;
}
