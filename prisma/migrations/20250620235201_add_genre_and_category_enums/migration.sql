/*
  Warnings:

  - A unique constraint covering the columns `[isbn]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BookCategory" AS ENUM ('fiction', 'non_fiction', 'science', 'technology', 'business', 'self_help', 'biography', 'history', 'philosophy', 'religion', 'politics', 'economics', 'psychology', 'health', 'cooking', 'travel', 'sports', 'arts', 'literature', 'poetry', 'drama', 'mystery', 'thriller', 'romance', 'fantasy', 'science_fiction', 'horror', 'western', 'adventure', 'humor', 'comics', 'graphic_novels', 'children', 'young_adult', 'academic', 'textbook', 'reference', 'dictionary', 'encyclopedia', 'magazine', 'newspaper', 'other');

-- CreateEnum
CREATE TYPE "BookGenre" AS ENUM ('education', 'fiction', 'non_fiction', 'mystery', 'romance', 'fantasy', 'science_fiction', 'horror', 'biography', 'self_help', 'other');

-- CreateEnum
CREATE TYPE "BookLanguage" AS ENUM ('english', 'spanish', 'french', 'german', 'chinese', 'japanese');

-- CreateEnum
CREATE TYPE "BookFormat" AS ENUM ('audiobook', 'e_book', 'hardcover', 'paperback', 'hardcopy');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "BookFormat" "BookFormat" NOT NULL DEFAULT 'hardcover',
ADD COLUMN     "category" "BookCategory",
ADD COLUMN     "genre" "BookGenre";

-- CreateIndex
CREATE UNIQUE INDEX "Product_isbn_key" ON "Product"("isbn");
