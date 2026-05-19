-- AlterTable
ALTER TABLE "User" ADD COLUMN     "claimedVipLevels" JSONB,
ADD COLUMN     "totalDeposit" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vipLevel" INTEGER NOT NULL DEFAULT 0;
