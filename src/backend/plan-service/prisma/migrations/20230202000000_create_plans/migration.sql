-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan_number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "premium_amount" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" UUID NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_plan_number_key" ON "plans"("plan_number");

-- CreateIndex
CREATE INDEX "plans_user_id_idx" ON "plans"("user_id");

-- CreateIndex
CREATE INDEX "plans_type_idx" ON "plans"("type");

-- CreateIndex
CREATE INDEX "plans_effective_from_effective_to_idx" ON "plans"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;