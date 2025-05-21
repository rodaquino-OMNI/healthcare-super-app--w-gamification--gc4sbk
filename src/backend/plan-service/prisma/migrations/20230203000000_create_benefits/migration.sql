-- CreateTable
CREATE TABLE "benefits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
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