-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM (
  'RECEIPT',
  'REFERRAL',
  'PRESCRIPTION',
  'MEDICAL_REPORT',
  'INVOICE',
  'INSURANCE_CARD',
  'CONSENT_FORM',
  'LAB_RESULT',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM (
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

-- CreateTable
CREATE TABLE "documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "claimId" UUID,
  "filePath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP(3),
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,

  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "documents_claimId_idx" ON "documents"("claimId");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_verificationStatus_idx" ON "documents"("verificationStatus");

-- CreateIndex
CREATE INDEX "documents_uploadedAt_idx" ON "documents"("uploadedAt");

-- Comment on table and columns
COMMENT ON TABLE "documents" IS 'Stores document metadata for claim attachments and supporting documentation';
COMMENT ON COLUMN "documents"."id" IS 'Unique identifier for the document';
COMMENT ON COLUMN "documents"."claimId" IS 'Reference to the associated claim';
COMMENT ON COLUMN "documents"."filePath" IS 'Path to the document in S3 storage';
COMMENT ON COLUMN "documents"."fileName" IS 'Original filename of the uploaded document';
COMMENT ON COLUMN "documents"."fileSize" IS 'Size of the document in bytes';
COMMENT ON COLUMN "documents"."mimeType" IS 'MIME type of the document';
COMMENT ON COLUMN "documents"."documentType" IS 'Type of document (receipt, referral, etc.)';
COMMENT ON COLUMN "documents"."verificationStatus" IS 'Current verification status of the document';
COMMENT ON COLUMN "documents"."verifiedAt" IS 'Timestamp when the document was verified or rejected';
COMMENT ON COLUMN "documents"."uploadedAt" IS 'Timestamp when the document was uploaded';
COMMENT ON COLUMN "documents"."metadata" IS 'Additional document metadata stored as JSON';