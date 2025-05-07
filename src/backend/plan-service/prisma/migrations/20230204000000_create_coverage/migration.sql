-- CreateEnum
CREATE TYPE "ProcedureType" AS ENUM ('CONSULTATION', 'DIAGNOSTIC', 'LABORATORY', 'IMAGING', 'SURGERY', 'THERAPY', 'MEDICATION', 'OTHER');

-- CreateTable
CREATE TABLE "coverage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "procedure_type" "ProcedureType" NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "coverage_percentage" DECIMAL(5,2) NOT NULL,
    "deductible_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "copay_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "annual_limit" DECIMAL(12,2),
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "coverage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coverage_plan_id_idx" ON "coverage"("plan_id");

-- CreateIndex
CREATE INDEX "coverage_procedure_type_code_idx" ON "coverage"("procedure_type", "code");

-- CreateIndex
CREATE INDEX "coverage_is_active_effective_from_effective_to_idx" ON "coverage"("is_active", "effective_from", "effective_to");

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;