/**
 * Standardized response interfaces for treatment plan operations.
 * These interfaces ensure consistent return types across the treatments domain.
 */

import { ITreatmentPlan } from '@austa/interfaces/journey/care';
import { FilterDto, PaginationDto } from '@austa/interfaces/common/dto';

/**
 * Base interface for all treatment plan responses.
 * Provides a standardized structure for API responses in the treatments domain.
 */
export interface TreatmentPlanResponse<T> {
  /**
   * Status of the response (success or error)
   */
  status: 'success' | 'error';
  
  /**
   * Timestamp when the response was generated
   */
  timestamp: Date;
  
  /**
   * Request ID for tracing and debugging purposes
   */
  requestId?: string;
}

/**
 * Interface for successful treatment plan operation responses.
 * Extends the base response interface with data payload.
 */
export interface TreatmentPlanSuccessResponse<T> extends TreatmentPlanResponse<T> {
  /**
   * Response status is always 'success' for this interface
   */
  status: 'success';
  
  /**
   * Data payload containing the operation result
   */
  data: T;
  
  /**
   * Optional metadata about the response
   */
  meta?: Record<string, any>;
}

/**
 * Interface for error responses in treatment plan operations.
 * Extends the base response interface with error details.
 */
export interface TreatmentPlanErrorResponse extends TreatmentPlanResponse<null> {
  /**
   * Response status is always 'error' for this interface
   */
  status: 'error';
  
  /**
   * Error code for categorizing the error
   */
  errorCode: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Optional detailed error information for debugging
   */
  details?: Record<string, any>;
}

/**
 * Interface for paginated treatment plan query results.
 * Extends the success response interface with pagination metadata.
 */
export interface TreatmentPlanPaginatedResponse<T> extends TreatmentPlanSuccessResponse<T[]> {
  /**
   * Pagination metadata
   */
  meta: {
    /**
     * Total number of items available
     */
    totalItems: number;
    
    /**
     * Number of items per page
     */
    itemsPerPage: number;
    
    /**
     * Current page number (1-based)
     */
    currentPage: number;
    
    /**
     * Total number of pages available
     */
    totalPages: number;
    
    /**
     * Original pagination parameters used for the query
     */
    pagination: PaginationDto;
  };
}

/**
 * Interface for filtered treatment plan query results.
 * Extends the paginated response interface with filter metadata.
 */
export interface TreatmentPlanFilteredResponse<T> extends TreatmentPlanPaginatedResponse<T> {
  /**
   * Extended metadata including filter information
   */
  meta: TreatmentPlanPaginatedResponse<T>['meta'] & {
    /**
     * Original filter parameters used for the query
     */
    filter: FilterDto;
  };
}

/**
 * Type alias for a single treatment plan response.
 * Used for operations that return a single treatment plan.
 */
export type SingleTreatmentPlanResponse = TreatmentPlanSuccessResponse<ITreatmentPlan>;

/**
 * Type alias for multiple treatment plans response.
 * Used for operations that return multiple treatment plans.
 */
export type MultipleTreatmentPlansResponse = TreatmentPlanSuccessResponse<ITreatmentPlan[]>;

/**
 * Type alias for paginated treatment plans response.
 * Used for operations that return paginated treatment plans.
 */
export type PaginatedTreatmentPlansResponse = TreatmentPlanPaginatedResponse<ITreatmentPlan>;

/**
 * Type alias for filtered treatment plans response.
 * Used for operations that return filtered and paginated treatment plans.
 */
export type FilteredTreatmentPlansResponse = TreatmentPlanFilteredResponse<ITreatmentPlan>;