import dotenv from 'dotenv';

dotenv.config();

type Env = {
  port?: number;
  DATABASE_URL: string;
};

const requiredVars = ['DATABASE_URL'] as const;

const missing = requiredVars.filter((key) => {
  const val = process.env[key];
  return val === undefined || val === null || String(val).trim() === '';
});

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const env: Env = {
  port: process.env.PORT ? Number(process.env.PORT) : undefined,
  DATABASE_URL: process.env.DATABASE_URL!,
};

export default env;
export { env };
