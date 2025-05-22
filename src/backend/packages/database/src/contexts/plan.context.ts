import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { BaseJourneyContext } from './base-journey.context';
import { TransactionClient } from '../transactions/transaction.interface';
import { Transactional } from '../transactions/transaction.decorators';
import { TransactionService } from '../transactions/transaction.service';

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

/**
 * Specialized database context for the Plan journey ("Meu Plano & Benefícios")
 * that extends the base journey context with plan-specific database operations.
 * 
 * Provides optimized methods for plans, benefits, coverage, claims, and documents
 * with transaction management and plan-specific error handling.
 */
@Injectable()
export class PlanContext extends BaseJourneyContext {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly transactionService: TransactionService,
  ) {
    super(prisma);
  }

  /**
   * Retrieves a plan by ID with optimized query for plan details
   * 
   * @param planId - The unique identifier of the plan
   * @returns The plan details or throws PlanNotFoundError if not found
   */
  async getPlanById(planId: string): Promise<IPlan> {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
        include: {
          benefits: true,
          coverage: true,
        },
      });

      if (!plan) {
        throw new PlanNotFoundError(`Plan with ID ${planId} not found`);
      }

      return plan as unknown as IPlan;
    } catch (error) {
      if (error instanceof PlanNotFoundError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to retrieve plan with ID ${planId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves plans available in a specific region
   * 
   * @param regionCode - The region code to filter plans by
   * @returns Array of plans available in the specified region
   */
  async getPlansByRegion(regionCode: string): Promise<IPlan[]> {
    try {
      const plans = await this.prisma.plan.findMany({
        where: {
          regions: {
            has: regionCode,
          },
          status: 'ACTIVE',
        },
        include: {
          benefits: true,
          coverage: {
            select: {
              id: true,
              type: true,
              description: true,
              copaymentAmount: true,
            },
          },
        },
        orderBy: {
          price: 'asc',
        },
      });

      if (plans.length === 0) {
        throw new PlanNotAvailableInRegionError(
          `No plans available in region ${regionCode}`,
        );
      }

      return plans as unknown as IPlan[];
    } catch (error) {
      if (error instanceof PlanNotAvailableInRegionError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to retrieve plans for region ${regionCode}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves a benefit by ID with optimized query
   * 
   * @param benefitId - The unique identifier of the benefit
   * @returns The benefit details or throws BenefitNotFoundError if not found
   */
  async getBenefitById(benefitId: string): Promise<IBenefit> {
    try {
      const benefit = await this.prisma.benefit.findUnique({
        where: { id: benefitId },
      });

      if (!benefit) {
        throw new BenefitNotFoundError(`Benefit with ID ${benefitId} not found`);
      }

      return benefit as unknown as IBenefit;
    } catch (error) {
      if (error instanceof BenefitNotFoundError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to retrieve benefit with ID ${benefitId}`,
        { cause: error },
      );
    }
  }

  /**
   * Checks if a benefit is covered by a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @param benefitId - The unique identifier of the benefit
   * @returns True if the benefit is covered, throws BenefitNotCoveredError otherwise
   */
  async isBenefitCoveredByPlan(planId: string, benefitId: string): Promise<boolean> {
    try {
      const planBenefit = await this.prisma.planBenefit.findUnique({
        where: {
          planId_benefitId: {
            planId,
            benefitId,
          },
        },
      });

      if (!planBenefit) {
        throw new BenefitNotCoveredError(
          `Benefit ${benefitId} is not covered by plan ${planId}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof BenefitNotCoveredError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to check benefit coverage for plan ${planId} and benefit ${benefitId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves coverage details for a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @returns Array of coverage details for the specified plan
   */
  async getPlanCoverage(planId: string): Promise<ICoverage[]> {
    try {
      const coverage = await this.prisma.coverage.findMany({
        where: { planId },
        orderBy: {
          type: 'asc',
        },
      });

      if (coverage.length === 0) {
        throw new CoverageNotFoundError(`No coverage found for plan ${planId}`);
      }

      return coverage as unknown as ICoverage[];
    } catch (error) {
      if (error instanceof CoverageNotFoundError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to retrieve coverage for plan ${planId}`,
        { cause: error },
      );
    }
  }

  /**
   * Checks if a service is covered by a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @param serviceCode - The service code to check coverage for
   * @returns Coverage details if covered, throws ServiceNotCoveredError otherwise
   */
  async isServiceCovered(planId: string, serviceCode: string): Promise<ICoverage> {
    try {
      const coverage = await this.prisma.coverage.findFirst({
        where: {
          planId,
          serviceCodes: {
            has: serviceCode,
          },
        },
      });

      if (!coverage) {
        throw new ServiceNotCoveredError(
          `Service ${serviceCode} is not covered by plan ${planId}`,
        );
      }

      return coverage as unknown as ICoverage;
    } catch (error) {
      if (error instanceof ServiceNotCoveredError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to check service coverage for plan ${planId} and service ${serviceCode}`,
        { cause: error },
      );
    }
  }

  /**
   * Checks if a provider is in-network for a specific plan
   * 
   * @param planId - The unique identifier of the plan
   * @param providerId - The unique identifier of the provider
   * @returns True if the provider is in-network, throws OutOfNetworkError otherwise
   */
  async isProviderInNetwork(planId: string, providerId: string): Promise<boolean> {
    try {
      const networkProvider = await this.prisma.networkProvider.findUnique({
        where: {
          planId_providerId: {
            planId,
            providerId,
          },
        },
      });

      if (!networkProvider) {
        throw new OutOfNetworkError(
          `Provider ${providerId} is out of network for plan ${planId}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof OutOfNetworkError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to check network status for plan ${planId} and provider ${providerId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves a claim by ID with optimized query for claim details
   * 
   * @param claimId - The unique identifier of the claim
   * @returns The claim details or throws ClaimNotFoundError if not found
   */
  async getClaimById(claimId: string): Promise<IClaim> {
    try {
      const claim = await this.prisma.claim.findUnique({
        where: { id: claimId },
        include: {
          documents: true,
        },
      });

      if (!claim) {
        throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
      }

      return claim as unknown as IClaim;
    } catch (error) {
      if (error instanceof ClaimNotFoundError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to retrieve claim with ID ${claimId}`,
        { cause: error },
      );
    }
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
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.ClaimWhereInput = { userId };
      
      if (status) {
        where.status = status;
      }

      const [claims, total] = await Promise.all([
        this.prisma.claim.findMany({
          where,
          include: {
            documents: true,
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.claim.count({ where }),
      ]);

      return {
        claims: claims as unknown as IClaim[],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new PlanPersistenceError(
        `Failed to retrieve claims for user ${userId}`,
        { cause: error },
      );
    }
  }

  /**
   * Creates a new claim with optimized transaction pattern
   * 
   * @param data - The claim data to create
   * @returns The created claim
   */
  @Transactional()
  async createClaim(
    data: Prisma.ClaimCreateInput,
    client?: TransactionClient,
  ): Promise<IClaim> {
    const prisma = client || this.prisma;
    
    try {
      // Check for duplicate claims
      const existingClaim = await prisma.claim.findFirst({
        where: {
          userId: data.userId,
          serviceDate: data.serviceDate,
          serviceCode: data.serviceCode,
          providerId: data.providerId,
        },
      });

      if (existingClaim) {
        throw new DuplicateClaimError(
          `A claim for this service already exists (ID: ${existingClaim.id})`,
        );
      }

      // Validate claim data
      if (!data.amount || data.amount <= 0) {
        throw new ClaimValidationError('Claim amount must be greater than zero');
      }

      // Create the claim
      const claim = await prisma.claim.create({
        data: {
          ...data,
          status: ClaimStatus.SUBMITTED,
        },
        include: {
          documents: true,
        },
      });

      return claim as unknown as IClaim;
    } catch (error) {
      if (
        error instanceof DuplicateClaimError ||
        error instanceof ClaimValidationError
      ) {
        throw error;
      }
      throw new PlanPersistenceError('Failed to create claim', { cause: error });
    }
  }

  /**
   * Updates a claim status with optimized transaction pattern
   * 
   * @param claimId - The unique identifier of the claim
   * @param status - The new status for the claim
   * @param notes - Optional notes about the status change
   * @returns The updated claim
   */
  @Transactional()
  async updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    notes?: string,
    client?: TransactionClient,
  ): Promise<IClaim> {
    const prisma = client || this.prisma;
    
    try {
      const claim = await prisma.claim.findUnique({
        where: { id: claimId },
      });

      if (!claim) {
        throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
      }

      // Validate status transition
      this.validateClaimStatusTransition(claim.status as ClaimStatus, status);

      // Update the claim status
      const updatedClaim = await prisma.claim.update({
        where: { id: claimId },
        data: {
          status,
          statusNotes: notes,
          updatedAt: new Date(),
        },
        include: {
          documents: true,
        },
      });

      return updatedClaim as unknown as IClaim;
    } catch (error) {
      if (error instanceof ClaimNotFoundError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to update status for claim ${claimId}`,
        { cause: error },
      );
    }
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
      [ClaimStatus.SUBMITTED]: [
        ClaimStatus.VALIDATING,
        ClaimStatus.REJECTED,
      ],
      [ClaimStatus.VALIDATING]: [
        ClaimStatus.PROCESSING,
        ClaimStatus.REJECTED,
      ],
      [ClaimStatus.PROCESSING]: [
        ClaimStatus.EXTERNAL_SUBMISSION,
        ClaimStatus.REJECTED,
      ],
      [ClaimStatus.EXTERNAL_SUBMISSION]: [
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.FAILED,
      ],
      [ClaimStatus.FAILED]: [
        ClaimStatus.RESUBMITTING,
        ClaimStatus.REJECTED,
      ],
      [ClaimStatus.RESUBMITTING]: [
        ClaimStatus.EXTERNAL_SUBMISSION,
      ],
      [ClaimStatus.UNDER_REVIEW]: [
        ClaimStatus.APPROVED,
        ClaimStatus.DENIED,
        ClaimStatus.ADDITIONAL_INFO_REQUIRED,
      ],
      [ClaimStatus.ADDITIONAL_INFO_REQUIRED]: [
        ClaimStatus.UPDATING,
      ],
      [ClaimStatus.UPDATING]: [
        ClaimStatus.UNDER_REVIEW,
      ],
      [ClaimStatus.APPROVED]: [
        ClaimStatus.PAYMENT_PENDING,
      ],
      [ClaimStatus.PAYMENT_PENDING]: [
        ClaimStatus.COMPLETED,
      ],
      [ClaimStatus.COMPLETED]: [],
      [ClaimStatus.REJECTED]: [],
      [ClaimStatus.DENIED]: [],
    };

    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      throw new ClaimValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
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
  @Transactional()
  async addDocumentToClaim(
    claimId: string,
    documentData: Prisma.DocumentCreateInput,
    client?: TransactionClient,
  ): Promise<IDocument> {
    const prisma = client || this.prisma;
    
    try {
      // Check if claim exists
      const claim = await prisma.claim.findUnique({
        where: { id: claimId },
      });

      if (!claim) {
        throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
      }

      // Validate document format
      const allowedFormats = ['pdf', 'jpg', 'jpeg', 'png'];
      const fileExtension = documentData.fileUrl.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedFormats.includes(fileExtension)) {
        throw new DocumentFormatError(
          `Invalid document format: ${fileExtension}. Allowed formats: ${allowedFormats.join(', ')}`,
        );
      }

      // Validate document size (assuming size is in bytes)
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (documentData.fileSize && documentData.fileSize > maxSizeBytes) {
        throw new DocumentSizeExceededError(
          `Document size exceeds maximum allowed size of 10MB`,
        );
      }

      // Add document to claim
      const document = await prisma.document.create({
        data: {
          ...documentData,
          claim: {
            connect: { id: claimId },
          },
        },
      });

      return document as unknown as IDocument;
    } catch (error) {
      if (
        error instanceof ClaimNotFoundError ||
        error instanceof DocumentFormatError ||
        error instanceof DocumentSizeExceededError
      ) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to add document to claim ${claimId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves documents for a specific claim
   * 
   * @param claimId - The unique identifier of the claim
   * @returns Array of documents for the specified claim
   */
  async getClaimDocuments(claimId: string): Promise<IDocument[]> {
    try {
      // Check if claim exists
      const claim = await this.prisma.claim.findUnique({
        where: { id: claimId },
      });

      if (!claim) {
        throw new ClaimNotFoundError(`Claim with ID ${claimId} not found`);
      }

      // Get documents for claim
      const documents = await this.prisma.document.findMany({
        where: { claimId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return documents as unknown as IDocument[];
    } catch (error) {
      if (error instanceof ClaimNotFoundError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to retrieve documents for claim ${claimId}`,
        { cause: error },
      );
    }
  }

  /**
   * Retrieves a document by ID
   * 
   * @param documentId - The unique identifier of the document
   * @returns The document details or throws DocumentNotFoundError if not found
   */
  async getDocumentById(documentId: string): Promise<IDocument> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new DocumentNotFoundError(`Document with ID ${documentId} not found`);
      }

      return document as unknown as IDocument;
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        throw error;
      }
      throw new PlanPersistenceError(
        `Failed to retrieve document with ID ${documentId}`,
        { cause: error },
      );
    }
  }
}