import { prisma } from "../config/prisma.confi.js";

export async function withTenant<T>(
  organizationId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config(
        'app.current_org_id',
        ${organizationId},
        true
      )
    `;

    return callback(tx);
  });
}