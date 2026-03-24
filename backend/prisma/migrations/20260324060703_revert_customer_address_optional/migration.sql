/*
  Warnings:

  - Made the column `address` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL;
