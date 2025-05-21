-- CreateTable for the gamification engine's rule system
-- This table stores rule definitions that determine how points and achievements are awarded
-- based on user actions across all journeys (Health, Care, Plan)
CREATE TABLE "rules" (
    -- Unique identifier for the rule
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    
    -- The event type that this rule listens for
    -- Examples: "STEPS_RECORDED", "APPOINTMENT_COMPLETED", "CLAIM_SUBMITTED"
    "event" TEXT NOT NULL,
    
    -- A JavaScript expression that determines if the rule should be triggered
    -- Example: "event.data.steps >= 10000" or "event.data.appointmentType === 'TELEMEDICINE'"
    "condition" TEXT NOT NULL,
    
    -- A JSON array of actions to be performed when the rule is triggered
    -- Example: [{"type": "AWARD_XP", "value": 50}, {"type": "PROGRESS_ACHIEVEMENT", "achievementId": "active-lifestyle", "value": 1}]
    "actions" JSONB NOT NULL,
    
    -- Timestamp for when the rule was created
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamp for when the rule was last updated
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    
    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for efficient rule lookup by event type
CREATE INDEX "rules_event_idx" ON "rules"("event");

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rules_timestamp
BEFORE UPDATE ON "rules"
FOR EACH ROW
EXECUTE FUNCTION trigger_update_timestamp();