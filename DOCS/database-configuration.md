# Database Configuration Guide

This guide explains how to set up and manage database connections for different environments (development, staging, production) in your NestJS application.

## Environment Variables Setup

In your `.env` file, set up the following variables:

```env
# Environment
NODE_ENV=staging  # Options: development, staging, production

# Database URLs
DATABASE_URL="postgresql://postgres:123@localhost:5434/smart-edu-db?schema=public"  # Development
DATABASE_URL_STAGING="postgresql://user:pass@staging-db-url"  # Staging
DATABASE_URL_PRODUCTION="postgresql://user:pass@production-db-url"  # Production
```

## Dynamic Database URL Configuration

The application uses a dynamic approach to switch between different database URLs based on the `NODE_ENV`. This is handled by two main components:

### 1. Database Config (src/config/database.config.ts)

This configuration file reads the environment and selects the appropriate database URL:

```typescript
export default registerAs('database', () => {
  const env = process.env.NODE_ENV as 'development' | 'staging' | 'production' | undefined;
  
  const urls = {
    development: process.env.DATABASE_URL,
    staging: process.env.DATABASE_URL_STAGING,
    production: process.env.DATABASE_URL_PRODUCTION,
  };

  return {
    url: (env && urls[env]) ? urls[env] : process.env.DATABASE_URL,
  };
});
```

### 2. Environment Switcher (prisma/use-env.js)

This script automatically modifies the Prisma schema to use the correct database URL based on the current environment:

```javascript
const envToDbUrl = {
  development: 'DATABASE_URL',
  staging: 'DATABASE_URL_STAGING',
  production: 'DATABASE_URL_PRODUCTION'
};
```

## Available Commands

The following npm scripts are available for database operations:

```bash
# Run migrations (applies pending migrations)
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Generate Prisma Client
npm run prisma:generate
```

## When to Use Each Command

1. **Development Setup**:
   ```bash
   # Set environment to development
   NODE_ENV=development
   
   # Run migrations on local database
   npm run prisma:migrate
   ```

2. **Staging Setup**:
   ```bash
   # Set environment to staging
   NODE_ENV=staging
   
   # Run migrations on staging database
   npm run prisma:migrate
   ```

3. **Production Setup**:
   ```bash
   # Set environment to production
   NODE_ENV=production
   
   # Run migrations on production database
   npm run prisma:migrate
   ```

## Important Notes

1. Always check your `NODE_ENV` before running database commands
2. The `use-env.js` script automatically modifies `schema.prisma` to use the correct database URL
3. Never manually modify the database URL in `schema.prisma` - let the script handle it
4. Make sure all database URLs are properly set in your `.env` file
5. Keep your production database credentials secure and never commit them to version control

## Troubleshooting

If you encounter database connection issues:

1. Verify your `NODE_ENV` is set correctly
2. Check that the corresponding database URL is set in your `.env` file
3. Ensure the database server is running and accessible
4. Check the logs for any connection errors
5. Verify your database credentials are correct

### Debugging Environment Variables

To debug environment variable issues:

1. Check the current environment:
   ```bash
   echo $NODE_ENV
   ```

2. Verify the environment variables are loaded:
   ```bash
   # The script will now show:
   # - Current NODE_ENV
   # - Selected database URL environment variable
   # - The actual database URL being used
   npm run prisma:use-env
   ```

3. If environment variables aren't loading:
   - Make sure your `.env` file is in the root directory
   - Check for any syntax errors in your `.env` file
   - Ensure there are no spaces around the `=` sign in your `.env` file
   - Try restarting your terminal/IDE

## Security Best Practices

1. Use different databases for each environment
2. Never use production credentials in development or staging
3. Keep your `.env` file in `.gitignore`
4. Use strong passwords for all database connections
5. Regularly rotate database credentials
6. Use SSL connections for production databases

## Deployment and Automatic Migrations

### Environment-Specific Deployment

The `start:deploy` script works for all environments (development, staging, production) by using the appropriate database URL based on `NODE_ENV`:

```bash
# For staging deployment
NODE_ENV=staging npm run start:deploy

# For production deployment
NODE_ENV=production npm run start:deploy
```

### Staging Deployment

When deploying to staging:

1. Set the environment variables:
   ```env
   NODE_ENV=staging
   DATABASE_URL_STAGING=your_staging_db_url
   ```

2. Use the same deployment script:
   ```bash
   npm run start:deploy
   ```

This will:
- Generate the Prisma client
- Run migrations on your staging database
- Start the server in staging mode

### Production Deployment

When deploying to production:

1. Set the environment variables:
   ```env
   NODE_ENV=production
   DATABASE_URL_PRODUCTION=your_production_db_url
   ```

2. Use the same deployment script:
   ```bash
   npm run start:deploy
   ```

### Render Configuration

#### Staging Deployment on Render

1. Create a new Web Service for staging
2. Set the following environment variables:
   ```env
   NODE_ENV=staging
   DATABASE_URL_STAGING=your_staging_db_url
   PORT=10000  # or any port you prefer for staging
   ```

3. Set the Build Command:
   ```bash
   npm install && npm run build
   ```

4. Set the Start Command:
   ```bash
   npm run start:deploy
   ```

#### Production Deployment on Render

1. Create a new Web Service for production
2. Set the following environment variables:
   ```env
   NODE_ENV=production
   DATABASE_URL_PRODUCTION=your_production_db_url
   PORT=10000  # or any port you prefer for production
   ```

3. Set the Build Command:
   ```bash
   npm install && npm run build
   ```

4. Set the Start Command:
   ```bash
   npm run start:deploy
   ```

#### Important Render Settings

For both staging and production:

1. **Auto-Deploy**: 
   - Enable for staging to automatically deploy from your development branch
   - Enable for production to automatically deploy from your main/master branch

2. **Health Check Path**:
   - Set to `/api/v1/health` (or your health check endpoint)
   - This helps Render know if your service is running properly

3. **Environment**:
   - Set to `Node`
   - Node Version: `18.x` (or your preferred version)

4. **Region**:
   - Choose the same region for both staging and production
   - This ensures consistent latency

5. **Instance Type**:
   - Staging: Can use a smaller instance (e.g., Free tier or Starter)
   - Production: Use an instance type that matches your needs

### Deployment Flow with Render

1. **Development**:
   - Work on your development branch
   - Test locally with `NODE_ENV=development`

2. **Staging**:
   - Push to development branch
   - Render automatically deploys to staging
   - Verify everything works in staging environment

3. **Production**:
   - Merge to main/master branch
   - Render automatically deploys to production
   - Monitor the deployment logs

### Monitoring Deployments

1. **Check Deployment Logs**:
   - In Render dashboard, go to your service
   - Click on "Events" to see deployment history
   - Click on any deployment to see detailed logs

2. **Verify Database Migrations**:
   - Look for messages like:
     ```
     Using database URL from DATABASE_URL_STAGING for staging environment
     Prisma Migrate: Applying migrations...
     ```

3. **Health Check**:
   - After deployment, verify your health check endpoint
   - This confirms the service is running properly

### Best Practices for Production Migrations

1. **Always test migrations in staging first**
   - Run migrations on staging database before production
   - Verify all data and functionality after migration

2. **Use migration locks**
   - Prisma's `migrate deploy` command is safe for concurrent deployments
   - It uses a lock to prevent multiple migrations running simultaneously

3. **Backup before migration**
   - Always ensure you have a recent backup of your production database
   - Consider taking a backup right before migration

4. **Monitor deployment logs**
   - Watch the deployment logs for any migration errors
   - Have a rollback plan ready

5. **Consider zero-downtime deployments**
   - For critical applications, consider using blue-green deployments
   - This allows you to verify the new version before switching traffic

### Migration Safety Checks

The `prisma:migrate` command includes several safety features:
- Checks if the database is in a consistent state
- Verifies that all migrations can be applied
- Uses transactions to ensure atomicity
- Provides detailed error messages if something goes wrong

### Rollback Strategy

If a migration fails in production:

1. Check the error logs
2. If possible, fix the issue and redeploy
3. If needed, restore from backup
4. Consider using Prisma's `migrate reset` in staging to test the fix 