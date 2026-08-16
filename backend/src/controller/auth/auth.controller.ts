import { RequestHandler } from "express";
import { asyncHandler } from "../../utility/asycnHandler.js";
import { ApiResponse } from "../../utility/apiResponse.js";
import { loginService, refreshService, logoutService } from "./auth.services.js";
import { AccessTokenSchema } from "./auth.schema.js";
import { ApiError } from "../../utility/apiError.js";

export const loginController: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = AccessTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid request payload");
  }
  const { csrfToken } = await loginService(res, parsed.data);
  res.status(200).json(new ApiResponse(200, "Logged in", { csrfToken }));
});

export const refreshController: RequestHandler = asyncHandler(async (req, res) => {
  const refreshToken = (req.cookies as any)?.refreshToken || req.body?.refreshToken;
  const { csrfToken } = await refreshService(res, refreshToken);
  res.status(200).json(new ApiResponse(200, "Tokens refreshed", { csrfToken }));
});

export const logoutController: RequestHandler = asyncHandler(async (req, res) => {
    
  logoutService(res);
  res.status(200).json(new ApiResponse(200, "Logged out", {}));
});
