-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('PRIMARY', 'SECONDARY', 'PRIMARY_SECONDARY');

-- CreateEnum
CREATE TYPE "SchoolOwnership" AS ENUM ('GOVERNMENT_OWNED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "school_email" TEXT NOT NULL,
    "school_phone" TEXT NOT NULL,
    "school_address" TEXT NOT NULL,
    "school_type" "SchoolType" NOT NULL,
    "school_ownership" "SchoolOwnership" NOT NULL,
    "cac" TEXT,
    "utility_bill" TEXT,
    "tax_clearance" TEXT,
    "status" "SchoolStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_school_email_key" ON "School"("school_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
