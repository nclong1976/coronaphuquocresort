-- Thứ trong tuần cho lịch tỉ lệ; unique mở rộng để cùng khung giờ khác bộ thứ
ALTER TABLE "GamePayoutConfig" ADD COLUMN IF NOT EXISTS "weekdays" JSONB;
ALTER TABLE "GamePayoutConfig" ADD COLUMN IF NOT EXISTS "weekdaysSig" TEXT NOT NULL DEFAULT '*';

DROP INDEX IF EXISTS "GamePayoutConfig_gameId_optionKey_startTime_key";

CREATE UNIQUE INDEX "GamePayoutConfig_gameId_optionKey_startTime_weekdaysSig_key" ON "GamePayoutConfig"("gameId", "optionKey", "startTime", "weekdaysSig");
