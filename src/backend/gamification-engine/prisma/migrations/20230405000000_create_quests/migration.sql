-- CreateEnum
CREATE TYPE "Journey" AS ENUM ('HEALTH', 'CARE', 'PLAN');

-- CreateTable
CREATE TABLE "quests" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "journey" "Journey" NOT NULL,
    "icon" VARCHAR(255),
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quests" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "questId" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quests_journey_idx" ON "quests"("journey");

-- CreateIndex
CREATE INDEX "user_quests_profileId_idx" ON "user_quests"("profileId");

-- CreateIndex
CREATE INDEX "user_quests_questId_idx" ON "user_quests"("questId");

-- CreateIndex
CREATE INDEX "user_quests_isCompleted_idx" ON "user_quests"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "user_quests_profileId_questId_key" ON "user_quests"("profileId", "questId");

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;