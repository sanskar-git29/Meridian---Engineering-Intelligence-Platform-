
import bcrypt from "bcrypt";

import crypto from "node:crypto";


export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isPasswordValid(
  password: string,
  hashedPassword: string,
): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

export async function hashPassword(password: string, saltRounds: number): Promise<string> {
    return bcrypt.hash(password, saltRounds);
}



