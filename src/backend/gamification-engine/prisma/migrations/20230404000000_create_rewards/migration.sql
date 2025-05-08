-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('DIGITAL', 'PHYSICAL', 'DISCOUNT', 'BADGE', 'EXPERIENCE');

-- CreateTable
CREATE TABLE "rewards" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "icon" VARCHAR(255) NOT NULL,
    "journey" VARCHAR(50) NOT NULL,
    "category" "RewardCategory" NOT NULL,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_rewards" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rewards_journey_idx" ON "rewards"("journey");

-- CreateIndex
CREATE INDEX "rewards_category_idx" ON "rewards"("category");

-- CreateIndex
CREATE INDEX "rewards_isActive_journey_idx" ON "rewards"("isActive", "journey");

-- CreateIndex
CREATE INDEX "user_rewards_profileId_idx" ON "user_rewards"("profileId");

-- CreateIndex
CREATE INDEX "user_rewards_rewardId_idx" ON "user_rewards"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "user_rewards_profileId_rewardId_key" ON "user_rewards"("profileId", "rewardId");

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add comment to tables and columns for better documentation
COMMENT ON TABLE "rewards" IS 'Stores definitions of all available rewards in the gamification system';
COMMENT ON COLUMN "rewards"."id" IS 'Primary key, unique identifier for the reward';
COMMENT ON COLUMN "rewards"."title" IS 'Display name of the reward';
COMMENT ON COLUMN "rewards"."description" IS 'Detailed description of what the reward is and how it was earned';
COMMENT ON COLUMN "rewards"."xpReward" IS 'Amount of experience points awarded when earning this reward';
COMMENT ON COLUMN "rewards"."icon" IS 'Path or identifier for the reward''s visual representation';
COMMENT ON COLUMN "rewards"."journey" IS 'The journey this reward is associated with (health, care, plan, or global)';
COMMENT ON COLUMN "rewards"."category" IS 'Category of reward (digital, physical, discount, badge, experience)';
COMMENT ON COLUMN "rewards"."availableFrom" IS 'Optional start date when the reward becomes available';
COMMENT ON COLUMN "rewards"."availableTo" IS 'Optional end date when the reward is no longer available';
COMMENT ON COLUMN "rewards"."isActive" IS 'Flag indicating if the reward is currently active';

COMMENT ON TABLE "user_rewards" IS 'Junction table that tracks which rewards have been earned by which users';
COMMENT ON COLUMN "user_rewards"."id" IS 'Primary key, unique identifier for the user-reward relationship';
COMMENT ON COLUMN "user_rewards"."profileId" IS 'Foreign key to the game_profiles table';
COMMENT ON COLUMN "user_rewards"."rewardId" IS 'Foreign key to the rewards table';
COMMENT ON COLUMN "user_rewards"."earnedAt" IS 'When the user earned this reward';