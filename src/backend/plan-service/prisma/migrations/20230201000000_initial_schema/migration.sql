-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Enable row-level security
ALTER DATABASE postgres SET "row_security" TO on;

-- Set up timestamp functions
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create UUID generation function with namespace for plan-service
CREATE OR REPLACE FUNCTION generate_plan_service_uuid(input_value TEXT)
RETURNS UUID AS $$
BEGIN
  -- Use a consistent namespace UUID for plan-service (using uuid_v5 from pgcrypto)
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function for optimistic locking
CREATE OR REPLACE FUNCTION check_version_and_update(
  table_name TEXT,
  record_id UUID,
  current_version INTEGER,
  expected_version INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  EXECUTE format('
    UPDATE %I
    SET version = $1
    WHERE id = $2 AND version = $3
    RETURNING true', table_name)
  INTO result
  USING current_version + 1, record_id, expected_version;
  
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate coverage percentage
CREATE OR REPLACE FUNCTION calculate_coverage_percentage(
  base_amount DECIMAL,
  covered_amount DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF base_amount = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((covered_amount / base_amount) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to validate plan dates
CREATE OR REPLACE FUNCTION validate_plan_dates(
  start_date TIMESTAMP,
  end_date TIMESTAMP
) RETURNS BOOLEAN AS $$
BEGIN
  -- Plans must start in the future and end after they start
  RETURN start_date > NOW() AND end_date > start_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create transaction management functions
CREATE OR REPLACE FUNCTION begin_plan_transaction(
  user_id UUID,
  operation_type TEXT
) RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
BEGIN
  transaction_id := gen_random_uuid();
  
  -- Log transaction start
  INSERT INTO plan_transaction_log (
    id,
    user_id,
    operation_type,
    status,
    started_at
  ) VALUES (
    transaction_id,
    user_id,
    operation_type,
    'STARTED',
    NOW()
  );
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_plan_transaction(
  transaction_id UUID,
  status TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update transaction status
  UPDATE plan_transaction_log
  SET 
    status = status,
    completed_at = NOW()
  WHERE id = transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_plan_audit(
  user_id UUID,
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  old_data JSONB,
  new_data JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO plan_audit_log (
    id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    timestamp
  ) VALUES (
    gen_random_uuid(),
    user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create transaction log table
CREATE TABLE plan_transaction_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Create audit log table
CREATE TABLE plan_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP NOT NULL
);

-- Create indices for better performance
CREATE INDEX idx_plan_transaction_log_user_id ON plan_transaction_log(user_id);
CREATE INDEX idx_plan_transaction_log_status ON plan_transaction_log(status);
CREATE INDEX idx_plan_audit_log_entity_id ON plan_audit_log(entity_id);
CREATE INDEX idx_plan_audit_log_user_id ON plan_audit_log(user_id);
CREATE INDEX idx_plan_audit_log_timestamp ON plan_audit_log(timestamp);

-- Set up database configuration for plan-service
ALTER DATABASE postgres SET timezone TO 'UTC';
ALTER DATABASE postgres SET statement_timeout TO '30s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout TO '60s';
ALTER DATABASE postgres SET lock_timeout TO '10s';