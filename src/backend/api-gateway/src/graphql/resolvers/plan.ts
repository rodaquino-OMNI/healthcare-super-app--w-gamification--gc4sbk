/**
 * Plan Journey GraphQL Resolvers
 * 
 * This module defines resolvers for all Plan Journey GraphQL operations, including
 * insurance plans, claims processing, benefits management, and payment operations.
 * It implements enhanced error handling with circuit breakers for external insurance
 * system integration and improved transaction integrity for claims processing.
 */

// Import standardized interfaces from @austa/interfaces package
import {
  IPlan,
  IClaim,
  ClaimStatus,
  ICoverage,
  IBenefit,
  IDocument
} from '@austa/interfaces/journey/plan';

// Import common interfaces and utilities
import { IUser } from '@austa/interfaces/auth';
import { CircuitBreaker } from '@austa/utils/error';

// Import plan-specific services and types using standardized path aliases
import { ClaimsService } from '@app/plan/claims';
import { PlansService } from '@app/plan/plans';
import { BenefitsService } from '@app/plan/benefits';
import { CoverageService } from '@app/plan/coverage';
import { DocumentsService } from '@app/plan/documents';
import { PaymentService } from '@app/plan/payment';

// Import transaction management utilities
import { TransactionManager } from '@app/plan/common/transaction';

/**
 * Circuit breaker configuration for external insurance system integration
 * Implements fallback strategies and retry policies for resilient operations
 */
const INSURANCE_SYSTEM_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,           // Number of failures before opening circuit
  resetTimeout: 30000,           // Time in ms before attempting to close circuit
  maxRetries: 2,                 // Maximum number of retries for operations
  timeout: 5000,                 // Timeout for external system operations
  fallbackResponse: null,        // Default fallback response when circuit is open
  monitorBucketSize: 10,         // Size of monitoring buckets for failure rate
  monitorBucketCount: 10         // Number of monitoring buckets to maintain
};

/**
 * Factory function that creates and returns Plan Journey resolvers
 * 
 * @param claimsService - Instance of ClaimsService for claims operations
 * @returns Object containing all Plan Journey GraphQL resolvers
 */
export const planResolvers = (claimsService: ClaimsService) => {
  // Initialize services using dependency injection pattern
  const plansService = new PlansService();
  const benefitsService = new BenefitsService();
  const coverageService = new CoverageService();
  const documentsService = new DocumentsService();
  const paymentService = new PaymentService();
  const transactionManager = new TransactionManager();
  
  // Create circuit breaker for external insurance system integration
  const insuranceSystemCircuitBreaker = new CircuitBreaker(
    INSURANCE_SYSTEM_CIRCUIT_BREAKER_CONFIG
  );

  return {
    // Type resolvers for Plan-related GraphQL types
    Plan: {
      /**
       * Resolver for Plan.benefits field
       * Retrieves benefits associated with a specific plan
       */
      benefits: async (plan: IPlan): Promise<IBenefit[]> => {
        try {
          return await benefitsService.findByPlanId(plan.id);
        } catch (error) {
          console.error(`Error retrieving benefits for plan ${plan.id}:`, error);
          throw new Error(`Failed to retrieve benefits for plan: ${error.message}`);
        }
      },

      /**
       * Resolver for Plan.coverage field
       * Retrieves coverage details associated with a specific plan
       */
      coverage: async (plan: IPlan): Promise<ICoverage[]> => {
        try {
          return await coverageService.findByPlanId(plan.id);
        } catch (error) {
          console.error(`Error retrieving coverage for plan ${plan.id}:`, error);
          throw new Error(`Failed to retrieve coverage for plan: ${error.message}`);
        }
      },

      /**
       * Resolver for Plan.claims field
       * Retrieves claims associated with a specific plan for the current user
       */
      claims: async (plan: IPlan, _, { user }: { user: IUser }): Promise<IClaim[]> => {
        try {
          return await claimsService.findByPlanIdAndUserId(plan.id, user.id);
        } catch (error) {
          console.error(`Error retrieving claims for plan ${plan.id}:`, error);
          throw new Error(`Failed to retrieve claims for plan: ${error.message}`);
        }
      }
    },

    Claim: {
      /**
       * Resolver for Claim.documents field
       * Retrieves documents associated with a specific claim
       */
      documents: async (claim: IClaim): Promise<IDocument[]> => {
        try {
          return await documentsService.findByClaimId(claim.id);
        } catch (error) {
          console.error(`Error retrieving documents for claim ${claim.id}:`, error);
          throw new Error(`Failed to retrieve documents for claim: ${error.message}`);
        }
      },

      /**
       * Resolver for Claim.plan field
       * Retrieves the plan associated with a specific claim
       */
      plan: async (claim: IClaim): Promise<IPlan> => {
        try {
          return await plansService.findById(claim.planId);
        } catch (error) {
          console.error(`Error retrieving plan for claim ${claim.id}:`, error);
          throw new Error(`Failed to retrieve plan for claim: ${error.message}`);
        }
      }
    },

    // Query resolvers
    Query: {
      /**
       * Retrieves all plans available to the current user
       */
      plans: async (_, __, { user }: { user: IUser }): Promise<IPlan[]> => {
        try {
          return await plansService.findByUserId(user.id);
        } catch (error) {
          console.error('Error retrieving plans:', error);
          throw new Error(`Failed to retrieve plans: ${error.message}`);
        }
      },

      /**
       * Retrieves a specific plan by ID
       */
      plan: async (_, { id }: { id: string }): Promise<IPlan> => {
        try {
          return await plansService.findById(id);
        } catch (error) {
          console.error(`Error retrieving plan ${id}:`, error);
          throw new Error(`Failed to retrieve plan: ${error.message}`);
        }
      },

      /**
       * Retrieves all claims for the current user
       */
      claims: async (_, __, { user }: { user: IUser }): Promise<IClaim[]> => {
        try {
          return await claimsService.findByUserId(user.id);
        } catch (error) {
          console.error('Error retrieving claims:', error);
          throw new Error(`Failed to retrieve claims: ${error.message}`);
        }
      },

      /**
       * Retrieves a specific claim by ID
       */
      claim: async (_, { id }: { id: string }, { user }: { user: IUser }): Promise<IClaim> => {
        try {
          const claim = await claimsService.findById(id);
          
          // Verify claim belongs to the current user for security
          if (claim.userId !== user.id) {
            throw new Error('Unauthorized access to claim');
          }
          
          return claim;
        } catch (error) {
          console.error(`Error retrieving claim ${id}:`, error);
          throw new Error(`Failed to retrieve claim: ${error.message}`);
        }
      },

      /**
       * Retrieves all benefits for a specific plan
       */
      benefits: async (_, { planId }: { planId: string }): Promise<IBenefit[]> => {
        try {
          return await benefitsService.findByPlanId(planId);
        } catch (error) {
          console.error(`Error retrieving benefits for plan ${planId}:`, error);
          throw new Error(`Failed to retrieve benefits: ${error.message}`);
        }
      },

      /**
       * Retrieves coverage details for a specific plan
       */
      coverage: async (_, { planId }: { planId: string }): Promise<ICoverage[]> => {
        try {
          return await coverageService.findByPlanId(planId);
        } catch (error) {
          console.error(`Error retrieving coverage for plan ${planId}:`, error);
          throw new Error(`Failed to retrieve coverage: ${error.message}`);
        }
      }
    },

    // Mutation resolvers
    Mutation: {
      /**
       * Creates a new claim for the current user
       * Implements transaction integrity for claim creation process
       */
      createClaim: async (
        _,
        { input }: { input: Omit<IClaim, 'id' | 'status' | 'createdAt' | 'updatedAt'> },
        { user }: { user: IUser }
      ): Promise<IClaim> => {
        // Use transaction manager to ensure data integrity
        return transactionManager.withTransaction(async (tx) => {
          try {
            // Verify plan exists and belongs to user
            const plan = await plansService.findById(input.planId, tx);
            if (!plan || plan.userId !== user.id) {
              throw new Error('Invalid plan selected for claim');
            }

            // Create the claim with initial status
            const claim = await claimsService.create(
              {
                ...input,
                userId: user.id,
                status: ClaimStatus.SUBMITTED
              },
              tx
            );

            return claim;
          } catch (error) {
            console.error('Error creating claim:', error);
            throw new Error(`Failed to create claim: ${error.message}`);
          }
        });
      },

      /**
       * Updates an existing claim
       * Implements transaction integrity and validation
       */
      updateClaim: async (
        _,
        { id, input }: { id: string; input: Partial<IClaim> },
        { user }: { user: IUser }
      ): Promise<IClaim> => {
        return transactionManager.withTransaction(async (tx) => {
          try {
            // Retrieve existing claim
            const existingClaim = await claimsService.findById(id, tx);
            
            // Verify claim belongs to user
            if (!existingClaim || existingClaim.userId !== user.id) {
              throw new Error('Unauthorized access to claim');
            }

            // Validate status transitions
            if (input.status && !isValidStatusTransition(existingClaim.status, input.status)) {
              throw new Error(`Invalid status transition from ${existingClaim.status} to ${input.status}`);
            }

            // Update the claim
            const updatedClaim = await claimsService.update(id, input, tx);
            return updatedClaim;
          } catch (error) {
            console.error(`Error updating claim ${id}:`, error);
            throw new Error(`Failed to update claim: ${error.message}`);
          }
        });
      },

      /**
       * Submits a claim to the external insurance system
       * Implements circuit breaker pattern for resilient external integration
       */
      submitClaimToInsurance: async (
        _,
        { id }: { id: string },
        { user }: { user: IUser }
      ): Promise<IClaim> => {
        try {
          // Retrieve claim and verify ownership
          const claim = await claimsService.findById(id);
          if (!claim || claim.userId !== user.id) {
            throw new Error('Unauthorized access to claim');
          }

          // Verify claim is in a submittable state
          if (claim.status !== ClaimStatus.SUBMITTED && claim.status !== ClaimStatus.UPDATING) {
            throw new Error(`Claim cannot be submitted in ${claim.status} status`);
          }

          // Use circuit breaker for external system call
          return await insuranceSystemCircuitBreaker.execute(async () => {
            // Update claim status to processing
            const processingClaim = await claimsService.update(id, { status: ClaimStatus.PROCESSING });
            
            // Submit to external insurance system
            const result = await claimsService.submitToInsurance(id);
            
            // Update claim with external system response
            return await claimsService.update(id, {
              status: ClaimStatus.UNDER_REVIEW,
              externalClaimId: result.externalId,
              externalSubmissionDate: new Date()
            });
          });
        } catch (error) {
          // Handle circuit breaker errors
          if (error.name === 'CircuitBreakerError') {
            // Update claim to failed status
            await claimsService.update(id, { status: ClaimStatus.FAILED });
            throw new Error('Insurance system is currently unavailable. Please try again later.');
          }
          
          console.error(`Error submitting claim ${id} to insurance:`, error);
          throw new Error(`Failed to submit claim to insurance: ${error.message}`);
        }
      },

      /**
       * Uploads a document for a specific claim
       */
      uploadClaimDocument: async (
        _,
        { claimId, document }: { claimId: string; document: Omit<IDocument, 'id' | 'claimId'> },
        { user }: { user: IUser }
      ): Promise<IDocument> => {
        return transactionManager.withTransaction(async (tx) => {
          try {
            // Verify claim exists and belongs to user
            const claim = await claimsService.findById(claimId, tx);
            if (!claim || claim.userId !== user.id) {
              throw new Error('Unauthorized access to claim');
            }

            // Create document
            const newDocument = await documentsService.create(
              {
                ...document,
                claimId
              },
              tx
            );

            return newDocument;
          } catch (error) {
            console.error(`Error uploading document for claim ${claimId}:`, error);
            throw new Error(`Failed to upload document: ${error.message}`);
          }
        });
      },

      /**
       * Processes payment for an approved claim
       * Implements transaction integrity for payment processing
       */
      processClaimPayment: async (
        _,
        { claimId, paymentDetails }: { claimId: string; paymentDetails: any },
        { user }: { user: IUser }
      ): Promise<IClaim> => {
        return transactionManager.withTransaction(async (tx) => {
          try {
            // Verify claim exists, belongs to user, and is in approved status
            const claim = await claimsService.findById(claimId, tx);
            if (!claim || claim.userId !== user.id) {
              throw new Error('Unauthorized access to claim');
            }

            if (claim.status !== ClaimStatus.APPROVED) {
              throw new Error('Payment can only be processed for approved claims');
            }

            // Process payment
            const paymentResult = await paymentService.processPayment(claim, paymentDetails, tx);

            // Update claim with payment information
            const updatedClaim = await claimsService.update(
              claimId,
              {
                status: ClaimStatus.PAYMENT_PENDING,
                paymentId: paymentResult.id,
                paymentDate: new Date()
              },
              tx
            );

            return updatedClaim;
          } catch (error) {
            console.error(`Error processing payment for claim ${claimId}:`, error);
            throw new Error(`Failed to process payment: ${error.message}`);
          }
        });
      }
    }
  };
};

/**
 * Validates if a status transition is allowed based on the claim processing workflow
 * 
 * @param currentStatus - Current status of the claim
 * @param newStatus - Proposed new status for the claim
 * @returns Boolean indicating if the transition is valid
 */
function isValidStatusTransition(currentStatus: ClaimStatus, newStatus: ClaimStatus): boolean {
  // Define allowed transitions for each status
  const allowedTransitions: Record<ClaimStatus, ClaimStatus[]> = {
    [ClaimStatus.SUBMITTED]: [
      ClaimStatus.VALIDATING,
      ClaimStatus.REJECTED,
      ClaimStatus.PROCESSING
    ],
    [ClaimStatus.VALIDATING]: [
      ClaimStatus.REJECTED,
      ClaimStatus.PROCESSING
    ],
    [ClaimStatus.PROCESSING]: [
      ClaimStatus.EXTERNAL_SUBMISSION,
      ClaimStatus.FAILED
    ],
    [ClaimStatus.EXTERNAL_SUBMISSION]: [
      ClaimStatus.UNDER_REVIEW,
      ClaimStatus.FAILED,
      ClaimStatus.RESUBMITTING
    ],
    [ClaimStatus.FAILED]: [
      ClaimStatus.RESUBMITTING
    ],
    [ClaimStatus.RESUBMITTING]: [
      ClaimStatus.EXTERNAL_SUBMISSION
    ],
    [ClaimStatus.UNDER_REVIEW]: [
      ClaimStatus.APPROVED,
      ClaimStatus.DENIED,
      ClaimStatus.ADDITIONAL_INFO_REQUIRED
    ],
    [ClaimStatus.ADDITIONAL_INFO_REQUIRED]: [
      ClaimStatus.UPDATING
    ],
    [ClaimStatus.UPDATING]: [
      ClaimStatus.UNDER_REVIEW
    ],
    [ClaimStatus.APPROVED]: [
      ClaimStatus.PAYMENT_PENDING
    ],
    [ClaimStatus.PAYMENT_PENDING]: [
      ClaimStatus.COMPLETED
    ],
    [ClaimStatus.COMPLETED]: [],
    [ClaimStatus.DENIED]: [],
    [ClaimStatus.REJECTED]: []
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
}