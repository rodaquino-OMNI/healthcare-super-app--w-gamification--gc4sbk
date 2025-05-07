-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('smartwatch', 'fitness_tracker', 'smart_scale', 'blood_pressure_monitor', 'glucose_monitor', 'sleep_tracker', 'other');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('connected', 'disconnected', 'pairing', 'error');

-- CreateTable
CREATE TABLE "device_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recordId" UUID NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'other',
    "deviceId" VARCHAR(255) NOT NULL,
    "lastSync" TIMESTAMP(3),
    "status" "ConnectionStatus" NOT NULL DEFAULT 'disconnected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_connections_recordId_idx" ON "device_connections"("recordId");

-- AddForeignKey
ALTER TABLE "device_connections" ADD CONSTRAINT "device_connections_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "health_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;