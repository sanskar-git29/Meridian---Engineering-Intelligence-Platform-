import type {
  Request,
  Response,
} from "express";

import {
  CostAttributionService,
} from "../../services/cost/cost-attribution.service.js";

import {
  ApiResponse,
} from "../../utility/apiResponse.js";

import {
  ApiError,
} from "../../utility/apiError.js";

const costAttributionService =
  new CostAttributionService();

export async function getCostAttribution(
  req: Request,
  res: Response
) {
  const organizationId =
    req.user?.organizationId;

  if (!organizationId) {
    throw ApiError.unauthorized(
      "Organization context required"
    );
  }

  const { date } = req.params;

  const anomalyDate =
    new Date(
      `${date}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      anomalyDate.getTime()
    )
  ) {
    throw ApiError.badRequest(
      "Invalid date. Expected YYYY-MM-DD",
      "INVALID_DATE"
    );
  }

  const attribution =
    await costAttributionService.getAttribution(
      organizationId,
      anomalyDate
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Cost attribution fetched successfully",
      attribution
    )
  );
}