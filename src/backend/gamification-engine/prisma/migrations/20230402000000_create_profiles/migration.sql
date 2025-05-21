-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "JourneyType" AS ENUM ('HEALTH', 'CARE', 'PLAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "game_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "healthJourneyData" JSONB NOT NULL DEFAULT '{}',
    "careJourneyData" JSONB NOT NULL DEFAULT '{}',
    "planJourneyData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_profiles_userId_key" ON "game_profiles"("userId");

-- CreateIndex
CREATE INDEX "game_profiles_level_idx" ON "game_profiles"("level");

-- CreateIndex
CREATE INDEX "game_profiles_totalXp_idx" ON "game_profiles"("totalXp");

-- CreateIndex
CREATE INDEX "game_profiles_createdAt_idx" ON "game_profiles"("createdAt");

-- CreateIndex
CREATE INDEX "game_profiles_updatedAt_idx" ON "game_profiles"("updatedAt");

-- Add GIN indexes for efficient JSON querying on journey data
CREATE INDEX "game_profiles_healthJourneyData_idx" ON "game_profiles" USING GIN ("healthJourneyData");
CREATE INDEX "game_profiles_careJourneyData_idx" ON "game_profiles" USING GIN ("careJourneyData");
CREATE INDEX "game_profiles_planJourneyData_idx" ON "game_profiles" USING GIN ("planJourneyData");
CREATE INDEX "game_profiles_preferences_idx" ON "game_profiles" USING GIN ("preferences");

-- Add comment to explain the purpose of the GIN indexes
COMMENT ON INDEX "game_profiles_healthJourneyData_idx" IS 'GIN index for efficient querying of Health journey data stored in JSONB';
COMMENT ON INDEX "game_profiles_careJourneyData_idx" IS 'GIN index for efficient querying of Care journey data stored in JSONB';
COMMENT ON INDEX "game_profiles_planJourneyData_idx" IS 'GIN index for efficient querying of Plan journey data stored in JSONB';
COMMENT ON INDEX "game_profiles_preferences_idx" IS 'GIN index for efficient querying of user preferences stored in JSONB';

-- Add comment to explain the purpose of the table and its relationships
COMMENT ON TABLE "game_profiles" IS 'Stores user gamification profiles with progress tracking across all three journeys (Health, Care, and Plan). Referenced by user_achievements and user_rewards tables';

-- Add comments to explain the purpose of each column
COMMENT ON COLUMN "game_profiles"."id" IS 'Primary key for the profile (UUID)';
COMMENT ON COLUMN "game_profiles"."userId" IS 'Unique identifier for the user, linked to the auth service';
COMMENT ON COLUMN "game_profiles"."displayName" IS 'User-friendly name displayed in leaderboards and achievements';
COMMENT ON COLUMN "game_profiles"."avatarUrl" IS 'Optional URL to the user''s avatar image';
COMMENT ON COLUMN "game_profiles"."level" IS 'Current gamification level of the user';
COMMENT ON COLUMN "game_profiles"."xp" IS 'Current experience points within the current level';
COMMENT ON COLUMN "game_profiles"."totalXp" IS 'Total accumulated experience points across all levels';
COMMENT ON COLUMN "game_profiles"."preferences" IS 'User preferences for gamification features stored as JSONB';
COMMENT ON COLUMN "game_profiles"."healthJourneyData" IS 'Health journey-specific gamification data stored as JSONB';
COMMENT ON COLUMN "game_profiles"."careJourneyData" IS 'Care journey-specific gamification data stored as JSONB';
COMMENT ON COLUMN "game_profiles"."planJourneyData" IS 'Plan journey-specific gamification data stored as JSONB';
COMMENT ON COLUMN "game_profiles"."createdAt" IS 'Timestamp when the profile was created';
COMMENT ON COLUMN "game_profiles"."updatedAt" IS 'Timestamp when the profile was last updated';

-- Add comments to explain the relationship with other tables
COMMENT ON TABLE "game_profiles" IS 'Stores user gamification profiles with progress tracking across all three journeys (Health, Care, and Plan). Referenced by user_achievements and user_rewards tables.';