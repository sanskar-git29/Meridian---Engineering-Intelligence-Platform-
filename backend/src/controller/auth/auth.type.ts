import { z } from "zod";
import { AccessTokenSchema, RefreshTokenSchema } from "./auth.schema.js";

type AccessTokenPayload  = z.infer<typeof AccessTokenSchema>;
type RefreshTokenPayload = z.infer<typeof RefreshTokenSchema>;

type AuthUser = {
  sub: string;
  email: string;
  
  
};
export{
    AuthUser,
    AccessTokenPayload,
    RefreshTokenPayload
}