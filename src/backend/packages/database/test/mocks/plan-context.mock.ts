/**
 * @file plan-context.mock.ts
 * @description Specialized mock for the Plan journey database context that extends the base journey context mock
 * with plan-specific data models and operations. Provides mock implementations for insurance plans, benefits,
 * coverage, claims, and documents with pre-configured test data tailored to the Plan journey.
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Import plan-specific error classes
import {
  PlanNotFoundError,
  PlanNotAvailableInRegionError,
  PlanPersistenceError,
} from '@austa/errors/journey/plan/plans-errors';

import {
  BenefitNotFoundError,
  BenefitNotCoveredError,
  BenefitLimitExceededError,
} from '@austa/errors/journey/plan/benefits-errors';

import {
  ClaimNotFoundError,
  DuplicateClaimError,
  ClaimValidationError,
  ClaimDeniedError,
} from '@austa/errors/journey/plan/claims-errors';

import {
  CoverageNotFoundError,
  ServiceNotCoveredError,
  OutOfNetworkError,
} from '@austa/errors/journey/plan/coverage-errors';

import {
  DocumentNotFoundError,
  DocumentFormatError,
  DocumentSizeExceededError,
} from '@austa/errors/journey/plan/documents-errors';

// Import plan-specific interfaces
import { IPlan } from '@austa/interfaces/journey/plan/plan.interface';
import { IBenefit } from '@austa/interfaces/journey/plan/benefit.interface';
import { ICoverage } from '@austa/interfaces/journey/plan/coverage.interface';
import { IClaim, ClaimStatus } from '@austa/interfaces/journey/plan/claim.interface';
import { IDocument } from '@austa/interfaces/journey/plan/document.interface';

// Import base journey context mock
import { BaseJourneyContextMock } from './journey-context.mock';
import { TransactionClient } from '../../src/transactions/transaction.interface';

/**
 * Mock implementation of the Plan journey database context.
 * Extends the base journey context mock with plan-specific operations and test data.
 */
@Injectable()
export class PlanContextMock extends BaseJourneyContextMock {
  // Pre-configured test data
  private plans: Map<string, IPlan> = new Map();
  private benefits: Map<string, IBenefit> = new Map();
  private coverage: Map<string, ICoverage> = new Map();
  private claims: Map<string, IClaim> = new Map();
  private documents: Map<string, IDocument> = new Map();
  private planBenefits: Map<string, { planId: string; benefitId: string }> = new Map();
  private networkProviders: Map<string, { planId: string; providerId: string }> = new Map();

  constructor() {
    super('plan');
    this.initializeTestData();
  }

  /**
   * Initializes pre-configured test data for the Plan journey.
   */
  private initializeTestData(): void {
    // Create test plans
    this.createTestPlans();
    
    // Create test benefits
    this.createTestBenefits();
    
    // Create test coverage
    this.createTestCoverage();
    
    // Create test claims
    this.createTestClaims();
    
    // Create test documents
    this.createTestDocuments();
    
    // Create test plan-benefit relationships
    this.createTestPlanBenefits();
    
    // Create test network providers
    this.createTestNetworkProviders();
  }

  /**
   * Creates test plans for the mock database.
   */
  private createTestPlans(): void {
    const plans: IPlan[] = [
      {
        id: 'plan-basic-001',
        name: 'Plano Básico',
        description: 'Plano com cobertura básica para necessidades essenciais',
        planNumber: 'PB-2023-001',
        type: 'Básico',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        premiumAmount: 250.00,
        currency: 'BRL',
        isActive: true,
        userId: 'user-001',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        regions: ['SP', 'RJ', 'MG'],
        price: 250.00,
        provider: 'AUSTA Seguros',
        status: 'ACTIVE',
        metadata: {
          coverageLevel: 'basic',
          networkSize: 'small',
          hasPharmacyDiscount: true
        }
      },
      {
        id: 'plan-standard-001',
        name: 'Plano Standard',
        description: 'Plano com cobertura intermediária para maior tranquilidade',
        planNumber: 'PS-2023-001',
        type: 'Standard',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        premiumAmount: 450.00,
        currency: 'BRL',
        isActive: true,
        userId: 'user-001',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        regions: ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'],
        price: 450.00,
        provider: 'AUSTA Seguros',
        status: 'ACTIVE',
        metadata: {
          coverageLevel: 'intermediate',
          networkSize: 'medium',
          hasPharmacyDiscount: true,
          hasDentalCoverage: true
        }
      },
      {
        id: 'plan-premium-001',
        name: 'Plano Premium',
        description: 'Plano com cobertura ampla para máxima proteção',
        planNumber: 'PP-2023-001',
        type: 'Premium',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        premiumAmount: 750.00,
        currency: 'BRL',
        isActive: true,
        userId: 'user-001',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        regions: ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS', 'BA', 'DF', 'GO'],
        price: 750.00,
        provider: 'AUSTA Seguros',
        status: 'ACTIVE',
        metadata: {
          coverageLevel: 'comprehensive',
          networkSize: 'large',
          hasPharmacyDiscount: true,
          hasDentalCoverage: true,
          hasInternationalCoverage: true
        }
      },
      {
        id: 'plan-inactive-001',
        name: 'Plano Descontinuado',
        description: 'Plano descontinuado não disponível para novos clientes',
        planNumber: 'PD-2022-001',
        type: 'Básico',
        effectiveFrom: new Date('2022-01-01'),
        effectiveTo: new Date('2022-12-31'),
        premiumAmount: 200.00,
        currency: 'BRL',
        isActive: false,
        userId: 'user-002',
        createdAt: new Date('2022-01-01'),
        updatedAt: new Date('2022-12-31'),
        regions: ['SP'],
        price: 200.00,
        provider: 'AUSTA Seguros',
        status: 'INACTIVE',
        metadata: {
          coverageLevel: 'basic',
          networkSize: 'small',
          discontinued: true
        }
      }
    ];

    plans.forEach(plan => {
      this.plans.set(plan.id, plan);
    });
  }

  /**
   * Creates test benefits for the mock database.
   */
  private createTestBenefits(): void {
    const benefits: IBenefit[] = [
      {
        id: 'benefit-001',
        type: 'MEDICAL_VISIT',
        code: 'MV-001',
        name: 'Consulta Médica',
        description: 'Cobertura para consultas médicas em consultório',
        limitations: 'Limite de 12 consultas por ano',
        exclusions: 'Não cobre consultas domiciliares',
        coveragePercentage: 80,
        maxCoverageAmount: 150.00,
        annualLimit: 1800.00,
        waitingPeriodDays: 30,
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        planId: 'plan-basic-001',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        metadata: {
          specialtyRestrictions: ['Clínica Geral', 'Pediatria']
        }
      },
      {
        id: 'benefit-002',
        type: 'EXAM',
        code: 'EX-001',
        name: 'Exames Laboratoriais',
        description: 'Cobertura para exames laboratoriais básicos',
        limitations: 'Conforme rol da ANS',
        exclusions: 'Exames experimentais ou não aprovados pela ANS',
        coveragePercentage: 70,
        maxCoverageAmount: 500.00,
        annualLimit: 2000.00,
        waitingPeriodDays: 60,
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        planId: 'plan-basic-001',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        metadata: {
          requiresReferral: true
        }
      },
      {
        id: 'benefit-003',
        type: 'THERAPY',
        code: 'TH-001',
        name: 'Fisioterapia',
        description: 'Cobertura para sessões de fisioterapia',
        limitations: 'Limite de 20 sessões por ano',
        exclusions: 'Não cobre terapias experimentais',
        coveragePercentage: 60,
        maxCoverageAmount: 80.00,
        annualLimit: 1600.00,
        waitingPeriodDays: 90,
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        planId: 'plan-standard-001',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        metadata: {
          requiresReferral: true,
          requiresPreAuthorization: true
        }
      },
      {
        id: 'benefit-004',
        type: 'HOSPITALIZATION',
        code: 'HO-001',
        name: 'Internação Hospitalar',
        description: 'Cobertura para internações hospitalares',
        limitations: 'Limite de 30 dias por ano',
        exclusions: 'Não cobre internações para procedimentos estéticos',
        coveragePercentage: 90,
        maxCoverageAmount: 10000.00,
        annualLimit: 50000.00,
        waitingPeriodDays: 180,
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        planId: 'plan-premium-001',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        metadata: {
          requiresPreAuthorization: true,
          includesICU: true,
          privateRoom: true
        }
      },
      {
        id: 'benefit-005',
        type: 'MEDICATION',
        code: 'ME-001',
        name: 'Medicamentos',
        description: 'Cobertura para medicamentos prescritos',
        limitations: 'Apenas medicamentos genéricos',
        exclusions: 'Não cobre medicamentos importados ou experimentais',
        coveragePercentage: 50,
        maxCoverageAmount: 200.00,
        annualLimit: 1000.00,
        waitingPeriodDays: 30,
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        planId: 'plan-premium-001',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        metadata: {
          requiresPrescription: true,
          pharmacyNetwork: ['Drogaria São Paulo', 'Drogasil', 'Pacheco']
        }
      }
    ];

    benefits.forEach(benefit => {
      this.benefits.set(benefit.id, benefit);
    });
  }

  /**
   * Creates test coverage for the mock database.
   */
  private createTestCoverage(): void {
    const coverageItems: ICoverage[] = [
      {
        id: 'coverage-001',
        procedureType: 'CONSULTATION',
        code: 'CONS-001',
        name: 'Consulta Médica Básica',
        coveragePercentage: 80,
        deductibleAmount: 30.00,
        copayAmount: 20.00,
        annualLimit: 1200.00,
        planId: 'plan-basic-001',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        serviceCodes: ['10101012', '10101039'],
        metadata: {
          networkRestrictions: 'IN_NETWORK_ONLY'
        }
      },
      {
        id: 'coverage-002',
        procedureType: 'DIAGNOSTIC',
        code: 'DIAG-001',
        name: 'Exames Diagnósticos Básicos',
        coveragePercentage: 70,
        deductibleAmount: 50.00,
        copayAmount: 30.00,
        annualLimit: 2000.00,
        planId: 'plan-basic-001',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        serviceCodes: ['40101010', '40101029', '40101037'],
        metadata: {
          requiresReferral: true
        }
      },
      {
        id: 'coverage-003',
        procedureType: 'THERAPY',
        code: 'THER-001',
        name: 'Terapias Físicas',
        coveragePercentage: 60,
        deductibleAmount: 40.00,
        copayAmount: 25.00,
        annualLimit: 1600.00,
        planId: 'plan-standard-001',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        serviceCodes: ['20101074', '20101082', '20101090'],
        metadata: {
          requiresReferral: true,
          sessionLimit: 20
        }
      },
      {
        id: 'coverage-004',
        procedureType: 'HOSPITALIZATION',
        code: 'HOSP-001',
        name: 'Internação Hospitalar',
        coveragePercentage: 90,
        deductibleAmount: 200.00,
        copayAmount: 0.00,
        annualLimit: 50000.00,
        planId: 'plan-premium-001',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        serviceCodes: ['30101018', '30101026', '30101034'],
        metadata: {
          requiresPreAuthorization: true,
          dayLimit: 30
        }
      },
      {
        id: 'coverage-005',
        procedureType: 'MEDICATION',
        code: 'MED-001',
        name: 'Medicamentos Prescritos',
        coveragePercentage: 50,
        deductibleAmount: 0.00,
        copayAmount: 0.00,
        annualLimit: 1000.00,
        planId: 'plan-premium-001',
        effectiveFrom: new Date('2023-01-01'),
        effectiveTo: new Date('2023-12-31'),
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        serviceCodes: ['90101010', '90101029', '90101037'],
        metadata: {
          requiresPrescription: true,
          genericOnly: true
        }
      }
    ];

    coverageItems.forEach(coverage => {
      this.coverage.set(coverage.id, coverage);
    });
  }

  /**
   * Creates test claims for the mock database.
   */
  private createTestClaims(): void {
    const claims: IClaim[] = [
      {
        id: 'claim-001',
        userId: 'user-001',
        planId: 'plan-basic-001',
        type: 'MEDICAL_VISIT',
        amount: 150.00,
        status: ClaimStatus.COMPLETED,
        procedureCode: '10101012',
        submittedAt: new Date('2023-02-15'),
        processedAt: new Date('2023-02-20'),
        documents: [],
        serviceDate: new Date('2023-02-10'),
        serviceCode: '10101012',
        providerId: 'provider-001',
        diagnosisCode: 'J00',
        providerName: 'Clínica São Lucas',
        notes: 'Consulta de rotina',
        metadata: {
          reimbursementAmount: 120.00,
          paymentMethod: 'BANK_TRANSFER',
          paymentDate: '2023-02-25'
        }
      },
      {
        id: 'claim-002',
        userId: 'user-001',
        planId: 'plan-basic-001',
        type: 'EXAM',
        amount: 300.00,
        status: ClaimStatus.APPROVED,
        procedureCode: '40101010',
        submittedAt: new Date('2023-03-05'),
        processedAt: new Date('2023-03-10'),
        documents: [],
        serviceDate: new Date('2023-03-01'),
        serviceCode: '40101010',
        providerId: 'provider-002',
        diagnosisCode: 'E11',
        providerName: 'Laboratório Central',
        notes: 'Exames de sangue anuais',
        metadata: {
          reimbursementAmount: 210.00,
          paymentStatus: 'PENDING'
        }
      },
      {
        id: 'claim-003',
        userId: 'user-002',
        planId: 'plan-standard-001',
        type: 'THERAPY',
        amount: 80.00,
        status: ClaimStatus.SUBMITTED,
        procedureCode: '20101074',
        submittedAt: new Date('2023-04-10'),
        processedAt: new Date('2023-04-10'),
        documents: [],
        serviceDate: new Date('2023-04-05'),
        serviceCode: '20101074',
        providerId: 'provider-003',
        diagnosisCode: 'M54.5',
        providerName: 'Clínica de Fisioterapia Saúde Total',
        notes: 'Sessão de fisioterapia para dor lombar',
        metadata: {
          sessionNumber: 1,
          totalSessions: 10
        }
      },
      {
        id: 'claim-004',
        userId: 'user-003',
        planId: 'plan-premium-001',
        type: 'HOSPITALIZATION',
        amount: 5000.00,
        status: ClaimStatus.DENIED,
        procedureCode: '30101018',
        submittedAt: new Date('2023-05-20'),
        processedAt: new Date('2023-05-25'),
        documents: [],
        serviceDate: new Date('2023-05-15'),
        serviceCode: '30101018',
        providerId: 'provider-004',
        diagnosisCode: 'K35.80',
        providerName: 'Hospital Santa Maria',
        notes: 'Internação para apendicectomia',
        metadata: {
          denialReason: 'PRE_EXISTING_CONDITION',
          appealDeadline: '2023-06-25'
        }
      },
      {
        id: 'claim-005',
        userId: 'user-003',
        planId: 'plan-premium-001',
        type: 'MEDICATION',
        amount: 120.00,
        status: ClaimStatus.UNDER_REVIEW,
        procedureCode: '90101010',
        submittedAt: new Date('2023-06-05'),
        processedAt: new Date('2023-06-05'),
        documents: [],
        serviceDate: new Date('2023-06-01'),
        serviceCode: '90101010',
        providerId: 'provider-005',
        diagnosisCode: 'I10',
        providerName: 'Farmácia São Paulo',
        notes: 'Medicamentos para hipertensão',
        metadata: {
          prescriptionId: 'RX-2023-0605-001',
          genericMedication: true
        }
      }
    ];

    claims.forEach(claim => {
      this.claims.set(claim.id, claim);
    });
  }

  /**
   * Creates test documents for the mock database.
   */
  private createTestDocuments(): void {
    const documents: IDocument[] = [
      {
        id: 'document-001',
        claimId: 'claim-001',
        filePath: 's3://austa-documents/claims/claim-001/receipt.pdf',
        fileName: 'receipt.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        documentType: 'RECEIPT',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date('2023-02-16'),
        uploadedAt: new Date('2023-02-15'),
        createdAt: new Date('2023-02-15'),
        updatedAt: new Date('2023-02-16'),
        fileUrl: 'https://austa-documents.s3.amazonaws.com/claims/claim-001/receipt.pdf',
        metadata: {
          uploadedBy: 'user-001',
          verifiedBy: 'system',
          ocr: {
            completed: true,
            confidence: 0.95
          }
        }
      },
      {
        id: 'document-002',
        claimId: 'claim-001',
        filePath: 's3://austa-documents/claims/claim-001/prescription.pdf',
        fileName: 'prescription.pdf',
        fileSize: 512 * 1024, // 512KB
        mimeType: 'application/pdf',
        documentType: 'PRESCRIPTION',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date('2023-02-16'),
        uploadedAt: new Date('2023-02-15'),
        createdAt: new Date('2023-02-15'),
        updatedAt: new Date('2023-02-16'),
        fileUrl: 'https://austa-documents.s3.amazonaws.com/claims/claim-001/prescription.pdf',
        metadata: {
          uploadedBy: 'user-001',
          verifiedBy: 'system',
          ocr: {
            completed: true,
            confidence: 0.92
          }
        }
      },
      {
        id: 'document-003',
        claimId: 'claim-002',
        filePath: 's3://austa-documents/claims/claim-002/receipt.pdf',
        fileName: 'receipt.pdf',
        fileSize: 768 * 1024, // 768KB
        mimeType: 'application/pdf',
        documentType: 'RECEIPT',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date('2023-03-06'),
        uploadedAt: new Date('2023-03-05'),
        createdAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-06'),
        fileUrl: 'https://austa-documents.s3.amazonaws.com/claims/claim-002/receipt.pdf',
        metadata: {
          uploadedBy: 'user-001',
          verifiedBy: 'system',
          ocr: {
            completed: true,
            confidence: 0.97
          }
        }
      },
      {
        id: 'document-004',
        claimId: 'claim-002',
        filePath: 's3://austa-documents/claims/claim-002/exam_results.pdf',
        fileName: 'exam_results.pdf',
        fileSize: 2 * 1024 * 1024, // 2MB
        mimeType: 'application/pdf',
        documentType: 'MEDICAL_REPORT',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date('2023-03-06'),
        uploadedAt: new Date('2023-03-05'),
        createdAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-06'),
        fileUrl: 'https://austa-documents.s3.amazonaws.com/claims/claim-002/exam_results.pdf',
        metadata: {
          uploadedBy: 'user-001',
          verifiedBy: 'system',
          ocr: {
            completed: true,
            confidence: 0.90
          }
        }
      },
      {
        id: 'document-005',
        claimId: 'claim-003',
        filePath: 's3://austa-documents/claims/claim-003/receipt.jpg',
        fileName: 'receipt.jpg',
        fileSize: 1.5 * 1024 * 1024, // 1.5MB
        mimeType: 'image/jpeg',
        documentType: 'RECEIPT',
        verificationStatus: 'PENDING',
        verifiedAt: null,
        uploadedAt: new Date('2023-04-10'),
        createdAt: new Date('2023-04-10'),
        updatedAt: new Date('2023-04-10'),
        fileUrl: 'https://austa-documents.s3.amazonaws.com/claims/claim-003/receipt.jpg',
        metadata: {
          uploadedBy: 'user-002',
          ocr: {
            completed: false
          }
        }
      }
    ];

    documents.forEach(document => {
      this.documents.set(document.id, document);
      
      // Update claims with their documents
      if (document.claimId) {
        const claim = this.claims.get(document.claimId);
        if (claim) {
          if (!claim.documents) {
            claim.documents = [];
          }
          claim.documents.push({
            id: document.id,
            type: document.documentType,
            url: document.fileUrl,
            uploadedAt: document.uploadedAt,
            metadata: document.metadata
          });
        }
      }
    });
  }

  /**
   * Creates test plan-benefit relationships for the mock database.
   */
  private createTestPlanBenefits(): void {
    const planBenefits = [
      { planId: 'plan-basic-001', benefitId: 'benefit-001' },
      { planId: 'plan-basic-001', benefitId: 'benefit-002' },
      { planId: 'plan-standard-001', benefitId: 'benefit-001' },
      { planId: 'plan-standard-001', benefitId: 'benefit-002' },
      { planId: 'plan-standard-001', benefitId: 'benefit-003' },
      { planId: 'plan-premium-001', benefitId: 'benefit-001' },
      { planId: 'plan-premium-001', benefitId: 'benefit-002' },
      { planId: 'plan-premium-001', benefitId: 'benefit-003' },
      { planId: 'plan-premium-001', benefitId: 'benefit-004' },
      { planId: 'plan-premium-001', benefitId: 'benefit-005' }
    ];

    planBenefits.forEach(pb => {
      const key = `${pb.planId}-${pb.benefitId}`;
      this.planBenefits.set(key, pb);
    });
  }

  /**
   * Creates test network providers for the mock database.
   */
  private createTestNetworkProviders(): void {
    const networkProviders = [
      { planId: 'plan-basic-001', providerId: 'provider-001' },
      { planId: 'plan-basic-001', providerId: 'provider-002' },
      { planId: 'plan-standard-001', providerId: 'provider-001' },
      { planId: 'plan-standard-001', providerId: 'provider-002' },
      { planId: 'plan-standard-001', providerId: 'provider-003' },
      { planId: 'plan-premium-001', providerId: 'provider-001' },
      { planId: 'plan-premium-001', providerId: 'provider-002' },
      { planId: 'plan-premium-001', providerId: 'provider-003' },
      { planId: 'plan-premium-001', providerId: 'provider-004' },
      { planId: 'plan-premium-001', providerId: 'provider-005' }
    ];

    networkProviders.forEach(np => {
      const key = `${np.planId}-${np.providerId}`;
      this.networkProviders.set(key, np);
    });
  }

  /**
   * Resets the mock database to its initial state.
   */
  reset(): void {
    this.plans.clear();
    this.benefits.clear();
    this.coverage.clear();
    this.claims.clear();
    this.documents.clear();
    this.planBenefits.clear();
    this.networkProviders.clear();
    this.initializeTestData();
  }

  /**
   * Retrieves a plan by ID with optimized query for plan details
   * 
   * @param planId - The unique identifier of the plan
   * @returns The plan details or throws PlanNotFoundError if not found
   */
  async getPlanById(planId: string): Promise<IPlan> {
    const plan = this.plans.get(planId);
    
    if (!plan) {
      throw new PlanNotFoundError(`Plan with ID ${planId} not found`);
    }
    
    return this.simulateAsync(plan);
  }

  /**
   * Retrieves plans available in a specific region
   * 
   * @param regionCode - The region code to filter plans by
   * @returns Array of plans available in the specified region
   */
  async getPlansByRegion(regionCode: string): Promise<IPlan[]> {
    const plans = Array.from(this.plans.values()).filter(plan => 
      plan.regions.includes(regionCode) && plan.status === 'ACTIVE'
    );
    
    if (plans.length === 0) {
      throw new PlanNotAvailableInRegionError(
        `No plans available in region ${regionCode}`
      );
    }
    
    return this.simulateAsync(plans);
  }

  /**
   * Retrieves a benefit by ID with optimized query
   * 
   * @param benefitId - The unique identifier of the benefit
   * @returns The benefit details or throws BenefitNotFoundError if not found
   */
  async getBenefitById(benefitId: string): Promise<IBenefit> {
    const benefit = this.benefits.get(benefitId);
    
    if (!benefit) {
      throw new BenefitNotFoundError(`Benefit with ID ${benefitId} not found`);
    }
    
    return this.simulateAsync(benefit);
  }

  /**
   * Checks if a benefit is covered by a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @param benefitId - The unique identifier of the benefit
   * @returns True if the benefit is covered, throws BenefitNotCoveredError otherwise
   */
  async isBenefitCoveredByPlan(planId: string, benefitId: string): Promise<boolean> {
    const key = `${planId}-${benefitId}`;
    const planBenefit = this.planBenefits.get(key);
    
    if (!planBenefit) {
      throw new BenefitNotCoveredError(
        `Benefit ${benefitId} is not covered by plan ${planId}`
      );
    }
    
    return this.simulateAsync(true);
  }

  /**
   * Retrieves coverage details for a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @returns Array of coverage details for the specified plan
   */
  async getPlanCoverage(planId: string): Promise<ICoverage[]> {
    const coverageItems = Array.from(this.coverage.values()).filter(
      coverage => coverage.planId === planId
    );
    
    if (coverageItems.length === 0) {
      throw new CoverageNotFoundError(`No coverage found for plan ${planId}`);
    }
    
    return this.simulateAsync(coverageItems);
  }

  /**
   * Checks if a service is covered by a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @param serviceCode - The service code to check coverage for
   * @returns Coverage details if covered, throws ServiceNotCoveredError otherwise
   */
  async isServiceCovered(planId: string, serviceCode: string): Promise<ICoverage> {
    const coverage = Array.from(this.coverage.values()).find(
      coverage => coverage.planId === planId && coverage.serviceCodes.includes(serviceCode)
    );
    
    if (!coverage) {
      throw new ServiceNotCoveredError(
        `Service ${serviceCode} is not covered by plan ${planId}`
      );
    }
    
    return this.simulateAsync(coverage);
  }

  /**
   * Checks if a provider is in-network for a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @param providerId - The unique identifier of the provider
   * @returns True if the provider is in-network, throws OutOfNetworkError otherwise
   */
  async isProviderInNetwork(planId: string, providerId: string): Promise<boolean> {
    const key = `${planId}-${providerId}`;
    const networkProvider = this.networkProviders.get(key);
    
    if (!networkProvider) {
      throw new OutOfNetworkError(
        `Provider ${providerId} is out of network for plan ${planId}`
      );
    }
    
    return this.simulateAsync(true);
  }

  /**
   * Retrieves a claim by ID with optimized query for claim details
   * 
   * @param claimId - The unique identifier of the claim
   * @returns The claim details or throws ClaimNotFoundError if not found
   */
  async getClaimById(claimId: string): Promise<IClaim> {
    const claim = this.claims.get(claimId);
    
    if (!claim) {
      throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
    }
    
    return this.simulateAsync(claim);
  }

  /**
   * Retrieves claims for a specific user with pagination
   * 
   * @param userId - The unique identifier of the user
   * @param status - Optional filter for claim status
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Paginated list of claims for the specified user
   */
  async getUserClaims(
    userId: string,
    status?: ClaimStatus,
    page = 1,
    limit = 10,
  ): Promise<{ claims: IClaim[]; total: number; page: number; limit: number }> {
    let filteredClaims = Array.from(this.claims.values()).filter(
      claim => claim.userId === userId
    );
    
    if (status) {
      filteredClaims = filteredClaims.filter(claim => claim.status === status);
    }
    
    const total = filteredClaims.length;
    const skip = (page - 1) * limit;
    const paginatedClaims = filteredClaims
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + limit);
    
    return this.simulateAsync({
      claims: paginatedClaims,
      total,
      page,
      limit,
    });
  }

  /**
   * Creates a new claim with optimized transaction pattern
   * 
   * @param data - The claim data to create
   * @returns The created claim
   */
  async createClaim(
    data: Prisma.ClaimCreateInput,
    client?: TransactionClient,
  ): Promise<IClaim> {
    // Check for duplicate claims
    const existingClaim = Array.from(this.claims.values()).find(
      claim => 
        claim.userId === data.userId &&
        claim.serviceDate?.toISOString() === data.serviceDate?.toISOString() &&
        claim.serviceCode === data.serviceCode &&
        claim.providerId === data.providerId
    );
    
    if (existingClaim) {
      throw new DuplicateClaimError(
        `A claim for this service already exists (ID: ${existingClaim.id})`
      );
    }
    
    // Validate claim data
    if (!data.amount || data.amount <= 0) {
      throw new ClaimValidationError('Claim amount must be greater than zero');
    }
    
    // Create the claim
    const newClaim: IClaim = {
      id: data.id || `claim-${uuidv4()}`,
      userId: data.userId as string,
      planId: data.planId as string,
      type: data.type as string,
      amount: data.amount as number,
      status: ClaimStatus.SUBMITTED,
      procedureCode: data.procedureCode as string,
      submittedAt: new Date(),
      processedAt: new Date(),
      documents: [],
      serviceDate: data.serviceDate as Date,
      serviceCode: data.serviceCode as string,
      providerId: data.providerId as string,
      diagnosisCode: data.diagnosisCode as string,
      providerName: data.providerName as string,
      notes: data.notes as string,
      metadata: data.metadata as Record<string, any>,
    };
    
    this.claims.set(newClaim.id, newClaim);
    
    return this.simulateAsync(newClaim);
  }

  /**
   * Updates a claim status with optimized transaction pattern
   * 
   * @param claimId - The unique identifier of the claim
   * @param status - The new status for the claim
   * @param notes - Optional notes about the status change
   * @returns The updated claim
   */
  async updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    notes?: string,
    client?: TransactionClient,
  ): Promise<IClaim> {
    const claim = this.claims.get(claimId);
    
    if (!claim) {
      throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
    }
    
    // Validate status transition
    this.validateClaimStatusTransition(claim.status, status);
    
    // Update the claim status
    const updatedClaim = {
      ...claim,
      status,
      notes: notes || claim.notes,
      processedAt: new Date(),
    };
    
    this.claims.set(claimId, updatedClaim);
    
    return this.simulateAsync(updatedClaim);
  }

  /**
   * Validates claim status transitions to ensure they follow the correct flow
   * 
   * @param currentStatus - The current status of the claim
   * @param newStatus - The new status to transition to
   * @throws ClaimValidationError if the transition is invalid
   */
  private validateClaimStatusTransition(
    currentStatus: ClaimStatus,
    newStatus: ClaimStatus,
  ): void {
    const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
      [ClaimStatus.DRAFT]: [
        ClaimStatus.SUBMITTED,
        ClaimStatus.CANCELLED,
      ],
      [ClaimStatus.SUBMITTED]: [
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.DENIED,
        ClaimStatus.CANCELLED,
      ],
      [ClaimStatus.UNDER_REVIEW]: [
        ClaimStatus.APPROVED,
        ClaimStatus.DENIED,
        ClaimStatus.ADDITIONAL_INFO_REQUIRED,
      ],
      [ClaimStatus.ADDITIONAL_INFO_REQUIRED]: [
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.EXPIRED,
      ],
      [ClaimStatus.APPROVED]: [
        ClaimStatus.PROCESSING,
      ],
      [ClaimStatus.DENIED]: [
        ClaimStatus.APPEALED,
        ClaimStatus.FINAL_DENIAL,
      ],
      [ClaimStatus.APPEALED]: [
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.FINAL_DENIAL,
      ],
      [ClaimStatus.PROCESSING]: [
        ClaimStatus.COMPLETED,
        ClaimStatus.FAILED,
      ],
      [ClaimStatus.FAILED]: [
        ClaimStatus.PROCESSING,
      ],
      [ClaimStatus.COMPLETED]: [],
      [ClaimStatus.CANCELLED]: [],
      [ClaimStatus.EXPIRED]: [],
      [ClaimStatus.FINAL_DENIAL]: [],
    };
    
    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      throw new ClaimValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Adds a document to a claim with optimized transaction pattern
   * 
   * @param claimId - The unique identifier of the claim
   * @param documentData - The document data to add
   * @returns The added document
   */
  async addDocumentToClaim(
    claimId: string,
    documentData: Prisma.DocumentCreateInput,
    client?: TransactionClient,
  ): Promise<IDocument> {
    // Check if claim exists
    const claim = this.claims.get(claimId);
    
    if (!claim) {
      throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
    }
    
    // Validate document format
    const allowedFormats = ['pdf', 'jpg', 'jpeg', 'png'];
    const fileUrl = documentData.fileUrl as string;
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      throw new DocumentFormatError(
        `Invalid document format: ${fileExtension}. Allowed formats: ${allowedFormats.join(', ')}`
      );
    }
    
    // Validate document size (assuming size is in bytes)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (documentData.fileSize && documentData.fileSize > maxSizeBytes) {
      throw new DocumentSizeExceededError(
        `Document size exceeds maximum allowed size of 10MB`
      );
    }
    
    // Add document to claim
    const newDocument: IDocument = {
      id: documentData.id as string || `document-${uuidv4()}`,
      claimId,
      filePath: documentData.filePath as string,
      fileName: documentData.fileName as string,
      fileSize: documentData.fileSize as number,
      mimeType: documentData.mimeType as string,
      documentType: documentData.documentType as string,
      verificationStatus: 'PENDING',
      verifiedAt: null,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      fileUrl: documentData.fileUrl as string,
      metadata: documentData.metadata as Record<string, any>,
    };
    
    this.documents.set(newDocument.id, newDocument);
    
    // Update claim with the new document
    if (!claim.documents) {
      claim.documents = [];
    }
    
    claim.documents.push({
      id: newDocument.id,
      type: newDocument.documentType,
      url: newDocument.fileUrl,
      uploadedAt: newDocument.uploadedAt,
      metadata: newDocument.metadata,
    });
    
    return this.simulateAsync(newDocument);
  }

  /**
   * Retrieves documents for a specific claim
   * 
   * @param claimId - The unique identifier of the claim
   * @returns Array of documents for the specified claim
   */
  async getClaimDocuments(claimId: string): Promise<IDocument[]> {
    // Check if claim exists
    const claim = this.claims.get(claimId);
    
    if (!claim) {
      throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
    }
    
    // Get documents for claim
    const documents = Array.from(this.documents.values())
      .filter(doc => doc.claimId === claimId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return this.simulateAsync(documents);
  }

  /**
   * Retrieves a document by ID
   * 
   * @param documentId - The unique identifier of the document
   * @returns The document details or throws DocumentNotFoundError if not found
   */
  async getDocumentById(documentId: string): Promise<IDocument> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      throw new DocumentNotFoundError(`Document with ID ${documentId} not found`);
    }
    
    return this.simulateAsync(document);
  }

  /**
   * Simulates an asynchronous operation with a small delay
   * to mimic database latency.
   * 
   * @param data - The data to return after the delay
   * @returns A promise that resolves to the data after a small delay
   */
  private simulateAsync<T>(data: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, Math.random() * 50); // Random delay between 0-50ms
    });
  }
}