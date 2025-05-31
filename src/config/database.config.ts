import { registerAs } from "@nestjs/config";

export default registerAs('database', () => {
  const env = process.env.NODE_ENV as 'development' | 'staging' | 'production' | undefined;

  const urls: Record<'development' | 'staging' | 'production', string | undefined> = {
    development: process.env.DATABASE_URL,
    staging: process.env.DATABASE_URL_STAGING,
    production: process.env.DATABASE_URL_PRODUCTION,
  };

  return {
    url: (env && urls[env]) ? urls[env] : process.env.DATABASE_URL, // fallback to dev
  };
});