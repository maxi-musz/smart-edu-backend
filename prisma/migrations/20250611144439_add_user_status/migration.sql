-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'inactive');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';
