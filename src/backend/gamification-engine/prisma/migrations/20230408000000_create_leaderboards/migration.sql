-- CreateEnum
CREATE TYPE "LeaderboardJourney" AS ENUM ('health', 'care', 'plan', 'global');

-- CreateEnum
CREATE TYPE "LeaderboardTimePeriod" AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

-- CreateTable
CREATE TABLE "leaderboards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "journey" "LeaderboardJourney" NOT NULL DEFAULT 'global',
    "time_period" "LeaderboardTimePeriod" NOT NULL DEFAULT 'all_time',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "leaderboard_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("leaderboard_id","profile_id")
);

-- CreateTable
CREATE TABLE "leaderboard_history" (
    "id" TEXT NOT NULL,
    "leaderboard_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leaderboards_journey_idx" ON "leaderboards"("journey");

-- CreateIndex
CREATE INDEX "leaderboards_time_period_idx" ON "leaderboards"("time_period");

-- CreateIndex
CREATE INDEX "leaderboards_is_active_idx" ON "leaderboards"("is_active");

-- CreateIndex
CREATE INDEX "leaderboard_entries_profile_id_idx" ON "leaderboard_entries"("profile_id");

-- CreateIndex
CREATE INDEX "leaderboard_entries_score_idx" ON "leaderboard_entries"("score" DESC);

-- CreateIndex
CREATE INDEX "leaderboard_entries_rank_idx" ON "leaderboard_entries"("rank");

-- CreateIndex
CREATE INDEX "leaderboard_history_leaderboard_id_idx" ON "leaderboard_history"("leaderboard_id");

-- CreateIndex
CREATE INDEX "leaderboard_history_profile_id_idx" ON "leaderboard_history"("profile_id");

-- CreateIndex
CREATE INDEX "leaderboard_history_snapshot_date_idx" ON "leaderboard_history"("snapshot_date");

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "leaderboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_history" ADD CONSTRAINT "leaderboard_history_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "leaderboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_history" ADD CONSTRAINT "leaderboard_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;