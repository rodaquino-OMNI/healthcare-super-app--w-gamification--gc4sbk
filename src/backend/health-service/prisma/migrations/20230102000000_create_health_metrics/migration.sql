-- CreateEnum
-- Define the enum for health metric types
CREATE TYPE "MetricType" AS ENUM (
  'HEART_RATE',
  'BLOOD_PRESSURE',
  'BLOOD_GLUCOSE',
  'STEPS',
  'SLEEP',
  'WEIGHT'
);

-- CreateEnum
-- Define the enum for health metric sources
CREATE TYPE "MetricSource" AS ENUM (
  'MANUAL_ENTRY',
  'WEARABLE_DEVICE',
  'API',
  'HEALTH_PROVIDER'
);

-- CreateTable
-- Create the health_metrics table for storing user health measurements
CREATE TABLE "health_metrics" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "MetricType" NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "unit" VARCHAR(20) NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "source" "MetricSource" NOT NULL,
  "notes" TEXT,
  "trend" DECIMAL(5,2),
  "isAbnormal" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Create index on userId for faster queries by user
CREATE INDEX "health_metrics_userId_idx" ON "health_metrics"("userId");

-- CreateIndex
-- Create composite index on userId and type for faster queries by user and metric type
CREATE INDEX "health_metrics_userId_type_idx" ON "health_metrics"("userId", "type");

-- CreateIndex
-- Create index on timestamp for faster time-based queries
CREATE INDEX "health_metrics_timestamp_idx" ON "health_metrics"("timestamp");