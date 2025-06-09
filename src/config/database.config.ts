import { registerAs } from "@nestjs/config";

export default registerAs('database', () => {
  const env = process.env.NODE_ENV as 'development' | 'staging' | 'production' | undefined;
  console.log('Current NODE_ENV:', env);

  const urls: Record<'development' | 'staging' | 'production', string | undefined> = {
    development: process.env.DATABASE_URL,
    staging: process.env.DATABASE_URL_STAGING,
    production: process.env.DATABASE_URL_PRODUCTION,
  };

  const selectedUrl = (env && urls[env]) ? urls[env] : process.env.DATABASE_URL;
  console.log('Selected database URL:', selectedUrl);

  return {
    url: selectedUrl,
  };
}); 