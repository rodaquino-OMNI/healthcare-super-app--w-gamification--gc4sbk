-- CreateTable
CREATE TABLE "benefits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "limitations" TEXT,
    "exclusions" TEXT,
    "coverage_percentage" DECIMAL(5,2),
    "max_coverage_amount" DECIMAL(12,2),
    "annual_limit" DECIMAL(12,2),
    "waiting_period_days" INTEGER,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "benefits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "benefits_plan_id_idx" ON "benefits"("plan_id");

-- CreateIndex
CREATE INDEX "benefits_type_code_idx" ON "benefits"("type", "code");

-- CreateIndex
CREATE INDEX "benefits_is_active_effective_from_effective_to_idx" ON "benefits"("is_active", "effective_from", "effective_to");

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comment
COMMENT ON TABLE "benefits" IS 'Stores insurance benefits associated with plans';
COMMENT ON COLUMN "benefits"."id" IS 'Unique identifier for the benefit';
COMMENT ON COLUMN "benefits"."plan_id" IS 'Reference to the associated insurance plan';
COMMENT ON COLUMN "benefits"."type" IS 'Benefit type category (e.g., MEDICAL, DENTAL, VISION)';
COMMENT ON COLUMN "benefits"."code" IS 'Benefit code for internal reference';
COMMENT ON COLUMN "benefits"."name" IS 'Human-readable name of the benefit';
COMMENT ON COLUMN "benefits"."description" IS 'Detailed description of the benefit';
COMMENT ON COLUMN "benefits"."limitations" IS 'Any limitations or restrictions on the benefit';
COMMENT ON COLUMN "benefits"."exclusions" IS 'Specific exclusions for the benefit';
COMMENT ON COLUMN "benefits"."coverage_percentage" IS 'Percentage of costs covered by the benefit';
COMMENT ON COLUMN "benefits"."max_coverage_amount" IS 'Maximum monetary amount covered';
COMMENT ON COLUMN "benefits"."annual_limit" IS 'Annual limit for benefit usage';
COMMENT ON COLUMN "benefits"."waiting_period_days" IS 'Required waiting period in days before benefit is available';
COMMENT ON COLUMN "benefits"."effective_from" IS 'Date when the benefit becomes effective';
COMMENT ON COLUMN "benefits"."effective_to" IS 'Date when the benefit expires';
COMMENT ON COLUMN "benefits"."is_active" IS 'Whether the benefit is currently active';
COMMENT ON COLUMN "benefits"."created_at" IS 'Timestamp when the benefit was created';
COMMENT ON COLUMN "benefits"."updated_at" IS 'Timestamp when the benefit was last updated';
COMMENT ON COLUMN "benefits"."metadata" IS 'Additional benefit-specific attributes in JSON format';