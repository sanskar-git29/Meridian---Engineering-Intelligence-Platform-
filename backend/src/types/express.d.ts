// src/types/express.d.ts

import type { AccessTokenPayload } from "../controller/auth/auth.type.js";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};