-- Migration to add performance indices and foreign key relationships to health service tables
-- This migration enhances query performance and ensures data integrity across the health service

-- Add indices on health_metrics table for user-specific and time-series queries
CREATE INDEX IF NOT EXISTS "health_metrics_userId_idx" ON "health_metrics" ("userId");
CREATE INDEX IF NOT EXISTS "health_metrics_timestamp_idx" ON "health_metrics" ("timestamp");

-- Add composite index for user-specific time-series queries
CREATE INDEX IF NOT EXISTS "health_metrics_userId_timestamp_idx" ON "health_metrics" ("userId", "timestamp" DESC);

-- Add foreign key constraints from health_goals to health_records
ALTER TABLE "health_goals" ADD CONSTRAINT "health_goals_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index on health_goals timestamp fields for time-based queries
CREATE INDEX IF NOT EXISTS "health_goals_startDate_idx" ON "health_goals" ("startDate");
CREATE INDEX IF NOT EXISTS "health_goals_endDate_idx" ON "health_goals" ("endDate");
CREATE INDEX IF NOT EXISTS "health_goals_createdAt_idx" ON "health_goals" ("createdAt");

-- Add foreign key constraints from medical_events to health_records
ALTER TABLE "medical_events" ADD CONSTRAINT "medical_events_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index on medical_events timestamp fields for time-based queries
CREATE INDEX IF NOT EXISTS "medical_events_date_idx" ON "medical_events" ("date");
CREATE INDEX IF NOT EXISTS "medical_events_createdAt_idx" ON "medical_events" ("createdAt");

-- Add foreign key constraints from device_connections to health_records
ALTER TABLE "device_connections" ADD CONSTRAINT "device_connections_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index on device_connections timestamp fields for time-based queries
CREATE INDEX IF NOT EXISTS "device_connections_lastSync_idx" ON "device_connections" ("lastSync");
CREATE INDEX IF NOT EXISTS "device_connections_createdAt_idx" ON "device_connections" ("createdAt");

-- Add composite indices for common query patterns
CREATE INDEX IF NOT EXISTS "health_goals_recordId_type_idx" ON "health_goals" ("recordId", "type");
CREATE INDEX IF NOT EXISTS "health_goals_recordId_status_idx" ON "health_goals" ("recordId", "status");
CREATE INDEX IF NOT EXISTS "medical_events_recordId_type_idx" ON "medical_events" ("recordId", "type");
CREATE INDEX IF NOT EXISTS "device_connections_recordId_deviceType_idx" ON "device_connections" ("recordId", "deviceType");

-- TimescaleDB optimization for health_metrics table (if TimescaleDB extension is enabled)
-- This converts the health_metrics table to a hypertable partitioned by timestamp
-- Note: This requires the TimescaleDB extension to be installed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) THEN
        -- Check if the table is already a hypertable
        IF NOT EXISTS (
            SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = 'health_metrics'
        ) THEN
            -- Convert health_metrics to a TimescaleDB hypertable
            PERFORM create_hypertable('health_metrics', 'timestamp', 
                                     chunk_time_interval => INTERVAL '1 day',
                                     if_not_exists => TRUE);
            
            -- Add compression policy (compress chunks older than 7 days)
            ALTER TABLE health_metrics SET (timescaledb.compress = true);
            SELECT add_compression_policy('health_metrics', INTERVAL '7 days');
        END IF;
    END IF;
END
$$;