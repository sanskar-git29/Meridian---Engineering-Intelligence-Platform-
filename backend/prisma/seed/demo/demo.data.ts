export const demoData = {
  organization: {
    name: "Acme Cloud Demo",
    slug: "acme-cloud-demo",
  },

  users: [
    {
      name: "Alex Morgan",
      email: "owner@acme-demo.com",
      password: "Demo@12345",
      role: "OWNER" as const,
    },
    {
      name: "Sarah Chen",
      email: "admin1@acme-demo.com",
      password: "Demo@12345",
      role: "ADMIN" as const,
    },
    {
      name: "David Wilson",
      email: "admin2@acme-demo.com",
      password: "Demo@12345",
      role: "ADMIN" as const,
    },
    {
      name: "Emma Davis",
      email: "member1@acme-demo.com",
      password: "Demo@12345",
      role: "MEMBER" as const,
    },
    {
      name: "James Taylor",
      email: "member2@acme-demo.com",
      password: "Demo@12345",
      role: "MEMBER" as const,
    },
  ],

  aws: {
    name: "AWS Production",
    provider: "AWS" as const,
    status: "ACTIVE" as const,
  },

  services: [
    "EC2",
    "RDS",
    "S3",
    "CloudFront",
    "Lambda",
    "EKS",
  ],

  teams: [
    "Payments",
    "Platform",
    "Frontend",
    "Data",
  ],

  projects: [
    "Checkout",
    "API Platform",
    "Customer Portal",
    "Analytics",
  ],

  environments: [
    "production",
    "staging",
    "development",
  ],

  regions: [
    "us-east-1",
    "us-west-2",
    "eu-west-1",
  ],

  anomalyScenarios: [
    {
      name: "EC2 scaling event",
      date: "2026-08-15",
      services: ["EC2"],
      multiplier: 2.5,
    },
    {
      name: "Database workload increase",
      date: "2026-08-22",
      services: ["RDS"],
      multiplier: 2.2,
    },
    {
      name: "Production traffic spike",
      date: "2026-08-29",
      services: [
        "EC2",
        "RDS",
        "EKS",
        "CloudFront",
      ],
      multiplier: 2.8,
    },
  ],
};