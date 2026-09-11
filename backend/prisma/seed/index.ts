import { prisma } from "../../src/config/prisma.confi.js";
import { seedOrganizations } from "./cost/organizations.js";
import { seedIntegrations } from "./cost/integrations.js";

async function main() {
  console.log("🌱 Starting database seed...");

  const organization = await seedOrganizations();

  console.log(`✅ Organization ready: ${organization.name}`);

  await seedIntegrations(organization.id);

  console.log("✅ Integrations ready");

  console.log("🌱 Database seed completed");
}

main()
  .catch((error) => {
    console.error("❌ Database seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });