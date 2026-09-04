export const costScenarios = {
  production: {
    name: "Production",
    growthPercentPerMonth: 0.05,

    regions: [
      "us-east-1",
      "us-west-2",
      "eu-west-1",
    ],

    services: {
      EC2: {
        baseAmount: 500,
        variationPercent: 0.10,
        spike: {
          day: 6,
          multiplier: 1.8,
        },
      },

      S3: {
        baseAmount: 120,
        variationPercent: 0.06,
        spike: {
          day: 4,
          multiplier: 1.4,
        },
      },

      RDS: {
        baseAmount: 300,
        variationPercent: 0.08,
        spike: {
          day: 5,
          multiplier: 1.6,
        },
      },

      Lambda: {
        baseAmount: 80,
        variationPercent: 0.12,
        spike: {
          day: 3,
          multiplier: 1.5,
        },
      },
    },
  },

  development: {
    name: "Development",
    growthPercentPerMonth: 0.02,

    regions: [
      "us-east-1",
      "eu-west-1",
    ],

    services: {
      EC2: {
        baseAmount: 120,
        variationPercent: 0.10,
        spike: {
          day: 5,
          multiplier: 1.5,
        },
      },

      S3: {
        baseAmount: 30,
        variationPercent: 0.06,
        spike: {
          day: 4,
          multiplier: 1.3,
        },
      },

      RDS: {
        baseAmount: 70,
        variationPercent: 0.08,
        spike: {
          day: 6,
          multiplier: 1.4,
        },
      },

      Lambda: {
        baseAmount: 20,
        variationPercent: 0.12,
        spike: {
          day: 3,
          multiplier: 1.5,
        },
      },
    },
  },

  sandbox: {
    name: "Sandbox",
    growthPercentPerMonth: 0.01,

    regions: [
      "us-east-1",
    ],

    services: {
      EC2: {
        baseAmount: 40,
        variationPercent: 0.10,
        spike: {
          day: 7,
          multiplier: 1.4,
        },
      },

      S3: {
        baseAmount: 10,
        variationPercent: 0.06,
        spike: {
          day: 4,
          multiplier: 1.3,
        },
      },

      RDS: {
        baseAmount: 20,
        variationPercent: 0.08,
        spike: {
          day: 5,
          multiplier: 1.4,
        },
      },

      Lambda: {
        baseAmount: 5,
        variationPercent: 0.12,
        spike: {
          day: 3,
          multiplier: 1.5,
        },
      },
    },
  },
};