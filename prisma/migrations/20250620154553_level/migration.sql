-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'vip');

-- CreateEnum
CREATE TYPE "Percentage" AS ENUM ('100', '75', '50', '25', '0');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "level" "UserLevel" NOT NULL DEFAULT 'bronze';
