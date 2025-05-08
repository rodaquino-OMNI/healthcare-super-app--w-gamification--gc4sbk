-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "journey" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "profileId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("profileId", "achievementId")
);

-- CreateIndex
CREATE INDEX "achievements_journey_idx" ON "achievements"("journey");

-- CreateIndex
CREATE INDEX "user_achievements_unlocked_idx" ON "user_achievements"("unlocked");

-- CreateIndex
CREATE INDEX "user_achievements_profileId_idx" ON "user_achievements"("profileId");

-- CreateIndex
CREATE INDEX "user_achievements_achievementId_idx" ON "user_achievements"("achievementId");

-- CreateIndex
CREATE INDEX "user_achievements_profileId_unlocked_idx" ON "user_achievements"("profileId", "unlocked");

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraint to ensure journey is one of the valid values
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_journey_check" 
    CHECK ("journey" IN ('health', 'care', 'plan'));

-- Add check constraint to ensure progress is between 0 and 100
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_progress_check" 
    CHECK ("progress" >= 0 AND "progress" <= 100);

-- Add trigger to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON "achievements"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON "user_achievements"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment to tables and columns for better documentation
COMMENT ON TABLE "achievements" IS 'Stores achievement definitions for the gamification system across all journeys';
COMMENT ON COLUMN "achievements"."journey" IS 'The journey this achievement belongs to: health, care, or plan';
COMMENT ON COLUMN "achievements"."xpReward" IS 'Experience points awarded when this achievement is unlocked';

COMMENT ON TABLE "user_achievements" IS 'Tracks user progress towards unlocking achievements';
COMMENT ON COLUMN "user_achievements"."progress" IS 'Percentage progress towards unlocking the achievement (0-100)';
COMMENT ON COLUMN "user_achievements"."unlocked" IS 'Whether the user has unlocked this achievement';
COMMENT ON COLUMN "user_achievements"."unlockedAt" IS 'When the user unlocked this achievement, null if not yet unlocked';