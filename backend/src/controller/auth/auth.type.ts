import { z } from "zod";
import { AccessTokenSchema, RefreshTokenSchema } from "./auth.schema.js";

type AccessTokenPayload  = z.infer<typeof AccessTokenSchema>;
type RefreshTokenPayload = z.infer<typeof RefreshTokenSchema>;
 type Role = AccessTokenPayload["role"];
type AuthUser = {
  sub: string;
  email: string;
  
  
};
export{
    AuthUser,
    Role,
    AccessTokenPayload,
    RefreshTokenPayload
}