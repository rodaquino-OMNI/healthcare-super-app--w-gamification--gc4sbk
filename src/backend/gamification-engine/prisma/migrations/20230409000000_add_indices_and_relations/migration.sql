-- AddIndicesAndRelations Migration
-- This migration adds performance indices and enhances relational constraints
-- across the gamification engine database tables to support journey-specific
-- operations and optimize high-volume event processing.

-- Enable btree_gin extension for efficient indexing of array and jsonb fields
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================================================
-- EVENTS TABLE OPTIMIZATIONS
-- ============================================================================

-- Add composite index for journey-specific queries (userId + journey + type)
CREATE INDEX idx_events_user_journey_type ON events("userId", journey, type);

-- Add index for efficient event processing by status
CREATE INDEX idx_events_status ON events(status) WHERE status = 'PENDING';

-- Add index for time-based queries on events
CREATE INDEX idx_events_created_at ON events("createdAt");
CREATE INDEX idx_events_processed_at ON events("processedAt") WHERE "processedAt" IS NOT NULL;

-- Add GIN index for efficient JSONB payload querying
CREATE INDEX idx_events_payload_gin ON events USING GIN (payload);

-- Add index for retry mechanism optimization
CREATE INDEX idx_events_retry_count ON events("retryCount", status) WHERE status = 'FAILED';

-- Add index for dead letter queue management
CREATE INDEX idx_events_dlq ON events("deadLetterQueue") WHERE "deadLetterQueue" = true;

-- Add index for version-based queries to support schema evolution
CREATE INDEX idx_events_version ON events(version);

-- ============================================================================
-- GAME PROFILES OPTIMIZATIONS
-- ============================================================================

-- Add index for journey-specific filtering on game profiles
CREATE INDEX idx_game_profiles_level ON game_profiles(level);
CREATE INDEX idx_game_profiles_xp ON game_profiles(xp);

-- Add GIN index for efficient preferences querying
CREATE INDEX idx_game_profiles_preferences_gin ON game_profiles USING GIN (preferences);

-- Add index for last activity tracking
CREATE INDEX idx_game_profiles_last_active ON game_profiles("lastActiveAt");

-- ============================================================================
-- ACHIEVEMENTS OPTIMIZATIONS
-- ============================================================================

-- Add index for journey-specific achievement queries
CREATE INDEX idx_achievements_journey ON achievements(journey);

-- Add index for XP-based achievement queries
CREATE INDEX idx_achievements_xp_reward ON achievements("xpReward");

-- Enhance user_achievements with better indices
CREATE INDEX idx_user_achievements_unlocked ON user_achievements("unlockedAt") WHERE "unlockedAt" IS NOT NULL;
CREATE INDEX idx_user_achievements_progress ON user_achievements(progress);
CREATE INDEX idx_user_achievements_profile_id ON user_achievements("profileId");

-- ============================================================================
-- QUESTS OPTIMIZATIONS
-- ============================================================================

-- Add index for journey-specific quest queries
CREATE INDEX idx_quests_journey ON quests(journey);

-- Add index for XP-based quest queries
CREATE INDEX idx_quests_xp_reward ON quests("xpReward");

-- Enhance user_quests with better indices
CREATE INDEX idx_user_quests_completed ON user_quests("completedAt") WHERE "completedAt" IS NOT NULL;
CREATE INDEX idx_user_quests_progress ON user_quests(progress);
CREATE INDEX idx_user_quests_profile_id ON user_quests("profileId");

-- ============================================================================
-- REWARDS OPTIMIZATIONS
-- ============================================================================

-- Add index for journey-specific reward queries
CREATE INDEX idx_rewards_journey ON rewards(journey);

-- Add index for XP-based reward queries
CREATE INDEX idx_rewards_xp_reward ON rewards("xpReward");

-- Enhance user_rewards with better indices
CREATE INDEX idx_user_rewards_earned ON user_rewards("earnedAt");
CREATE INDEX idx_user_rewards_profile_id ON user_rewards("profileId");

-- ============================================================================
-- RULES OPTIMIZATIONS
-- ============================================================================

-- Add index for event-type rule queries
CREATE INDEX idx_rules_event ON rules(event);

-- Add GIN index for efficient condition and actions querying
CREATE INDEX idx_rules_condition_gin ON rules USING GIN (condition jsonb_path_ops);
CREATE INDEX idx_rules_actions_gin ON rules USING GIN (actions);

-- ============================================================================
-- LEADERBOARD OPTIMIZATIONS
-- ============================================================================

-- Add index for journey-specific leaderboard queries
CREATE INDEX idx_leaderboards_journey ON leaderboards(journey);

-- Add index for time-period leaderboard queries
CREATE INDEX idx_leaderboards_time_period ON leaderboards("timePeriod");

-- Add index for active leaderboards
CREATE INDEX idx_leaderboards_active ON leaderboards(active) WHERE active = true;

-- Enhance leaderboard_entries with better indices
CREATE INDEX idx_leaderboard_entries_score ON leaderboard_entries(score DESC);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(rank);

-- Enhance leaderboard_history with better indices
CREATE INDEX idx_leaderboard_history_timestamp ON leaderboard_history(timestamp);
CREATE INDEX idx_leaderboard_history_score ON leaderboard_history(score DESC);

-- ============================================================================
-- FOREIGN KEY RELATIONSHIP ENHANCEMENTS
-- ============================================================================

-- Ensure proper cascading for user_achievements when profiles are deleted
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS "user_achievements_profileId_fkey";
ALTER TABLE user_achievements ADD CONSTRAINT "user_achievements_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES game_profiles(id) ON DELETE CASCADE;

-- Ensure proper cascading for user_quests when profiles are deleted
ALTER TABLE user_quests DROP CONSTRAINT IF EXISTS "user_quests_profileId_fkey";
ALTER TABLE user_quests ADD CONSTRAINT "user_quests_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES game_profiles(id) ON DELETE CASCADE;

-- Ensure proper cascading for user_rewards when profiles are deleted
ALTER TABLE user_rewards DROP CONSTRAINT IF EXISTS "user_rewards_profileId_fkey";
ALTER TABLE user_rewards ADD CONSTRAINT "user_rewards_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES game_profiles(id) ON DELETE CASCADE;

-- Ensure proper cascading for leaderboard_entries when profiles are deleted
ALTER TABLE leaderboard_entries DROP CONSTRAINT IF EXISTS "leaderboard_entries_profileId_fkey";
ALTER TABLE leaderboard_entries ADD CONSTRAINT "leaderboard_entries_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES game_profiles(id) ON DELETE CASCADE;

-- Ensure proper cascading for leaderboard_entries when leaderboards are deleted
ALTER TABLE leaderboard_entries DROP CONSTRAINT IF EXISTS "leaderboard_entries_leaderboardId_fkey";
ALTER TABLE leaderboard_entries ADD CONSTRAINT "leaderboard_entries_leaderboardId_fkey"
  FOREIGN KEY ("leaderboardId") REFERENCES leaderboards(id) ON DELETE CASCADE;

-- Ensure proper cascading for leaderboard_history when leaderboards are deleted
ALTER TABLE leaderboard_history DROP CONSTRAINT IF EXISTS "leaderboard_history_leaderboardId_fkey";
ALTER TABLE leaderboard_history ADD CONSTRAINT "leaderboard_history_leaderboardId_fkey"
  FOREIGN KEY ("leaderboardId") REFERENCES leaderboards(id) ON DELETE CASCADE;

-- ============================================================================
-- ADDITIONAL CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Add check constraint to ensure progress values are within valid range (0-1000)
ALTER TABLE user_achievements ADD CONSTRAINT "user_achievements_progress_range"
  CHECK (progress >= 0 AND progress <= 1000);

ALTER TABLE user_quests ADD CONSTRAINT "user_quests_progress_range"
  CHECK (progress >= 0 AND progress <= 1000);

-- Add check constraint to ensure retry count doesn't exceed maximum
ALTER TABLE events ADD CONSTRAINT "events_retry_count_max"
  CHECK ("retryCount" >= 0 AND "retryCount" <= 10);

-- Add check constraint to ensure XP rewards are positive
ALTER TABLE achievements ADD CONSTRAINT "achievements_xp_reward_positive"
  CHECK ("xpReward" >= 0);

ALTER TABLE quests ADD CONSTRAINT "quests_xp_reward_positive"
  CHECK ("xpReward" >= 0);

ALTER TABLE rewards ADD CONSTRAINT "rewards_xp_reward_positive"
  CHECK ("xpReward" >= 0);

-- Add check constraint to ensure game profile XP and level are valid
ALTER TABLE game_profiles ADD CONSTRAINT "game_profiles_xp_positive"
  CHECK (xp >= 0);

ALTER TABLE game_profiles ADD CONSTRAINT "game_profiles_level_positive"
  CHECK (level >= 1);

-- ============================================================================
-- COMMENT ON INDICES AND CONSTRAINTS
-- ============================================================================

COMMENT ON INDEX idx_events_user_journey_type IS 'Optimizes journey-specific queries by user ID, journey, and event type';
COMMENT ON INDEX idx_events_status IS 'Improves event consumption performance for pending events';
COMMENT ON INDEX idx_events_payload_gin IS 'Enables efficient querying of JSON payloads for rules evaluation';
COMMENT ON INDEX idx_game_profiles_preferences_gin IS 'Supports efficient querying of user preferences across journeys';
COMMENT ON INDEX idx_rules_condition_gin IS 'Optimizes rule evaluation based on condition expressions';
COMMENT ON INDEX idx_rules_actions_gin IS 'Enables efficient querying of rule actions';

COMMENT ON CONSTRAINT "user_achievements_progress_range" ON user_achievements IS 'Ensures progress values are within valid range (0-1000)';
COMMENT ON CONSTRAINT "user_quests_progress_range" ON user_quests IS 'Ensures progress values are within valid range (0-1000)';
COMMENT ON CONSTRAINT "events_retry_count_max" ON events IS 'Prevents excessive retry attempts for failed events';