-- CreateEnum
-- Define the event status enum to track processing state
CREATE TYPE "EventStatus" AS ENUM (
  'PENDING',    -- Event received but not yet processed
  'PROCESSING', -- Event is currently being processed
  'PROCESSED',  -- Event has been successfully processed
  'FAILED',     -- Event processing failed
  'RETRY',      -- Event is scheduled for retry
  'DEAD_LETTER' -- Event moved to dead letter queue after max retries
);

-- CreateEnum
-- Define the journey enum to categorize events by user journey
CREATE TYPE "Journey" AS ENUM (
  'health', -- My Health journey
  'care',   -- Care Now journey
  'plan'    -- My Plan & Benefits journey
);

-- CreateTable
-- Create the events table for storing and processing user events from all journeys
CREATE TABLE "Event" (
  -- Primary identification
  "id" UUID NOT NULL,
  
  -- Event metadata
  "type" TEXT NOT NULL,                      -- Event type (e.g., HEALTH_METRIC_RECORDED, APPOINTMENT_BOOKED)
  "userId" UUID NOT NULL,                    -- User who generated the event
  "journey" "Journey",                       -- Source journey (health, care, plan)
  "correlationId" UUID,                      -- For tracking related events
  "version" TEXT NOT NULL DEFAULT '1.0',     -- Schema version for backward compatibility
  
  -- Timestamps
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When event was created
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When event was last updated
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When event actually occurred
  
  -- Event data
  "payload" JSONB NOT NULL,                  -- Flexible event data in JSON format
  
  -- Processing status
  "status" "EventStatus" NOT NULL DEFAULT 'PENDING', -- Current processing status
  "processedAt" TIMESTAMP(3),                -- When event was processed
  
  -- Error handling
  "retryCount" INTEGER NOT NULL DEFAULT 0,   -- Number of processing attempts
  "nextRetryAt" TIMESTAMP(3),                -- When to retry processing
  "errorDetails" JSONB,                      -- Details about processing errors
  "deadLetterQueue" BOOLEAN NOT NULL DEFAULT false, -- Whether event is in dead letter queue
  "maxRetries" INTEGER NOT NULL DEFAULT 3,   -- Maximum number of retry attempts

  -- Constraints
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Create indices for efficient querying

-- Index for querying by user ID (common query pattern)
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- Index for querying by journey (for journey-specific processing)
CREATE INDEX "Event_journey_idx" ON "Event"("journey");

-- Index for querying by event type (for rule matching)
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- Index for querying by status (for processing queues)
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- Composite index for user ID and journey (common query pattern)
CREATE INDEX "Event_userId_journey_idx" ON "Event"("userId", "journey");

-- Composite index for user ID and event type (for user-specific rule processing)
CREATE INDEX "Event_userId_type_idx" ON "Event"("userId", "type");

-- Index for retry processing queue
CREATE INDEX "Event_nextRetryAt_status_idx" ON "Event"("nextRetryAt", "status") 
  WHERE "status" = 'RETRY';

-- Index for dead letter queue management
CREATE INDEX "Event_deadLetterQueue_idx" ON "Event"("deadLetterQueue") 
  WHERE "deadLetterQueue" = true;

-- Index for payload using GIN for efficient JSONB querying
CREATE INDEX "Event_payload_gin_idx" ON "Event" USING GIN ("payload");

-- Add update trigger to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_updated_at
BEFORE UPDATE ON "Event"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Add comment to the table for documentation
COMMENT ON TABLE "Event" IS 'Stores gamification events from all journeys (Health, Care, Plan) for processing rules, achievements, and rewards';