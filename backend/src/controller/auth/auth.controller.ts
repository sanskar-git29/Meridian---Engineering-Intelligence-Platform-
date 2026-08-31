import { RequestHandler } from "express";
import { asyncHandler } from "../../utility/asycnHandler.js";
import { ApiResponse } from "../../utility/apiResponse.js";
import { loginService, logoutService, registerService, refreshService } from "./auth.services.js";


export const loginController: RequestHandler = asyncHandler(async (req, res) => {
   const { email, password,organizationName, } = req.body;
   
   const { csrfToken, user } = await loginService(res, email, password ,organizationName,);
   return res.status(200).json(new ApiResponse(200, "Login successful", { csrfToken, user }));

});

export const RegisterController: RequestHandler = asyncHandler(async (req, res) => {
    const { email, password , organizationName} = req.body;


    const {csrfToken,user }= await registerService(res, email, password,organizationName);

     return res.status(201).json(new ApiResponse(201, "User registered", { csrfToken, user }));


})

export const RefreshController = asyncHandler(async (req, res) => {
  const refreshToken: string = req.cookies?.refreshToken;

  await refreshService(res, refreshToken);

  // Tokens are set via cookies; no response body required
  res.sendStatus(204);
});

export const logoutController: RequestHandler = asyncHandler(async (req, res) => {
    const  refreshToken :string = req.cookies?.refreshToken;

  logoutService(res, refreshToken);
  res.status(200).json(new ApiResponse(200, "Logged out", {}));
});
