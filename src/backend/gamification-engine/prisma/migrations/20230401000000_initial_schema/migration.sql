-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up timestamp handling functions
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create game_profiles table
CREATE TABLE "game_profiles" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" TEXT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 1,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE "achievements" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "journey" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "xp_reward" INTEGER NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "achievements_xp_reward_check" CHECK ("xp_reward" >= 0 AND "xp_reward" <= 1000)
);

-- Create user_achievements table
CREATE TABLE "user_achievements" (
  "profile_id" UUID NOT NULL,
  "achievement_id" UUID NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "unlocked" BOOLEAN NOT NULL DEFAULT FALSE,
  "unlocked_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("profile_id", "achievement_id"),
  CONSTRAINT "user_achievements_progress_check" CHECK ("progress" >= 0 AND "progress" <= 1000),
  CONSTRAINT "user_achievements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles" ("id") ON DELETE CASCADE,
  CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements" ("id") ON DELETE CASCADE
);

-- Create quests table
CREATE TABLE "quests" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "journey" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "xp_reward" INTEGER NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "quests_xp_reward_check" CHECK ("xp_reward" >= 0 AND "xp_reward" <= 1000)
);

-- Create rewards table
CREATE TABLE "rewards" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "journey" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "xp_reward" INTEGER NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "rewards_xp_reward_check" CHECK ("xp_reward" >= 0)
);

-- Create user_rewards table
CREATE TABLE "user_rewards" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "profile_id" UUID NOT NULL,
  "reward_id" UUID NOT NULL,
  "earned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_rewards_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles" ("id") ON DELETE CASCADE,
  CONSTRAINT "user_rewards_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards" ("id") ON DELETE CASCADE
);

-- Create rules table
CREATE TABLE "rules" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "event" TEXT NOT NULL,
  "condition" TEXT NOT NULL,
  "actions" JSONB NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create events table for tracking gamification events across journeys
CREATE TABLE "events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "journey" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT FALSE,
  "processed_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX "game_profiles_user_id_idx" ON "game_profiles" ("user_id");
CREATE INDEX "achievements_journey_idx" ON "achievements" ("journey");
CREATE INDEX "user_achievements_unlocked_idx" ON "user_achievements" ("unlocked");
CREATE INDEX "quests_journey_idx" ON "quests" ("journey");
CREATE INDEX "rewards_journey_idx" ON "rewards" ("journey");
CREATE INDEX "rules_event_idx" ON "rules" ("event");
CREATE INDEX "events_type_idx" ON "events" ("type");
CREATE INDEX "events_user_id_idx" ON "events" ("user_id");
CREATE INDEX "events_journey_idx" ON "events" ("journey");
CREATE INDEX "events_processed_idx" ON "events" ("processed");

-- Set up automatic updated_at timestamp triggers
CREATE TRIGGER set_timestamp_game_profiles
BEFORE UPDATE ON "game_profiles"
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_achievements
BEFORE UPDATE ON "achievements"
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_achievements
BEFORE UPDATE ON "user_achievements"
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_quests
BEFORE UPDATE ON "quests"
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_rewards
BEFORE UPDATE ON "rewards"
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_rules
BEFORE UPDATE ON "rules"
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Add comments for documentation
COMMENT ON TABLE "game_profiles" IS 'Stores user gamification data including level, XP, and other progress metrics';
COMMENT ON TABLE "achievements" IS 'Defines achievements that users can unlock across different journeys';
COMMENT ON TABLE "user_achievements" IS 'Tracks which achievements have been unlocked by which users';
COMMENT ON TABLE "quests" IS 'Defines quests/challenges that users can complete for rewards';
COMMENT ON TABLE "rewards" IS 'Defines rewards that users can earn through achievements and quests';
COMMENT ON TABLE "user_rewards" IS 'Tracks which rewards have been earned by which users';
COMMENT ON TABLE "rules" IS 'Defines rules for processing events and awarding achievements/XP';
COMMENT ON TABLE "events" IS 'Stores gamification events from all journeys for processing';