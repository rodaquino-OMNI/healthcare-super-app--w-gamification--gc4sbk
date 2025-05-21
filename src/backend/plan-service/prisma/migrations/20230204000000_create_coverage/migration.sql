-- CreateEnum
CREATE TYPE "ProcedureType" AS ENUM (
  'CONSULTATION',
  'DIAGNOSTIC',
  'LABORATORY',
  'IMAGING',
  'THERAPY',
  'SURGERY',
  'MEDICATION',
  'PREVENTIVE',
  'EMERGENCY',
  'OTHER'
);

-- CreateTable
-- This table stores coverage information for insurance plans
-- It defines what procedures are covered, at what percentage, and with what limitations
CREATE TABLE "coverage" (
  -- Primary identifier
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Procedure classification
  "procedure_type" "ProcedureType" NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  
  -- Coverage parameters
  "coverage_percentage" DECIMAL(5,2) NOT NULL,
  "deductible_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "copay_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "annual_limit" DECIMAL(12,2),
  
  -- Plan association
  "plan_id" UUID NOT NULL,
  
  -- Validity period
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  
  -- Status tracking
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,

  -- Constraints
  CONSTRAINT "coverage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Index for plan_id to optimize queries that filter by plan
CREATE INDEX "coverage_plan_id_idx" ON "coverage"("plan_id");

-- CreateIndex
-- Index for procedure_type and code to optimize coverage verification queries
CREATE INDEX "coverage_procedure_type_code_idx" ON "coverage"("procedure_type", "code");

-- CreateIndex
-- Index for is_active and effective dates to optimize current coverage checks
CREATE INDEX "coverage_is_active_effective_dates_idx" ON "coverage"("is_active", "effective_from", "effective_to");

-- AddForeignKey
-- Link coverage to plans
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comment to table
COMMENT ON TABLE "coverage" IS 'Stores insurance plan coverage details for medical procedures and services';

-- Add comments to columns
COMMENT ON COLUMN "coverage"."id" IS 'Unique identifier for the coverage entry';
COMMENT ON COLUMN "coverage"."procedure_type" IS 'Category of medical procedure (consultation, diagnostic, etc.)';
COMMENT ON COLUMN "coverage"."code" IS 'Standardized procedure code (e.g., CPT, ICD)';
COMMENT ON COLUMN "coverage"."name" IS 'Human-readable name of the procedure or service';
COMMENT ON COLUMN "coverage"."coverage_percentage" IS 'Percentage of the procedure cost covered by insurance (0-100)';
COMMENT ON COLUMN "coverage"."deductible_amount" IS 'Amount that must be paid by the insured before coverage applies';
COMMENT ON COLUMN "coverage"."copay_amount" IS 'Fixed amount paid by the insured for this procedure';
COMMENT ON COLUMN "coverage"."annual_limit" IS 'Maximum amount covered per year for this procedure, if applicable';
COMMENT ON COLUMN "coverage"."plan_id" IS 'Reference to the insurance plan this coverage belongs to';
COMMENT ON COLUMN "coverage"."effective_from" IS 'Date when this coverage becomes effective';
COMMENT ON COLUMN "coverage"."effective_to" IS 'Date when this coverage expires, null if indefinite';
COMMENT ON COLUMN "coverage"."is_active" IS 'Whether this coverage is currently active';
COMMENT ON COLUMN "coverage"."created_at" IS 'Timestamp when this record was created';
COMMENT ON COLUMN "coverage"."updated_at" IS 'Timestamp when this record was last updated';
COMMENT ON COLUMN "coverage"."metadata" IS 'Additional coverage-specific attributes stored as JSON';