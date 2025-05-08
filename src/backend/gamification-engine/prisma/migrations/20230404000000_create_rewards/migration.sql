-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('DIGITAL', 'PHYSICAL', 'DISCOUNT', 'EXPERIENCE');

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
CREATE INDEX "rewards_isActive_idx" ON "rewards"("isActive");

-- CreateIndex
CREATE INDEX "rewards_availableFrom_availableTo_idx" ON "rewards"("availableFrom", "availableTo");

-- CreateIndex
CREATE INDEX "user_rewards_profileId_idx" ON "user_rewards"("profileId");

-- CreateIndex
CREATE INDEX "user_rewards_rewardId_idx" ON "user_rewards"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "user_rewards_profileId_rewardId_key" ON "user_rewards"("profileId", "rewardId");

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comment to tables and columns for better documentation
COMMENT ON TABLE "rewards" IS 'Stores reward definitions available in the gamification system';
COMMENT ON COLUMN "rewards"."id" IS 'Unique identifier for the reward';
COMMENT ON COLUMN "rewards"."title" IS 'Display title of the reward';
COMMENT ON COLUMN "rewards"."description" IS 'Detailed description of what the reward provides';
COMMENT ON COLUMN "rewards"."xpReward" IS 'Amount of experience points awarded when earning this reward';
COMMENT ON COLUMN "rewards"."icon" IS 'Icon path or name used to visually represent the reward';
COMMENT ON COLUMN "rewards"."journey" IS 'The journey this reward is associated with (health, care, plan, or global)';
COMMENT ON COLUMN "rewards"."category" IS 'Category determining how the reward can be redeemed';
COMMENT ON COLUMN "rewards"."availableFrom" IS 'Optional start date when the reward becomes available';
COMMENT ON COLUMN "rewards"."availableTo" IS 'Optional end date when the reward is no longer available';
COMMENT ON COLUMN "rewards"."isActive" IS 'Flag indicating if the reward is currently active and can be earned';

COMMENT ON TABLE "user_rewards" IS 'Junction table tracking which users have earned specific rewards';
COMMENT ON COLUMN "user_rewards"."id" IS 'Unique identifier for the user reward record';
COMMENT ON COLUMN "user_rewards"."profileId" IS 'Reference to the game profile that earned the reward';
COMMENT ON COLUMN "user_rewards"."rewardId" IS 'Reference to the earned reward';
COMMENT ON COLUMN "user_rewards"."earnedAt" IS 'Timestamp when the reward was earned by the user';