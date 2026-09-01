import { Prisma } from "../generated/prisma/client.js";

type AuditLogData = {
  actorId?: string;
  organizationId?: string;

  action: string;

  resourceType?: string;
  resourceId?: string;

  metadata?: Prisma.InputJsonValue;

  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(
  tx: Prisma.TransactionClient,
  data: AuditLogData
) {
  return tx.auditLog.create({
    data: {
      actorId: data.actorId,
      organizationId: data.organizationId,

      action: data.action,

      resourceType: data.resourceType,
      resourceId: data.resourceId,

      metadata: data.metadata,

      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}