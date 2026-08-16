import { Router } from "express";
import { loginController, logoutController, RegisterController } from "../controller/auth/auth.controller.js";

const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.post("/register", RegisterController);
authRouter.post("/logout", logoutController);

export default authRouter;