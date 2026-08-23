import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utility/apiError.js";
import type { Role } from "../controller/auth/auth.type.js";

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }

    next();
  };
}