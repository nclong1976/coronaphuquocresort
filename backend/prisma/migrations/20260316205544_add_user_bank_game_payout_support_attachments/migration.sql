-- AlterTable
ALTER TABLE "SupportMessage" ADD COLUMN     "attachmentType" TEXT,
ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "targetUserId" TEXT,
ALTER COLUMN "ticketId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "withdrawPassword" TEXT;

-- CreateTable
CREATE TABLE "GamePayoutConfig" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "ratio" DECIMAL(5,2) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePayoutConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GamePayoutConfig_gameId_idx" ON "GamePayoutConfig"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GamePayoutConfig_gameId_optionKey_startTime_key" ON "GamePayoutConfig"("gameId", "optionKey", "startTime");

-- CreateIndex
CREATE INDEX "SupportMessage_targetUserId_idx" ON "SupportMessage"("targetUserId");
