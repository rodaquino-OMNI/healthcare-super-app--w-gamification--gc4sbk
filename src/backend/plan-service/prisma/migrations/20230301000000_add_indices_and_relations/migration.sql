-- Migration: 20230301000000_add_indices_and_relations
-- Purpose: Enhance database performance through strategic indexing and ensure data integrity
--          through proper foreign key constraints for the Plan Service component.

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- These constraints enforce referential integrity between related tables,
-- preventing orphaned records and ensuring data consistency.

-- Benefits to Plans relationship
-- When a plan is deleted, all associated benefits are automatically removed (CASCADE)
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Coverage to Plans relationship
-- When a plan is deleted, all associated coverage entries are automatically removed (CASCADE)
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Claims to Plans relationship
-- Prevents deletion of plans that have associated claims (RESTRICT)
-- This ensures claims are properly processed before a plan can be removed
ALTER TABLE "claims" ADD CONSTRAINT "claims_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Documents to Claims relationship
-- When a claim is deleted, all associated documents are automatically removed (CASCADE)
ALTER TABLE "documents" ADD CONSTRAINT "documents_claim_id_fkey" 
    FOREIGN KEY ("claim_id") REFERENCES "claims"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- SINGLE-COLUMN INDICES
-- ============================================================================
-- These indices optimize queries that filter, sort, or join on individual columns

-- Plans table indices
-- Optimize user plan queries and filtering by plan attributes
CREATE INDEX "plans_user_id_idx" ON "plans"("user_id");          -- For retrieving all plans for a specific user
CREATE INDEX "plans_type_idx" ON "plans"("type");               -- For filtering plans by type (e.g., health, dental, vision)
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");     -- For filtering active/inactive plans
CREATE INDEX "plans_start_date_idx" ON "plans"("start_date");   -- For date range queries and sorting by start date
CREATE INDEX "plans_end_date_idx" ON "plans"("end_date");       -- For expiration queries and sorting by end date

-- Benefits table indices
-- Optimize benefit lookups and filtering operations
CREATE INDEX "benefits_plan_id_idx" ON "benefits"("plan_id");    -- For retrieving all benefits for a specific plan
CREATE INDEX "benefits_type_idx" ON "benefits"("type");          -- For filtering benefits by type
CREATE INDEX "benefits_is_active_idx" ON "benefits"("is_active"); -- For filtering active/inactive benefits

-- Coverage table indices
-- Optimize coverage verification and category-based queries
CREATE INDEX "coverage_plan_id_idx" ON "coverage"("plan_id");     -- For retrieving all coverage items for a plan
CREATE INDEX "coverage_is_active_idx" ON "coverage"("is_active"); -- For filtering active/inactive coverage
CREATE INDEX "coverage_category_idx" ON "coverage"("category");   -- For filtering by coverage category

-- Claims table indices
-- Optimize claim retrieval, status filtering, and date-based queries
CREATE INDEX "claims_plan_id_idx" ON "claims"("plan_id");           -- For retrieving all claims for a plan
CREATE INDEX "claims_user_id_idx" ON "claims"("user_id");           -- For retrieving all claims for a user
CREATE INDEX "claims_status_idx" ON "claims"("status");             -- For filtering claims by status
CREATE INDEX "claims_type_idx" ON "claims"("type");                 -- For filtering claims by type
CREATE INDEX "claims_submission_date_idx" ON "claims"("submission_date"); -- For date range queries and sorting

-- Documents table indices
-- Optimize document retrieval, type filtering, and verification status queries
CREATE INDEX "documents_claim_id_idx" ON "documents"("claim_id");   -- For retrieving all documents for a claim
CREATE INDEX "documents_document_type_idx" ON "documents"("document_type"); -- For filtering by document type
CREATE INDEX "documents_verification_status_idx" ON "documents"("verification_status"); -- For filtering by verification status
CREATE INDEX "documents_upload_date_idx" ON "documents"("upload_date"); -- For date range queries and sorting

-- ============================================================================
-- COMPOSITE INDICES
-- ============================================================================
-- These indices optimize complex queries that filter on multiple columns simultaneously

-- Plans table composite indices
-- Optimize common plan query patterns
CREATE INDEX "plans_user_id_is_active_idx" ON "plans"("user_id", "is_active"); -- For retrieving active plans for a user
CREATE INDEX "plans_user_id_type_idx" ON "plans"("user_id", "type");       -- For retrieving specific plan types for a user

-- Benefits table composite indices
-- Optimize benefit lookup patterns
CREATE INDEX "benefits_plan_id_type_idx" ON "benefits"("plan_id", "type");       -- For retrieving specific benefit types for a plan
CREATE INDEX "benefits_plan_id_is_active_idx" ON "benefits"("plan_id", "is_active"); -- For retrieving active benefits for a plan

-- Coverage table composite indices
-- Optimize coverage verification workflows
CREATE INDEX "coverage_plan_id_is_active_idx" ON "coverage"("plan_id", "is_active"); -- For retrieving active coverage for a plan
CREATE INDEX "coverage_plan_id_category_idx" ON "coverage"("plan_id", "category"); -- For retrieving specific coverage categories for a plan

-- Claims table composite indices
-- Optimize claims processing and user history views
CREATE INDEX "claims_user_id_status_idx" ON "claims"("user_id", "status"); -- For retrieving claims with specific status for a user
CREATE INDEX "claims_plan_id_status_idx" ON "claims"("plan_id", "status"); -- For retrieving claims with specific status for a plan
CREATE INDEX "claims_user_id_submission_date_idx" ON "claims"("user_id", "submission_date"); -- For chronological claim history

-- Documents table composite indices
-- Optimize document retrieval workflows
CREATE INDEX "documents_claim_id_document_type_idx" ON "documents"("claim_id", "document_type"); -- For retrieving specific document types for a claim
CREATE INDEX "documents_claim_id_verification_status_idx" ON "documents"("claim_id", "verification_status"); -- For verification workflow

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- This migration enhances the plan-service database by:
-- 1. Adding foreign key constraints between related tables to enforce referential integrity
-- 2. Creating single-column indices on frequently queried columns for faster filtering and sorting
-- 3. Implementing composite indices for common query patterns to optimize complex queries
-- 4. Supporting efficient query patterns for the 'Meu Plano & Benefícios' journey features
--
-- These optimizations are essential for:
-- - Improving overall database performance for plan-related operations
-- - Ensuring data integrity between plans, benefits, coverage, claims, and documents
-- - Accelerating common query patterns used in the Plan journey
-- - Supporting efficient plan comparison, claim processing, and benefit verification workflows