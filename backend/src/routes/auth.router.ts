import { Router } from "express";
import { loginController, logoutController, RegisterController, RefreshController } from "../controller/auth/auth.controller.js";
const authRouter = Router();
//  import authMiddleware from "../middleware/auth.middleware.js";
//  import { requireRole } from "../middleware/authorization.middleware.js";

authRouter.post("/login", loginController);
authRouter.post("/register", RegisterController);
authRouter.post("/logout", logoutController);
authRouter.post("/refresh", RefreshController);

export default authRouter;