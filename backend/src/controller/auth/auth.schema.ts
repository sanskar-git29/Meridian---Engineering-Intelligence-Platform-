import *  as z from "zod";

 export const AccessTokenSchema = z.object({
    sub:z.string().uuid(),
    email:z.string().email(),
     organizationId: z.string(),
  role: z.enum(["ADMIN", "MEMBER","OWNER"]),
})

export const RefreshTokenSchema = z.object({
    sub:z.string ().uuid( ),
})




