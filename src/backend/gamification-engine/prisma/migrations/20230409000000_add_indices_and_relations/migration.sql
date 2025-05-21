-- AddIndicesAndRelations Migration
-- This migration adds performance indices and enhances relational constraints
-- across the gamification engine database tables to support cross-journey queries
-- and optimize database access patterns for high-volume event processing.

-- Add composite indices on events table for journey-specific queries
CREATE INDEX "events_userId_journey_type_idx" ON "events" ("userId", "journey", "type");
CREATE INDEX "events_journey_type_idx" ON "events" ("journey", "type");
CREATE INDEX "events_type_idx" ON "events" ("type");

-- Add partial index for processing status to improve event consumption performance
CREATE INDEX "events_processed_status_idx" ON "events" ("processed") WHERE "processed" = false;

-- Add indices on timestamp fields for time-based queries and reporting
CREATE INDEX "events_createdAt_idx" ON "events" ("createdAt");
CREATE INDEX "user_achievements_unlockedAt_idx" ON "user_achievements" ("unlockedAt");
CREATE INDEX "user_rewards_earnedAt_idx" ON "user_rewards" ("earnedAt");

-- Add indices on game_profiles for efficient journey-specific filtering and leaderboard generation
CREATE INDEX "game_profiles_level_xp_idx" ON "game_profiles" ("level" DESC, "xp" DESC);
CREATE INDEX "game_profiles_userId_idx" ON "game_profiles" ("userId");

-- Create optimized indices for rule evaluation queries by event type and journey
CREATE INDEX "rules_event_idx" ON "rules" ("event");
CREATE INDEX "rules_journey_event_idx" ON "rules" ("journey", "event");

-- Enhance JSONB indices for efficient payload querying and rules evaluation
CREATE INDEX "events_payload_gin_idx" ON "events" USING gin ("payload" jsonb_path_ops);
CREATE INDEX "rules_actions_gin_idx" ON "rules" USING gin ("actions" jsonb_path_ops);

-- Add journey indices to support cross-journey achievement tracking
CREATE INDEX "achievements_journey_idx" ON "achievements" ("journey");
CREATE INDEX "quests_journey_idx" ON "quests" ("journey");
CREATE INDEX "rewards_journey_idx" ON "rewards" ("journey");

-- Enhance foreign key relationships between achievements, rewards, and user progress tables
ALTER TABLE "user_achievements" ADD CONSTRAINT "fk_user_achievements_profile"
  FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "user_achievements" ADD CONSTRAINT "fk_user_achievements_achievement"
  FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE;

ALTER TABLE "user_rewards" ADD CONSTRAINT "fk_user_rewards_profile"
  FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "user_rewards" ADD CONSTRAINT "fk_user_rewards_reward"
  FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE;

ALTER TABLE "user_quests" ADD CONSTRAINT "fk_user_quests_profile"
  FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "user_quests" ADD CONSTRAINT "fk_user_quests_quest"
  FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE;

-- Add indices for user progress tracking across journeys
CREATE INDEX "user_achievements_profileId_idx" ON "user_achievements" ("profileId");
CREATE INDEX "user_rewards_profileId_idx" ON "user_rewards" ("profileId");
CREATE INDEX "user_quests_profileId_idx" ON "user_quests" ("profileId");

-- Add composite indices for achievement and quest progress tracking
CREATE INDEX "user_achievements_profileId_unlocked_idx" ON "user_achievements" ("profileId", "unlocked");
CREATE INDEX "user_quests_profileId_completed_idx" ON "user_quests" ("profileId", "completed");

-- Add indices for efficient leaderboard generation
CREATE INDEX "game_profiles_journey_level_xp_idx" ON "game_profiles" ("journey", "level" DESC, "xp" DESC);

-- Add indices for efficient event processing by status and timestamp
CREATE INDEX "events_processed_createdAt_idx" ON "events" ("processed", "createdAt") WHERE "processed" = false;

-- Comment explaining the purpose of this migration
COMMENT ON INDEX "events_userId_journey_type_idx" IS 'Optimizes queries filtering events by user, journey, and event type';
COMMENT ON INDEX "events_journey_type_idx" IS 'Optimizes queries filtering events by journey and event type';
COMMENT ON INDEX "events_type_idx" IS 'Optimizes queries filtering events by event type';
COMMENT ON INDEX "events_processed_status_idx" IS 'Optimizes queries for unprocessed events';
COMMENT ON INDEX "events_createdAt_idx" IS 'Optimizes time-based event queries';
COMMENT ON INDEX "user_achievements_unlockedAt_idx" IS 'Optimizes queries for recently unlocked achievements';
COMMENT ON INDEX "user_rewards_earnedAt_idx" IS 'Optimizes queries for recently earned rewards';
COMMENT ON INDEX "game_profiles_level_xp_idx" IS 'Optimizes leaderboard queries sorting by level and XP';
COMMENT ON INDEX "game_profiles_userId_idx" IS 'Optimizes profile lookups by user ID';
COMMENT ON INDEX "rules_event_idx" IS 'Optimizes rule lookups by event type';
COMMENT ON INDEX "rules_journey_event_idx" IS 'Optimizes rule lookups by journey and event type';
COMMENT ON INDEX "events_payload_gin_idx" IS 'Optimizes queries filtering by event payload content';
COMMENT ON INDEX "rules_actions_gin_idx" IS 'Optimizes queries filtering by rule actions';
COMMENT ON INDEX "achievements_journey_idx" IS 'Optimizes achievement lookups by journey';
COMMENT ON INDEX "quests_journey_idx" IS 'Optimizes quest lookups by journey';
COMMENT ON INDEX "rewards_journey_idx" IS 'Optimizes reward lookups by journey';
COMMENT ON INDEX "game_profiles_journey_level_xp_idx" IS 'Optimizes journey-specific leaderboard generation';