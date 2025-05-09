/**
 * @file Plan Journey Document Fixtures
 * 
 * Provides test fixtures for insurance-related documents in the Plan journey.
 * Contains mock data for policy documents, claim receipts, medical invoices,
 * reimbursement forms, and other document types. These fixtures enable testing
 * of document uploading, validation, storage, and retrieval functionality.
 */

// Document type and verification status enums that match the database schema
export enum DocumentType {
  RECEIPT = 'RECEIPT',
  REFERRAL = 'REFERRAL',
  PRESCRIPTION = 'PRESCRIPTION',
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  INVOICE = 'INVOICE',
  INSURANCE_CARD = 'INSURANCE_CARD',
  CONSENT_FORM = 'CONSENT_FORM',
  LAB_RESULT = 'LAB_RESULT',
  OTHER = 'OTHER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// Document interface that matches the database schema
export interface Document {
  id: string;
  claimId?: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  // Additional fields for testing purposes
  planType?: string; // To associate with a plan type
}

// Common MIME types for document fixtures
const MIME_TYPES = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Base S3 path for document storage
const BASE_S3_PATH = 'documents/plan/';

/**
 * Generate a random file size between min and max KB
 * @param minKB Minimum size in KB
 * @param maxKB Maximum size in KB
 * @returns Size in bytes
 */
function randomFileSize(minKB: number, maxKB: number): number {
  return Math.floor(Math.random() * (maxKB - minKB + 1) + minKB) * 1024;
}

/**
 * Generate a date in the past
 * @param daysAgo Number of days in the past
 * @returns Date object
 */
function daysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Mock claim IDs for document association
const MOCK_CLAIM_IDS = {
  MEDICAL: {
    SUBMITTED: '11111111-1111-1111-1111-111111111111',
    PROCESSING: '22222222-2222-2222-2222-222222222222',
    APPROVED: '33333333-3333-3333-3333-333333333333',
    REJECTED: '44444444-4444-4444-4444-444444444444',
  },
  EXAM: {
    SUBMITTED: '55555555-5555-5555-5555-555555555555',
    PROCESSING: '66666666-6666-6666-6666-666666666666',
    APPROVED: '77777777-7777-7777-7777-777777777777',
    REJECTED: '88888888-8888-8888-8888-888888888888',
  },
  THERAPY: {
    SUBMITTED: '99999999-9999-9999-9999-999999999999',
    PROCESSING: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    APPROVED: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    REJECTED: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  },
  HOSPITAL: {
    SUBMITTED: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    PROCESSING: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    APPROVED: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    REJECTED: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
  },
  MEDICATION: {
    SUBMITTED: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
    PROCESSING: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
    APPROVED: 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
    REJECTED: 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk',
  },
};

// Document fixtures for medical consultation claims
const medicalConsultationDocuments: Document[] = [
  // Receipt for a medical consultation - Verified
  {
    id: '10000000-0000-0000-0000-000000000001',
    claimId: MOCK_CLAIM_IDS.MEDICAL.APPROVED,
    filePath: `${BASE_S3_PATH}receipts/receipt_dr_silva_2023_01_15.pdf`,
    fileName: 'receipt_dr_silva_2023_01_15.pdf',
    fileSize: randomFileSize(50, 200),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.RECEIPT,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(25),
    uploadedAt: daysAgo(30),
    createdAt: daysAgo(30),
    updatedAt: daysAgo(25),
    metadata: {
      provider: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      amount: 350.00,
      date: '2023-01-15',
      receiptNumber: 'RC-2023-0115-001',
    },
    planType: 'Standard',
  },
  // Medical report for a consultation - Verified
  {
    id: '10000000-0000-0000-0000-000000000002',
    claimId: MOCK_CLAIM_IDS.MEDICAL.APPROVED,
    filePath: `${BASE_S3_PATH}reports/medical_report_dr_silva_2023_01_15.pdf`,
    fileName: 'medical_report_dr_silva_2023_01_15.pdf',
    fileSize: randomFileSize(100, 500),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.MEDICAL_REPORT,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(25),
    uploadedAt: daysAgo(30),
    createdAt: daysAgo(30),
    updatedAt: daysAgo(25),
    metadata: {
      provider: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      diagnosis: 'Hipertensão leve',
      date: '2023-01-15',
    },
    planType: 'Standard',
  },
  // Receipt for a medical consultation - Pending
  {
    id: '10000000-0000-0000-0000-000000000003',
    claimId: MOCK_CLAIM_IDS.MEDICAL.SUBMITTED,
    filePath: `${BASE_S3_PATH}receipts/receipt_dr_santos_2023_02_20.jpg`,
    fileName: 'receipt_dr_santos_2023_02_20.jpg',
    fileSize: randomFileSize(200, 800),
    mimeType: MIME_TYPES.JPEG,
    documentType: DocumentType.RECEIPT,
    verificationStatus: VerificationStatus.PENDING,
    uploadedAt: daysAgo(5),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    metadata: {
      provider: 'Dra. Ana Santos',
      specialty: 'Dermatologia',
      amount: 280.00,
      date: '2023-02-20',
      receiptNumber: 'RC-2023-0220-042',
    },
    planType: 'Básico',
  },
  // Receipt for a medical consultation - Rejected
  {
    id: '10000000-0000-0000-0000-000000000004',
    claimId: MOCK_CLAIM_IDS.MEDICAL.REJECTED,
    filePath: `${BASE_S3_PATH}receipts/receipt_dr_oliveira_2023_03_05.pdf`,
    fileName: 'receipt_dr_oliveira_2023_03_05.pdf',
    fileSize: randomFileSize(50, 150),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.RECEIPT,
    verificationStatus: VerificationStatus.REJECTED,
    verifiedAt: daysAgo(10),
    uploadedAt: daysAgo(15),
    createdAt: daysAgo(15),
    updatedAt: daysAgo(10),
    metadata: {
      provider: 'Dr. Marcos Oliveira',
      specialty: 'Ortopedia',
      amount: 400.00,
      date: '2023-03-05',
      receiptNumber: 'RC-2023-0305-018',
      rejectionReason: 'Receipt is illegible, please resubmit a clearer copy',
    },
    planType: 'Premium',
  },
];

// Document fixtures for medical exam claims
const medicalExamDocuments: Document[] = [
  // Lab result for an exam - Verified
  {
    id: '20000000-0000-0000-0000-000000000001',
    claimId: MOCK_CLAIM_IDS.EXAM.APPROVED,
    filePath: `${BASE_S3_PATH}lab_results/blood_test_results_2023_01_20.pdf`,
    fileName: 'blood_test_results_2023_01_20.pdf',
    fileSize: randomFileSize(200, 1000),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.LAB_RESULT,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(20),
    uploadedAt: daysAgo(25),
    createdAt: daysAgo(25),
    updatedAt: daysAgo(20),
    metadata: {
      laboratory: 'Laboratório Central',
      examType: 'Hemograma Completo',
      date: '2023-01-20',
      requestingDoctor: 'Dra. Carla Mendes',
    },
    planType: 'Standard',
  },
  // Referral for an exam - Verified
  {
    id: '20000000-0000-0000-0000-000000000002',
    claimId: MOCK_CLAIM_IDS.EXAM.APPROVED,
    filePath: `${BASE_S3_PATH}referrals/exam_referral_dr_mendes_2023_01_10.pdf`,
    fileName: 'exam_referral_dr_mendes_2023_01_10.pdf',
    fileSize: randomFileSize(50, 200),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.REFERRAL,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(20),
    uploadedAt: daysAgo(25),
    createdAt: daysAgo(25),
    updatedAt: daysAgo(20),
    metadata: {
      referringDoctor: 'Dra. Carla Mendes',
      specialty: 'Clínica Geral',
      examType: 'Hemograma Completo',
      date: '2023-01-10',
    },
    planType: 'Standard',
  },
  // Invoice for an exam - Verified
  {
    id: '20000000-0000-0000-0000-000000000003',
    claimId: MOCK_CLAIM_IDS.EXAM.APPROVED,
    filePath: `${BASE_S3_PATH}invoices/invoice_lab_central_2023_01_20.pdf`,
    fileName: 'invoice_lab_central_2023_01_20.pdf',
    fileSize: randomFileSize(50, 200),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.INVOICE,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(20),
    uploadedAt: daysAgo(25),
    createdAt: daysAgo(25),
    updatedAt: daysAgo(20),
    metadata: {
      laboratory: 'Laboratório Central',
      examType: 'Hemograma Completo',
      amount: 120.00,
      date: '2023-01-20',
      invoiceNumber: 'INV-2023-0120-089',
    },
    planType: 'Standard',
  },
  // Referral for an exam - Pending
  {
    id: '20000000-0000-0000-0000-000000000004',
    claimId: MOCK_CLAIM_IDS.EXAM.SUBMITTED,
    filePath: `${BASE_S3_PATH}referrals/exam_referral_dr_costa_2023_03_15.jpg`,
    fileName: 'exam_referral_dr_costa_2023_03_15.jpg',
    fileSize: randomFileSize(200, 800),
    mimeType: MIME_TYPES.JPEG,
    documentType: DocumentType.REFERRAL,
    verificationStatus: VerificationStatus.PENDING,
    uploadedAt: daysAgo(3),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    metadata: {
      referringDoctor: 'Dr. Paulo Costa',
      specialty: 'Cardiologia',
      examType: 'Ecocardiograma',
      date: '2023-03-15',
    },
    planType: 'Premium',
  },
];

// Document fixtures for therapy claims
const therapyDocuments: Document[] = [
  // Receipt for therapy session - Verified
  {
    id: '30000000-0000-0000-0000-000000000001',
    claimId: MOCK_CLAIM_IDS.THERAPY.APPROVED,
    filePath: `${BASE_S3_PATH}receipts/receipt_therapy_lima_2023_02_10.pdf`,
    fileName: 'receipt_therapy_lima_2023_02_10.pdf',
    fileSize: randomFileSize(50, 200),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.RECEIPT,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(15),
    uploadedAt: daysAgo(20),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(15),
    metadata: {
      provider: 'Dra. Juliana Lima',
      specialty: 'Fisioterapia',
      sessionNumber: 3,
      totalSessions: 10,
      amount: 150.00,
      date: '2023-02-10',
      receiptNumber: 'RC-2023-0210-033',
    },
    planType: 'Standard',
  },
  // Referral for therapy - Verified
  {
    id: '30000000-0000-0000-0000-000000000002',
    claimId: MOCK_CLAIM_IDS.THERAPY.APPROVED,
    filePath: `${BASE_S3_PATH}referrals/therapy_referral_dr_almeida_2023_01_25.pdf`,
    fileName: 'therapy_referral_dr_almeida_2023_01_25.pdf',
    fileSize: randomFileSize(50, 200),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.REFERRAL,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(15),
    uploadedAt: daysAgo(20),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(15),
    metadata: {
      referringDoctor: 'Dr. Roberto Almeida',
      specialty: 'Ortopedia',
      therapyType: 'Fisioterapia',
      sessionCount: 10,
      diagnosis: 'Recuperação pós-cirúrgica - joelho',
      date: '2023-01-25',
    },
    planType: 'Standard',
  },
  // Medical report for therapy - Pending
  {
    id: '30000000-0000-0000-0000-000000000003',
    claimId: MOCK_CLAIM_IDS.THERAPY.SUBMITTED,
    filePath: `${BASE_S3_PATH}reports/medical_report_therapy_2023_03_10.pdf`,
    fileName: 'medical_report_therapy_2023_03_10.pdf',
    fileSize: randomFileSize(100, 500),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.MEDICAL_REPORT,
    verificationStatus: VerificationStatus.PENDING,
    uploadedAt: daysAgo(4),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    metadata: {
      provider: 'Dr. Marcelo Souza',
      specialty: 'Neurologia',
      therapyType: 'Fonoaudiologia',
      diagnosis: 'Disfagia pós-AVC',
      date: '2023-03-10',
    },
    planType: 'Premium',
  },
];

// Document fixtures for hospitalization claims
const hospitalizationDocuments: Document[] = [
  // Hospital invoice - Verified
  {
    id: '40000000-0000-0000-0000-000000000001',
    claimId: MOCK_CLAIM_IDS.HOSPITAL.APPROVED,
    filePath: `${BASE_S3_PATH}invoices/hospital_invoice_2023_01_05.pdf`,
    fileName: 'hospital_invoice_2023_01_05.pdf',
    fileSize: randomFileSize(200, 1000),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.INVOICE,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(40),
    uploadedAt: daysAgo(45),
    createdAt: daysAgo(45),
    updatedAt: daysAgo(40),
    metadata: {
      hospital: 'Hospital São Lucas',
      admissionDate: '2023-01-01',
      dischargeDate: '2023-01-05',
      amount: 8500.00,
      invoiceNumber: 'INV-2023-0105-123',
      roomType: 'Semi-privativo',
    },
    planType: 'Premium',
  },
  // Medical report for hospitalization - Verified
  {
    id: '40000000-0000-0000-0000-000000000002',
    claimId: MOCK_CLAIM_IDS.HOSPITAL.APPROVED,
    filePath: `${BASE_S3_PATH}reports/hospital_discharge_report_2023_01_05.pdf`,
    fileName: 'hospital_discharge_report_2023_01_05.pdf',
    fileSize: randomFileSize(200, 1000),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.MEDICAL_REPORT,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(40),
    uploadedAt: daysAgo(45),
    createdAt: daysAgo(45),
    updatedAt: daysAgo(40),
    metadata: {
      hospital: 'Hospital São Lucas',
      attendingPhysician: 'Dra. Mariana Campos',
      admissionDate: '2023-01-01',
      dischargeDate: '2023-01-05',
      diagnosis: 'Apendicite aguda',
      procedure: 'Apendicectomia',
    },
    planType: 'Premium',
  },
  // Consent form for hospitalization - Verified
  {
    id: '40000000-0000-0000-0000-000000000003',
    claimId: MOCK_CLAIM_IDS.HOSPITAL.APPROVED,
    filePath: `${BASE_S3_PATH}forms/surgical_consent_form_2023_01_01.pdf`,
    fileName: 'surgical_consent_form_2023_01_01.pdf',
    fileSize: randomFileSize(100, 300),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.CONSENT_FORM,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(40),
    uploadedAt: daysAgo(45),
    createdAt: daysAgo(45),
    updatedAt: daysAgo(40),
    metadata: {
      hospital: 'Hospital São Lucas',
      procedure: 'Apendicectomia',
      surgeon: 'Dra. Mariana Campos',
      date: '2023-01-01',
    },
    planType: 'Premium',
  },
  // Hospital invoice - Pending
  {
    id: '40000000-0000-0000-0000-000000000004',
    claimId: MOCK_CLAIM_IDS.HOSPITAL.SUBMITTED,
    filePath: `${BASE_S3_PATH}invoices/hospital_invoice_2023_03_20.pdf`,
    fileName: 'hospital_invoice_2023_03_20.pdf',
    fileSize: randomFileSize(200, 1000),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.INVOICE,
    verificationStatus: VerificationStatus.PENDING,
    uploadedAt: daysAgo(2),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    metadata: {
      hospital: 'Hospital Santa Maria',
      admissionDate: '2023-03-18',
      dischargeDate: '2023-03-20',
      amount: 3200.00,
      invoiceNumber: 'INV-2023-0320-078',
      roomType: 'Enfermaria',
    },
    planType: 'Básico',
  },
];

// Document fixtures for medication claims
const medicationDocuments: Document[] = [
  // Prescription for medication - Verified
  {
    id: '50000000-0000-0000-0000-000000000001',
    claimId: MOCK_CLAIM_IDS.MEDICATION.APPROVED,
    filePath: `${BASE_S3_PATH}prescriptions/prescription_dr_ferreira_2023_02_05.pdf`,
    fileName: 'prescription_dr_ferreira_2023_02_05.pdf',
    fileSize: randomFileSize(50, 200),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.PRESCRIPTION,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(18),
    uploadedAt: daysAgo(20),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(18),
    metadata: {
      prescribingDoctor: 'Dr. Ricardo Ferreira',
      specialty: 'Cardiologia',
      medications: [
        { name: 'Losartana Potássica', dosage: '50mg', frequency: '1x ao dia' },
        { name: 'Atorvastatina', dosage: '20mg', frequency: '1x ao dia' },
      ],
      date: '2023-02-05',
    },
    planType: 'Standard',
  },
  // Receipt for medication - Verified
  {
    id: '50000000-0000-0000-0000-000000000002',
    claimId: MOCK_CLAIM_IDS.MEDICATION.APPROVED,
    filePath: `${BASE_S3_PATH}receipts/pharmacy_receipt_2023_02_05.pdf`,
    fileName: 'pharmacy_receipt_2023_02_05.pdf',
    fileSize: randomFileSize(50, 200),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.RECEIPT,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(18),
    uploadedAt: daysAgo(20),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(18),
    metadata: {
      pharmacy: 'Farmácia Saúde',
      medications: [
        { name: 'Losartana Potássica 50mg', quantity: 30, price: 45.90 },
        { name: 'Atorvastatina 20mg', quantity: 30, price: 62.50 },
      ],
      total: 108.40,
      date: '2023-02-05',
      receiptNumber: 'RC-2023-0205-156',
    },
    planType: 'Standard',
  },
  // Prescription for medication - Rejected
  {
    id: '50000000-0000-0000-0000-000000000003',
    claimId: MOCK_CLAIM_IDS.MEDICATION.REJECTED,
    filePath: `${BASE_S3_PATH}prescriptions/prescription_dr_martins_2023_02_28.jpg`,
    fileName: 'prescription_dr_martins_2023_02_28.jpg',
    fileSize: randomFileSize(200, 800),
    mimeType: MIME_TYPES.JPEG,
    documentType: DocumentType.PRESCRIPTION,
    verificationStatus: VerificationStatus.REJECTED,
    verifiedAt: daysAgo(8),
    uploadedAt: daysAgo(10),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(8),
    metadata: {
      prescribingDoctor: 'Dr. André Martins',
      specialty: 'Clínica Geral',
      medications: [
        { name: 'Amoxicilina', dosage: '500mg', frequency: '8/8h por 7 dias' },
      ],
      date: '2023-02-28',
      rejectionReason: 'Prescription is expired. Must be filled within 30 days of issue date.',
    },
    planType: 'Básico',
  },
];

// Insurance policy documents (not associated with claims)
const policyDocuments: Document[] = [
  // Basic plan policy document
  {
    id: '60000000-0000-0000-0000-000000000001',
    filePath: `${BASE_S3_PATH}policies/policy_basic_2023.pdf`,
    fileName: 'policy_basic_2023.pdf',
    fileSize: randomFileSize(500, 2000),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.INSURANCE_CARD,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(60),
    uploadedAt: daysAgo(60),
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
    metadata: {
      planType: 'Básico',
      policyNumber: 'POL-B-2023-001',
      effectiveDate: '2023-01-01',
      expirationDate: '2023-12-31',
    },
    planType: 'Básico',
  },
  // Standard plan policy document
  {
    id: '60000000-0000-0000-0000-000000000002',
    filePath: `${BASE_S3_PATH}policies/policy_standard_2023.pdf`,
    fileName: 'policy_standard_2023.pdf',
    fileSize: randomFileSize(500, 2000),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.INSURANCE_CARD,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(60),
    uploadedAt: daysAgo(60),
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
    metadata: {
      planType: 'Standard',
      policyNumber: 'POL-S-2023-001',
      effectiveDate: '2023-01-01',
      expirationDate: '2023-12-31',
    },
    planType: 'Standard',
  },
  // Premium plan policy document
  {
    id: '60000000-0000-0000-0000-000000000003',
    filePath: `${BASE_S3_PATH}policies/policy_premium_2023.pdf`,
    fileName: 'policy_premium_2023.pdf',
    fileSize: randomFileSize(500, 2000),
    mimeType: MIME_TYPES.PDF,
    documentType: DocumentType.INSURANCE_CARD,
    verificationStatus: VerificationStatus.VERIFIED,
    verifiedAt: daysAgo(60),
    uploadedAt: daysAgo(60),
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
    metadata: {
      planType: 'Premium',
      policyNumber: 'POL-P-2023-001',
      effectiveDate: '2023-01-01',
      expirationDate: '2023-12-31',
    },
    planType: 'Premium',
  },
];

// Combine all document fixtures
const allDocuments: Document[] = [
  ...medicalConsultationDocuments,
  ...medicalExamDocuments,
  ...therapyDocuments,
  ...hospitalizationDocuments,
  ...medicationDocuments,
  ...policyDocuments,
];

/**
 * Get all document fixtures
 * @returns Array of all document fixtures
 */
export function getAllDocuments(): Document[] {
  return allDocuments;
}

/**
 * Get documents by plan type
 * @param planType The plan type (Básico, Standard, Premium)
 * @returns Array of documents for the specified plan type
 */
export function getDocumentsByPlanType(planType: string): Document[] {
  return allDocuments.filter(doc => doc.planType === planType);
}

/**
 * Get documents by claim ID
 * @param claimId The claim ID
 * @returns Array of documents associated with the specified claim
 */
export function getDocumentsByClaim(claimId: string): Document[] {
  return allDocuments.filter(doc => doc.claimId === claimId);
}

/**
 * Get documents by verification status
 * @param status The verification status (PENDING, VERIFIED, REJECTED)
 * @returns Array of documents with the specified verification status
 */
export function getDocumentsByVerificationStatus(status: string): Document[] {
  return allDocuments.filter(doc => doc.verificationStatus === status);
}

/**
 * Get documents by document type
 * @param type The document type (RECEIPT, REFERRAL, etc.)
 * @returns Array of documents of the specified type
 */
export function getDocumentsByType(type: string): Document[] {
  return allDocuments.filter(doc => doc.documentType === type);
}

/**
 * Get documents by MIME type
 * @param mimeType The MIME type (application/pdf, image/jpeg, etc.)
 * @returns Array of documents with the specified MIME type
 */
export function getDocumentsByMimeType(mimeType: string): Document[] {
  return allDocuments.filter(doc => doc.mimeType === mimeType);
}

/**
 * Get documents uploaded within a date range
 * @param startDate The start date
 * @param endDate The end date
 * @returns Array of documents uploaded within the specified date range
 */
export function getDocumentsByUploadDateRange(startDate: Date, endDate: Date): Document[] {
  return allDocuments.filter(doc => {
    return doc.uploadedAt >= startDate && doc.uploadedAt <= endDate;
  });
}

/**
 * Get documents by file size range (in bytes)
 * @param minSize The minimum file size in bytes
 * @param maxSize The maximum file size in bytes
 * @returns Array of documents within the specified file size range
 */
export function getDocumentsByFileSizeRange(minSize: number, maxSize: number): Document[] {
  return allDocuments.filter(doc => {
    return doc.fileSize >= minSize && doc.fileSize <= maxSize;
  });
}

/**
 * Get a specific document by ID
 * @param id The document ID
 * @returns The document with the specified ID, or undefined if not found
 */
export function getDocumentById(id: string): Document | undefined {
  return allDocuments.find(doc => doc.id === id);
}

/**
 * Get documents for a specific claim type
 * @param claimType The claim type (Consulta Médica, Exame, etc.)
 * @returns Array of documents associated with claims of the specified type
 */
export function getDocumentsByClaimType(claimType: string): Document[] {
  // Map claim type to claim IDs
  let claimIds: string[] = [];
  
  switch (claimType) {
    case 'Consulta Médica':
      claimIds = Object.values(MOCK_CLAIM_IDS.MEDICAL);
      break;
    case 'Exame':
      claimIds = Object.values(MOCK_CLAIM_IDS.EXAM);
      break;
    case 'Terapia':
      claimIds = Object.values(MOCK_CLAIM_IDS.THERAPY);
      break;
    case 'Internação':
      claimIds = Object.values(MOCK_CLAIM_IDS.HOSPITAL);
      break;
    case 'Medicamento':
      claimIds = Object.values(MOCK_CLAIM_IDS.MEDICATION);
      break;
    default:
      return [];
  }
  
  return allDocuments.filter(doc => doc.claimId && claimIds.includes(doc.claimId));
}

/**
 * Get documents by claim status
 * @param status The claim status (submitted, processing, approved, rejected)
 * @returns Array of documents associated with claims of the specified status
 */
export function getDocumentsByClaimStatus(status: string): Document[] {
  // Map claim status to claim IDs
  const claimIds: string[] = [];
  
  Object.values(MOCK_CLAIM_IDS).forEach(statusMap => {
    if (statusMap[status.toUpperCase()]) {
      claimIds.push(statusMap[status.toUpperCase()]);
    }
  });
  
  return allDocuments.filter(doc => doc.claimId && claimIds.includes(doc.claimId));
}

/**
 * Get a random document
 * @returns A random document from the fixtures
 */
export function getRandomDocument(): Document {
  const randomIndex = Math.floor(Math.random() * allDocuments.length);
  return allDocuments[randomIndex];
}

/**
 * Get a random document of a specific type
 * @param type The document type
 * @returns A random document of the specified type
 */
export function getRandomDocumentByType(type: string): Document | undefined {
  const documentsOfType = getDocumentsByType(type);
  if (documentsOfType.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * documentsOfType.length);
  return documentsOfType[randomIndex];
}

/**
 * Get a random document with a specific verification status
 * @param status The verification status
 * @returns A random document with the specified verification status
 */
export function getRandomDocumentByVerificationStatus(status: string): Document | undefined {
  const documentsWithStatus = getDocumentsByVerificationStatus(status);
  if (documentsWithStatus.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * documentsWithStatus.length);
  return documentsWithStatus[randomIndex];
}