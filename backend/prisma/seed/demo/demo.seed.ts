import {
  createHash,
  randomUUID,
} from "node:crypto";

import bcrypt from "bcrypt";
import type { Prisma } from "../../../src/generated/prisma/client.js";

import { prisma } from "../../../src/config/prisma.confi.js";
import { withTenant } from "../../../src/lib/withTenant.js";

import { demoData } from "./demo.data.js";

const DAYS_TO_GENERATE = 60;

const SERVICE_BASE_COST: Record<string, number> = {
  EC2: 420,
  RDS: 280,
  S3: 90,
  CloudFront: 110,
  Lambda: 75,
  EKS: 240,
};

const TEAM_BY_SERVICE: Record<string, string> = {
  EC2: "Platform",
  RDS: "Data",
  S3: "Data",
  CloudFront: "Frontend",
  Lambda: "Payments",
  EKS: "Platform",
};

const PROJECT_BY_SERVICE: Record<string, string> = {
  EC2: "API Platform",
  RDS: "Analytics",
  S3: "Analytics",
  CloudFront: "Customer Portal",
  Lambda: "Checkout",
  EKS: "API Platform",
};

const ENVIRONMENT_BY_SERVICE: Record<string, string> = {
  EC2: "production",
  RDS: "production",
  S3: "production",
  CloudFront: "production",
  Lambda: "production",
  EKS: "production",
};

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getScenarioForDate(date: Date) {
  const key = dateKey(date);

  return demoData.anomalyScenarios.find(
    (scenario) => scenario.date === key
  );
}

function generateExternalId(
  integrationId: string,
  date: Date,
  service: string
): string {
  const raw =
    `${integrationId}:${dateKey(date)}:${service}`;

  return createHash("sha256")
    .update(raw)
    .digest("hex")
    .slice(0, 32);
}

function generateDailyAmount(
  service: string,
  date: Date
): number {
  const base =
    SERVICE_BASE_COST[service] ?? 100;

  const day = date.getUTCDate();

  const variation =
    1 +
    ((day * 17 + service.length * 7) % 15) /
      100;

  const scenario =
    getScenarioForDate(date);

  const scenarioMultiplier =
    scenario?.services.some(
      (scenarioService) =>
        scenarioService === service
    )
      ? scenario.multiplier
      : 1;

  return Number(
    (
      base *
      variation *
      scenarioMultiplier
    ).toFixed(2)
  );
}

function getRegion(
  service: string,
  date: Date
): string {
  const day = date.getUTCDate();

  const regionIndex =
    (day + service.length) %
    demoData.regions.length;

  return demoData.regions[regionIndex];
}

function getDateRange(): Date[] {
  const dates: Date[] = [];

  const end = new Date(
    "2026-08-31T00:00:00.000Z"
  );

  for (
    let index = DAYS_TO_GENERATE - 1;
    index >= 0;
    index--
  ) {
    const date = new Date(end);

    date.setUTCDate(
      date.getUTCDate() - index
    );

    dates.push(date);
  }

  return dates;
}

async function removeExistingDemoData() {
  console.log(
    "🧹 Removing existing demo data..."
  );

  const organization =
    await prisma.organization.findUnique({
      where: {
        slug: demoData.organization.slug,
      },
    });

  if (!organization) {
    return;
  }

  await withTenant(
    organization.id,
    async (tx) => {
      await tx.costRecord.deleteMany({
        where: {
          organizationId: organization.id,
        },
      });

      await tx.integration.deleteMany({
        where: {
          organizationId: organization.id,
        },
      });
    }
  );

  await prisma.membership.deleteMany({
    where: {
      organizationId: organization.id,
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: demoData.users.map(
          (user) => user.email
        ),
      },
    },
  });

  await prisma.organization.delete({
    where: {
      id: organization.id,
    },
  });

  console.log(
    "✅ Existing demo data removed"
  );
}

async function createOrganization() {
  return prisma.organization.create({
    data: {
      name: demoData.organization.name,
      slug: demoData.organization.slug,
    },
  });
}

async function createUsers(
  organizationId: string
) {
  const users = [];

  for (const user of demoData.users) {
    const passwordHash =
      await bcrypt.hash(
        user.password,
        12
      );

    const createdUser =
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
        },
      });

    await prisma.membership.create({
      data: {
        userId: createdUser.id,
        organizationId,
        role: user.role,
      },
    });

    users.push(createdUser);
  }

  return users;
}

async function createAwsIntegration(
  organizationId: string
) {
  const integrationId = randomUUID();

  await withTenant(
    organizationId,
    async (tx) => {
      await tx.integration.create({
        data: {
          id: integrationId,
          organizationId,
          name: demoData.aws.name,
          provider: demoData.aws.provider,
          status: demoData.aws.status,
        },
      });
    }
  );

  return integrationId;
}

async function createCostRecords(
  organizationId: string,
  integrationId: string
) {
  const dates = getDateRange();

//   const records = [];
const records: Prisma.CostRecordCreateManyInput[] = [];

  for (const date of dates) {
    for (const service of demoData.services) {
      records.push({
        organizationId,
        integrationId,

        externalId:
          generateExternalId(
            integrationId,
            date,
            service
          ),

        service,

        team:
          TEAM_BY_SERVICE[service],

        project:
          PROJECT_BY_SERVICE[service],

        environment:
          ENVIRONMENT_BY_SERVICE[service],

        amount:
          generateDailyAmount(
            service,
            date
          ),

        currency: "USD",

        date,

        region:
          getRegion(
            service,
            date
          ),
      });
    }
  }

  await withTenant(
    organizationId,
    async (tx) => {
      await tx.costRecord.createMany({
        data: records,
      });
    }
  );

  return records.length;
}

async function main() {
  console.log(
    "\n🚀 Starting recruiter demo seed...\n"
  );

  try {
    await removeExistingDemoData();

    const organization =
      await createOrganization();

    console.log(
      `✅ Organization: ${organization.name}`
    );

    const users =
      await createUsers(
        organization.id
      );

    console.log(
      `✅ Users created: ${users.length}`
    );

    const integrationId =
      await createAwsIntegration(
        organization.id
      );

    console.log(
      `✅ AWS integration created`
    );

    const costCount =
      await createCostRecords(
        organization.id,
        integrationId
      );

    console.log(
      `✅ Cost records created: ${costCount}`
    );

    console.log(
      "\n========================================"
    );

    console.log(
      "🎉 RECRUITER DEMO SEED COMPLETE"
    );

    console.log(
      "========================================"
    );

    console.log(
      `\nOrganization: ${demoData.organization.name}`
    );

    console.log(
      "\nDemo users:"
    );

    for (const user of demoData.users) {
      console.log(
        `  ${user.role.padEnd(6)} | ${user.email} | ${user.password}`
      );
    }

    console.log(
      "\nAWS:"
    );

    console.log(
      `  ${demoData.aws.name} | ${demoData.aws.status}`
    );

    console.log(
      `\nHistory: ${DAYS_TO_GENERATE} days`
    );

    console.log(
      `Services: ${demoData.services.join(", ")}`
    );

    console.log(
      `Anomaly scenarios: ${demoData.anomalyScenarios.length}`
    );

    console.log(
      "\n========================================\n"
    );
  } catch (error) {
    console.error(
      "\n❌ DEMO SEED FAILED\n"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();