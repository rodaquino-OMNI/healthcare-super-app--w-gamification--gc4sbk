-- Add indices and relations to health service database tables
-- This migration enhances database performance through strategic indexing
-- and ensures data integrity through proper foreign key constraints

-- Add indices to health_metrics table for efficient user-specific and time-series queries
CREATE INDEX IF NOT EXISTS "health_metrics_userId_idx" ON "health_metrics" ("userId");
CREATE INDEX IF NOT EXISTS "health_metrics_timestamp_idx" ON "health_metrics" ("timestamp");
-- Create composite index for user-specific time-series data
CREATE INDEX IF NOT EXISTS "health_metrics_userId_timestamp_idx" ON "health_metrics" ("userId", "timestamp");

-- Add foreign key constraints to health_goals table
ALTER TABLE "health_goals" ADD CONSTRAINT "health_goals_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Add index on timestamp fields for time-based queries
CREATE INDEX IF NOT EXISTS "health_goals_startDate_idx" ON "health_goals" ("startDate");
CREATE INDEX IF NOT EXISTS "health_goals_endDate_idx" ON "health_goals" ("endDate");
CREATE INDEX IF NOT EXISTS "health_goals_completedDate_idx" ON "health_goals" ("completedDate");

-- Add foreign key constraints to medical_events table
ALTER TABLE "medical_events" ADD CONSTRAINT "medical_events_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Add index on date field for time-based queries
CREATE INDEX IF NOT EXISTS "medical_events_date_idx" ON "medical_events" ("date");

-- Add foreign key constraints to device_connections table
ALTER TABLE "device_connections" ADD CONSTRAINT "device_connections_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Add index on lastSync field for time-based queries
CREATE INDEX IF NOT EXISTS "device_connections_lastSync_idx" ON "device_connections" ("lastSync");

-- Add indices on created/updated timestamps for all tables to support audit queries
CREATE INDEX IF NOT EXISTS "health_goals_createdAt_idx" ON "health_goals" ("createdAt");
CREATE INDEX IF NOT EXISTS "health_goals_updatedAt_idx" ON "health_goals" ("updatedAt");

CREATE INDEX IF NOT EXISTS "medical_events_createdAt_idx" ON "medical_events" ("createdAt");
CREATE INDEX IF NOT EXISTS "medical_events_updatedAt_idx" ON "medical_events" ("updatedAt");

CREATE INDEX IF NOT EXISTS "device_connections_createdAt_idx" ON "device_connections" ("createdAt");
CREATE INDEX IF NOT EXISTS "device_connections_updatedAt_idx" ON "device_connections" ("updatedAt");

-- Add TimescaleDB hypertable configuration for health_metrics table
-- This enables efficient time-series data queries with TimescaleDB
-- Note: This assumes TimescaleDB extension is already enabled
SELECT create_hypertable('health_metrics', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);

-- Add additional indices for health metrics by type for efficient filtering
CREATE INDEX IF NOT EXISTS "health_metrics_type_idx" ON "health_metrics" ("type");
CREATE INDEX IF NOT EXISTS "health_metrics_type_timestamp_idx" ON "health_metrics" ("type", "timestamp");
CREATE INDEX IF NOT EXISTS "health_metrics_userId_type_timestamp_idx" ON "health_metrics" ("userId", "type", "timestamp");

-- Add indices for health goals by type and status for efficient filtering
CREATE INDEX IF NOT EXISTS "health_goals_type_status_idx" ON "health_goals" ("type", "status");
CREATE INDEX IF NOT EXISTS "health_goals_period_idx" ON "health_goals" ("period");

-- Add indices for medical events by type for efficient filtering
CREATE INDEX IF NOT EXISTS "medical_events_type_idx" ON "medical_events" ("type");

-- Add indices for device connections by type and status for efficient filtering
CREATE INDEX IF NOT EXISTS "device_connections_deviceType_idx" ON "device_connections" ("deviceType");
CREATE INDEX IF NOT EXISTS "device_connections_status_idx" ON "device_connections" ("status");