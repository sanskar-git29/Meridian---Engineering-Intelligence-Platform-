import type { Request, Response } from "express";

import { asyncHandler } from "../../utility/asycnHandler.js";
import { ApiError } from "../../utility/apiError.js";
import { ApiResponse } from "../../utility/apiResponse.js";

import {githubService  } from "../../services/github/github.service.js";


export const connectGitHub = asyncHandler(
  async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiError.unauthorized(
        "Organization context required",
      );
    }

    const result =
      await githubService.connectGitHub(
        organizationId,
      );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "GitHub connection request received",
          result,
        ),
      );
  },
);

export const githubCallback = asyncHandler(
  async (
    req: Request,
    res: Response,
  ) => {
    const installationId =
      Number(req.query.installation_id);

    if (!installationId) {
      throw ApiError.badRequest(
        "GitHub installation ID is required",
      );
    }

    console.log(
      `GitHub installation received: ${installationId}`,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "GitHub installation received",
          {
            installationId,
          },
        ),
      );
  },
);