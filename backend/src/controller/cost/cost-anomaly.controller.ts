import type {
  Request,
  Response,
} from "express";

import { asyncHandler } from "../../utility/asycnHandler.js";
import { ApiError } from "../../utility/apiError.js";

import {
  CostAnomalyService,
} from "../../services/cost/cost-anomaly.service.js";

import { costDateRangeSchema } from "./cost.schema.js";

const costAnomalyService =
  new CostAnomalyService();

export const getCostAnomalies = asyncHandler(
  async (
    req: Request,
    res: Response
  ) => {
    const organizationId =
      req.user?.organizationId;

    if (!organizationId) {
      throw ApiError.unauthorized(
        "Organization context required"
      );
    }

    const parsed =
      costDateRangeSchema.safeParse(
        req.query
      );

    if (!parsed.success) {
      throw ApiError.badRequest(
        "Invalid date range",
        "INVALID_DATE_RANGE",
        parsed.error.flatten()
      );
    }

    const anomalies =
      await costAnomalyService.detectAnomalies(
        organizationId,
        parsed.data.startDate,
        parsed.data.endDate
      );

    return res.status(200).json({
      success: true,
      data: {
        anomalies,
      },
    });
  }
);