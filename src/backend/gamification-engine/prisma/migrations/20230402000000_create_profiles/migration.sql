-- CreateEnum
CREATE TYPE "JourneyType" AS ENUM ('HEALTH', 'CARE', 'PLAN');

-- AlterTable
ALTER TABLE "game_profiles" 
    ADD COLUMN "preferences" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN "health_progress" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN "care_progress" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN "plan_progress" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN "active_journey" "JourneyType" DEFAULT 'HEALTH',
    ADD COLUMN "last_activity_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "game_profiles_user_id_key" ON "game_profiles"("user_id");

-- CreateIndex
CREATE INDEX "game_profiles_active_journey_idx" ON "game_profiles"("active_journey");

-- CreateIndex
CREATE INDEX "game_profiles_level_idx" ON "game_profiles"("level");

-- CreateIndex
CREATE INDEX "game_profiles_last_activity_at_idx" ON "game_profiles"("last_activity_at");

-- Add constraints for journey progress data integrity
ALTER TABLE "game_profiles" 
    ADD CONSTRAINT "health_progress_json_check" 
    CHECK (jsonb_typeof("health_progress") = 'object');

ALTER TABLE "game_profiles" 
    ADD CONSTRAINT "care_progress_json_check" 
    CHECK (jsonb_typeof("care_progress") = 'object');

ALTER TABLE "game_profiles" 
    ADD CONSTRAINT "plan_progress_json_check" 
    CHECK (jsonb_typeof("plan_progress") = 'object');

ALTER TABLE "game_profiles" 
    ADD CONSTRAINT "preferences_json_check" 
    CHECK (jsonb_typeof("preferences") = 'object');

-- Create foreign key relationships with user achievements and rewards
ALTER TABLE "user_achievements" 
    ADD CONSTRAINT "user_achievements_profile_id_fkey" 
    FOREIGN KEY ("profile_id") REFERENCES "game_profiles"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_rewards" 
    ADD CONSTRAINT "user_rewards_profile_id_fkey" 
    FOREIGN KEY ("profile_id") REFERENCES "game_profiles"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indices for efficient journey-specific queries
CREATE INDEX "game_profiles_health_progress_gin_idx" ON "game_profiles" USING GIN ("health_progress");
CREATE INDEX "game_profiles_care_progress_gin_idx" ON "game_profiles" USING GIN ("care_progress");
CREATE INDEX "game_profiles_plan_progress_gin_idx" ON "game_profiles" USING GIN ("plan_progress");
CREATE INDEX "game_profiles_preferences_gin_idx" ON "game_profiles" USING GIN ("preferences");

-- Add comment for documentation
COMMENT ON TABLE "game_profiles" IS 'Stores user gamification profiles with journey-specific progress tracking';
COMMENT ON COLUMN "game_profiles"."health_progress" IS 'JSON structure containing Health journey progress metrics';
COMMENT ON COLUMN "game_profiles"."care_progress" IS 'JSON structure containing Care journey progress metrics';
COMMENT ON COLUMN "game_profiles"."plan_progress" IS 'JSON structure containing Plan journey progress metrics';
COMMENT ON COLUMN "game_profiles"."preferences" IS 'User preferences for gamification features across journeys';
COMMENT ON COLUMN "game_profiles"."active_journey" IS 'Currently active journey context for the user';