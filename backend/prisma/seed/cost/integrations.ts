import { prisma } from "../../../src/config/prisma.confi.js";

export async function seedIntegrations(organizationId: string) {
  const integrations = [
    {
      name: "Production",
      provider: "AWS" as const,
      status: "ACTIVE" as const,
    },
    {
      name: "Development",
      provider: "AWS" as const,
      status: "ACTIVE" as const,
    },
    {
      name: "Sandbox",
      provider: "AWS" as const,
      status: "ACTIVE" as const,
    },
  ];

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: {
        id: `${organizationId}-${integration.name.toLowerCase()}`,
      },
      update: {},
      create: {
        id: `${organizationId}-${integration.name.toLowerCase()}`,
        organizationId,
        name: integration.name,
        provider: integration.provider,
        status: integration.status,
      },
    });
  }
}