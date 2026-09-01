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

import { withTenant } from "../../lib/withTenant.js";
import { createAuditLog } from "../../lib/auditLog.js";

import { AuditAction } from "../../lib/auditActions.js";
import { AccessTokenPayload} from "./auth.type.js";

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
  organizationName: string,
  ipAddress?: string,
  userAgent?: string,
) {
  if (!email || !password || !organizationName) {
    throw ApiError.badRequest(
      "Email, password and organization name required",
    );
  }

  // 1. Find organization
  const slug = organizationName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  const organization = await prisma.organization.findUnique({
    where: {
      slug,
    },
  });

  if (!organization) {
    throw ApiError.unauthorized("Invalid organization");
  }

  // 2. Find user
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
  await withTenant(organization.id, async (tx) => {
    await createAuditLog(tx, {
      organizationId: organization.id,
      action: AuditAction.LOGIN_FAILED,
      resourceType: "User",
      metadata: {
        reason: "user_not_found",
      },
      ipAddress,
      userAgent,
    });
  });

  throw ApiError.unauthorized("Invalid email or password");
}

  // 3. Verify password
  const hashedPassword = user.passwordHash;

  if (isPasswordValid(password, hashedPassword) === false) {
  await withTenant(organization.id, async (tx) => {
    await createAuditLog(tx, {
      actorId: user.id,
      organizationId: organization.id,
      action: AuditAction.LOGIN_FAILED,
      resourceType: "User",
      resourceId: user.id,
      metadata: {
        reason: "invalid_password",
      },
      ipAddress,
      userAgent,
    });
  });

  throw ApiError.unauthorized("Invalid email or password");
}

  // 4. Find membership inside tenant context
  const membership = await withTenant(
    organization.id,
    async (tx) => {
      return tx.membership.findFirst({
        where: {
          userId: user.id,
          organizationId: organization.id,
        },
      });
    },
  );

  if (!membership) {
    throw ApiError.unauthorized(
      "User is not associated with an organization",
    );
  }

  // 5. Create access-token payload
  const accessPayload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  };

  // 6. Generate tokens
  const accessToken = generateAccessToken(accessPayload);

  const refreshToken = generateRefreshToken({
    sub: accessPayload.sub,
  });

  const csrfToken = generateCsrfToken();

  // 7. Hash refresh token
  const tokenHash = hashToken(refreshToken);

  // 8. Calculate expiration
  const expiresAt = new Date(
    Date.now() +
      parseExpirationToMs(env.jwt.JWT_REFRESH_EXPIRATION),
  );

  // 9. Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: accessPayload.sub,
      tokenHash,
      organizationId: organization.id,
      expiresAt,
    },
  });


  // 10. Create audit log
  await withTenant(organization.id, async (tx) => {
    await createAuditLog(tx, {
      actorId: user.id,
      organizationId: organization.id,
      action: AuditAction.LOGIN,
      resourceType: "User",
      resourceId: user.id,
      metadata: {
        method: "password",
      },
      ipAddress,
      userAgent,
    });
  });
 

  // 11. Set cookies
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  setCsrfCookie(res, csrfToken);

  return {
    csrfToken,
    user: accessPayload,
  };
}

export async function logoutService(
  res: Response,
  refreshToken: string,
  ipAddress?: string,
  userAgent?: string,
) {
  

  if (!refreshToken) {
    
    clearAuthCookies(res);
    return;
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });

  

  if (storedToken) {
   

    await withTenant(
      storedToken.organizationId,
      async (tx) => {
        await createAuditLog(tx, {
          actorId: storedToken.userId,
          organizationId: storedToken.organizationId,
          action: AuditAction.LOGOUT,
          resourceType: "User",
          resourceId: storedToken.userId,
          metadata: {
            method: "refresh_token",
          },
          ipAddress,
          userAgent,
        });
      },
    );

   

    await prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    

  clearAuthCookies(res);
}

export async function refreshService(res: Response, refreshToken?: string) {
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

  const membership = await withTenant(
  storedToken.organizationId,
  async (tx) => {
    return tx.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: storedToken.organizationId,
      },
    });
  },
);

if (!membership) {
  throw ApiError.unauthorized(
    "User is not associated with an organization",
  );
}

  // 7. Create NEW access token
 const accessPayload: AccessTokenPayload = {
  sub: user.id,
  email: user.email,
  organizationId: membership.organizationId,
  role: membership.role,
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
    Date.now() + parseExpirationToMs(env.jwt.JWT_REFRESH_EXPIRATION),
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
       organizationId: storedToken.organizationId,
     
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
  organizationName?: string,
) {
  if (!email || !password || !organizationName) {
    throw ApiError.badRequest(
      "Email, password and organization name required",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw ApiError.conflict("Email already registered");
  }

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

    // 3. Set tenant context
    await tx.$executeRaw`
      SELECT set_config(
        'app.current_org_id',
        ${organization.id},
        true
      )
    `;

    // 4. Create membership
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    // 5. Create registration audit log
    await createAuditLog(tx, {
      actorId: user.id,
      organizationId: organization.id,
      action: AuditAction.REGISTER,
      resourceType: "User",
      resourceId: user.id,
      metadata: {
        method: "password",
      },
    });
  });

  // 6. Automatically login after registration
  const result = await loginService(
    res,
    email,
    password,
    organizationName,
  );

  return result;
}