-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
