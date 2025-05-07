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

-- Create trigger function for automatic updatedAt timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for medical_events table
CREATE TRIGGER update_medical_events_modtime
BEFORE UPDATE ON "medical_events"
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();