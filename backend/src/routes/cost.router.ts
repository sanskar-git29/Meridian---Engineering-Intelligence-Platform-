import { Router } from "express";

import {
  getCostSummary,
  getCostTrend,
} from "../controller/cost/cost.controller.js";

import {
  getCostAnomalies,
} from "../controller/cost/cost-anomaly.controller.js";

import {
  getCostAttribution,
} from "../controller/cost/cost-attribution.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const costRouter = Router();


costRouter.get(
  "/summary",
  authMiddleware,
  getCostSummary
);

costRouter.get(
  "/trend",
  authMiddleware,
  getCostTrend
);

costRouter.get(
  "/anomalies",
  authMiddleware,
  getCostAnomalies
);

costRouter.get(
  "/anomalies/:date/attribution",
  authMiddleware,
  getCostAttribution
);

export default costRouter;