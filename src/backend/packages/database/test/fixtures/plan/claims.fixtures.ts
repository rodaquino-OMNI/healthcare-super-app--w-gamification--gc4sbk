/**
 * Test fixtures for insurance claims in the Plan journey.
 * 
 * Provides mock data for different claim types (medical consultation, exams, therapy, 
 * hospitalization, medications) in various processing states (submitted, validating, 
 * processing, approved, rejected, etc.).
 */

import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Claim status enum matching the states in the claims processing flow
 */
export enum ClaimStatus {
  SUBMITTED = 'SUBMITTED',
  VALIDATING = 'VALIDATING',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  EXTERNAL_SUBMISSION = 'EXTERNAL_SUBMISSION',
  UNDER_REVIEW = 'UNDER_REVIEW',
  FAILED = 'FAILED',
  RESUBMITTING = 'RESUBMITTING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  UPDATING = 'UPDATING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  COMPLETED = 'COMPLETED'
}

/**
 * Interface for claim fixture data
 */
export interface ClaimFixture {
  id: string;
  userId: string;
  claimTypeId: string;
  claimNumber: string;
  status: ClaimStatus;
  serviceDate: Date;
  submissionDate: Date;
  providerName: string;
  providerDocument: string;
  totalAmount: number;
  coveredAmount: number | null;
  description: string;
  documentIds: string[];
  rejectionReason: string | null;
  additionalInfoRequest: string | null;
  lastUpdated: Date;
  paymentDate: Date | null;
  externalReferenceId: string | null;
}

/**
 * Claim type IDs matching the seed data
 */
export const claimTypeIds = {
  MEDICAL_CONSULTATION: '1',
  EXAM: '2',
  THERAPY: '3',
  HOSPITALIZATION: '4',
  MEDICATION: '5'
};

/**
 * Base user IDs for test fixtures
 */
export const userIds = {
  ADMIN_USER: '1',
  TEST_USER: '2'
};

/**
 * Document IDs for test fixtures
 */
export const documentIds = {
  MEDICAL_RECEIPT: 'd1',
  MEDICAL_REPORT: 'd2',
  PRESCRIPTION: 'd3',
  EXAM_RESULT: 'd4',
  HOSPITAL_INVOICE: 'd5',
  PHARMACY_RECEIPT: 'd6',
  ADDITIONAL_INFO: 'd7'
};

/**
 * Creates a base claim fixture with default values
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A claim fixture object
 */
export const createClaimFixture = (overrides?: Partial<ClaimFixture>): ClaimFixture => {
  const now = new Date();
  const serviceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  return {
    id: uuidv4(),
    userId: userIds.TEST_USER,
    claimTypeId: claimTypeIds.MEDICAL_CONSULTATION,
    claimNumber: `CLM-${Math.floor(Math.random() * 1000000)}`,
    status: ClaimStatus.SUBMITTED,
    serviceDate,
    submissionDate: now,
    providerName: 'Clínica São Paulo',
    providerDocument: '12.345.678/0001-90',
    totalAmount: 250.0,
    coveredAmount: null,
    description: 'Consulta médica de rotina',
    documentIds: [documentIds.MEDICAL_RECEIPT],
    rejectionReason: null,
    additionalInfoRequest: null,
    lastUpdated: now,
    paymentDate: null,
    externalReferenceId: null,
    ...overrides
  };
};

/**
 * Medical consultation claim fixtures
 */
export const medicalConsultationClaims = {
  // Newly submitted claim
  submitted: createClaimFixture({
    id: 'mc-1',
    claimTypeId: claimTypeIds.MEDICAL_CONSULTATION,
    status: ClaimStatus.SUBMITTED,
    description: 'Consulta com cardiologista',
    totalAmount: 350.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.MEDICAL_REPORT]
  }),
  
  // Claim in validation phase
  validating: createClaimFixture({
    id: 'mc-2',
    claimTypeId: claimTypeIds.MEDICAL_CONSULTATION,
    status: ClaimStatus.VALIDATING,
    description: 'Consulta com dermatologista',
    totalAmount: 280.0,
    documentIds: [documentIds.MEDICAL_RECEIPT]
  }),
  
  // Claim rejected due to missing documentation
  rejected: createClaimFixture({
    id: 'mc-3',
    claimTypeId: claimTypeIds.MEDICAL_CONSULTATION,
    status: ClaimStatus.REJECTED,
    description: 'Consulta com neurologista',
    totalAmount: 400.0,
    documentIds: [documentIds.MEDICAL_RECEIPT],
    rejectionReason: 'Documentação incompleta. Falta relatório médico.'
  }),
  
  // Claim approved and payment pending
  approved: createClaimFixture({
    id: 'mc-4',
    claimTypeId: claimTypeIds.MEDICAL_CONSULTATION,
    status: ClaimStatus.APPROVED,
    description: 'Consulta com ortopedista',
    totalAmount: 320.0,
    coveredAmount: 256.0, // 80% coverage
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.MEDICAL_REPORT],
    externalReferenceId: 'INS-12345'
  }),
  
  // Claim completed with payment
  completed: createClaimFixture({
    id: 'mc-5',
    claimTypeId: claimTypeIds.MEDICAL_CONSULTATION,
    status: ClaimStatus.COMPLETED,
    description: 'Consulta com clínico geral',
    totalAmount: 200.0,
    coveredAmount: 160.0, // 80% coverage
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.MEDICAL_REPORT],
    paymentDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    externalReferenceId: 'INS-12346'
  }),
  
  // Claim requiring additional information
  additionalInfoRequired: createClaimFixture({
    id: 'mc-6',
    claimTypeId: claimTypeIds.MEDICAL_CONSULTATION,
    status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
    description: 'Consulta com endocrinologista',
    totalAmount: 300.0,
    documentIds: [documentIds.MEDICAL_RECEIPT],
    additionalInfoRequest: 'Por favor, forneça o relatório médico detalhado da consulta.'
  })
};

/**
 * Medical exam claim fixtures
 */
export const examClaims = {
  // Newly submitted claim
  submitted: createClaimFixture({
    id: 'ex-1',
    claimTypeId: claimTypeIds.EXAM,
    status: ClaimStatus.SUBMITTED,
    description: 'Exame de sangue completo',
    totalAmount: 150.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.EXAM_RESULT]
  }),
  
  // Claim in processing phase
  processing: createClaimFixture({
    id: 'ex-2',
    claimTypeId: claimTypeIds.EXAM,
    status: ClaimStatus.PROCESSING,
    description: 'Ressonância magnética de joelho',
    totalAmount: 800.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.EXAM_RESULT, documentIds.PRESCRIPTION]
  }),
  
  // Claim under review by insurance
  underReview: createClaimFixture({
    id: 'ex-3',
    claimTypeId: claimTypeIds.EXAM,
    status: ClaimStatus.UNDER_REVIEW,
    description: 'Tomografia computadorizada de tórax',
    totalAmount: 950.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.EXAM_RESULT, documentIds.PRESCRIPTION],
    externalReferenceId: 'INS-12347'
  }),
  
  // Claim denied by insurance
  denied: createClaimFixture({
    id: 'ex-4',
    claimTypeId: claimTypeIds.EXAM,
    status: ClaimStatus.DENIED,
    description: 'Exame de densitometria óssea',
    totalAmount: 350.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.EXAM_RESULT],
    rejectionReason: 'Procedimento não coberto pelo plano atual.',
    externalReferenceId: 'INS-12348'
  }),
  
  // Claim completed with payment
  completed: createClaimFixture({
    id: 'ex-5',
    claimTypeId: claimTypeIds.EXAM,
    status: ClaimStatus.COMPLETED,
    description: 'Ultrassonografia abdominal',
    totalAmount: 280.0,
    coveredAmount: 224.0, // 80% coverage
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.EXAM_RESULT, documentIds.PRESCRIPTION],
    paymentDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    externalReferenceId: 'INS-12349'
  })
};

/**
 * Therapy claim fixtures
 */
export const therapyClaims = {
  // Newly submitted claim
  submitted: createClaimFixture({
    id: 'th-1',
    claimTypeId: claimTypeIds.THERAPY,
    status: ClaimStatus.SUBMITTED,
    description: 'Sessão de fisioterapia',
    totalAmount: 120.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.PRESCRIPTION]
  }),
  
  // Claim in external submission phase
  externalSubmission: createClaimFixture({
    id: 'th-2',
    claimTypeId: claimTypeIds.THERAPY,
    status: ClaimStatus.EXTERNAL_SUBMISSION,
    description: 'Sessão de terapia ocupacional',
    totalAmount: 150.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.PRESCRIPTION, documentIds.MEDICAL_REPORT]
  }),
  
  // Claim with failed submission
  failed: createClaimFixture({
    id: 'th-3',
    claimTypeId: claimTypeIds.THERAPY,
    status: ClaimStatus.FAILED,
    description: 'Sessão de fonoaudiologia',
    totalAmount: 130.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.PRESCRIPTION],
    rejectionReason: 'Falha na comunicação com o sistema da seguradora.'
  }),
  
  // Claim in resubmission phase
  resubmitting: createClaimFixture({
    id: 'th-4',
    claimTypeId: claimTypeIds.THERAPY,
    status: ClaimStatus.RESUBMITTING,
    description: 'Sessão de psicoterapia',
    totalAmount: 200.0,
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.PRESCRIPTION, documentIds.MEDICAL_REPORT]
  }),
  
  // Claim approved and payment pending
  paymentPending: createClaimFixture({
    id: 'th-5',
    claimTypeId: claimTypeIds.THERAPY,
    status: ClaimStatus.PAYMENT_PENDING,
    description: 'Sessão de acupuntura',
    totalAmount: 180.0,
    coveredAmount: 144.0, // 80% coverage
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.PRESCRIPTION],
    externalReferenceId: 'INS-12350'
  }),
  
  // Claim completed with payment
  completed: createClaimFixture({
    id: 'th-6',
    claimTypeId: claimTypeIds.THERAPY,
    status: ClaimStatus.COMPLETED,
    description: 'Sessão de quiropraxia',
    totalAmount: 160.0,
    coveredAmount: 128.0, // 80% coverage
    documentIds: [documentIds.MEDICAL_RECEIPT, documentIds.PRESCRIPTION],
    paymentDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    externalReferenceId: 'INS-12351'
  })
};

/**
 * Hospitalization claim fixtures
 */
export const hospitalizationClaims = {
  // Newly submitted claim
  submitted: createClaimFixture({
    id: 'ho-1',
    claimTypeId: claimTypeIds.HOSPITALIZATION,
    status: ClaimStatus.SUBMITTED,
    description: 'Internação para cirurgia de apendicite',
    totalAmount: 8500.0,
    documentIds: [documentIds.HOSPITAL_INVOICE, documentIds.MEDICAL_REPORT, documentIds.PRESCRIPTION]
  }),
  
  // Claim in validation phase
  validating: createClaimFixture({
    id: 'ho-2',
    claimTypeId: claimTypeIds.HOSPITALIZATION,
    status: ClaimStatus.VALIDATING,
    description: 'Internação para tratamento de pneumonia',
    totalAmount: 6200.0,
    documentIds: [documentIds.HOSPITAL_INVOICE, documentIds.MEDICAL_REPORT]
  }),
  
  // Claim under review by insurance
  underReview: createClaimFixture({
    id: 'ho-3',
    claimTypeId: claimTypeIds.HOSPITALIZATION,
    status: ClaimStatus.UNDER_REVIEW,
    description: 'Internação para cirurgia ortopédica',
    totalAmount: 12000.0,
    documentIds: [documentIds.HOSPITAL_INVOICE, documentIds.MEDICAL_REPORT, documentIds.PRESCRIPTION, documentIds.EXAM_RESULT],
    externalReferenceId: 'INS-12352'
  }),
  
  // Claim requiring additional information
  additionalInfoRequired: createClaimFixture({
    id: 'ho-4',
    claimTypeId: claimTypeIds.HOSPITALIZATION,
    status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
    description: 'Internação para parto',
    totalAmount: 9500.0,
    documentIds: [documentIds.HOSPITAL_INVOICE, documentIds.MEDICAL_REPORT],
    additionalInfoRequest: 'Por favor, forneça o relatório detalhado do procedimento e a nota fiscal discriminada.'
  }),
  
  // Claim in updating phase after additional info request
  updating: createClaimFixture({
    id: 'ho-5',
    claimTypeId: claimTypeIds.HOSPITALIZATION,
    status: ClaimStatus.UPDATING,
    description: 'Internação para tratamento cardíaco',
    totalAmount: 15000.0,
    documentIds: [documentIds.HOSPITAL_INVOICE, documentIds.MEDICAL_REPORT, documentIds.ADDITIONAL_INFO],
    additionalInfoRequest: 'Por favor, forneça o relatório detalhado do procedimento e a nota fiscal discriminada.'
  }),
  
  // Claim approved and payment pending
  approved: createClaimFixture({
    id: 'ho-6',
    claimTypeId: claimTypeIds.HOSPITALIZATION,
    status: ClaimStatus.APPROVED,
    description: 'Internação para cirurgia de vesícula',
    totalAmount: 7800.0,
    coveredAmount: 7020.0, // 90% coverage for hospitalization
    documentIds: [documentIds.HOSPITAL_INVOICE, documentIds.MEDICAL_REPORT, documentIds.PRESCRIPTION],
    externalReferenceId: 'INS-12353'
  }),
  
  // Claim completed with payment
  completed: createClaimFixture({
    id: 'ho-7',
    claimTypeId: claimTypeIds.HOSPITALIZATION,
    status: ClaimStatus.COMPLETED,
    description: 'Internação para tratamento de fratura',
    totalAmount: 5500.0,
    coveredAmount: 4950.0, // 90% coverage for hospitalization
    documentIds: [documentIds.HOSPITAL_INVOICE, documentIds.MEDICAL_REPORT, documentIds.PRESCRIPTION, documentIds.EXAM_RESULT],
    paymentDate: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    externalReferenceId: 'INS-12354'
  })
};

/**
 * Medication claim fixtures
 */
export const medicationClaims = {
  // Newly submitted claim
  submitted: createClaimFixture({
    id: 'me-1',
    claimTypeId: claimTypeIds.MEDICATION,
    status: ClaimStatus.SUBMITTED,
    description: 'Medicamento para hipertensão',
    totalAmount: 120.0,
    documentIds: [documentIds.PHARMACY_RECEIPT, documentIds.PRESCRIPTION]
  }),
  
  // Claim in processing phase
  processing: createClaimFixture({
    id: 'me-2',
    claimTypeId: claimTypeIds.MEDICATION,
    status: ClaimStatus.PROCESSING,
    description: 'Medicamento para diabetes',
    totalAmount: 180.0,
    documentIds: [documentIds.PHARMACY_RECEIPT, documentIds.PRESCRIPTION, documentIds.MEDICAL_REPORT]
  }),
  
  // Claim rejected due to missing documentation
  rejected: createClaimFixture({
    id: 'me-3',
    claimTypeId: claimTypeIds.MEDICATION,
    status: ClaimStatus.REJECTED,
    description: 'Medicamento para alergia',
    totalAmount: 85.0,
    documentIds: [documentIds.PHARMACY_RECEIPT],
    rejectionReason: 'Falta receita médica válida.'
  }),
  
  // Claim denied by insurance
  denied: createClaimFixture({
    id: 'me-4',
    claimTypeId: claimTypeIds.MEDICATION,
    status: ClaimStatus.DENIED,
    description: 'Medicamento para dor crônica',
    totalAmount: 250.0,
    documentIds: [documentIds.PHARMACY_RECEIPT, documentIds.PRESCRIPTION],
    rejectionReason: 'Medicamento não coberto pelo plano atual.',
    externalReferenceId: 'INS-12355'
  }),
  
  // Claim approved and payment pending
  paymentPending: createClaimFixture({
    id: 'me-5',
    claimTypeId: claimTypeIds.MEDICATION,
    status: ClaimStatus.PAYMENT_PENDING,
    description: 'Medicamento para colesterol',
    totalAmount: 95.0,
    coveredAmount: 66.5, // 70% coverage for medications
    documentIds: [documentIds.PHARMACY_RECEIPT, documentIds.PRESCRIPTION],
    externalReferenceId: 'INS-12356'
  }),
  
  // Claim completed with payment
  completed: createClaimFixture({
    id: 'me-6',
    claimTypeId: claimTypeIds.MEDICATION,
    status: ClaimStatus.COMPLETED,
    description: 'Medicamento para asma',
    totalAmount: 150.0,
    coveredAmount: 105.0, // 70% coverage for medications
    documentIds: [documentIds.PHARMACY_RECEIPT, documentIds.PRESCRIPTION, documentIds.MEDICAL_REPORT],
    paymentDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    externalReferenceId: 'INS-12357'
  })
};

/**
 * All claim fixtures grouped by type
 */
export const claimFixtures = {
  medicalConsultation: medicalConsultationClaims,
  exam: examClaims,
  therapy: therapyClaims,
  hospitalization: hospitalizationClaims,
  medication: medicationClaims
};

/**
 * All claim fixtures as a flat array
 */
export const allClaimFixtures = [
  ...Object.values(medicalConsultationClaims),
  ...Object.values(examClaims),
  ...Object.values(therapyClaims),
  ...Object.values(hospitalizationClaims),
  ...Object.values(medicationClaims)
];

/**
 * Get claim fixtures by status
 * 
 * @param status - The claim status to filter by
 * @returns An array of claim fixtures with the specified status
 */
export const getClaimFixturesByStatus = (status: ClaimStatus): ClaimFixture[] => {
  return allClaimFixtures.filter(claim => claim.status === status);
};

/**
 * Get claim fixtures by type
 * 
 * @param claimTypeId - The claim type ID to filter by
 * @returns An array of claim fixtures with the specified type
 */
export const getClaimFixturesByType = (claimTypeId: string): ClaimFixture[] => {
  return allClaimFixtures.filter(claim => claim.claimTypeId === claimTypeId);
};

/**
 * Get claim fixtures by user
 * 
 * @param userId - The user ID to filter by
 * @returns An array of claim fixtures for the specified user
 */
export const getClaimFixturesByUser = (userId: string): ClaimFixture[] => {
  return allClaimFixtures.filter(claim => claim.userId === userId);
};

/**
 * Convert claim fixtures to Prisma create inputs
 * 
 * @param fixtures - The claim fixtures to convert
 * @returns An array of Prisma create inputs for claims
 */
export const toClaimCreateInputs = (fixtures: ClaimFixture[]): Prisma.ClaimCreateInput[] => {
  return fixtures.map(fixture => {
    const { documentIds, ...rest } = fixture;
    
    return {
      ...rest,
      documents: {
        connect: documentIds.map(id => ({ id }))
      },
      user: {
        connect: { id: fixture.userId }
      },
      claimType: {
        connect: { id: fixture.claimTypeId }
      }
    };
  });
};

export default claimFixtures;