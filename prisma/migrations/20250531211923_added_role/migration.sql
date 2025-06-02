-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('student', 'teacher', 'school_director', 'admin', 'super_admin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Roles" NOT NULL DEFAULT 'student';
