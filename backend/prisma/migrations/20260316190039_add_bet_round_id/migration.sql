-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "previousBalance" DECIMAL(18,2) NOT NULL,
    "currentBalance" DECIMAL(18,2) NOT NULL,
    "game" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "roundId" TEXT,
    "betAmount" DECIMAL(18,2) NOT NULL,
    "betData" JSONB NOT NULL,
    "result" TEXT,
    "payout" DECIMAL(18,2) NOT NULL,
    "serverSeedHash" TEXT,
    "clientSeed" TEXT,
    "nonce" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundSeed" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT,
    "nonce" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundSeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "bankInfo" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minBet" DECIMAL(18,2) NOT NULL DEFAULT 10,
    "maxBet" DECIMAL(18,2) NOT NULL DEFAULT 10000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Bet_userId_idx" ON "Bet"("userId");

-- CreateIndex
CREATE INDEX "Bet_game_idx" ON "Bet"("game");

-- CreateIndex
CREATE INDEX "Bet_createdAt_idx" ON "Bet"("createdAt");

-- CreateIndex
CREATE INDEX "Bet_game_roundId_idx" ON "Bet"("game", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundSeed_roundId_key" ON "RoundSeed"("roundId");

-- CreateIndex
CREATE INDEX "RoundSeed_game_roundId_idx" ON "RoundSeed"("game", "roundId");

-- CreateIndex
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");

-- CreateIndex
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");

-- CreateIndex
CREATE INDEX "DepositRequest_createdAt_idx" ON "DepositRequest"("createdAt");

-- CreateIndex
CREATE INDEX "WithdrawRequest_userId_idx" ON "WithdrawRequest"("userId");

-- CreateIndex
CREATE INDEX "WithdrawRequest_status_idx" ON "WithdrawRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawRequest_createdAt_idx" ON "WithdrawRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_gameId_key" ON "GameConfig"("gameId");

-- CreateIndex
CREATE INDEX "GameConfig_gameId_idx" ON "GameConfig"("gameId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_idx" ON "SupportMessage"("ticketId");

-- CreateIndex
CREATE INDEX "UserLoginHistory_userId_idx" ON "UserLoginHistory"("userId");

-- CreateIndex
CREATE INDEX "UserLoginHistory_createdAt_idx" ON "UserLoginHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLoginHistory" ADD CONSTRAINT "UserLoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
