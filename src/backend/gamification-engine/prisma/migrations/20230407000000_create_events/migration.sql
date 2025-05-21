-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'RETRY_PENDING');

-- CreateEnum
CREATE TYPE "JourneyType" AS ENUM ('health', 'care', 'plan', 'system');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "journey" "JourneyType" NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "source" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,
    "deadLetterQueue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_userId_idx" ON "events"("userId");

-- CreateIndex
CREATE INDEX "events_journey_idx" ON "events"("journey");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "events_deadLetterQueue_idx" ON "events"("deadLetterQueue") WHERE "deadLetterQueue" = true;

-- CreateIndex
CREATE INDEX "events_userId_journey_type_idx" ON "events"("userId", "journey", "type");

-- CreateIndex
CREATE INDEX "events_status_retryCount_idx" ON "events"("status", "retryCount") WHERE "status" = 'RETRY_PENDING';

-- Add comment to table
COMMENT ON TABLE "events" IS 'Stores all events processed by the gamification engine from all journeys (Health, Care, Plan)';

-- Add comments to columns
COMMENT ON COLUMN "events"."id" IS 'Unique identifier for the event';
COMMENT ON COLUMN "events"."userId" IS 'User ID associated with this event';
COMMENT ON COLUMN "events"."journey" IS 'Journey context where the event originated (health, care, plan, system)';
COMMENT ON COLUMN "events"."type" IS 'Type of event (e.g., APPOINTMENT_BOOKED, GOAL_ACHIEVED, CLAIM_SUBMITTED)';
COMMENT ON COLUMN "events"."payload" IS 'Event-specific data stored as JSONB';
COMMENT ON COLUMN "events"."version" IS 'Schema version for backward compatibility';
COMMENT ON COLUMN "events"."source" IS 'Source service that generated this event';
COMMENT ON COLUMN "events"."status" IS 'Processing status of the event';
COMMENT ON COLUMN "events"."processedAt" IS 'Timestamp when the event was processed';
COMMENT ON COLUMN "events"."retryCount" IS 'Number of processing retry attempts';
COMMENT ON COLUMN "events"."errorDetails" IS 'Error information if processing failed';
COMMENT ON COLUMN "events"."deadLetterQueue" IS 'Flag indicating if the event has been moved to the dead letter queue';
COMMENT ON COLUMN "events"."createdAt" IS 'Timestamp when the event was created';
COMMENT ON COLUMN "events"."updatedAt" IS 'Timestamp when the event was last updated';

-- Create GIN index for efficient JSONB querying
CREATE INDEX "events_payload_gin_idx" ON "events" USING GIN ("payload" jsonb_path_ops);

-- Create partial index for pending events to optimize event processing
CREATE INDEX "events_pending_idx" ON "events"("createdAt") WHERE "status" = 'PENDING';

-- Create partial index for failed events to facilitate monitoring and troubleshooting
CREATE INDEX "events_failed_idx" ON "events"("createdAt") WHERE "status" = 'FAILED';