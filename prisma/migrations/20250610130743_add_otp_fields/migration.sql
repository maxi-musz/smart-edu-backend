/*
  Warnings:

  - Added the required column `otp` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `otp_expires_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "otp" TEXT NOT NULL,
ADD COLUMN     "otp_expires_at" TEXT NOT NULL;
