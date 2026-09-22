import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import {
  connectGitHubController,
  githubCallbackController,
} from "../controller/github/github.controller.js";

const router = Router();

router.post(
  "/connect",
  authMiddleware,
  connectGitHubController,
);

router.get(
  "/callback",
  githubCallbackController,
);

export default router;