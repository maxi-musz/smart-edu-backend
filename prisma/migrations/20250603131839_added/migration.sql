/*
  Warnings:

  - You are about to drop the column `cac` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `tax_clearance` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `utility_bill` on the `School` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cacId]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[utilityBillId]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taxClearanceId]` on the table `School` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_school_id_idx";

-- AlterTable
ALTER TABLE "School" DROP COLUMN "cac",
DROP COLUMN "tax_clearance",
DROP COLUMN "utility_bill",
ADD COLUMN     "cacId" TEXT,
ADD COLUMN     "taxClearanceId" TEXT,
ADD COLUMN     "utilityBillId" TEXT;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_id_key" ON "Document"("id");

-- CreateIndex
CREATE UNIQUE INDEX "School_cacId_key" ON "School"("cacId");

-- CreateIndex
CREATE UNIQUE INDEX "School_utilityBillId_key" ON "School"("utilityBillId");

-- CreateIndex
CREATE UNIQUE INDEX "School_taxClearanceId_key" ON "School"("taxClearanceId");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_cacId_fkey" FOREIGN KEY ("cacId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_taxClearanceId_fkey" FOREIGN KEY ("taxClearanceId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
