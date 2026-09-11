export const costScenarios = {
  production: {
    name: "Production",
    services: {
      EC2: 500,
      S3: 120,
      RDS: 300,
      Lambda: 80,
    },
  },

  development: {
    name: "Development",
    services: {
      EC2: 120,
      S3: 30,
      RDS: 70,
      Lambda: 20,
    },
  },

  sandbox: {
    name: "Sandbox",
    services: {
      EC2: 40,
      S3: 10,
      RDS: 20,
      Lambda: 5,
    },
  },
};