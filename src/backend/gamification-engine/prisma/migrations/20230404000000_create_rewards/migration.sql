-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "Journey" AS ENUM ('HEALTH', 'CARE', 'PLAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "rewards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "icon" VARCHAR(255),
    "journey" "Journey" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_rewards" (
    "profileId" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_rewards_pkey" PRIMARY KEY ("profileId","rewardId")
);

-- CreateIndex
CREATE INDEX "rewards_journey_idx" ON "rewards"("journey");

-- CreateIndex
CREATE INDEX "rewards_xpReward_idx" ON "rewards"("xpReward");

-- CreateIndex
CREATE INDEX "user_rewards_profileId_idx" ON "user_rewards"("profileId");

-- CreateIndex
CREATE INDEX "user_rewards_rewardId_idx" ON "user_rewards"("rewardId");

-- CreateIndex
CREATE INDEX "user_rewards_earnedAt_idx" ON "user_rewards"("earnedAt");

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;