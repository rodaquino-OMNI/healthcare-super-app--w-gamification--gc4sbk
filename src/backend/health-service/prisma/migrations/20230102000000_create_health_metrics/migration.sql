-- CreateEnum
CREATE TYPE "MetricType" AS ENUM (
    'HEART_RATE',
    'BLOOD_PRESSURE',
    'BLOOD_GLUCOSE',
    'WEIGHT',
    'STEPS',
    'SLEEP',
    'TEMPERATURE',
    'OXYGEN_SATURATION'
);

-- CreateEnum
CREATE TYPE "MetricSource" AS ENUM (
    'MANUAL_ENTRY',
    'WEARABLE_DEVICE',
    'MEDICAL_DEVICE',
    'HEALTHCARE_PROVIDER',
    'THIRD_PARTY_APP'
);

-- CreateTable
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
CREATE INDEX "health_metrics_userId_idx" ON "health_metrics"("userId");

-- CreateIndex
CREATE INDEX "health_metrics_type_idx" ON "health_metrics"("type");

-- CreateIndex
CREATE INDEX "health_metrics_timestamp_idx" ON "health_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "health_metrics_userId_type_timestamp_idx" ON "health_metrics"("userId", "type", "timestamp");