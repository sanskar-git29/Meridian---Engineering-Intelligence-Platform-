import express, { type Request, type Response } from "express";
import { env } from "./config/env.js";

const app = express();
const port : number = env.port ?? 3000 ;  

app.use(express.json());
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: process.uptime(),
  });
});


