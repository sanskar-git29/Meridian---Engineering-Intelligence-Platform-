export const rateLimitConfig = {
  login: {
    ip: {
      points: 10,
      duration: 15 * 60,
    },

    email: {
      points: 5,
      duration: 15 * 60,
    },
  },

  register: {
    ip: {
      points: 5,
      duration: 60 * 60,
    },
  },
  refresh: {
  ip: {
    points: 20,
    duration: 15 * 60,
  },
},
} as const;