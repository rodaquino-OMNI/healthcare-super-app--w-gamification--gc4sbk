-- CreateEnum
CREATE TYPE "JourneyType" AS ENUM ('HEALTH', 'CARE', 'PLAN');

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "journey" "JourneyType" NOT NULL,
    "icon" VARCHAR(255),
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "profile_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "progress_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlocked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("profile_id","achievement_id")
);

-- CreateIndex
CREATE INDEX "achievements_journey_idx" ON "achievements"("journey");

-- CreateIndex
CREATE INDEX "achievements_xp_reward_idx" ON "achievements"("xp_reward");

-- CreateIndex
CREATE INDEX "user_achievements_profile_id_idx" ON "user_achievements"("profile_id");

-- CreateIndex
CREATE INDEX "user_achievements_achievement_id_idx" ON "user_achievements"("achievement_id");

-- CreateIndex
CREATE INDEX "user_achievements_unlocked_idx" ON "user_achievements"("unlocked");

-- CreateIndex
CREATE INDEX "user_achievements_unlocked_at_idx" ON "user_achievements"("unlocked_at");

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;