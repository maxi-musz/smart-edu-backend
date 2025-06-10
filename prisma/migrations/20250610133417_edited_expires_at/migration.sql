/*
  Warnings:

  - The `otp_expires_at` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otp_expires_at",
ADD COLUMN     "otp_expires_at" TIMESTAMP(3);
