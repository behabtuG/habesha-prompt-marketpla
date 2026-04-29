-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TELEGRAM_STARS', 'TON', 'LOCAL_BIRR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PurchaseStatus" ADD VALUE 'WAITING_VERIFICATION';
ALTER TYPE "PurchaseStatus" ADD VALUE 'PENDING_VERIFICATION';
ALTER TYPE "PurchaseStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "manualPaymentData" JSONB,
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verifiedBy" TEXT;

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "Purchase_promptId_idx" ON "Purchase"("promptId");

-- CreateIndex
CREATE INDEX "Purchase_status_idx" ON "Purchase"("status");

-- CreateIndex
CREATE INDEX "Purchase_paymentId_idx" ON "Purchase"("paymentId");

-- CreateIndex
CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");
