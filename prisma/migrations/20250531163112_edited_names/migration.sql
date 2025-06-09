/*
  Warnings:

  - The values [GOVERNMENT_OWNED,PRIVATE] on the enum `SchoolOwnership` will be removed. If these variants are still used in the database, this will fail.
  - The values [NOT_VERIFIED,PENDING,APPROVED,REJECTED,FAILED] on the enum `SchoolStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PRIMARY,SECONDARY,PRIMARY_SECONDARY] on the enum `SchoolType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SchoolOwnership_new" AS ENUM ('government', 'private');
ALTER TABLE "School" ALTER COLUMN "school_ownership" TYPE "SchoolOwnership_new" USING ("school_ownership"::text::"SchoolOwnership_new");
ALTER TYPE "SchoolOwnership" RENAME TO "SchoolOwnership_old";
ALTER TYPE "SchoolOwnership_new" RENAME TO "SchoolOwnership";
DROP TYPE "SchoolOwnership_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SchoolStatus_new" AS ENUM ('not_verified', 'pending', 'approved', 'rejected', 'failed', 'suspended', 'closed', 'archived');
ALTER TABLE "School" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "School" ALTER COLUMN "status" TYPE "SchoolStatus_new" USING ("status"::text::"SchoolStatus_new");
ALTER TYPE "SchoolStatus" RENAME TO "SchoolStatus_old";
ALTER TYPE "SchoolStatus_new" RENAME TO "SchoolStatus";
DROP TYPE "SchoolStatus_old";
ALTER TABLE "School" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SchoolType_new" AS ENUM ('primary', 'secondary', 'primary_and_secondary');
ALTER TABLE "School" ALTER COLUMN "school_type" TYPE "SchoolType_new" USING ("school_type"::text::"SchoolType_new");
ALTER TYPE "SchoolType" RENAME TO "SchoolType_old";
ALTER TYPE "SchoolType_new" RENAME TO "SchoolType";
DROP TYPE "SchoolType_old";
COMMIT;

-- AlterTable
ALTER TABLE "School" ALTER COLUMN "status" SET DEFAULT 'pending';
