-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('steps', 'sleep', 'water', 'weight', 'exercise', 'heart_rate', 'blood_pressure', 'blood_glucose', 'custom');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('daily', 'weekly', 'monthly', 'custom');

-- CreateTable
CREATE TABLE "health_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recordId" UUID NOT NULL,
    "type" "GoalType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "period" "GoalPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_goals_recordId_type_idx" ON "health_goals"("recordId", "type");

-- CreateIndex
CREATE INDEX "health_goals_status_idx" ON "health_goals"("status");

-- CreateIndex
CREATE INDEX "health_goals_period_idx" ON "health_goals"("period");

-- Add trigger for automatic updatedAt timestamp
CREATE OR REPLACE FUNCTION update_health_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_health_goals_updated_at
BEFORE UPDATE ON "health_goals"
FOR EACH ROW
EXECUTE FUNCTION update_health_goals_updated_at();