-- CreateTable
CREATE TABLE "rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rules_event_idx" ON "rules"("event");

-- Add comment to table
COMMENT ON TABLE "rules" IS 'Stores rule definitions for the gamification engine that determine how events trigger actions';

-- Add comments to columns
COMMENT ON COLUMN "rules"."id" IS 'Unique identifier for the rule';
COMMENT ON COLUMN "rules"."event" IS 'The event type that this rule listens for (e.g., STEPS_RECORDED, APPOINTMENT_COMPLETED, CLAIM_SUBMITTED)';
COMMENT ON COLUMN "rules"."condition" IS 'JavaScript expression that determines if the rule should be triggered based on event data';
COMMENT ON COLUMN "rules"."actions" IS 'JSON array of actions to be performed when the rule is triggered (e.g., award XP, progress achievement)';
COMMENT ON COLUMN "rules"."created_at" IS 'Timestamp when the rule was created';
COMMENT ON COLUMN "rules"."updated_at" IS 'Timestamp when the rule was last updated';