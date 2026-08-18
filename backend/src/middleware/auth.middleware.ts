import type { RequestHandler } from "express";

import { verifyAccessToken } from "../utility/jwt/jwt.js";
import { ApiError } from "../utility/apiError.js";

export const authMiddleware: RequestHandler = (
  req,
  _res,
  next,
) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw ApiError.unauthorized(
        "Access token missing",
      );
    }

    const payload = verifyAccessToken(token);

    req.user = payload;

     console.log()

     console.log(payload?.sub);
console.log(payload?.email);

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;