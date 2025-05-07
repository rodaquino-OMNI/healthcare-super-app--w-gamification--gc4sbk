-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ADDITIONAL_INFO_REQUIRED',
  'APPROVED',
  'DENIED',
  'PAYMENT_PENDING',
  'COMPLETED',
  'REJECTED',
  'FAILED',
  'RESUBMITTING'
);

-- CreateTable
CREATE TABLE "claims" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
  "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
  "procedure_code" VARCHAR(50),
  "diagnosis_code" VARCHAR(50),
  "provider_name" VARCHAR(255),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submitted_at" TIMESTAMP(3),
  "processed_at" TIMESTAMP(3),
  "metadata" JSONB,

  CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claims_plan_id_idx" ON "claims"("plan_id");

-- CreateIndex
CREATE INDEX "claims_user_id_idx" ON "claims"("user_id");

-- CreateIndex
CREATE INDEX "claims_status_idx" ON "claims"("status");

-- CreateIndex
CREATE INDEX "claims_type_idx" ON "claims"("type");

-- CreateIndex
CREATE INDEX "claims_submitted_at_idx" ON "claims"("submitted_at");

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_claims_updated_at
BEFORE UPDATE ON "claims"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Add comment to table
COMMENT ON TABLE "claims" IS 'Stores insurance claim submissions and their processing status';

-- Add comments to columns
COMMENT ON COLUMN "claims"."id" IS 'Unique identifier for the claim';
COMMENT ON COLUMN "claims"."plan_id" IS 'Reference to the insurance plan associated with this claim';
COMMENT ON COLUMN "claims"."user_id" IS 'User who submitted the claim';
COMMENT ON COLUMN "claims"."type" IS 'Type of claim (e.g., MEDICAL_VISIT, PROCEDURE, EXAM, THERAPY)';
COMMENT ON COLUMN "claims"."amount" IS 'Monetary amount of the claim';
COMMENT ON COLUMN "claims"."currency" IS 'Currency code for the claim amount';
COMMENT ON COLUMN "claims"."status" IS 'Current status in the claim lifecycle';
COMMENT ON COLUMN "claims"."procedure_code" IS 'Medical procedure code associated with the claim';
COMMENT ON COLUMN "claims"."diagnosis_code" IS 'Diagnosis code associated with the claim';
COMMENT ON COLUMN "claims"."provider_name" IS 'Healthcare provider who performed the service';
COMMENT ON COLUMN "claims"."notes" IS 'Additional notes or information about the claim';
COMMENT ON COLUMN "claims"."created_at" IS 'Timestamp when the claim was created';
COMMENT ON COLUMN "claims"."updated_at" IS 'Timestamp when the claim was last updated';
COMMENT ON COLUMN "claims"."submitted_at" IS 'Timestamp when the claim was submitted for processing';
COMMENT ON COLUMN "claims"."processed_at" IS 'Timestamp when the claim was processed';
COMMENT ON COLUMN "claims"."metadata" IS 'Additional flexible attributes stored as JSON';