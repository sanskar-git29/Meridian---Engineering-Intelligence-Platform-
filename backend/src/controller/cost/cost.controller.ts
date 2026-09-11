import type { Request, Response } from "express";

import { CostAnalyticsService } from "../../services/cost/cost-analytics.service.js";
import { costDateRangeSchema } from "./cost.schema.js";

const costAnalyticsService =
  new CostAnalyticsService();

export async function getCostSummary(
  req: Request,
  res: Response
) {
  const organizationId =
    req.user?.organizationId;

  if (!organizationId) {
    return res.status(401).json({
      success: false,
      message: "Organization context required",
    });
  }

  const parsed =
    costDateRangeSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid date range",
      errors: parsed.error.flatten(),
    });
  }

  const result =
    await costAnalyticsService.getSummary(
      organizationId,
      parsed.data
    );

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getCostTrend(
  req: Request,
  res: Response
) {
  const organizationId =
    req.user?.organizationId;

  if (!organizationId) {
    return res.status(401).json({
      success: false,
      message: "Organization context required",
    });
  }

  const parsed =
    costDateRangeSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid date range",
      errors: parsed.error.flatten(),
    });
  }

  const result =
    await costAnalyticsService.getTrend(
      organizationId,
      parsed.data
    );

  return res.status(200).json({
    success: true,
    data: result,
  });
}