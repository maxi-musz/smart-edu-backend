-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "author" TEXT,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "isbn" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "pages" INTEGER,
ADD COLUMN     "publishedDate" TIMESTAMP(3),
ADD COLUMN     "publisher" TEXT;
