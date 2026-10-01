import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  connectGitHub,
  githubCallback,
} from "../controller/github/github.controller.js";

const githubRouter = Router();

githubRouter.post(
  "/connect",
  authMiddleware,
  connectGitHub,
);

githubRouter.get(
  "/callback",
  githubCallback,
);

export default githubRouter;