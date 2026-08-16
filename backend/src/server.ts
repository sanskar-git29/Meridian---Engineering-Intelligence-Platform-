import express from "express";
import cookieParser from "cookie-parser"

import cors from "cors";
import { env } from "./config/env.js";


const app = express();


app.use(
  cors({
    origin: env.FRONTEND_URL|| "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

app.use(express.static("public")) ;

// auth routes


export default app;






