import crypto from "crypto";
import type { Response } from "express";

import {
	generateAccessToken,
	generateRefreshToken,
	verifyRefreshToken,
} from "../../utility/jwt/jwt.js";

import {
	setAccessTokenCookie,
	setRefreshTokenCookie,
	setCsrfCookie,
	clearAuthCookies,
} from "../../utility/cookies/cookie.services.js";


import { AccessTokenPayload, RefreshTokenPayload } from "./auth.type.js";
import { ApiError } from "../../utility/apiError.js";
import bcrypt from "bcrypt";
import {prisma} from "../../config/prisma.confi.js";
import { env } from "../../config/env.js";
import { StringValue } from "ms";


export async function loginService(res: Response, payload: AccessTokenPayload) {
	if (!payload || !payload.sub) throw ApiError.badRequest("Invalid payload for login");

	const accessToken = generateAccessToken(payload);
	const refreshToken = generateRefreshToken({ sub: payload.sub } as RefreshTokenPayload);

	setAccessTokenCookie(res, accessToken);
	setRefreshTokenCookie(res, refreshToken);

	const csrfToken = crypto.randomBytes(16).toString("hex");
	setCsrfCookie(res, csrfToken);
	return { csrfToken };
}

export async function refreshService(res: Response, refreshToken?: string) {
	if (!refreshToken) throw ApiError.unauthorized("Refresh token missing");

	const decoded = verifyRefreshToken(refreshToken) as RefreshTokenPayload & Partial<AccessTokenPayload>;

	// If you need additional user data (email, roles), fetch user by `decoded.sub` here.
	const accessPayload = { sub: decoded.sub } as AccessTokenPayload;

	const accessToken = generateAccessToken(accessPayload);
	const newRefreshToken = generateRefreshToken({ sub: decoded.sub } as RefreshTokenPayload);

	setAccessTokenCookie(res, accessToken);
	setRefreshTokenCookie(res, newRefreshToken);

	const csrfToken = crypto.randomBytes(16).toString("hex");
	setCsrfCookie(res, csrfToken);

	return { csrfToken };
}

export function logoutService(res: Response) {
	clearAuthCookies(res);
}

export async function registerService(res: Response, email: string, password: string) {
	if (!email || !password) throw ApiError.badRequest("Email and password required");

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) throw ApiError.conflict("Email already registered");

	const passwordHash = await bcrypt.hash(password, 10);

	const user = await prisma.user.create({ data: { email, passwordHash } });

	const accessPayload: AccessTokenPayload = { sub: user.id, email: user.email } as AccessTokenPayload;
	const accessToken = generateAccessToken(accessPayload);
	const refreshToken = generateRefreshToken({ sub: user.id } as RefreshTokenPayload);

	// set cookies
	setAccessTokenCookie(res, accessToken);
	setRefreshTokenCookie(res, refreshToken);

	// store hashed refresh token in DB
	const tokenHash = await bcrypt.hash(refreshToken, 10);
	const expiresMs = (env.jwt.JWT_REFRESH_EXPIRATION)as StringValue;
	const expiresAt = new Date(Date.now() + expiresMs);

	await prisma.refreshToken.create({
		data: {
			userId: user.id,
			tokenHash,
			expiresAt,
		},
	});

	const csrfToken = crypto.randomBytes(16).toString("hex");
	setCsrfCookie(res, csrfToken);

	return { csrfToken, user };
}

