-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable case-insensitive text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Function to set updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTable: Game Profiles
CREATE TABLE "game_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "total_xp_earned" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Achievements
CREATE TABLE "achievements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "journey" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "target_value" INTEGER NOT NULL DEFAULT 1,
    "secret" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: User Achievements
CREATE TABLE "user_achievements" (
    "profile_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlocked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("profile_id", "achievement_id")
);

-- CreateTable: Quests
CREATE TABLE "quests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "journey" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: User Quests
CREATE TABLE "user_quests" (
    "profile_id" UUID NOT NULL,
    "quest_id" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("profile_id", "quest_id")
);

-- CreateTable: Rewards
CREATE TABLE "rewards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "journey" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable: User Rewards
CREATE TABLE "user_rewards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "profile_id" UUID NOT NULL,
    "reward_id" UUID NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Rules
CREATE TABLE "rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "event" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Events
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "journey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique user_id in game_profiles
CREATE UNIQUE INDEX "game_profiles_user_id_key" ON "game_profiles"("user_id");

-- CreateIndex: Unique title in achievements
CREATE UNIQUE INDEX "achievements_title_key" ON "achievements"("title");

-- CreateIndex: Unique title in quests
CREATE UNIQUE INDEX "quests_title_key" ON "quests"("title");

-- CreateIndex: Unique title in rewards
CREATE UNIQUE INDEX "rewards_title_key" ON "rewards"("title");

-- CreateIndex: Index on events type for faster lookups
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex: Index on events journey for faster lookups
CREATE INDEX "events_journey_idx" ON "events"("journey");

-- CreateIndex: Index on events user_id for faster lookups
CREATE INDEX "events_user_id_idx" ON "events"("user_id");

-- CreateIndex: Index on events processed status for faster lookups
CREATE INDEX "events_processed_idx" ON "events"("processed");

-- CreateIndex: Index on rules event for faster lookups
CREATE INDEX "rules_event_idx" ON "rules"("event");

-- AddForeignKey: User Achievements to Game Profiles
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: User Achievements to Achievements
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: User Quests to Game Profiles
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: User Quests to Quests
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: User Rewards to Game Profiles
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: User Rewards to Rewards
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_updated_at_game_profiles
BEFORE UPDATE ON "game_profiles"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_achievements
BEFORE UPDATE ON "achievements"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_user_achievements
BEFORE UPDATE ON "user_achievements"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_quests
BEFORE UPDATE ON "quests"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_user_quests
BEFORE UPDATE ON "user_quests"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_rewards
BEFORE UPDATE ON "rewards"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_user_rewards
BEFORE UPDATE ON "user_rewards"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_rules
BEFORE UPDATE ON "rules"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_events
BEFORE UPDATE ON "events"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();