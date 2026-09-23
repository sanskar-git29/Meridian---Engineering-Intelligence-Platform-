export interface Env {
  nodeEnv: "development" | "production" | "test";
  port?: number;

  DATABASE_URL: string;
  FRONTEND_URL: string;

  jwt: {
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRATION: string;
    JWT_REFRESH_EXPIRATION: string;
  };

  REDIS_URL: string;

  github: {
  GITHUB_APP_ID: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_PRIVATE_KEY_PATH: string;
  GITHUB_CALLBACK_URL: string;
};
}