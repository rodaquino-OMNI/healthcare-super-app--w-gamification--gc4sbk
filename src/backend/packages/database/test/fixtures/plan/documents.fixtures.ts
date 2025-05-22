/**
 * @file documents.fixtures.ts
 * @description Provides test fixtures for insurance-related documents in the Plan journey.
 * Contains mock data for policy documents, claim receipts, medical invoices, reimbursement forms,
 * and other document types. These fixtures enable testing of document uploading, validation,
 * storage, and retrieval functionality.
 */

import { IDocument } from '@austa/interfaces/journey/plan';

/**
 * Document types used in the Plan journey
 */
export enum DocumentType {
  POLICY_DOCUMENT = 'policy_document',
  MEDICAL_RECEIPT = 'medical_receipt',
  MEDICAL_INVOICE = 'medical_invoice',
  PRESCRIPTION = 'prescription',
  MEDICAL_REPORT = 'medical_report',
  LAB_RESULT = 'lab_result',
  REIMBURSEMENT_FORM = 'reimbursement_form',
  INSURANCE_CARD = 'insurance_card',
  AUTHORIZATION_FORM = 'authorization_form',
  REFERRAL_LETTER = 'referral_letter',
  OTHER = 'other'
}

/**
 * Document upload status values
 */
export enum UploadStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

/**
 * Entity types that documents can be associated with
 */
export enum EntityType {
  CLAIM = 'claim',
  PLAN = 'plan',
  COVERAGE = 'coverage',
  BENEFIT = 'benefit'
}

/**
 * Base document fixture with default values
 * @param overrides - Optional properties to override defaults
 * @returns A document fixture with default values merged with overrides
 */
export const createDocumentFixture = (overrides?: Partial<IDocument>): IDocument => {
  const now = new Date();
  const defaultDocument: IDocument = {
    id: `doc-${Math.random().toString(36).substring(2, 10)}`,
    entityId: `entity-${Math.random().toString(36).substring(2, 10)}`,
    entityType: EntityType.CLAIM,
    type: DocumentType.MEDICAL_RECEIPT,
    filePath: `documents/claims/${Math.random().toString(36).substring(2, 10)}.pdf`,
    fileName: 'receipt.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 2, // 2MB
    uploadStatus: UploadStatus.COMPLETED,
    createdAt: new Date(now.getTime() - 3600000), // 1 hour ago
    updatedAt: now
  };

  return { ...defaultDocument, ...overrides };
};

/**
 * Creates a medical receipt document fixture
 * @param claimId - ID of the claim this receipt is associated with
 * @param overrides - Optional properties to override defaults
 * @returns A medical receipt document fixture
 */
export const createMedicalReceiptFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.MEDICAL_RECEIPT,
    fileName: 'medical_receipt.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 1.5, // 1.5MB
    ...overrides
  });
};

/**
 * Creates a medical invoice document fixture
 * @param claimId - ID of the claim this invoice is associated with
 * @param overrides - Optional properties to override defaults
 * @returns A medical invoice document fixture
 */
export const createMedicalInvoiceFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.MEDICAL_INVOICE,
    fileName: 'medical_invoice.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 2.2, // 2.2MB
    ...overrides
  });
};

/**
 * Creates a prescription document fixture
 * @param claimId - ID of the claim this prescription is associated with
 * @param overrides - Optional properties to override defaults
 * @returns A prescription document fixture
 */
export const createPrescriptionFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.PRESCRIPTION,
    fileName: 'prescription.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024 * 1024 * 0.8, // 800KB
    ...overrides
  });
};

/**
 * Creates a medical report document fixture
 * @param claimId - ID of the claim this report is associated with
 * @param overrides - Optional properties to override defaults
 * @returns A medical report document fixture
 */
export const createMedicalReportFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.MEDICAL_REPORT,
    fileName: 'medical_report.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 3.5, // 3.5MB
    ...overrides
  });
};

/**
 * Creates a lab result document fixture
 * @param claimId - ID of the claim these lab results are associated with
 * @param overrides - Optional properties to override defaults
 * @returns A lab result document fixture
 */
export const createLabResultFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.LAB_RESULT,
    fileName: 'lab_results.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 2.8, // 2.8MB
    ...overrides
  });
};

/**
 * Creates a reimbursement form document fixture
 * @param claimId - ID of the claim this form is associated with
 * @param overrides - Optional properties to override defaults
 * @returns A reimbursement form document fixture
 */
export const createReimbursementFormFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.REIMBURSEMENT_FORM,
    fileName: 'reimbursement_form.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 1.2, // 1.2MB
    ...overrides
  });
};

/**
 * Creates an insurance card document fixture
 * @param planId - ID of the plan this insurance card is associated with
 * @param overrides - Optional properties to override defaults
 * @returns An insurance card document fixture
 */
export const createInsuranceCardFixture = (planId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: planId,
    entityType: EntityType.PLAN,
    type: DocumentType.INSURANCE_CARD,
    fileName: 'insurance_card.png',
    mimeType: 'image/png',
    fileSize: 1024 * 512, // 512KB
    ...overrides
  });
};

/**
 * Creates a policy document fixture
 * @param planId - ID of the plan this policy document is associated with
 * @param overrides - Optional properties to override defaults
 * @returns A policy document fixture
 */
export const createPolicyDocumentFixture = (planId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: planId,
    entityType: EntityType.PLAN,
    type: DocumentType.POLICY_DOCUMENT,
    fileName: 'policy_document.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 5, // 5MB
    ...overrides
  });
};

/**
 * Creates an authorization form document fixture
 * @param claimId - ID of the claim this authorization form is associated with
 * @param overrides - Optional properties to override defaults
 * @returns An authorization form document fixture
 */
export const createAuthorizationFormFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.AUTHORIZATION_FORM,
    fileName: 'authorization_form.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 0.9, // 900KB
    ...overrides
  });
};

/**
 * Creates a referral letter document fixture
 * @param claimId - ID of the claim this referral letter is associated with
 * @param overrides - Optional properties to override defaults
 * @returns A referral letter document fixture
 */
export const createReferralLetterFixture = (claimId: string, overrides?: Partial<IDocument>): IDocument => {
  return createDocumentFixture({
    entityId: claimId,
    entityType: EntityType.CLAIM,
    type: DocumentType.REFERRAL_LETTER,
    fileName: 'referral_letter.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 1024 * 1.1, // 1.1MB
    ...overrides
  });
};

/**
 * Creates a document with pending upload status
 * @param entityId - ID of the entity this document is associated with
 * @param entityType - Type of entity this document is associated with
 * @param documentType - Type of document
 * @param overrides - Optional properties to override defaults
 * @returns A document fixture with pending upload status
 */
export const createPendingDocumentFixture = (
  entityId: string,
  entityType: EntityType,
  documentType: DocumentType,
  overrides?: Partial<IDocument>
): IDocument => {
  return createDocumentFixture({
    entityId,
    entityType,
    type: documentType,
    uploadStatus: UploadStatus.PENDING,
    ...overrides
  });
};

/**
 * Creates a document with failed upload status
 * @param entityId - ID of the entity this document is associated with
 * @param entityType - Type of entity this document is associated with
 * @param documentType - Type of document
 * @param overrides - Optional properties to override defaults
 * @returns A document fixture with failed upload status
 */
export const createFailedDocumentFixture = (
  entityId: string,
  entityType: EntityType,
  documentType: DocumentType,
  overrides?: Partial<IDocument>
): IDocument => {
  return createDocumentFixture({
    entityId,
    entityType,
    type: documentType,
    uploadStatus: UploadStatus.FAILED,
    ...overrides
  });
};

/**
 * Creates a document with verified status
 * @param entityId - ID of the entity this document is associated with
 * @param entityType - Type of entity this document is associated with
 * @param documentType - Type of document
 * @param overrides - Optional properties to override defaults
 * @returns A document fixture with verified status
 */
export const createVerifiedDocumentFixture = (
  entityId: string,
  entityType: EntityType,
  documentType: DocumentType,
  overrides?: Partial<IDocument>
): IDocument => {
  return createDocumentFixture({
    entityId,
    entityType,
    type: documentType,
    uploadStatus: UploadStatus.VERIFIED,
    ...overrides
  });
};

/**
 * Creates a document with rejected status
 * @param entityId - ID of the entity this document is associated with
 * @param entityType - Type of entity this document is associated with
 * @param documentType - Type of document
 * @param overrides - Optional properties to override defaults
 * @returns A document fixture with rejected status
 */
export const createRejectedDocumentFixture = (
  entityId: string,
  entityType: EntityType,
  documentType: DocumentType,
  overrides?: Partial<IDocument>
): IDocument => {
  return createDocumentFixture({
    entityId,
    entityType,
    type: documentType,
    uploadStatus: UploadStatus.REJECTED,
    ...overrides
  });
};

/**
 * Creates a set of documents for a claim
 * @param claimId - ID of the claim to create documents for
 * @returns An array of document fixtures for the claim
 */
export const createClaimDocumentsFixture = (claimId: string): IDocument[] => {
  return [
    createMedicalReceiptFixture(claimId),
    createMedicalInvoiceFixture(claimId),
    createPrescriptionFixture(claimId),
    createReimbursementFormFixture(claimId)
  ];
};

/**
 * Creates a set of documents for a plan
 * @param planId - ID of the plan to create documents for
 * @returns An array of document fixtures for the plan
 */
export const createPlanDocumentsFixture = (planId: string): IDocument[] => {
  return [
    createPolicyDocumentFixture(planId),
    createInsuranceCardFixture(planId)
  ];
};

/**
 * Creates a complete set of documents for testing all document types and statuses
 * @returns An array of document fixtures covering all document types and statuses
 */
export const createCompleteDocumentSetFixture = (): IDocument[] => {
  const claimId = `claim-${Math.random().toString(36).substring(2, 10)}`;
  const planId = `plan-${Math.random().toString(36).substring(2, 10)}`;
  
  return [
    // Claim documents with different statuses
    createMedicalReceiptFixture(claimId, { uploadStatus: UploadStatus.COMPLETED }),
    createMedicalInvoiceFixture(claimId, { uploadStatus: UploadStatus.VERIFIED }),
    createPrescriptionFixture(claimId, { uploadStatus: UploadStatus.PENDING }),
    createMedicalReportFixture(claimId, { uploadStatus: UploadStatus.PROCESSING }),
    createLabResultFixture(claimId, { uploadStatus: UploadStatus.FAILED }),
    createReimbursementFormFixture(claimId, { uploadStatus: UploadStatus.REJECTED }),
    createAuthorizationFormFixture(claimId, { uploadStatus: UploadStatus.COMPLETED }),
    createReferralLetterFixture(claimId, { uploadStatus: UploadStatus.VERIFIED }),
    
    // Plan documents
    createPolicyDocumentFixture(planId, { uploadStatus: UploadStatus.COMPLETED }),
    createInsuranceCardFixture(planId, { uploadStatus: UploadStatus.VERIFIED })
  ];
};