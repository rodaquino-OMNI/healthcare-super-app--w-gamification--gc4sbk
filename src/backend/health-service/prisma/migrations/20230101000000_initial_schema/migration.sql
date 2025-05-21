-- Initial schema migration for the AUSTA SuperApp Health Service
-- This migration establishes the foundation for all health-related data storage
-- using PostgreSQL 14 with TimescaleDB extension for time-series data

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Configure timestamp handling
SET timezone = 'UTC';

-- Create health_metrics table for time-series health data
CREATE TABLE "health_metrics" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "unit" VARCHAR(20) NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "source" VARCHAR(50) NOT NULL,
  "notes" TEXT,
  "trend" DOUBLE PRECISION,
  "isAbnormal" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert health_metrics to a TimescaleDB hypertable for efficient time-series operations
-- This enables high-performance time-series queries for health data analytics
SELECT create_hypertable('health_metrics', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Set up TimescaleDB compression policy for health_metrics
-- This optimizes storage for historical health data while maintaining query performance
SELECT add_compression_policy('health_metrics', INTERVAL '7 days');

-- Configure retention policy to automatically remove data older than 5 years
-- This can be adjusted based on regulatory requirements and data retention policies
SELECT add_retention_policy('health_metrics', INTERVAL '5 years');

-- Create indexes for health_metrics
CREATE INDEX "health_metrics_userId_idx" ON "health_metrics" ("userId");
CREATE INDEX "health_metrics_type_idx" ON "health_metrics" ("type");
CREATE INDEX "health_metrics_timestamp_idx" ON "health_metrics" ("timestamp" DESC);
CREATE INDEX "health_metrics_userId_type_idx" ON "health_metrics" ("userId", "type");

-- Create health_records table to store user health profiles
CREATE TABLE "health_records" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL UNIQUE,
  "dateOfBirth" DATE,
  "gender" VARCHAR(20),
  "height" DOUBLE PRECISION,
  "weight" DOUBLE PRECISION,
  "bloodType" VARCHAR(10),
  "allergies" TEXT[],
  "conditions" TEXT[],
  "medications" TEXT[],
  "emergencyContact" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for health_records
CREATE INDEX "health_records_userId_idx" ON "health_records" ("userId");

-- Create health_goals table
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
  "startDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endDate" TIMESTAMPTZ,
  "completedDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE
);

-- Create indexes for health_goals
CREATE INDEX "health_goals_recordId_idx" ON "health_goals" ("recordId");
CREATE INDEX "health_goals_recordId_type_idx" ON "health_goals" ("recordId", "type");
CREATE INDEX "health_goals_status_idx" ON "health_goals" ("status");
CREATE INDEX "health_goals_period_idx" ON "health_goals" ("period");

-- Create medical_events table
CREATE TABLE "medical_events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recordId" UUID NOT NULL,
  "type" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "date" TIMESTAMPTZ NOT NULL,
  "provider" VARCHAR(255),
  "documents" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE
);

-- Create indexes for medical_events
CREATE INDEX "medical_events_recordId_idx" ON "medical_events" ("recordId");
CREATE INDEX "medical_events_recordId_type_idx" ON "medical_events" ("recordId", "type");
CREATE INDEX "medical_events_date_idx" ON "medical_events" ("date" DESC);

-- Create device_connections table
CREATE TYPE "DeviceType" AS ENUM (
  'smartwatch',
  'fitness_tracker',
  'smart_scale',
  'blood_pressure_monitor',
  'glucose_monitor',
  'sleep_tracker',
  'other'
);

CREATE TYPE "ConnectionStatus" AS ENUM (
  'connected',
  'disconnected',
  'pairing',
  'error'
);

CREATE TABLE "device_connections" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recordId" UUID NOT NULL,
  "deviceType" "DeviceType" NOT NULL DEFAULT 'other',
  "deviceId" VARCHAR(255) NOT NULL,
  "lastSync" TIMESTAMPTZ,
  "status" "ConnectionStatus" NOT NULL DEFAULT 'disconnected',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("recordId") REFERENCES "health_records" ("id") ON DELETE CASCADE
);

-- Create indexes for device_connections
CREATE INDEX "device_connections_recordId_idx" ON "device_connections" ("recordId");
CREATE INDEX "device_connections_deviceId_idx" ON "device_connections" ("deviceId");
CREATE UNIQUE INDEX "device_connections_recordId_deviceId_idx" ON "device_connections" ("recordId", "deviceId");

-- Create trigger functions for automatic timestamp updates
-- This ensures that updatedAt timestamps are automatically maintained
-- without requiring application code to handle this responsibility
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_health_records_updated_at
    BEFORE UPDATE ON "health_records"
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
    
-- Note: This migration establishes the initial schema only
-- No data migration or transformation is performed
-- Entity relationships are preserved as defined in the application models
-- No changes to database storage technologies are made