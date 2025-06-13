-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "display_picture" TEXT,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'other';
