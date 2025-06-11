/*
  Warnings:

  - Added the required column `first_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "first_name" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "User" ADD COLUMN "last_name" TEXT NOT NULL DEFAULT 'User';
ALTER TABLE "User" ADD COLUMN "phone_number" TEXT NOT NULL DEFAULT '0000000000';

-- Remove the default values after adding the columns
ALTER TABLE "User" ALTER COLUMN "first_name" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "last_name" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "phone_number" DROP DEFAULT;
