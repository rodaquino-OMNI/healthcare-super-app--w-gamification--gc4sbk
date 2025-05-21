-- CreateTable
CREATE TABLE "medical_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recordId" UUID NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP NOT NULL,
    "provider" VARCHAR(255),
    "documents" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_events_recordId_type_idx" ON "medical_events"("recordId", "type");