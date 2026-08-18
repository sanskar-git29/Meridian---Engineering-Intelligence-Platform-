import jwt from "jsonwebtoken";

import { ApiError } from "../apiError.js";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../../controller/auth/auth.type.js";

import crypto from "node:crypto";
import {
  RefreshTokenSchema,
  AccessTokenSchema,
} from "../../controller/auth/auth.schema.js";
import { env } from "../../config/env.js";
import { StringValue} from "ms";

const ACCESS_SECRET = env.jwt.JWT_ACCESS_SECRET;
const REFRESH_SECRET = env.jwt.JWT_REFRESH_SECRET;
const ACCESS_EXP = (env.jwt.JWT_ACCESS_EXPIRATION) as StringValue;


const REFRESH_EXP = (env.jwt.JWT_REFRESH_EXPIRATION) as StringValue;


export function generateAccessToken(payload: AccessTokenPayload): string {

  return jwt.sign(payload, ACCESS_SECRET, { expiresIn:(ACCESS_EXP) });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload , REFRESH_SECRET, {
    expiresIn: (REFRESH_EXP),
  });
}
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = AccessTokenSchema.safeParse(
      jwt.verify(token, ACCESS_SECRET),
    );
    if (!decoded.success) {
      throw ApiError.unauthorized("Invalid or expired access token");
    }
    return decoded.data;
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = RefreshTokenSchema.safeParse(
      jwt.verify(token, REFRESH_SECRET),
    );
    if (!decoded.success) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }
    
    return decoded.data;
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
}


export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}