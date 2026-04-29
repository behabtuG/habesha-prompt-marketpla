/*
  Warnings:

  - The `status` column on the `Purchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- DropIndex
DROP INDEX "Purchase_createdAt_idx";

-- DropIndex
DROP INDEX "Purchase_paymentId_idx";

-- DropIndex
DROP INDEX "Purchase_promptId_idx";

-- DropIndex
DROP INDEX "Purchase_status_idx";

-- DropIndex
DROP INDEX "Purchase_userId_idx";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING';
