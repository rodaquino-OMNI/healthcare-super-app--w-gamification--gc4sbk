-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ADDITIONAL_INFO_REQUIRED',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'DENIED',
  'APPEALED',
  'COMPLETED',
  'CANCELLED'
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