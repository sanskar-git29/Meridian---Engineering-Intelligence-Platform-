import type { RequestHandler } from "express";

import { asyncHandler } from "../../utility/asycnHandler.js";
import { ApiResponse } from "../../utility/apiResponse.js";
import { ApiError } from "../../utility/apiError.js";

import {
  connectGitHubService,
  getGitHubMembers,
  getGitHubTeams,
  githubCallbackService,
  syncGitHubRepositories,
  syncGitHubTeamsAndUsers,
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
    const {
      code,
      state,
      installation_id,
    } = GitHubCallbackSchema.parse(req.query);

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

export const getGitHubRepositoriesController: RequestHandler =
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const repositories =
      await syncGitHubRepositories(
        req.user.organizationId,
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        "GitHub repositories synchronized successfully",
        repositories,
      ),
    );
  });

export const syncGitHubTeamsController: RequestHandler =
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const data =
      await syncGitHubTeamsAndUsers(
        req.user.organizationId,
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        "GitHub teams and users synchronized successfully",
        data,
      ),
    );
  });

export const getGitHubMembersController: RequestHandler =
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const members =
      await getGitHubMembers(
        req.user.organizationId,
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        "GitHub members retrieved successfully",
        members,
      ),
    );
  });

export const getGitHubTeamsController: RequestHandler =
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const teams =
      await getGitHubTeams(
        req.user.organizationId,
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        "GitHub teams retrieved successfully",
        teams,
      ),
    );
  });