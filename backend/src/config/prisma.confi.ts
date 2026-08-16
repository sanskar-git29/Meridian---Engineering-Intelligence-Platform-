
import { env } from "./env.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPostgresAdapter } from "@prisma/adapter-ppg";
const adapter = new PrismaPostgresAdapter({
  connectionString: env.DATABASE_URL!,
});
export const prisma = new PrismaClient({ adapter });