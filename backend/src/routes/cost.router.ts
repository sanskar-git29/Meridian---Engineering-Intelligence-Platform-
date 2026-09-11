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

const router = Router();

router.use(authMiddleware);

router.get(
  "/summary",
  getCostSummary
);

router.get(
  "/trend",
  getCostTrend
);

router.get(
  "/anomalies",
  getCostAnomalies
);

router.get(
  "/anomalies/:date/attribution",
  getCostAttribution
);
export default router;