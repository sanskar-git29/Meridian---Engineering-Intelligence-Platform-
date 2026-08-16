import { Response } from "express";
import {
  accessTokenCookieConfig,
  csrfCookieConfig,
  refreshTokenCookieConfig,
} from "./cookie.conf.js";



const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie("accessToken", token, accessTokenCookieConfig);
};

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, refreshTokenCookieConfig);
};

const setCsrfCookie = (res: Response, token: string): void => {
  res.cookie("csrfToken", token, csrfCookieConfig);
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", accessTokenCookieConfig);
  res.clearCookie("refreshToken", refreshTokenCookieConfig);
  res.clearCookie("csrfToken", csrfCookieConfig);
};

export {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setCsrfCookie,
  clearAuthCookies,
};
