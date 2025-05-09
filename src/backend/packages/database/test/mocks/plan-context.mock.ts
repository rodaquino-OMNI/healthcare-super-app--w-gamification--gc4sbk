/**
 * @file plan-context.mock.ts
 * @description Specialized mock for the Plan journey database context that extends the base journey context mock
 * with plan-specific data models and operations. Provides mock implementations for insurance plans, benefits,
 * coverage, claims, and documents with pre-configured test data tailored to the Plan journey.
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Import interfaces
import { PlanDatabaseContext } from '../../src/types/context.types';
import { JourneyType } from '../../src/types/journey.types';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { RetryStrategy } from '../../src/errors/retry-strategies';
import { TransactionOptions, TransactionIsolationLevel } from '../../src/types/transaction.types';

// Import Plan journey interfaces
import {
  IPlan,
  IBenefit,
  ICoverage,
  IClaim,
  ClaimStatus,
  IDocument,
  DocumentType,
  DocumentUploadStatus
} from '@austa/interfaces/journey/plan';

/**
 * Mock implementation of the Plan journey database context.
 * Provides pre-configured test data and mock implementations for plan-specific operations.
 */
export class PlanContextMock implements Partial<PlanDatabaseContext> {
  // Mock implementations of all methods
  readonly journeyType = JourneyType.PLAN;
  readonly contextId = 'mock-plan-context-id';
  
  // Mock data storage
  private plans: Record<string, any> = {};
  private benefits: Record<string, any> = {};
  private coverages: Record<string, any> = {};
  private claims: Record<string, any> = {};
  private documents: Record<string, any> = {};
  private enrollments: Record<string, any> = {};
  
  // Mock function implementations
  getUserPlanDetails = jest.fn();
  submitClaim = jest.fn();
  getBenefitUtilization = jest.fn();
  comparePlans = jest.fn();
  enrollInPlan = jest.fn();
  storeDocument = jest.fn();
  retrieveDocument = jest.fn();
  checkCoverage = jest.fn();
  trackClaimStatus = jest.fn();
  calculateOutOfPocketExpenses = jest.fn();
  validateJourneyData = jest.fn();
  getJourneyMetrics = jest.fn();
  sendJourneyEvent = jest.fn();
  getJourneyConfig = jest.fn();
  executeJourneyOperation = jest.fn();
  transaction = jest.fn();
  executeOperation = jest.fn();
  getPrismaClient = jest.fn();
  
  /**
   * Creates a new Plan journey database context mock with pre-configured test data.
   */
  constructor() {
    this.initializeTestData();
    this.setupMockImplementations();
  }
  
  /**
   * Initializes pre-configured test data for the Plan journey.
   */
  private initializeTestData(): void {
    // Create test plans
    this.plans = {
      'plan-1': {
        id: 'plan-1',
        userId: 'user-1',
        planNumber: 'PLN-2023-12345',
        name: 'Premium Health Plan',
        description: 'Comprehensive health coverage with dental and vision benefits',
        type: 'family',
        provider: 'AUSTA Insurance',
        premium: 299.99,
        currency: 'BRL',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        status: 'active',
        coverageDetails: {
          medicalVisits: true,
          emergencyCare: true,
          hospitalization: true,
          dental: true,
          vision: true,
          prescription: true
        },
        journey: { journeyType: JourneyType.PLAN },
        createdAt: new Date('2022-12-15'),
        updatedAt: new Date('2022-12-15')
      },
      'plan-2': {
        id: 'plan-2',
        userId: 'user-2',
        planNumber: 'PLN-2023-67890',
        name: 'Basic Health Plan',
        description: 'Essential health coverage for individuals',
        type: 'individual',
        provider: 'AUSTA Insurance',
        premium: 149.99,
        currency: 'BRL',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        status: 'active',
        coverageDetails: {
          medicalVisits: true,
          emergencyCare: true,
          hospitalization: true,
          dental: false,
          vision: false,
          prescription: true
        },
        journey: { journeyType: JourneyType.PLAN },
        createdAt: new Date('2022-12-20'),
        updatedAt: new Date('2022-12-20')
      }
    };
    
    // Create test benefits
    this.benefits = {
      'benefit-1': {
        id: 'benefit-1',
        planId: 'plan-1',
        type: 'medical_visits',
        description: 'Coverage for medical consultations',
        limitations: 'Up to 12 visits per year',
        maxCoverage: 1500,
        coveragePercentage: 80,
        deductible: 50,
        copay: 25,
        effectiveDate: '2023-01-01T00:00:00Z',
        expirationDate: '2023-12-31T23:59:59Z',
        metadata: {
          serviceCodes: ['1001', '1002', '1003']
        }
      },
      'benefit-2': {
        id: 'benefit-2',
        planId: 'plan-1',
        type: 'dental',
        description: 'Coverage for dental procedures',
        limitations: 'Up to 2 cleanings per year',
        maxCoverage: 1000,
        coveragePercentage: 70,
        deductible: 100,
        copay: 30,
        effectiveDate: '2023-01-01T00:00:00Z',
        expirationDate: '2023-12-31T23:59:59Z',
        metadata: {
          serviceCodes: ['2001', '2002', '2003']
        }
      },
      'benefit-3': {
        id: 'benefit-3',
        planId: 'plan-2',
        type: 'medical_visits',
        description: 'Coverage for medical consultations',
        limitations: 'Up to 8 visits per year',
        maxCoverage: 1000,
        coveragePercentage: 70,
        deductible: 100,
        copay: 35,
        effectiveDate: '2023-01-01T00:00:00Z',
        expirationDate: '2023-12-31T23:59:59Z',
        metadata: {
          serviceCodes: ['1001', '1002']
        }
      }
    };
    
    // Create test coverages
    this.coverages = {
      'coverage-1': {
        id: 'coverage-1',
        planId: 'plan-1',
        type: 'medical_visit',
        details: 'Coverage for general practitioner and specialist visits',
        limitations: 'Referral required for specialists',
        coPayment: 25,
        createdAt: new Date('2022-12-15'),
        updatedAt: new Date('2022-12-15')
      },
      'coverage-2': {
        id: 'coverage-2',
        planId: 'plan-1',
        type: 'emergency_care',
        details: 'Coverage for emergency room visits',
        limitations: 'Must be a genuine emergency',
        coPayment: 150,
        createdAt: new Date('2022-12-15'),
        updatedAt: new Date('2022-12-15')
      },
      'coverage-3': {
        id: 'coverage-3',
        planId: 'plan-2',
        type: 'medical_visit',
        details: 'Coverage for general practitioner visits only',
        limitations: 'Specialists not covered',
        coPayment: 35,
        createdAt: new Date('2022-12-20'),
        updatedAt: new Date('2022-12-20')
      }
    };
    
    // Create test claims
    this.claims = {
      'claim-1': {
        id: 'claim-1',
        userId: 'user-1',
        planId: 'plan-1',
        type: 'medical_visit',
        amount: 150.00,
        status: ClaimStatus.APPROVED,
        procedureCode: '1001',
        submittedAt: new Date('2023-03-15'),
        processedAt: new Date('2023-03-20'),
        documents: ['document-1'],
        metadata: {
          providerName: 'Dr. Silva',
          providerNPI: '1234567890',
          diagnosisCodes: ['J00'],
          outOfPocket: 30.00
        }
      },
      'claim-2': {
        id: 'claim-2',
        userId: 'user-1',
        planId: 'plan-1',
        type: 'dental',
        amount: 200.00,
        status: ClaimStatus.SUBMITTED,
        procedureCode: '2001',
        submittedAt: new Date('2023-04-10'),
        processedAt: new Date('2023-04-10'),
        documents: ['document-2'],
        metadata: {
          providerName: 'Dr. Santos',
          providerNPI: '0987654321',
          procedureDescription: 'Dental cleaning',
          outOfPocket: 60.00
        }
      },
      'claim-3': {
        id: 'claim-3',
        userId: 'user-2',
        planId: 'plan-2',
        type: 'medical_visit',
        amount: 120.00,
        status: ClaimStatus.COMPLETED,
        procedureCode: '1002',
        submittedAt: new Date('2023-02-05'),
        processedAt: new Date('2023-02-10'),
        documents: ['document-3'],
        metadata: {
          providerName: 'Dr. Oliveira',
          providerNPI: '5678901234',
          diagnosisCodes: ['J06.9'],
          outOfPocket: 36.00
        }
      }
    };
    
    // Create test documents
    this.documents = {
      'document-1': {
        id: 'document-1',
        entityId: 'claim-1',
        entityType: 'claim',
        type: DocumentType.RECEIPT,
        fileName: 'receipt_dr_silva.pdf',
        fileSize: 1024 * 50, // 50KB
        mimeType: 'application/pdf',
        filePath: 'documents/user-1/receipt_dr_silva.pdf',
        uploadStatus: DocumentUploadStatus.COMPLETED,
        createdAt: new Date('2023-03-15'),
        updatedAt: new Date('2023-03-15'),
        description: 'Receipt for medical consultation',
        metadata: {
          uploadedBy: 'user-1',
          originalName: 'receipt.pdf'
        }
      },
      'document-2': {
        id: 'document-2',
        entityId: 'claim-2',
        entityType: 'claim',
        type: DocumentType.RECEIPT,
        fileName: 'receipt_dr_santos.pdf',
        fileSize: 1024 * 45, // 45KB
        mimeType: 'application/pdf',
        filePath: 'documents/user-1/receipt_dr_santos.pdf',
        uploadStatus: DocumentUploadStatus.COMPLETED,
        createdAt: new Date('2023-04-10'),
        updatedAt: new Date('2023-04-10'),
        description: 'Receipt for dental cleaning',
        metadata: {
          uploadedBy: 'user-1',
          originalName: 'dental_receipt.pdf'
        }
      },
      'document-3': {
        id: 'document-3',
        entityId: 'claim-3',
        entityType: 'claim',
        type: DocumentType.RECEIPT,
        fileName: 'receipt_dr_oliveira.jpg',
        fileSize: 1024 * 100, // 100KB
        mimeType: 'image/jpeg',
        filePath: 'documents/user-2/receipt_dr_oliveira.jpg',
        uploadStatus: DocumentUploadStatus.COMPLETED,
        createdAt: new Date('2023-02-05'),
        updatedAt: new Date('2023-02-05'),
        description: 'Receipt for medical consultation',
        metadata: {
          uploadedBy: 'user-2',
          originalName: 'receipt.jpg'
        }
      }
    };
    
    // Create test enrollments
    this.enrollments = {
      'enrollment-1': {
        id: 'enrollment-1',
        userId: 'user-1',
        planId: 'plan-1',
        status: 'active',
        coverageStart: new Date('2023-01-01'),
        coverageEnd: new Date('2023-12-31'),
        paymentMethod: {
          type: 'credit_card',
          lastFour: '1234',
          expiryDate: '12/25'
        },
        dependents: [
          {
            name: 'Dependent 1',
            birthDate: '2010-05-15',
            relationship: 'child'
          },
          {
            name: 'Dependent 2',
            birthDate: '2015-08-20',
            relationship: 'child'
          }
        ],
        createdAt: new Date('2022-12-15'),
        updatedAt: new Date('2022-12-15')
      },
      'enrollment-2': {
        id: 'enrollment-2',
        userId: 'user-2',
        planId: 'plan-2',
        status: 'active',
        coverageStart: new Date('2023-01-01'),
        coverageEnd: new Date('2023-12-31'),
        paymentMethod: {
          type: 'bank_account',
          lastFour: '5678',
          bankName: 'Banco do Brasil'
        },
        dependents: [],
        createdAt: new Date('2022-12-20'),
        updatedAt: new Date('2022-12-20')
      }
    };
  }
  
  /**
   * Sets up mock implementations for all methods.
   */
  private setupMockImplementations(): void {
    // Mock getUserPlanDetails implementation
    this.getUserPlanDetails.mockImplementation(async (userId: string) => {
      const plan = Object.values(this.plans).find(p => p.userId === userId);
      
      if (!plan) {
        throw new DatabaseException(
          `No plan found for user ${userId}`,
          DatabaseErrorType.NOT_FOUND,
          { userId }
        );
      }
      
      // Add benefits and coverages to the plan
      const planBenefits = Object.values(this.benefits).filter(b => b.planId === plan.id);
      const planCoverages = Object.values(this.coverages).filter(c => c.planId === plan.id);
      
      return {
        ...plan,
        benefits: planBenefits,
        coverages: planCoverages
      } as IPlan;
    });
    
    // Mock submitClaim implementation
    this.submitClaim.mockImplementation(async (
      userId: string,
      claimData: Record<string, any>,
      documentIds?: string[]
    ) => {
      // Validate the claim data
      const validationResult = await this.validateJourneyData('claim', claimData);
      if (!validationResult.valid) {
        throw new DatabaseException(
          'Invalid claim data',
          DatabaseErrorType.VALIDATION,
          { errors: validationResult.errors }
        );
      }
      
      // Check if the plan exists and is active
      const plan = Object.values(this.plans).find(
        p => p.id === claimData.planId && p.userId === userId && p.status === 'active'
      );
      
      if (!plan) {
        throw new DatabaseException(
          `No active plan found with ID ${claimData.planId} for user ${userId}`,
          DatabaseErrorType.NOT_FOUND,
          { planId: claimData.planId, userId }
        );
      }
      
      // Create a new claim
      const claimId = `claim-${Date.now()}`;
      const now = new Date();
      
      const newClaim = {
        id: claimId,
        userId,
        planId: claimData.planId,
        type: claimData.type,
        amount: claimData.amount,
        status: ClaimStatus.SUBMITTED,
        procedureCode: claimData.procedureCode,
        submittedAt: now,
        processedAt: now,
        documents: documentIds || [],
        metadata: claimData.metadata || {}
      };
      
      // Store the claim
      this.claims[claimId] = newClaim;
      
      // Associate documents if provided
      if (documentIds && documentIds.length > 0) {
        documentIds.forEach(docId => {
          if (this.documents[docId]) {
            this.documents[docId].entityId = claimId;
            this.documents[docId].entityType = 'claim';
          }
        });
      }
      
      // Send journey event for claim submission
      await this.sendJourneyEvent(
        'CLAIM_SUBMITTED',
        userId,
        {
          claimId,
          claimType: newClaim.type,
          amount: newClaim.amount
        }
      );
      
      return newClaim as IClaim;
    });
    
    // Mock getBenefitUtilization implementation
    this.getBenefitUtilization.mockImplementation(async (
      userId: string,
      benefitType?: string,
      year?: number
    ) => {
      const currentYear = year || new Date().getFullYear();
      
      // Get the user's plan
      const plan = Object.values(this.plans).find(p => p.userId === userId && p.status === 'active');
      
      if (!plan) {
        throw new DatabaseException(
          `No active plan found for user ${userId}`,
          DatabaseErrorType.NOT_FOUND,
          { userId }
        );
      }
      
      // Get benefits for the plan
      let benefits = Object.values(this.benefits).filter(b => b.planId === plan.id);
      
      // Filter by benefit type if provided
      if (benefitType) {
        benefits = benefits.filter(b => b.type === benefitType);
      }
      
      // Get claims for the user in the specified year
      const startDate = new Date(`${currentYear}-01-01`);
      const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);
      
      const claims = Object.values(this.claims).filter(c => 
        c.userId === userId && 
        c.submittedAt >= startDate && 
        c.submittedAt <= endDate
      );
      
      // Calculate utilization for each benefit
      const utilization = benefits.map(benefit => {
        // Find claims related to this benefit type
        const benefitClaims = claims.filter(c => c.type === benefit.type);
        
        // Calculate total used amount
        const used = benefitClaims.reduce((sum, claim) => sum + claim.amount, 0);
        
        return {
          benefitId: benefit.id,
          type: benefit.type,
          description: benefit.description,
          maxCoverage: benefit.maxCoverage,
          used,
          remaining: benefit.maxCoverage ? benefit.maxCoverage - used : null,
          utilizationPercentage: benefit.maxCoverage
            ? (used / benefit.maxCoverage) * 100
            : null,
          records: benefitClaims.map(claim => ({
            claimId: claim.id,
            amount: claim.amount,
            date: claim.submittedAt,
            status: claim.status
          }))
        };
      });
      
      return {
        userId,
        planId: plan.id,
        year: currentYear,
        benefits: utilization
      };
    });
    
    // Mock comparePlans implementation
    this.comparePlans.mockImplementation(async (
      planIds: string[],
      userProfile?: Record<string, any>
    ) => {
      // Validate plan IDs
      if (!planIds.length) {
        throw new DatabaseException(
          'At least one plan ID must be provided for comparison',
          DatabaseErrorType.VALIDATION,
          { planIds }
        );
      }
      
      // Get plans with benefits and coverage
      const plans = planIds.map(id => {
        const plan = this.plans[id];
        if (!plan) {
          return null;
        }
        
        const benefits = Object.values(this.benefits).filter(b => b.planId === id);
        const coverages = Object.values(this.coverages).filter(c => c.planId === id);
        
        return {
          ...plan,
          benefits,
          coverages
        };
      }).filter(Boolean);
      
      // Check if all plans were found
      if (plans.length !== planIds.length) {
        const foundIds = plans.map(p => p.id);
        const missingIds = planIds.filter(id => !foundIds.includes(id));
        
        throw new DatabaseException(
          `Some plans were not found: ${missingIds.join(', ')}`,
          DatabaseErrorType.NOT_FOUND,
          { missingIds }
        );
      }
      
      // Generate comparison data
      const comparison = {
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          provider: plan.provider,
          premium: plan.premium,
          currency: plan.currency,
          benefits: plan.benefits.map(benefit => ({
            type: benefit.type,
            description: benefit.description,
            coveragePercentage: benefit.coveragePercentage,
            maxCoverage: benefit.maxCoverage,
            copay: benefit.copay,
            deductible: benefit.deductible
          })),
          coverages: plan.coverages.map(coverage => ({
            type: coverage.type,
            details: coverage.details,
            limitations: coverage.limitations,
            coPayment: coverage.coPayment
          }))
        }))
      };
      
      // Add personalized recommendations if user profile is provided
      if (userProfile) {
        comparison['recommendations'] = this.generatePlanRecommendations(
          plans,
          userProfile
        );
      }
      
      return comparison;
    });
    
    // Mock enrollInPlan implementation
    this.enrollInPlan.mockImplementation(async (
      userId: string,
      planId: string,
      coverageStart: Date,
      dependents?: Record<string, any>[],
      paymentMethod?: Record<string, any>
    ) => {
      // Check if the plan exists
      const plan = this.plans[planId];
      if (!plan) {
        throw new DatabaseException(
          `Plan not found with ID ${planId}`,
          DatabaseErrorType.NOT_FOUND,
          { planId }
        );
      }
      
      // Check if user already has an active plan
      const existingPlan = Object.values(this.plans).find(
        p => p.userId === userId && p.status === 'active'
      );
      
      if (existingPlan) {
        throw new DatabaseException(
          `User ${userId} already has an active plan`,
          DatabaseErrorType.CONFLICT,
          { existingPlanId: existingPlan.id }
        );
      }
      
      // Calculate coverage end date (1 year from start)
      const coverageEnd = new Date(coverageStart);
      coverageEnd.setFullYear(coverageEnd.getFullYear() + 1);
      
      // Create enrollment
      const enrollmentId = `enrollment-${Date.now()}`;
      const enrollment = {
        id: enrollmentId,
        userId,
        planId,
        status: 'active',
        coverageStart,
        coverageEnd,
        paymentMethod: paymentMethod || {},
        dependents: dependents || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store the enrollment
      this.enrollments[enrollmentId] = enrollment;
      
      // Update the plan
      this.plans[planId] = {
        ...plan,
        userId,
        status: 'active',
        validityStart: coverageStart,
        validityEnd: coverageEnd
      };
      
      // Send journey event for plan enrollment
      await this.sendJourneyEvent(
        'PLAN_ENROLLED',
        userId,
        {
          planId,
          enrollmentId,
          coverageStart,
          coverageEnd,
          dependentCount: dependents?.length || 0
        }
      );
      
      return {
        enrollmentId,
        userId,
        planId,
        status: 'active',
        coverageStart,
        coverageEnd,
        dependents: dependents || []
      };
    });
    
    // Mock storeDocument implementation
    this.storeDocument.mockImplementation(async (
      userId: string,
      documentType: string,
      documentData: Buffer | string,
      metadata?: Record<string, any>
    ) => {
      // Validate document type
      if (!Object.values(DocumentType).includes(documentType as DocumentType)) {
        throw new DatabaseException(
          `Invalid document type: ${documentType}`,
          DatabaseErrorType.VALIDATION,
          { documentType, validTypes: Object.values(DocumentType) }
        );
      }
      
      // Generate a unique file path for the document
      const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const filePath = `documents/${userId}/${fileName}`;
      
      // Calculate file size and mime type
      let fileSize = 0;
      let mimeType = 'application/octet-stream';
      
      if (typeof documentData === 'string') {
        // Handle base64 or URL
        if (documentData.startsWith('data:')) {
          // Extract mime type from data URL
          const matches = documentData.match(/^data:([^;]+);base64,/);
          if (matches && matches.length > 1) {
            mimeType = matches[1];
          }
          // Remove the data URL prefix
          const base64Data = documentData.replace(/^data:[^;]+;base64,/, '');
          fileSize = Math.ceil((base64Data.length * 3) / 4);
        } else {
          // Assume it's a URL or file path
          fileSize = documentData.length;
        }
      } else if (Buffer.isBuffer(documentData)) {
        fileSize = documentData.length;
      }
      
      // Create document record
      const documentId = `document-${Date.now()}`;
      const document = {
        id: documentId,
        userId,
        type: documentType,
        fileName,
        fileSize,
        mimeType,
        filePath,
        uploadStatus: DocumentUploadStatus.COMPLETED,
        entityType: metadata?.entityType || 'user',
        entityId: metadata?.entityId || userId,
        description: metadata?.description,
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store the document
      this.documents[documentId] = document;
      
      // Send journey event for document upload
      await this.sendJourneyEvent(
        'DOCUMENT_UPLOADED',
        userId,
        {
          documentId,
          documentType,
          fileSize
        }
      );
      
      return document as IDocument;
    });
    
    // Mock retrieveDocument implementation
    this.retrieveDocument.mockImplementation(async (
      documentId: string,
      userId: string
    ) => {
      // Get document metadata
      const document = this.documents[documentId];
      
      if (!document) {
        throw new DatabaseException(
          `Document not found with ID ${documentId}`,
          DatabaseErrorType.NOT_FOUND,
          { documentId }
        );
      }
      
      // Check authorization
      if (document.userId !== userId) {
        // Check if the document is associated with a claim that belongs to the user
        if (document.entityType === 'claim') {
          const claim = this.claims[document.entityId];
          
          if (!claim || claim.userId !== userId) {
            throw new DatabaseException(
              'Unauthorized access to document',
              DatabaseErrorType.UNAUTHORIZED,
              { documentId, userId }
            );
          }
        } else {
          throw new DatabaseException(
            'Unauthorized access to document',
            DatabaseErrorType.UNAUTHORIZED,
            { documentId, userId }
          );
        }
      }
      
      // Simulate document data retrieval
      const documentData = `data:${document.mimeType};base64,dGhpcyBpcyBhIHNpbXVsYXRlZCBkb2N1bWVudA==`;
      
      // Send journey event for document access
      await this.sendJourneyEvent(
        'DOCUMENT_ACCESSED',
        userId,
        {
          documentId,
          documentType: document.type
        }
      );
      
      return {
        data: documentData,
        metadata: {
          id: document.id,
          fileName: document.fileName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          uploadStatus: document.uploadStatus,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          description: document.description,
          type: document.type,
          ...document.metadata
        }
      };
    });
    
    // Mock checkCoverage implementation
    this.checkCoverage.mockImplementation(async (
      userId: string,
      serviceCode: string,
      providerNPI?: string
    ) => {
      // Get the user's active plan
      const plan = Object.values(this.plans).find(
        p => p.userId === userId && p.status === 'active'
      );
      
      if (!plan) {
        throw new DatabaseException(
          `No active plan found for user ${userId}`,
          DatabaseErrorType.NOT_FOUND,
          { userId }
        );
      }
      
      // Get coverages and benefits for the plan
      const coverages = Object.values(this.coverages).filter(c => c.planId === plan.id);
      const benefits = Object.values(this.benefits).filter(b => b.planId === plan.id);
      
      // Find coverage for the service code (simplified implementation)
      const serviceCoverage = {
        serviceCode,
        serviceName: `Service ${serviceCode}`,
        covered: true,
        inNetwork: providerNPI ? true : undefined,
        copay: 25,
        coinsurance: 20,
        deductibleApplies: true,
        requiresPreauthorization: false,
        limitations: 'None',
        notes: 'Standard coverage applies'
      };
      
      // Check if the service is covered by any of the plan's coverages
      const relevantCoverage = coverages.find(coverage =>
        coverage.details.includes(serviceCode)
      );
      
      if (relevantCoverage) {
        serviceCoverage.copay = relevantCoverage.coPayment || serviceCoverage.copay;
        serviceCoverage.limitations = relevantCoverage.limitations || serviceCoverage.limitations;
      }
      
      // Check if the service is covered by any of the plan's benefits
      const relevantBenefit = benefits.find(benefit =>
        benefit.metadata && 
        benefit.metadata.serviceCodes && 
        benefit.metadata.serviceCodes.includes(serviceCode)
      );
      
      if (relevantBenefit) {
        serviceCoverage.copay = relevantBenefit.copay || serviceCoverage.copay;
        serviceCoverage.coinsurance = relevantBenefit.coveragePercentage
          ? 100 - relevantBenefit.coveragePercentage
          : serviceCoverage.coinsurance;
        serviceCoverage.limitations = relevantBenefit.limitations || serviceCoverage.limitations;
      }
      
      // Send journey event for coverage check
      await this.sendJourneyEvent(
        'COVERAGE_CHECKED',
        userId,
        {
          planId: plan.id,
          serviceCode,
          providerNPI,
          covered: serviceCoverage.covered
        }
      );
      
      return {
        planId: plan.id,
        planName: plan.name,
        userId,
        serviceCode,
        providerNPI,
        coverage: serviceCoverage
      };
    });
    
    // Mock trackClaimStatus implementation
    this.trackClaimStatus.mockImplementation(async (
      claimId: string,
      userId: string
    ) => {
      // Get the claim
      const claim = this.claims[claimId];
      
      if (!claim) {
        throw new DatabaseException(
          `Claim not found with ID ${claimId}`,
          DatabaseErrorType.NOT_FOUND,
          { claimId }
        );
      }
      
      // Check authorization
      if (claim.userId !== userId) {
        throw new DatabaseException(
          'Unauthorized access to claim',
          DatabaseErrorType.UNAUTHORIZED,
          { claimId, userId }
        );
      }
      
      // Generate mock status history
      const statusHistory = [
        {
          status: ClaimStatus.SUBMITTED,
          createdAt: new Date(claim.submittedAt.getTime() - 1000 * 60 * 60 * 24), // 1 day before
          notes: 'Claim submitted successfully',
          updatedBy: 'system'
        },
        {
          status: claim.status,
          createdAt: claim.processedAt,
          notes: claim.status === ClaimStatus.APPROVED ? 'Claim approved' : 'Claim processing',
          updatedBy: 'claims_processor'
        }
      ];
      
      // Get associated documents
      const claimDocuments = Object.values(this.documents).filter(
        doc => doc.entityId === claimId && doc.entityType === 'claim'
      );
      
      // Format the response
      const response = {
        status: claim.status,
        history: statusHistory.map(history => ({
          status: history.status,
          timestamp: history.createdAt,
          notes: history.notes,
          updatedBy: history.updatedBy
        })),
        details: {
          id: claim.id,
          type: claim.type,
          amount: claim.amount,
          submittedAt: claim.submittedAt,
          processedAt: claim.processedAt,
          procedureCode: claim.procedureCode,
          documents: claimDocuments.map(doc => ({
            id: doc.id,
            type: doc.type,
            fileName: doc.fileName,
            uploadStatus: doc.uploadStatus
          })),
          ...claim.metadata
        }
      };
      
      // Send journey event for claim status check
      await this.sendJourneyEvent(
        'CLAIM_STATUS_CHECKED',
        userId,
        {
          claimId,
          status: claim.status
        }
      );
      
      return response;
    });
    
    // Mock calculateOutOfPocketExpenses implementation
    this.calculateOutOfPocketExpenses.mockImplementation(async (
      userId: string,
      year: number,
      categoryFilter?: string[]
    ) => {
      // Get the user's active plan
      const plan = Object.values(this.plans).find(
        p => p.userId === userId && p.status === 'active'
      );
      
      if (!plan) {
        throw new DatabaseException(
          `No active plan found for user ${userId}`,
          DatabaseErrorType.NOT_FOUND,
          { userId }
        );
      }
      
      // Get all claims for the user in the specified year
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      
      let claims = Object.values(this.claims).filter(claim =>
        claim.userId === userId &&
        claim.submittedAt >= startDate &&
        claim.submittedAt <= endDate &&
        [ClaimStatus.APPROVED, ClaimStatus.COMPLETED].includes(claim.status as ClaimStatus)
      );
      
      // Apply category filter if provided
      if (categoryFilter && categoryFilter.length > 0) {
        claims = claims.filter(claim => categoryFilter.includes(claim.type));
      }
      
      // Calculate total and category breakdown
      let total = 0;
      const byCategory: Record<string, number> = {};
      
      claims.forEach(claim => {
        // Get the out-of-pocket amount from the claim
        const outOfPocket = claim.metadata?.outOfPocket || claim.amount * 0.2; // Assume 20% coinsurance if not specified
        
        total += outOfPocket;
        
        // Add to category breakdown
        if (!byCategory[claim.type]) {
          byCategory[claim.type] = 0;
        }
        byCategory[claim.type] += outOfPocket;
      });
      
      // Calculate remaining out-of-pocket maximum
      const outOfPocketMax = plan.metadata?.outOfPocketMax || 5000; // Default to $5000 if not specified
      const remaining = Math.max(0, outOfPocketMax - total);
      
      // Send journey event for expense calculation
      await this.sendJourneyEvent(
        'OUT_OF_POCKET_CALCULATED',
        userId,
        {
          planId: plan.id,
          year,
          total,
          remaining
        }
      );
      
      return {
        total,
        byCategory,
        remaining
      };
    });
    
    // Mock validateJourneyData implementation
    this.validateJourneyData.mockImplementation((
      dataType: string,
      data: Record<string, any>
    ) => {
      const errors = [];
      
      switch (dataType) {
        case 'claim':
          if (!data.planId) errors.push({ field: 'planId', message: 'Plan ID is required' });
          if (!data.type) errors.push({ field: 'type', message: 'Claim type is required' });
          if (typeof data.amount !== 'number' || data.amount <= 0) {
            errors.push({ field: 'amount', message: 'Amount must be a positive number' });
          }
          break;
          
        case 'plan':
          if (!data.name) errors.push({ field: 'name', message: 'Plan name is required' });
          if (!data.provider) errors.push({ field: 'provider', message: 'Provider is required' });
          if (!data.type) errors.push({ field: 'type', message: 'Plan type is required' });
          if (typeof data.premium !== 'number' || data.premium < 0) {
            errors.push({ field: 'premium', message: 'Premium must be a non-negative number' });
          }
          break;
          
        case 'document':
          if (!data.type) errors.push({ field: 'type', message: 'Document type is required' });
          if (!data.fileName) errors.push({ field: 'fileName', message: 'File name is required' });
          break;
          
        case 'benefit':
          if (!data.type) errors.push({ field: 'type', message: 'Benefit type is required' });
          if (!data.description) errors.push({ field: 'description', message: 'Description is required' });
          break;
          
        default:
          errors.push({ field: 'dataType', message: `Unknown data type: ${dataType}` });
      }
      
      return Promise.resolve({
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      });
    });
    
    // Mock getJourneyMetrics implementation
    this.getJourneyMetrics.mockImplementation(async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get active plans count
      const activePlansCount = Object.values(this.plans).filter(
        p => p.status === 'active'
      ).length;
      
      // Get claims by status
      const claimsByStatus = Object.values(this.claims).reduce(
        (acc, claim) => {
          if (!acc[claim.status]) {
            acc[claim.status] = 0;
          }
          acc[claim.status]++;
          return acc;
        },
        {} as Record<string, number>
      );
      
      // Get recent claims
      const recentClaimsCount = Object.values(this.claims).filter(
        claim => claim.submittedAt >= thirtyDaysAgo
      ).length;
      
      // Get average claim processing time (in days)
      const claims = Object.values(this.claims).filter(
        claim => [
          ClaimStatus.APPROVED,
          ClaimStatus.COMPLETED
        ].includes(claim.status as ClaimStatus) &&
        claim.submittedAt >= thirtyDaysAgo
      );
      
      let totalProcessingTime = 0;
      claims.forEach(claim => {
        const processingTime = claim.processedAt.getTime() - claim.submittedAt.getTime();
        totalProcessingTime += processingTime;
      });
      
      const avgProcessingTimeMs = claims.length > 0 ? totalProcessingTime / claims.length : 0;
      const avgProcessingTimeDays = avgProcessingTimeMs / (24 * 60 * 60 * 1000);
      
      return {
        activePlansCount,
        claimsByStatus,
        recentClaimsCount,
        avgProcessingTimeDays,
        timestamp: now
      };
    });
    
    // Mock sendJourneyEvent implementation
    this.sendJourneyEvent.mockImplementation(async (
      eventType: string,
      userId: string,
      payload: Record<string, any>
    ) => {
      // In a real implementation, this would publish to Kafka or another event system
      // For the mock, we just log the event
      console.log(`[MOCK_PLAN_JOURNEY_EVENT] ${eventType}`, {
        eventType,
        userId,
        journeyId: JourneyType.PLAN,
        timestamp: new Date().toISOString(),
        payload
      });
      
      // Simulate sending to gamification engine
      return Promise.resolve();
    });
    
    // Mock getJourneyConfig implementation
    this.getJourneyConfig.mockImplementation(() => {
      return {
        enableInsuranceSystemIntegration: true,
        enableDocumentStorage: true,
        claimProcessingBatchSize: 50
      };
    });
    
    // Mock executeJourneyOperation implementation
    this.executeJourneyOperation.mockImplementation(async (
      operationName: string,
      operation: () => Promise<any>,
      options?: any
    ) => {
      try {
        return await operation();
      } catch (error) {
        // Rethrow the error
        throw error;
      }
    });
    
    // Mock transaction implementation
    this.transaction.mockImplementation(async (
      fn: (client: any) => Promise<any>,
      options?: TransactionOptions
    ) => {
      // Create a mock transaction client
      const txClient = {
        plan: {
          findFirst: jest.fn((args: any) => {
            const plans = Object.values(this.plans);
            return Promise.resolve(plans.find(p => {
              if (args.where.id) return p.id === args.where.id;
              if (args.where.userId && args.where.status) {
                return p.userId === args.where.userId && p.status === args.where.status;
              }
              return false;
            }));
          }),
          findUnique: jest.fn((args: any) => {
            return Promise.resolve(this.plans[args.where.id]);
          }),
          update: jest.fn((args: any) => {
            const plan = this.plans[args.where.id];
            if (!plan) return Promise.resolve(null);
            
            this.plans[args.where.id] = {
              ...plan,
              ...args.data
            };
            
            return Promise.resolve(this.plans[args.where.id]);
          }),
          create: jest.fn((args: any) => {
            const id = `plan-${Date.now()}`;
            this.plans[id] = {
              id,
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            return Promise.resolve(this.plans[id]);
          })
        },
        claim: {
          findUnique: jest.fn((args: any) => {
            return Promise.resolve(this.claims[args.where.id]);
          }),
          create: jest.fn((args: any) => {
            const id = `claim-${Date.now()}`;
            this.claims[id] = {
              id,
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            return Promise.resolve(this.claims[id]);
          }),
          update: jest.fn((args: any) => {
            const claim = this.claims[args.where.id];
            if (!claim) return Promise.resolve(null);
            
            this.claims[args.where.id] = {
              ...claim,
              ...args.data
            };
            
            return Promise.resolve(this.claims[args.where.id]);
          })
        },
        document: {
          update: jest.fn((args: any) => {
            const document = this.documents[args.where.id];
            if (!document) return Promise.resolve(null);
            
            this.documents[args.where.id] = {
              ...document,
              ...args.data
            };
            
            return Promise.resolve(this.documents[args.where.id]);
          })
        },
        planEnrollment: {
          create: jest.fn((args: any) => {
            const id = `enrollment-${Date.now()}`;
            this.enrollments[id] = {
              id,
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            return Promise.resolve(this.enrollments[id]);
          })
        }
      };
      
      try {
        // Execute the function with the mock transaction client
        return await fn(txClient);
      } catch (error) {
        // Simulate transaction rollback
        throw error;
      }
    });
    
    // Mock getPrismaClient implementation
    this.getPrismaClient.mockImplementation(() => {
      // Return a mock Prisma client
      return {
        plan: {
          findFirst: jest.fn((args: any) => {
            const plans = Object.values(this.plans);
            return Promise.resolve(plans.find(p => {
              if (args.where.id) return p.id === args.where.id;
              if (args.where.userId && args.where.status) {
                return p.userId === args.where.userId && p.status === args.where.status;
              }
              return false;
            }));
          }),
          findUnique: jest.fn((args: any) => {
            return Promise.resolve(this.plans[args.where.id]);
          }),
          count: jest.fn((args: any) => {
            if (args.where.status) {
              return Promise.resolve(Object.values(this.plans).filter(p => p.status === args.where.status).length);
            }
            return Promise.resolve(Object.values(this.plans).length);
          })
        },
        claim: {
          findUnique: jest.fn((args: any) => {
            return Promise.resolve(this.claims[args.where.id]);
          }),
          findMany: jest.fn((args: any) => {
            let claims = Object.values(this.claims);
            
            if (args.where) {
              if (args.where.userId) {
                claims = claims.filter(c => c.userId === args.where.userId);
              }
              
              if (args.where.submittedAt) {
                if (args.where.submittedAt.gte) {
                  claims = claims.filter(c => c.submittedAt >= args.where.submittedAt.gte);
                }
                if (args.where.submittedAt.lte) {
                  claims = claims.filter(c => c.submittedAt <= args.where.submittedAt.lte);
                }
              }
              
              if (args.where.status && args.where.status.in) {
                claims = claims.filter(c => args.where.status.in.includes(c.status));
              }
              
              if (args.where.type && args.where.type.in) {
                claims = claims.filter(c => args.where.type.in.includes(c.type));
              }
            }
            
            return Promise.resolve(claims);
          }),
          groupBy: jest.fn(() => {
            // Group claims by status
            const statusCounts = Object.values(this.claims).reduce(
              (acc, claim) => {
                if (!acc[claim.status]) {
                  acc[claim.status] = 0;
                }
                acc[claim.status]++;
                return acc;
              },
              {} as Record<string, number>
            );
            
            // Convert to the format expected by the groupBy result
            return Promise.resolve(
              Object.entries(statusCounts).map(([status, count]) => ({
                status,
                _count: count
              }))
            );
          }),
          count: jest.fn((args: any) => {
            let claims = Object.values(this.claims);
            
            if (args.where) {
              if (args.where.submittedAt) {
                if (args.where.submittedAt.gte) {
                  claims = claims.filter(c => c.submittedAt >= args.where.submittedAt.gte);
                }
              }
            }
            
            return Promise.resolve(claims.length);
          })
        },
        document: {
          findUnique: jest.fn((args: any) => {
            return Promise.resolve(this.documents[args.where.id]);
          })
        },
        benefit: {
          findMany: jest.fn((args: any) => {
            let benefits = Object.values(this.benefits);
            
            if (args.where) {
              if (args.where.planId) {
                benefits = benefits.filter(b => b.planId === args.where.planId);
              }
              
              if (args.where.type) {
                benefits = benefits.filter(b => b.type === args.where.type);
              }
            }
            
            return Promise.resolve(benefits);
          })
        },
        coverage: {
          findMany: jest.fn((args: any) => {
            let coverages = Object.values(this.coverages);
            
            if (args.where && args.where.planId) {
              coverages = coverages.filter(c => c.planId === args.where.planId);
            }
            
            return Promise.resolve(coverages);
          })
        },
        $queryRaw: jest.fn(() => Promise.resolve([{ result: 1 }]))
      } as unknown as PrismaClient;
    });
  }
  
  /**
   * Generate personalized plan recommendations based on user profile
   * @param plans List of plans to analyze
   * @param userProfile User profile data
   * @returns Personalized recommendations
   * @private
   */
  private generatePlanRecommendations(
    plans: any[],
    userProfile: Record<string, any>
  ): any {
    const recommendations = [];
    
    // Example: Recommend plans based on family size
    if (userProfile.familySize > 1) {
      const familyPlans = plans.filter(p => p.type === 'family');
      if (familyPlans.length) {
        recommendations.push({
          type: 'family_size',
          message: 'These family plans are recommended based on your household size',
          planIds: familyPlans.map(p => p.id)
        });
      }
    }
    
    // Example: Recommend plans based on age
    if (userProfile.age > 50) {
      const seniorPlans = plans.filter(p =>
        p.benefits.some((b: any) => b.type === 'senior_care' || b.type === 'prescription')
      );
      if (seniorPlans.length) {
        recommendations.push({
          type: 'age_appropriate',
          message: 'These plans offer better coverage for your age group',
          planIds: seniorPlans.map(p => p.id)
        });
      }
    }
    
    // Example: Recommend plans based on pre-existing conditions
    if (userProfile.conditions && userProfile.conditions.length) {
      const conditionPlans = plans.filter(p =>
        p.benefits.some((b: any) => b.type === 'chronic_condition_management')
      );
      if (conditionPlans.length) {
        recommendations.push({
          type: 'condition_management',
          message: 'These plans offer better coverage for managing chronic conditions',
          planIds: conditionPlans.map(p => p.id)
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Reset the mock data to its initial state
   * Useful for tests that need a clean state
   */
  reset(): void {
    this.plans = {};
    this.benefits = {};
    this.coverages = {};
    this.claims = {};
    this.documents = {};
    this.enrollments = {};
    
    this.initializeTestData();
    
    // Reset all mock functions
    jest.resetAllMocks();
    this.setupMockImplementations();
  }
  
  /**
   * Configure the mock to simulate specific scenarios
   * @param scenario The scenario to simulate
   * @param options Options for the scenario
   */
  configureScenario(scenario: string, options: Record<string, any> = {}): void {
    switch (scenario) {
      case 'empty_plan':
        // Simulate no plans for a user
        this.plans = {};
        break;
        
      case 'claim_error':
        // Simulate error during claim submission
        this.submitClaim.mockImplementation(() => {
          throw new DatabaseException(
            'Error submitting claim',
            DatabaseErrorType.INTERNAL_ERROR,
            { details: options.errorDetails || 'Simulated error' }
          );
        });
        break;
        
      case 'document_upload_failure':
        // Simulate document upload failure
        this.storeDocument.mockImplementation(() => {
          throw new DatabaseException(
            'Error uploading document',
            DatabaseErrorType.STORAGE_ERROR,
            { details: options.errorDetails || 'Simulated storage error' }
          );
        });
        break;
        
      case 'plan_enrollment_conflict':
        // Simulate conflict during plan enrollment
        this.enrollInPlan.mockImplementation(() => {
          throw new DatabaseException(
            'User already has an active plan',
            DatabaseErrorType.CONFLICT,
            { existingPlanId: options.existingPlanId || 'plan-1' }
          );
        });
        break;
        
      case 'slow_database':
        // Simulate slow database responses
        const delay = options.delayMs || 2000;
        
        // Apply delay to all methods
        Object.keys(this).forEach(key => {
          if (typeof this[key] === 'function' && jest.isMockFunction(this[key])) {
            const originalImpl = this[key].getMockImplementation();
            if (originalImpl) {
              this[key].mockImplementation(async (...args: any[]) => {
                await new Promise(resolve => setTimeout(resolve, delay));
                return originalImpl(...args);
              });
            }
          }
        });
        break;
        
      case 'connection_error':
        // Simulate database connection error
        this.getPrismaClient.mockImplementation(() => {
          throw new DatabaseException(
            'Database connection error',
            DatabaseErrorType.CONNECTION_ERROR,
            { details: options.errorDetails || 'Simulated connection error' }
          );
        });
        break;
        
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }
}

/**
 * Create a new Plan journey database context mock
 * @returns A new PlanContextMock instance
 */
export function createPlanContextMock(): PlanContextMock {
  return new PlanContextMock();
}