/**
 * @file Plan API Interfaces
 * @description Defines TypeScript interfaces for the Plan journey API, including request/response types
 * for insurance plans, claims, coverage, and benefits. These interfaces ensure type safety for all
 * Plan journey operations and provide proper document handling for insurance claims.
 */

import { 
  Benefit, 
  Claim, 
  ClaimStatus, 
  ClaimType, 
  Coverage, 
  CoverageType, 
  Plan, 
  PlanType 
} from '../plan';

/**
 * Namespace for Plan journey API interfaces
 */
export namespace PlanAPI {
  /**
   * Common request parameters
   */
  export interface RequestParams {
    /**
     * Optional user ID for admin operations
     */
    userId?: string;
  }

  /**
   * Document related interfaces
   */
  export namespace Documents {
    /**
     * Document types that can be uploaded for claims
     */
    export type DocumentType = 
      | 'invoice' 
      | 'receipt' 
      | 'medical_report' 
      | 'prescription' 
      | 'referral' 
      | 'explanation_of_benefits' 
      | 'other';

    /**
     * Document metadata
     */
    export interface DocumentMetadata {
      /**
       * Type of document
       */
      type: DocumentType;
      
      /**
       * Original filename
       */
      filename: string;
      
      /**
       * MIME type of the document
       */
      mimeType: string;
      
      /**
       * Size of the document in bytes
       */
      size: number;
      
      /**
       * Additional metadata specific to the document type
       */
      additionalInfo?: Record<string, any>;
    }

    /**
     * Document upload request
     */
    export interface UploadRequest {
      /**
       * Claim ID to associate the document with
       */
      claimId: string;
      
      /**
       * Document metadata
       */
      metadata: DocumentMetadata;
      
      /**
       * File data (handled by REST API, not included in the actual request type)
       */
      file?: File;
    }

    /**
     * Document upload response
     */
    export interface UploadResponse {
      /**
       * Generated document ID
       */
      id: string;
      
      /**
       * Server-generated file path
       */
      filePath: string;
      
      /**
       * Timestamp of upload
       */
      uploadedAt: string;
      
      /**
       * Document metadata
       */
      metadata: DocumentMetadata;
    }

    /**
     * Document deletion request
     */
    export interface DeleteRequest {
      /**
       * Document ID to delete
       */
      documentId: string;
      
      /**
       * Claim ID the document belongs to
       */
      claimId: string;
    }

    /**
     * Document deletion response
     */
    export interface DeleteResponse {
      /**
       * Success status
       */
      success: boolean;
      
      /**
       * Deleted document ID
       */
      documentId: string;
    }
  }

  /**
   * Plan related interfaces
   */
  export namespace Plans {
    /**
     * Get plan request
     */
    export interface GetPlanRequest extends RequestParams {
      /**
       * Plan ID to retrieve
       */
      planId: string;
      
      /**
       * Whether to include related entities
       */
      includeRelated?: {
        /**
         * Include coverage details
         */
        coverages?: boolean;
        
        /**
         * Include benefits
         */
        benefits?: boolean;
        
        /**
         * Include claims
         */
        claims?: boolean;
      };
    }

    /**
     * Get plan response
     */
    export interface GetPlanResponse {
      /**
       * Plan details
       */
      plan: Plan;
    }

    /**
     * List plans request
     */
    export interface ListPlansRequest extends RequestParams {
      /**
       * Pagination parameters
       */
      pagination?: {
        /**
         * Page number (0-based)
         */
        page: number;
        
        /**
         * Items per page
         */
        pageSize: number;
      };
      
      /**
       * Filtering options
       */
      filters?: {
        /**
         * Filter by plan type
         */
        type?: PlanType;
        
        /**
         * Filter by active status (based on validity dates)
         */
        active?: boolean;
      };
    }

    /**
     * List plans response
     */
    export interface ListPlansResponse {
      /**
       * List of plans
       */
      plans: Plan[];
      
      /**
       * Pagination metadata
       */
      pagination: {
        /**
         * Total number of plans
         */
        totalCount: number;
        
        /**
         * Total number of pages
         */
        totalPages: number;
        
        /**
         * Current page (0-based)
         */
        currentPage: number;
      };
    }
  }

  /**
   * Coverage related interfaces
   */
  export namespace Coverages {
    /**
     * Get coverage request
     */
    export interface GetCoverageRequest extends RequestParams {
      /**
       * Coverage ID to retrieve
       */
      coverageId: string;
    }

    /**
     * Get coverage response
     */
    export interface GetCoverageResponse {
      /**
       * Coverage details
       */
      coverage: Coverage;
    }

    /**
     * List coverages request
     */
    export interface ListCoveragesRequest extends RequestParams {
      /**
       * Plan ID to list coverages for
       */
      planId: string;
      
      /**
       * Filtering options
       */
      filters?: {
        /**
         * Filter by coverage type
         */
        type?: CoverageType;
      };
    }

    /**
     * List coverages response
     */
    export interface ListCoveragesResponse {
      /**
       * List of coverages
       */
      coverages: Coverage[];
    }

    /**
     * Coverage details for cost simulation
     */
    export interface CoverageDetails {
      /**
       * Coverage ID
       */
      id: string;
      
      /**
       * Coverage type
       */
      type: CoverageType;
      
      /**
       * Coverage details
       */
      details: string;
      
      /**
       * Co-payment amount (if applicable)
       */
      coPayment?: number;
      
      /**
       * Deductible amount (if applicable)
       */
      deductible?: number;
      
      /**
       * Coverage percentage (0-100)
       */
      coveragePercentage?: number;
    }
  }

  /**
   * Benefit related interfaces
   */
  export namespace Benefits {
    /**
     * Get benefit request
     */
    export interface GetBenefitRequest extends RequestParams {
      /**
       * Benefit ID to retrieve
       */
      benefitId: string;
    }

    /**
     * Get benefit response
     */
    export interface GetBenefitResponse {
      /**
       * Benefit details
       */
      benefit: Benefit;
    }

    /**
     * List benefits request
     */
    export interface ListBenefitsRequest extends RequestParams {
      /**
       * Plan ID to list benefits for
       */
      planId: string;
    }

    /**
     * List benefits response
     */
    export interface ListBenefitsResponse {
      /**
       * List of benefits
       */
      benefits: Benefit[];
    }

    /**
     * Benefit usage tracking
     */
    export interface BenefitUsage {
      /**
       * Benefit ID
       */
      benefitId: string;
      
      /**
       * Usage amount or count
       */
      used: number;
      
      /**
       * Total available amount or count
       */
      total: number;
      
      /**
       * Usage period start date
       */
      periodStart: string;
      
      /**
       * Usage period end date
       */
      periodEnd: string;
    }

    /**
     * Get benefit usage request
     */
    export interface GetBenefitUsageRequest extends RequestParams {
      /**
       * Benefit ID to get usage for
       */
      benefitId: string;
    }

    /**
     * Get benefit usage response
     */
    export interface GetBenefitUsageResponse {
      /**
       * Benefit usage details
       */
      usage: BenefitUsage;
    }
  }

  /**
   * Claim related interfaces
   */
  export namespace Claims {
    /**
     * Create claim request
     */
    export interface CreateClaimRequest extends RequestParams {
      /**
       * Plan ID to create claim for
       */
      planId: string;
      
      /**
       * Type of claim
       */
      type: ClaimType;
      
      /**
       * Claim amount
       */
      amount: number;
      
      /**
       * Service date
       */
      serviceDate: string;
      
      /**
       * Provider information
       */
      provider: {
        /**
         * Provider name
         */
        name: string;
        
        /**
         * Provider ID (if available)
         */
        providerId?: string;
        
        /**
         * Provider contact information
         */
        contact?: {
          /**
           * Phone number
           */
          phone?: string;
          
          /**
           * Email address
           */
          email?: string;
        };
      };
      
      /**
       * Claim description
       */
      description?: string;
      
      /**
       * Initial documents to attach (document uploads handled separately)
       */
      documentIds?: string[];
    }

    /**
     * Create claim response
     */
    export interface CreateClaimResponse {
      /**
       * Created claim
       */
      claim: Claim;
      
      /**
       * Document upload URLs for any pending documents
       */
      documentUploadUrls?: Record<string, string>;
    }

    /**
     * Get claim request
     */
    export interface GetClaimRequest extends RequestParams {
      /**
       * Claim ID to retrieve
       */
      claimId: string;
    }

    /**
     * Get claim response
     */
    export interface GetClaimResponse {
      /**
       * Claim details
       */
      claim: Claim;
    }

    /**
     * List claims request
     */
    export interface ListClaimsRequest extends RequestParams {
      /**
       * Plan ID to list claims for
       */
      planId?: string;
      
      /**
       * Pagination parameters
       */
      pagination?: {
        /**
         * Page number (0-based)
         */
        page: number;
        
        /**
         * Items per page
         */
        pageSize: number;
      };
      
      /**
       * Filtering options
       */
      filters?: {
        /**
         * Filter by claim status
         */
        status?: ClaimStatus | ClaimStatus[];
        
        /**
         * Filter by claim type
         */
        type?: ClaimType | ClaimType[];
        
        /**
         * Filter by date range
         */
        dateRange?: {
          /**
           * Start date (inclusive)
           */
          from?: string;
          
          /**
           * End date (inclusive)
           */
          to?: string;
        };
      };
      
      /**
       * Sorting options
       */
      sort?: {
        /**
         * Field to sort by
         */
        field: 'submittedAt' | 'amount' | 'status';
        
        /**
         * Sort direction
         */
        direction: 'asc' | 'desc';
      };
    }

    /**
     * List claims response
     */
    export interface ListClaimsResponse {
      /**
       * List of claims
       */
      claims: Claim[];
      
      /**
       * Pagination metadata
       */
      pagination: {
        /**
         * Total number of claims
         */
        totalCount: number;
        
        /**
         * Total number of pages
         */
        totalPages: number;
        
        /**
         * Current page (0-based)
         */
        currentPage: number;
      };
    }

    /**
     * Update claim request
     */
    export interface UpdateClaimRequest extends RequestParams {
      /**
       * Claim ID to update
       */
      claimId: string;
      
      /**
       * Updated claim amount (if applicable)
       */
      amount?: number;
      
      /**
       * Updated claim description (if applicable)
       */
      description?: string;
      
      /**
       * Additional information requested by insurer
       */
      additionalInformation?: string;
    }

    /**
     * Update claim response
     */
    export interface UpdateClaimResponse {
      /**
       * Updated claim
       */
      claim: Claim;
    }

    /**
     * Cancel claim request
     */
    export interface CancelClaimRequest extends RequestParams {
      /**
       * Claim ID to cancel
       */
      claimId: string;
      
      /**
       * Reason for cancellation
       */
      reason: string;
    }

    /**
     * Cancel claim response
     */
    export interface CancelClaimResponse {
      /**
       * Success status
       */
      success: boolean;
      
      /**
       * Cancelled claim ID
       */
      claimId: string;
    }
  }

  /**
   * Cost simulator related interfaces
   */
  export namespace CostSimulator {
    /**
     * Procedure cost simulation request
     */
    export interface SimulateCostRequest extends RequestParams {
      /**
       * Plan ID to simulate cost for
       */
      planId: string;
      
      /**
       * Procedure code (CPT/HCPCS)
       */
      procedureCode?: string;
      
      /**
       * Procedure description (if code not available)
       */
      procedureDescription?: string;
      
      /**
       * Provider information
       */
      provider?: {
        /**
         * Provider ID
         */
        providerId?: string;
        
        /**
         * Provider name
         */
        name?: string;
        
        /**
         * Whether the provider is in-network
         */
        inNetwork?: boolean;
      };
      
      /**
       * Estimated procedure cost (if known)
       */
      estimatedCost?: number;
      
      /**
       * Coverage type for the procedure
       */
      coverageType?: CoverageType;
    }

    /**
     * Cost breakdown
     */
    export interface CostBreakdown {
      /**
       * Total procedure cost
       */
      totalCost: number;
      
      /**
       * Amount covered by insurance
       */
      coveredAmount: number;
      
      /**
       * Patient responsibility
       */
      patientResponsibility: {
        /**
         * Deductible amount
         */
        deductible: number;
        
        /**
         * Co-payment amount
         */
        coPayment: number;
        
        /**
         * Co-insurance amount
         */
        coInsurance: number;
        
        /**
         * Total patient responsibility
         */
        total: number;
      };
      
      /**
       * Applied coverage details
       */
      appliedCoverage: PlanAPI.Coverages.CoverageDetails;
    }

    /**
     * Procedure cost simulation response
     */
    export interface SimulateCostResponse {
      /**
       * Cost breakdown
       */
      costBreakdown: CostBreakdown;
      
      /**
       * Alternate scenarios (e.g., in-network vs out-of-network)
       */
      alternateScenarios?: {
        /**
         * Scenario name
         */
        name: string;
        
        /**
         * Scenario description
         */
        description: string;
        
        /**
         * Cost breakdown for this scenario
         */
        costBreakdown: CostBreakdown;
      }[];
    }
  }
}