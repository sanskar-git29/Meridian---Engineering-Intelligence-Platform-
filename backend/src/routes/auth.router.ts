import { Router } from "express";
import { loginController, logoutController, RegisterController, RefreshController } from "../controller/auth/auth.controller.js";
import {
    loginIpRateLimit,
    loginEmailRateLimit,
    registerIpRateLimit,
} from "../middleware/auth-rate-limit.js";

const authRouter = Router();

authRouter.post(
  "/login",
  loginIpRateLimit,
  loginEmailRateLimit,
  loginController,
);

authRouter.post(
  "/register",
  registerIpRateLimit,
  RegisterController,
);

authRouter.post("/logout", logoutController);
authRouter.post("/refresh", RefreshController);

export default authRouter;