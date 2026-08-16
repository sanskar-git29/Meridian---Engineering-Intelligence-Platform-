import { z } from "zod";
import { AccessTokenSchema, RefreshTokenSchema } from "./auth.schema.js";

type AccessTokenPayload  = z.infer<typeof AccessTokenSchema>;
type RefreshTokenPayload = z.infer<typeof RefreshTokenSchema>;

export{
    AccessTokenPayload,
    RefreshTokenPayload
}