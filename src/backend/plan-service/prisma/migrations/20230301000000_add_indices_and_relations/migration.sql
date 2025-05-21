-- AddForeignKey: Add foreign key constraints between benefits and plans tables
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Add foreign key constraints between coverage and plans tables
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Add foreign key constraints between claims and plans tables
ALTER TABLE "claims" ADD CONSTRAINT "claims_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Add foreign key constraints between documents and claims tables
ALTER TABLE "documents" ADD CONSTRAINT "documents_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: Optimize plans queries with indices on user_id, type, and is_active
CREATE INDEX "plans_user_id_idx" ON "plans"("user_id");
CREATE INDEX "plans_type_idx" ON "plans"("type");
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- CreateIndex: Optimize benefits queries with indices on plan_id, type, and is_active
CREATE INDEX "benefits_plan_id_idx" ON "benefits"("plan_id");
CREATE INDEX "benefits_type_idx" ON "benefits"("type");
CREATE INDEX "benefits_is_active_idx" ON "benefits"("is_active");

-- CreateIndex: Optimize coverage queries with indices on plan_id and is_active
CREATE INDEX "coverage_plan_id_idx" ON "coverage"("plan_id");
CREATE INDEX "coverage_is_active_idx" ON "coverage"("is_active");

-- CreateIndex: Optimize claims queries with indices on plan_id, user_id, status, and type
CREATE INDEX "claims_plan_id_idx" ON "claims"("plan_id");
CREATE INDEX "claims_user_id_idx" ON "claims"("user_id");
CREATE INDEX "claims_status_idx" ON "claims"("status");
CREATE INDEX "claims_type_idx" ON "claims"("type");

-- CreateIndex: Optimize document queries with indices on claim_id, document_type, and verification_status
CREATE INDEX "documents_claim_id_idx" ON "documents"("claim_id");
CREATE INDEX "documents_document_type_idx" ON "documents"("document_type");
CREATE INDEX "documents_verification_status_idx" ON "documents"("verification_status");

-- CreateIndex: Create composite indices for common query patterns in plan comparison
CREATE INDEX "plans_user_id_is_active_idx" ON "plans"("user_id", "is_active");
CREATE INDEX "plans_type_is_active_idx" ON "plans"("type", "is_active");

-- CreateIndex: Create composite indices for common query patterns in benefits lookup
CREATE INDEX "benefits_plan_id_type_idx" ON "benefits"("plan_id", "type");
CREATE INDEX "benefits_plan_id_is_active_idx" ON "benefits"("plan_id", "is_active");

-- CreateIndex: Create composite indices for common query patterns in claims processing
CREATE INDEX "claims_plan_id_status_idx" ON "claims"("plan_id", "status");
CREATE INDEX "claims_user_id_status_idx" ON "claims"("user_id", "status");
CREATE INDEX "claims_plan_id_type_idx" ON "claims"("plan_id", "type");

-- CreateIndex: Create composite indices for document verification workflows
CREATE INDEX "documents_claim_id_verification_status_idx" ON "documents"("claim_id", "verification_status");
CREATE INDEX "documents_claim_id_document_type_idx" ON "documents"("claim_id", "document_type");