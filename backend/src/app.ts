import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import testRlsRouter from  "./test/testRls.js"

import { env } from "./config/env.js";
import authRouter from './routes/auth.router.js'

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static("public"));

// Auth routes
app.use("/api/auth", authRouter);

app.use("/test", testRlsRouter);

export default app;