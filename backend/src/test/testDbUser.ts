import { prisma } from "../config/prisma.confi.js";

const result = await prisma.$queryRaw<
  { current_user: string; session_user: string }[]
>`SELECT current_user, session_user`;

console.log(result);

await prisma.$disconnect();
