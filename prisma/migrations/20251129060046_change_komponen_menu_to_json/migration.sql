/*
  Warnings:

  - The `komponen_menu` column on the `food_scans` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "food_scans" DROP COLUMN "komponen_menu",
ADD COLUMN     "komponen_menu" JSONB;
