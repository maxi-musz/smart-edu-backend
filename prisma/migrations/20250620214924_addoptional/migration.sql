/*
  Warnings:

  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - Added the required column `normalPrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellingPrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "images",
DROP COLUMN "price",
ADD COLUMN     "displayImages" TEXT[],
ADD COLUMN     "normalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sellingPrice" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "commission" DROP NOT NULL,
ALTER COLUMN "commission" DROP DEFAULT,
ALTER COLUMN "commission" SET DATA TYPE TEXT;
