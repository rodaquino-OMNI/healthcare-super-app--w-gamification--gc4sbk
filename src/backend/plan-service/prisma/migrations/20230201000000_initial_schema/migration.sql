-- Initial PostgreSQL setup for the AUSTA SuperApp Plan Service
-- This migration establishes the foundation for all plan-service database operations

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for plan service
CREATE SCHEMA IF NOT EXISTS plan_service;

-- Set search path to include our schema
SET search_path TO public, plan_service;

-- Create users table (referenced by plans in subsequent migrations)
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "external_id" TEXT,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
-- Create index on external_id for faster lookups
CREATE INDEX "users_external_id_idx" ON "users"("external_id");

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for optimistic locking
CREATE OR REPLACE FUNCTION check_optimistic_lock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.version != NEW.version - 1 THEN
        RAISE EXCEPTION 'Optimistic lock failure: record has been modified since last read';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the updated_at trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply optimistic locking trigger to users table
CREATE TRIGGER check_users_optimistic_lock
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION check_optimistic_lock();

-- Create function to calculate coverage percentage
CREATE OR REPLACE FUNCTION calculate_coverage_percentage(
    claim_amount DECIMAL,
    deductible DECIMAL,
    coinsurance_rate DECIMAL,
    max_out_of_pocket DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    covered_amount DECIMAL;
    patient_responsibility DECIMAL;
BEGIN
    -- Apply deductible
    IF claim_amount <= deductible THEN
        RETURN 0;
    END IF;
    
    -- Calculate patient responsibility after deductible
    patient_responsibility := deductible + ((claim_amount - deductible) * coinsurance_rate);
    
    -- Apply max out of pocket
    IF patient_responsibility > max_out_of_pocket THEN
        patient_responsibility := max_out_of_pocket;
    END IF;
    
    -- Calculate covered amount
    covered_amount := claim_amount - patient_responsibility;
    
    -- Return coverage percentage
    RETURN (covered_amount / claim_amount) * 100;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate date ranges for plans and benefits
CREATE OR REPLACE FUNCTION validate_date_range(
    effective_from TIMESTAMP,
    effective_to TIMESTAMP
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if effective_from is before effective_to
    IF effective_to IS NOT NULL AND effective_from >= effective_to THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create transaction management functions for improved performance
CREATE OR REPLACE FUNCTION begin_plan_transaction()
RETURNS VOID AS $$
BEGIN
    -- Set transaction isolation level
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    
    -- Set statement timeout for plan operations
    SET LOCAL statement_timeout = '30s';
END;
$$ LANGUAGE plpgsql;

-- Create index on updated_at for efficient auditing queries
CREATE INDEX "users_updated_at_idx" ON "users"("updated_at");

-- Create function to generate plan numbers with proper formatting
CREATE OR REPLACE FUNCTION generate_plan_number(
    plan_type TEXT,
    user_id UUID
)
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
    type_code TEXT;
BEGIN
    -- Extract first two letters of plan type
    type_code := UPPER(SUBSTRING(plan_type, 1, 2));
    
    -- Generate timestamp part (YYMMDDHHmmss)
    timestamp_part := TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDD');
    
    -- Generate random part (last 4 characters of user_id)
    random_part := SUBSTRING(user_id::TEXT, LENGTH(user_id::TEXT)-3, 4);
    
    -- Combine parts with proper formatting
    RETURN type_code || '-' || timestamp_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if a plan is active based on effective dates
CREATE OR REPLACE FUNCTION is_plan_active(
    effective_from TIMESTAMP,
    effective_to TIMESTAMP
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Plan is active if current date is within effective range
    RETURN (
        CURRENT_TIMESTAMP >= effective_from AND
        (effective_to IS NULL OR CURRENT_TIMESTAMP <= effective_to)
    );
END;
$$ LANGUAGE plpgsql;

-- Create extension for full-text search capabilities
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create extension for advanced analytics on plan data
CREATE EXTENSION IF NOT EXISTS tablefunc;

-- Set up database parameters for optimal performance with plan-service workload
ALTER DATABASE CURRENT SET
    work_mem = '16MB',
    maintenance_work_mem = '128MB',
    random_page_cost = 1.1,
    effective_cache_size = '4GB';

-- Comment on schema objects for documentation
COMMENT ON TABLE "users" IS 'Users table for the plan service - stores basic user information for plan ownership';
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp and increments version for optimistic locking';
COMMENT ON FUNCTION check_optimistic_lock() IS 'Implements optimistic locking to prevent concurrent update conflicts';
COMMENT ON FUNCTION calculate_coverage_percentage() IS 'Calculates insurance coverage percentage based on plan parameters';
COMMENT ON FUNCTION validate_date_range() IS 'Validates that effective date ranges are properly ordered';
COMMENT ON FUNCTION begin_plan_transaction() IS 'Sets up optimal transaction parameters for plan-related operations';
COMMENT ON FUNCTION generate_plan_number() IS 'Generates formatted plan numbers with type code, timestamp, and user identifier';
COMMENT ON FUNCTION is_plan_active() IS 'Determines if a plan is currently active based on its effective date range';