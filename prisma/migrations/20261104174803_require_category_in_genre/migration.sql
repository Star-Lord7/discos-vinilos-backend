/*
  Warnings:

  - Made the column `categoryId` on table `genres` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "genres" ALTER COLUMN "categoryId" SET NOT NULL;
