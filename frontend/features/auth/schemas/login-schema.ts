import { z } from "zod";

export const loginSchema = z.object({
  organizationName: z
    .string()
    .min(1, { message: "Organization name is required" })
    .trim(),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
