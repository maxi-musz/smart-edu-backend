-- CreateEnum
CREATE TYPE "AcademicTerm" AS ENUM ('first', 'second', 'third');

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "current_term" "AcademicTerm" NOT NULL DEFAULT 'first',
ADD COLUMN     "current_year" INTEGER NOT NULL DEFAULT 2024,
ADD COLUMN     "term_end_date" TIMESTAMP(3),
ADD COLUMN     "term_start_date" TIMESTAMP(3);
