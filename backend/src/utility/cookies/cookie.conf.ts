import type { CookieOptions } from "express";

import { env } from "../../config/env.js";

const isProduction = env.nodeEnv === "production";

export const accessTokenCookieConfig: CookieOptions = {
   httpOnly: true,
   secure: isProduction,
   sameSite: "lax",
   maxAge: 15 * 60 * 1000,  //15 minutes
   path: "/",
};

export const refreshTokenCookieConfig: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    path: "/api/auth/refresh",
};

export const csrfCookieConfig: CookieOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,  // 15 minutes
    path: "/",
};