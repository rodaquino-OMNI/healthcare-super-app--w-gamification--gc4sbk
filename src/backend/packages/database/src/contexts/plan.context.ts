/**
 * @file plan.context.ts
 * @description Specialized database context for the Plan journey ("Meu Plano & Benefícios") that extends
 * the base journey context with plan-specific database operations. It provides methods for plans, benefits,
 * coverage, claims, and documents with optimized queries, transaction management, and plan-specific error handling.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';

import { BaseJourneyContext } from './base-journey.context';
import { DatabaseContextConfig, DEFAULT_PLAN_CONTEXT_CONFIG, PlanDatabaseContext } from '../types/context.types';
import { JourneyType } from '../types/journey.types';
import { TransactionOptions, TransactionIsolationLevel } from '../types/transaction.types';
import { DatabaseErrorType } from '../errors/database-error.types';
import { DatabaseException } from '../errors/database-error.exception';
import { RetryStrategy } from '../errors/retry-strategies';
import { ConnectionManager } from '../connection/connection-manager';

// Import Plan journey interfaces
import { IPlan, IBenefit, ICoverage, IClaim, ClaimStatus, IDocument, DocumentType, DocumentUploadStatus } from '@austa/interfaces/journey/plan';

/**
 * Specialized database context for the Plan journey ("Meu Plano & Benefícios")
 * Provides optimized methods for plans, benefits, coverage, claims, and documents
 * with plan-specific transaction management and error handling.
 */
@Injectable()
export class PlanContext extends BaseJourneyContext implements PlanDatabaseContext {
  private readonly logger = new Logger(PlanContext.name);

  /**
   * Creates a new Plan journey database context
   * @param connectionManager Connection manager for database connections
   * @param config Configuration options for this context
   */
  constructor(
    connectionManager: ConnectionManager,
    config: Partial<DatabaseContextConfig> = {}
  ) {
    super(
      connectionManager,
      {
        ...DEFAULT_PLAN_CONTEXT_CONFIG,
        ...config,
        journey: {
          journeyType: JourneyType.PLAN,
          options: {
            ...DEFAULT_PLAN_CONTEXT_CONFIG.journey?.options,
            ...config.journey?.options,
          },
        },
      }
    );

    this.logger.log('Plan journey database context initialized');
  }

  /**
   * Get the journey type for this context
   * @returns The journey type (PLAN)
   */
  get journeyType(): JourneyType {
    return JourneyType.PLAN;
  }

  /**
   * Get user's insurance plan details
   * @param userId User ID
   * @returns Insurance plan details with related benefits and coverage
   * @throws DatabaseException if the query fails
   */
  async getUserPlanDetails(userId: string): Promise<IPlan> {
    return this.executeJourneyOperation<IPlan>(
      'getUserPlanDetails',
      async () => {
        const prisma = this.getPrismaClient();
        
        const plan = await prisma.plan.findFirst({
          where: { userId },
          include: {
            benefits: true,
            coverages: true,
          },
        });

        if (!plan) {
          throw new DatabaseException(
            `No plan found for user ${userId}`,
            DatabaseErrorType.NOT_FOUND,
            { userId }
          );
        }

        // Send journey event for plan access
        await this.sendJourneyEvent(
          'PLAN_DETAILS_ACCESSED',
          userId,
          { planId: plan.id }
        );

        return plan as unknown as IPlan;
      },
      {
        // Cache plan details for faster access
        journeyContext: { useJourneyCaching: true }
      }
    );
  }

  /**
   * Submit an insurance claim with optimized transaction handling
   * @param userId User ID
   * @param claimData Claim data
   * @param documentIds Associated document IDs
   * @returns The submitted claim
   * @throws DatabaseException if the submission fails
   */
  async submitClaim(
    userId: string,
    claimData: Record<string, any>,
    documentIds?: string[]
  ): Promise<IClaim> {
    return this.executeJourneyOperation<IClaim>(
      'submitClaim',
      async () => {
        // Validate the claim data before proceeding
        const validationResult = await this.validateJourneyData('claim', claimData);
        if (!validationResult.valid) {
          throw new DatabaseException(
            'Invalid claim data',
            DatabaseErrorType.VALIDATION,
            { errors: validationResult.errors }
          );
        }

        // Use a transaction with serializable isolation to ensure consistency
        return this.transaction<IClaim>(async (tx) => {
          // Check if the plan exists and is active
          const plan = await tx.plan.findFirst({
            where: {
              id: claimData.planId,
              userId,
              status: 'active',
            },
          });

          if (!plan) {
            throw new DatabaseException(
              `No active plan found with ID ${claimData.planId} for user ${userId}`,
              DatabaseErrorType.NOT_FOUND,
              { planId: claimData.planId, userId }
            );
          }

          // Create the claim
          const claim = await tx.claim.create({
            data: {
              userId,
              planId: claimData.planId,
              type: claimData.type,
              amount: claimData.amount,
              status: ClaimStatus.SUBMITTED,
              procedureCode: claimData.procedureCode,
              submittedAt: new Date(),
              processedAt: new Date(),
              metadata: claimData.metadata || {},
            },
          });

          // Associate documents if provided
          if (documentIds && documentIds.length > 0) {
            // Update each document to associate with the claim
            await Promise.all(
              documentIds.map((docId) =>
                tx.document.update({
                  where: { id: docId },
                  data: {
                    entityId: claim.id,
                    entityType: 'claim',
                  },
                })
              )
            );
          }

          // Send journey event for claim submission
          await this.sendJourneyEvent(
            'CLAIM_SUBMITTED',
            userId,
            {
              claimId: claim.id,
              claimType: claim.type,
              amount: claim.amount,
            }
          );

          return claim as unknown as IClaim;
        }, {
          // Use serializable isolation for claim submission to prevent conflicts
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
          // Increase timeout for claim processing
          timeout: {
            timeoutMs: 60000, // 60 seconds
          },
          // Configure retry options for claim submission
          retry: {
            maxRetries: 3,
            baseDelayMs: 500,
          },
        });
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 5,
        // Set journey-specific context
        journeyContext: {
          operationType: 'claim_submission',
          priority: 'high',
        },
      }
    );
  }

  /**
   * Get user's benefit utilization with optimized queries
   * @param userId User ID
   * @param benefitType Optional benefit type filter
   * @param year Optional year filter
   * @returns Benefit utilization data
   * @throws DatabaseException if the query fails
   */
  async getBenefitUtilization(
    userId: string,
    benefitType?: string,
    year?: number
  ): Promise<any> {
    return this.executeJourneyOperation(
      'getBenefitUtilization',
      async () => {
        const prisma = this.getPrismaClient();
        const currentYear = year || new Date().getFullYear();
        
        // Get the user's plan
        const plan = await prisma.plan.findFirst({
          where: { userId, status: 'active' },
          select: { id: true },
        });

        if (!plan) {
          throw new DatabaseException(
            `No active plan found for user ${userId}`,
            DatabaseErrorType.NOT_FOUND,
            { userId }
          );
        }

        // Build the query for benefits
        const benefitQuery: Prisma.BenefitFindManyArgs = {
          where: {
            planId: plan.id,
            ...(benefitType ? { type: benefitType } : {}),
          },
          include: {
            // Include related utilization records
            utilization: {
              where: {
                // Filter by year if provided
                createdAt: {
                  gte: new Date(`${currentYear}-01-01`),
                  lte: new Date(`${currentYear}-12-31`),
                },
              },
            },
          },
        };

        // Execute the query
        const benefits = await prisma.benefit.findMany(benefitQuery);

        // Calculate utilization for each benefit
        const utilization = benefits.map((benefit) => {
          const used = benefit.utilization.reduce(
            (sum, record) => sum + (record.amount || 0),
            0
          );

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
            records: benefit.utilization,
          };
        });

        return {
          userId,
          planId: plan.id,
          year: currentYear,
          benefits: utilization,
        };
      },
      {
        // Cache benefit utilization data
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Compare insurance plans with personalized recommendations
   * @param planIds IDs of plans to compare
   * @param userProfile User profile for personalized comparison
   * @returns Comparison data for the specified plans
   * @throws DatabaseException if the comparison fails
   */
  async comparePlans(
    planIds: string[],
    userProfile?: Record<string, any>
  ): Promise<any> {
    return this.executeJourneyOperation(
      'comparePlans',
      async () => {
        const prisma = this.getPrismaClient();

        // Validate plan IDs
        if (!planIds.length) {
          throw new DatabaseException(
            'At least one plan ID must be provided for comparison',
            DatabaseErrorType.VALIDATION,
            { planIds }
          );
        }

        // Get plans with benefits and coverage
        const plans = await prisma.plan.findMany({
          where: {
            id: { in: planIds },
          },
          include: {
            benefits: true,
            coverages: true,
          },
        });

        // Check if all plans were found
        if (plans.length !== planIds.length) {
          const foundIds = plans.map((p) => p.id);
          const missingIds = planIds.filter((id) => !foundIds.includes(id));
          
          throw new DatabaseException(
            `Some plans were not found: ${missingIds.join(', ')}`,
            DatabaseErrorType.NOT_FOUND,
            { missingIds }
          );
        }

        // Generate comparison data
        const comparison = {
          plans: plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            provider: plan.provider,
            premium: plan.premium,
            currency: plan.currency,
            benefits: plan.benefits.map((benefit) => ({
              type: benefit.type,
              description: benefit.description,
              coveragePercentage: benefit.coveragePercentage,
              maxCoverage: benefit.maxCoverage,
              copay: benefit.copay,
              deductible: benefit.deductible,
            })),
            coverages: plan.coverages.map((coverage) => ({
              type: coverage.type,
              details: coverage.details,
              limitations: coverage.limitations,
              coPayment: coverage.coPayment,
            })),
          })),
        };

        // Add personalized recommendations if user profile is provided
        if (userProfile) {
          comparison['recommendations'] = this.generatePlanRecommendations(
            plans,
            userProfile
          );
        }

        return comparison;
      },
      {
        // Cache plan comparison results
        journeyContext: { useJourneyCaching: true },
      }
    );
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
    // This is a simplified implementation
    // In a real-world scenario, this would use more sophisticated algorithms
    const recommendations = [];

    // Example: Recommend plans based on family size
    if (userProfile.familySize > 1) {
      const familyPlans = plans.filter((p) => p.type === 'family');
      if (familyPlans.length) {
        recommendations.push({
          type: 'family_size',
          message: 'These family plans are recommended based on your household size',
          planIds: familyPlans.map((p) => p.id),
        });
      }
    }

    // Example: Recommend plans based on age
    if (userProfile.age > 50) {
      const seniorPlans = plans.filter((p) =>
        p.benefits.some((b) => b.type === 'senior_care' || b.type === 'prescription')
      );
      if (seniorPlans.length) {
        recommendations.push({
          type: 'age_appropriate',
          message: 'These plans offer better coverage for your age group',
          planIds: seniorPlans.map((p) => p.id),
        });
      }
    }

    // Example: Recommend plans based on pre-existing conditions
    if (userProfile.conditions && userProfile.conditions.length) {
      const conditionPlans = plans.filter((p) =>
        p.benefits.some((b) => b.type === 'chronic_condition_management')
      );
      if (conditionPlans.length) {
        recommendations.push({
          type: 'condition_management',
          message: 'These plans offer better coverage for managing chronic conditions',
          planIds: conditionPlans.map((p) => p.id),
        });
      }
    }

    return recommendations;
  }

  /**
   * Enroll user in an insurance plan with transaction safety
   * @param userId User ID
   * @param planId Plan ID
   * @param coverageStart Coverage start date
   * @param dependents Optional dependent information
   * @param paymentMethod Payment method details
   * @returns Enrollment details
   * @throws DatabaseException if the enrollment fails
   */
  async enrollInPlan(
    userId: string,
    planId: string,
    coverageStart: Date,
    dependents?: Record<string, any>[],
    paymentMethod?: Record<string, any>
  ): Promise<any> {
    return this.executeJourneyOperation(
      'enrollInPlan',
      async () => {
        // Use a transaction with serializable isolation to ensure consistency
        return this.transaction(async (tx) => {
          // Check if the plan exists
          const plan = await tx.plan.findUnique({
            where: { id: planId },
          });

          if (!plan) {
            throw new DatabaseException(
              `Plan not found with ID ${planId}`,
              DatabaseErrorType.NOT_FOUND,
              { planId }
            );
          }

          // Check if user already has an active plan
          const existingPlan = await tx.plan.findFirst({
            where: {
              userId,
              status: 'active',
            },
          });

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

          // Create user plan enrollment
          const enrollment = await tx.planEnrollment.create({
            data: {
              userId,
              planId,
              status: 'active',
              coverageStart,
              coverageEnd,
              paymentMethod: paymentMethod || {},
              dependents: dependents || [],
            },
          });

          // Associate the plan with the user
          await tx.plan.update({
            where: { id: planId },
            data: {
              userId,
              status: 'active',
              validityStart: coverageStart,
              validityEnd: coverageEnd,
            },
          });

          // Send journey event for plan enrollment
          await this.sendJourneyEvent(
            'PLAN_ENROLLED',
            userId,
            {
              planId,
              enrollmentId: enrollment.id,
              coverageStart,
              coverageEnd,
              dependentCount: dependents?.length || 0,
            }
          );

          return {
            enrollmentId: enrollment.id,
            userId,
            planId,
            status: 'active',
            coverageStart,
            coverageEnd,
            dependents: dependents || [],
          };
        }, {
          // Use serializable isolation for enrollment to prevent conflicts
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
          // Increase timeout for enrollment processing
          timeout: {
            timeoutMs: 60000, // 60 seconds
          },
        });
      },
      {
        // Configure retry strategy for the operation
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'plan_enrollment',
          priority: 'high',
        },
      }
    );
  }

  /**
   * Upload and store a document with optimized storage
   * @param userId User ID
   * @param documentType Type of document
   * @param documentData Document data or reference
   * @param metadata Additional metadata
   * @returns The stored document reference
   * @throws DatabaseException if the upload fails
   */
  async storeDocument(
    userId: string,
    documentType: string,
    documentData: Buffer | string,
    metadata?: Record<string, any>
  ): Promise<IDocument> {
    return this.executeJourneyOperation<IDocument>(
      'storeDocument',
      async () => {
        const prisma = this.getPrismaClient();

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

        // Store the document data (simplified implementation)
        // In a real implementation, this would use S3 or another storage service
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

        // Create document record in the database
        const document = await prisma.document.create({
          data: {
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
          },
        });

        // Send journey event for document upload
        await this.sendJourneyEvent(
          'DOCUMENT_UPLOADED',
          userId,
          {
            documentId: document.id,
            documentType,
            fileSize,
          }
        );

        return document as unknown as IDocument;
      },
      {
        // Configure retry strategy for document storage
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        // Set journey-specific context
        journeyContext: {
          operationType: 'document_storage',
          priority: 'medium',
        },
      }
    );
  }

  /**
   * Retrieve a document with access control
   * @param documentId Document ID
   * @param userId User ID for authorization
   * @returns The document data and metadata
   * @throws DatabaseException if the retrieval fails
   */
  async retrieveDocument(
    documentId: string,
    userId: string
  ): Promise<{ data: Buffer | string; metadata: Record<string, any> }> {
    return this.executeJourneyOperation(
      'retrieveDocument',
      async () => {
        const prisma = this.getPrismaClient();

        // Get document metadata
        const document = await prisma.document.findUnique({
          where: { id: documentId },
        });

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
            const claim = await prisma.claim.findUnique({
              where: { id: document.entityId },
              select: { userId: true },
            });

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

        // Retrieve document data (simplified implementation)
        // In a real implementation, this would retrieve from S3 or another storage service
        const documentData = `data:${document.mimeType};base64,dGhpcyBpcyBhIHNpbXVsYXRlZCBkb2N1bWVudA==`;

        // Send journey event for document access
        await this.sendJourneyEvent(
          'DOCUMENT_ACCESSED',
          userId,
          {
            documentId,
            documentType: document.type,
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
            ...document.metadata,
          },
        };
      },
      {
        // Cache document metadata but not content
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Check coverage for a specific service or procedure
   * @param userId User ID
   * @param serviceCode Service or procedure code
   * @param providerNPI Optional provider NPI for in-network check
   * @returns Coverage information including copay, coinsurance, and limits
   * @throws DatabaseException if the coverage check fails
   */
  async checkCoverage(
    userId: string,
    serviceCode: string,
    providerNPI?: string
  ): Promise<any> {
    return this.executeJourneyOperation(
      'checkCoverage',
      async () => {
        const prisma = this.getPrismaClient();

        // Get the user's active plan
        const plan = await prisma.plan.findFirst({
          where: { userId, status: 'active' },
          include: {
            coverages: true,
            benefits: true,
          },
        });

        if (!plan) {
          throw new DatabaseException(
            `No active plan found for user ${userId}`,
            DatabaseErrorType.NOT_FOUND,
            { userId }
          );
        }

        // Find coverage for the service code
        // This is a simplified implementation
        // In a real-world scenario, this would query an insurance coverage database
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
          notes: 'Standard coverage applies',
        };

        // Check if the service is covered by any of the plan's coverages
        const relevantCoverage = plan.coverages.find((coverage) =>
          coverage.details.includes(serviceCode)
        );

        if (relevantCoverage) {
          serviceCoverage.copay = relevantCoverage.coPayment || serviceCoverage.copay;
          serviceCoverage.limitations = relevantCoverage.limitations || serviceCoverage.limitations;
        }

        // Check if the service is covered by any of the plan's benefits
        const relevantBenefit = plan.benefits.find((benefit) =>
          benefit.metadata && benefit.metadata.serviceCodes && 
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
            covered: serviceCoverage.covered,
          }
        );

        return {
          planId: plan.id,
          planName: plan.name,
          userId,
          serviceCode,
          providerNPI,
          coverage: serviceCoverage,
        };
      },
      {
        // Cache coverage check results
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Track claim status with detailed history
   * @param claimId Claim ID
   * @param userId User ID for authorization
   * @returns Current claim status and history
   * @throws DatabaseException if the status check fails
   */
  async trackClaimStatus(
    claimId: string,
    userId: string
  ): Promise<{ status: string; history: any[]; details: Record<string, any> }> {
    return this.executeJourneyOperation(
      'trackClaimStatus',
      async () => {
        const prisma = this.getPrismaClient();

        // Get the claim with history
        const claim = await prisma.claim.findUnique({
          where: { id: claimId },
          include: {
            statusHistory: {
              orderBy: { createdAt: 'desc' },
            },
            documents: true,
          },
        });

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

        // Format the response
        const response = {
          status: claim.status,
          history: claim.statusHistory.map((history) => ({
            status: history.status,
            timestamp: history.createdAt,
            notes: history.notes,
            updatedBy: history.updatedBy,
          })),
          details: {
            id: claim.id,
            type: claim.type,
            amount: claim.amount,
            submittedAt: claim.submittedAt,
            processedAt: claim.processedAt,
            procedureCode: claim.procedureCode,
            documents: claim.documents.map((doc) => ({
              id: doc.id,
              type: doc.type,
              fileName: doc.fileName,
              uploadStatus: doc.uploadStatus,
            })),
            ...claim.metadata,
          },
        };

        // Send journey event for claim status check
        await this.sendJourneyEvent(
          'CLAIM_STATUS_CHECKED',
          userId,
          {
            claimId,
            status: claim.status,
          }
        );

        return response;
      },
      {
        // Cache claim status results briefly
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Calculate out-of-pocket expenses with category breakdown
   * @param userId User ID
   * @param year Year for calculation
   * @param categoryFilter Optional category filter
   * @returns Out-of-pocket expense summary
   * @throws DatabaseException if the calculation fails
   */
  async calculateOutOfPocketExpenses(
    userId: string,
    year: number,
    categoryFilter?: string[]
  ): Promise<{ total: number; byCategory: Record<string, number>; remaining: number }> {
    return this.executeJourneyOperation(
      'calculateOutOfPocketExpenses',
      async () => {
        const prisma = this.getPrismaClient();

        // Get the user's active plan
        const plan = await prisma.plan.findFirst({
          where: { userId, status: 'active' },
          select: { id: true, metadata: true },
        });

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

        const claimsQuery: Prisma.ClaimFindManyArgs = {
          where: {
            userId,
            submittedAt: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: [ClaimStatus.APPROVED, ClaimStatus.COMPLETED],
            },
            ...(categoryFilter && categoryFilter.length > 0
              ? { type: { in: categoryFilter } }
              : {}),
          },
          select: {
            id: true,
            type: true,
            amount: true,
            metadata: true,
          },
        };

        const claims = await prisma.claim.findMany(claimsQuery);

        // Calculate total and category breakdown
        let total = 0;
        const byCategory: Record<string, number> = {};

        claims.forEach((claim) => {
          // Get the out-of-pocket amount from the claim
          // This is a simplified calculation
          // In a real-world scenario, this would consider copays, coinsurance, etc.
          const outOfPocket = claim.metadata?.outOfPocket || claim.amount * 0.2; // Assume 20% coinsurance if not specified
          
          total += outOfPocket;
          
          // Add to category breakdown
          if (!byCategory[claim.type]) {
            byCategory[claim.type] = 0;
          }
          byCategory[claim.type] += outOfPocket;
        });

        // Calculate remaining out-of-pocket maximum
        // Get the out-of-pocket maximum from the plan metadata
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
            remaining,
          }
        );

        return {
          total,
          byCategory,
          remaining,
        };
      },
      {
        // Cache expense calculations
        journeyContext: { useJourneyCaching: true },
      }
    );
  }

  /**
   * Validate journey-specific data against schema
   * @param dataType Type of data to validate
   * @param data Data to validate
   * @returns Validation result with errors if any
   */
  async validateJourneyData(
    dataType: string,
    data: Record<string, any>
  ): Promise<{ valid: boolean; errors?: any[] }> {
    // This is a simplified implementation
    // In a real-world scenario, this would use a validation library like Zod or class-validator
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

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get journey-specific metrics for monitoring and observability
   * @returns Journey-specific metrics
   */
  async getJourneyMetrics(): Promise<Record<string, any>> {
    const prisma = this.getPrismaClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get active plans count
    const activePlansCount = await prisma.plan.count({
      where: { status: 'active' },
    });

    // Get claims by status
    const claimsByStatus = await prisma.claim.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get recent claims
    const recentClaimsCount = await prisma.claim.count({
      where: {
        submittedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get average claim processing time (in days)
    const claims = await prisma.claim.findMany({
      where: {
        status: { in: [ClaimStatus.APPROVED, ClaimStatus.COMPLETED] },
        submittedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        submittedAt: true,
        processedAt: true,
      },
    });

    let totalProcessingTime = 0;
    claims.forEach((claim) => {
      const processingTime = claim.processedAt.getTime() - claim.submittedAt.getTime();
      totalProcessingTime += processingTime;
    });

    const avgProcessingTimeMs = claims.length > 0 ? totalProcessingTime / claims.length : 0;
    const avgProcessingTimeDays = avgProcessingTimeMs / (24 * 60 * 60 * 1000);

    return {
      activePlansCount,
      claimsByStatus: claimsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentClaimsCount,
      avgProcessingTimeDays,
      timestamp: now,
    };
  }

  /**
   * Send a journey-specific event to the gamification engine
   * @param eventType Type of journey event
   * @param userId User ID
   * @param payload Event payload
   * @throws DatabaseException if event sending fails
   */
  async sendJourneyEvent(
    eventType: string,
    userId: string,
    payload: Record<string, any>
  ): Promise<void> {
    try {
      this.logger.debug(`Sending journey event: ${eventType}`, { userId, ...payload });

      // Prepare the event with journey context
      const event = {
        eventType,
        userId,
        journeyId: JourneyType.PLAN,
        timestamp: new Date().toISOString(),
        payload,
      };

      // In a real implementation, this would publish to Kafka or another event system
      // For now, we'll just log the event
      this.logger.log(`[PLAN_JOURNEY_EVENT] ${eventType}`, event);

      // Simulate sending to gamification engine
      await this.sendDatabaseEvent('journey_event', event);
    } catch (error) {
      this.logger.error(`Failed to send journey event: ${eventType}`, error);
      // Don't throw here to prevent operation failure due to event sending issues
      // Just log the error and continue
    }
  }

  /**
   * Get journey-specific configuration
   * @returns Journey-specific configuration options
   */
  getJourneyConfig(): Record<string, any> {
    return this.config.journey?.options || {};
  }
}