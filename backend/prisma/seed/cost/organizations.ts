import {prisma} from "../../../src/config/prisma.confi.js";

export async function seedOrganizations() {
  const organization = await prisma.organization.upsert({
    where: {
      slug: "acme-corp",
    },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
    },
  });

  return organization;
}