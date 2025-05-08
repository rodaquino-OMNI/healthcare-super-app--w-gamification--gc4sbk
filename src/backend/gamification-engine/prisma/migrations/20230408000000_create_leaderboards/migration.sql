-- CreateEnum
CREATE TYPE "JourneyType" AS ENUM ('health', 'care', 'plan', 'global');

-- CreateEnum
CREATE TYPE "TimePeriod" AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

-- CreateTable
CREATE TABLE "leaderboards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "journey" "JourneyType" NOT NULL DEFAULT 'global',
    "timePeriod" "TimePeriod" NOT NULL DEFAULT 'all_time',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "leaderboardId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("leaderboardId","profileId")
);

-- CreateTable
CREATE TABLE "leaderboard_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leaderboardId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "snapshotDate" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leaderboards_journey_timePeriod_idx" ON "leaderboards"("journey", "timePeriod");

-- CreateIndex
CREATE INDEX "leaderboards_isActive_idx" ON "leaderboards"("isActive");

-- CreateIndex
CREATE INDEX "leaderboard_entries_leaderboardId_rank_idx" ON "leaderboard_entries"("leaderboardId", "rank");

-- CreateIndex
CREATE INDEX "leaderboard_entries_profileId_idx" ON "leaderboard_entries"("profileId");

-- CreateIndex
CREATE INDEX "leaderboard_history_leaderboardId_snapshotDate_idx" ON "leaderboard_history"("leaderboardId", "snapshotDate");

-- CreateIndex
CREATE INDEX "leaderboard_history_profileId_idx" ON "leaderboard_history"("profileId");

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_leaderboardId_fkey" FOREIGN KEY ("leaderboardId") REFERENCES "leaderboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_history" ADD CONSTRAINT "leaderboard_history_leaderboardId_fkey" FOREIGN KEY ("leaderboardId") REFERENCES "leaderboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_history" ADD CONSTRAINT "leaderboard_history_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add default leaderboards for each journey and time period
INSERT INTO "leaderboards" ("title", "description", "journey", "timePeriod") VALUES
('Health Journey - Daily', 'Daily leaderboard for health journey achievements', 'health', 'daily'),
('Health Journey - Weekly', 'Weekly leaderboard for health journey achievements', 'health', 'weekly'),
('Health Journey - Monthly', 'Monthly leaderboard for health journey achievements', 'health', 'monthly'),
('Health Journey - All Time', 'All-time leaderboard for health journey achievements', 'health', 'all_time'),
('Care Journey - Daily', 'Daily leaderboard for care journey achievements', 'care', 'daily'),
('Care Journey - Weekly', 'Weekly leaderboard for care journey achievements', 'care', 'weekly'),
('Care Journey - Monthly', 'Monthly leaderboard for care journey achievements', 'care', 'monthly'),
('Care Journey - All Time', 'All-time leaderboard for care journey achievements', 'care', 'all_time'),
('Plan Journey - Daily', 'Daily leaderboard for plan journey achievements', 'plan', 'daily'),
('Plan Journey - Weekly', 'Weekly leaderboard for plan journey achievements', 'plan', 'weekly'),
('Plan Journey - Monthly', 'Monthly leaderboard for plan journey achievements', 'plan', 'monthly'),
('Plan Journey - All Time', 'All-time leaderboard for plan journey achievements', 'plan', 'all_time'),
('Global - Daily', 'Daily leaderboard across all journeys', 'global', 'daily'),
('Global - Weekly', 'Weekly leaderboard across all journeys', 'global', 'weekly'),
('Global - Monthly', 'Monthly leaderboard across all journeys', 'global', 'monthly'),
('Global - All Time', 'All-time leaderboard across all journeys', 'global', 'all_time');