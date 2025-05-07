-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Create health_records table (parent table for health data)
CREATE TABLE "health_records" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create index on userId for faster lookups
CREATE INDEX "health_records_userId_idx" ON "health_records" ("userId");

-- Create health_metrics table for storing time-series health data
CREATE TABLE "health_metrics" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "unit" VARCHAR(20) NOT NULL,
  "timestamp" TIMESTAMP NOT NULL,
  "source" VARCHAR(50) NOT NULL,
  "notes" TEXT,
  "trend" DOUBLE PRECISION,
  "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Convert health_metrics to a TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('health_metrics', 'timestamp');

-- Create indices for health_metrics for faster querying
CREATE INDEX "health_metrics_userId_idx" ON "health_metrics" ("userId");
CREATE INDEX "health_metrics_type_idx" ON "health_metrics" ("type");
CREATE INDEX "health_metrics_timestamp_idx" ON "health_metrics" ("timestamp" DESC);

-- Create enum types for health goals
CREATE TYPE "GoalType" AS ENUM (
  'steps',
  'sleep',
  'water',
  'weight',
  'exercise',
  'heart_rate',
  'blood_pressure',
  'blood_glucose',
  'custom'
);

CREATE TYPE "GoalStatus" AS ENUM (
  'active',
  'completed',
  'abandoned'
);

CREATE TYPE "GoalPeriod" AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'custom'
);

-- Create health_goals table
CREATE TABLE "health_goals" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recordId" UUID NOT NULL,
  "type" "GoalType" NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "targetValue" DOUBLE PRECISION NOT NULL,
  "unit" VARCHAR(50) NOT NULL,
  "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "GoalStatus" NOT NULL DEFAULT 'active',
  "period" "GoalPeriod" NOT NULL,
  "startDate" TIMESTAMP NOT NULL DEFAULT now(),
  "endDate" TIMESTAMP,
  "completedDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_health_goals_recordId" FOREIGN KEY ("recordId") REFERENCES "health_records"("id") ON DELETE CASCADE
);

-- Create indices for health_goals
CREATE INDEX "health_goals_recordId_type_idx" ON "health_goals" ("recordId", "type");
CREATE INDEX "health_goals_status_idx" ON "health_goals" ("status");
CREATE INDEX "health_goals_period_idx" ON "health_goals" ("period");

-- Create medical_events table
CREATE TABLE "medical_events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recordId" UUID NOT NULL,
  "type" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP NOT NULL,
  "provider" VARCHAR(255),
  "documents" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_medical_events_recordId" FOREIGN KEY ("recordId") REFERENCES "health_records"("id") ON DELETE CASCADE
);

-- Create index for medical_events
CREATE INDEX "medical_events_recordId_type_idx" ON "medical_events" ("recordId", "type");
CREATE INDEX "medical_events_date_idx" ON "medical_events" ("date" DESC);

-- Create enum types for device connections
CREATE TYPE "ConnectionStatus" AS ENUM (
  'connected',
  'disconnected',
  'pairing',
  'error'
);

CREATE TYPE "DeviceType" AS ENUM (
  'smartwatch',
  'fitness_tracker',
  'smart_scale',
  'blood_pressure_monitor',
  'glucose_monitor',
  'sleep_tracker',
  'other'
);

-- Create device_connections table
CREATE TABLE "device_connections" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recordId" UUID NOT NULL,
  "deviceType" "DeviceType" NOT NULL DEFAULT 'other',
  "deviceId" VARCHAR(255) NOT NULL,
  "lastSync" TIMESTAMP,
  "status" "ConnectionStatus" NOT NULL DEFAULT 'disconnected',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_device_connections_recordId" FOREIGN KEY ("recordId") REFERENCES "health_records"("id") ON DELETE CASCADE
);

-- Create indices for device_connections
CREATE INDEX "device_connections_recordId_idx" ON "device_connections" ("recordId");
CREATE INDEX "device_connections_deviceId_idx" ON "device_connections" ("deviceId");

-- Create function to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updatedAt timestamp
CREATE TRIGGER update_health_records_updated_at
    BEFORE UPDATE ON "health_records"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_metrics_updated_at
    BEFORE UPDATE ON "health_metrics"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_goals_updated_at
    BEFORE UPDATE ON "health_goals"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_events_updated_at
    BEFORE UPDATE ON "medical_events"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_connections_updated_at
    BEFORE UPDATE ON "device_connections"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create compression policy for health_metrics (TimescaleDB feature)
-- This compresses data older than 30 days to save space while maintaining query performance
SELECT add_compression_policy('health_metrics', INTERVAL '30 days');

-- Create retention policy for health_metrics (TimescaleDB feature)
-- This keeps data for 5 years and automatically removes older data
SELECT add_retention_policy('health_metrics', INTERVAL '5 years');

-- Create continuous aggregates for common queries (TimescaleDB feature)
-- Daily average for numeric health metrics
CREATE MATERIALIZED VIEW health_metrics_daily_avg
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS day,
  userId,
  type,
  AVG(value) AS avg_value
FROM health_metrics
WHERE type IN ('HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'WEIGHT', 'STEPS')
GROUP BY day, userId, type;

-- Refresh policy for the continuous aggregate
SELECT add_continuous_aggregate_policy('health_metrics_daily_avg',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 day');