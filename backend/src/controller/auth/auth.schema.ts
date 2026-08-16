import *  as z from "zod";
 export const AccessTokenSchema = z.object({
    sub:z.string().uuid(),
    email:z.string().email(),
})

export const RefreshTokenSchema = z.object({
    sub:z.string ().uuid( ),
})




