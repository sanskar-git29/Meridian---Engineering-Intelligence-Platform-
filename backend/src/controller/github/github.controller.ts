import type { RequestHandler } from "express";

import { asyncHandler } from "../../utility/asycnHandler.js";
import { ApiResponse } from "../../utility/apiResponse.js";
import { ApiError } from "../../utility/apiError.js";

import {
  connectGitHubService,
  githubCallbackService,
} from "./github.services.js";

import { GitHubCallbackSchema } from "./gtihub.schema.js";

export const connectGitHubController: RequestHandler =
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const result = await connectGitHubService(
      req.user.organizationId,
      req.user.sub,
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        "GitHub connection started",
        result,
      ),
    );
  });

export const githubCallbackController: RequestHandler =
  asyncHandler(async (req, res) => {
    const { code, state, installation_id } =
      GitHubCallbackSchema.parse(req.query);

    const result = await githubCallbackService(
      code,
      state,
      installation_id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        "GitHub connected successfully",
        result,
      ),
    );
  });