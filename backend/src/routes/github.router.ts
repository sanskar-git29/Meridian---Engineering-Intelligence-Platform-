import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import {requireRole} from "../middleware/authorization.middleware.js";

import {
  connectGitHubController,
  githubCallbackController,
  getGitHubRepositoriesController,
} from "../controller/github/github.controller.js";

const router = Router();

router.post(
  "/connect",
  authMiddleware,
  requireRole("OWNER", "ADMIN"),
  connectGitHubController,
);

router.get(
  "/callback",
  githubCallbackController,
);

router.get(
  "/repositories",
  authMiddleware,
  requireRole("OWNER", "ADMIN"),
  getGitHubRepositoriesController,
);

export default router;