/**
 * @file treatment-plan-response.interface.ts
 * @description Defines standardized response interfaces for treatment plan operations.
 * These interfaces ensure consistent return types across the treatments domain.
 */

import { FilterDto, PaginationDto } from '@austa/interfaces/common/dto';
import { TreatmentPlan } from '../entities/treatment-plan.entity';

/**
 * Base interface for all treatment plan responses.
 * Provides a standardized structure for success and error responses.
 */
export interface BaseTreatmentPlanResponse {
  success: boolean;
  timestamp: string;
  requestId?: string;
}

/**
 * Interface for error responses in treatment plan operations.
 * Includes error code, message, and optional details.
 */
export interface TreatmentPlanErrorResponse extends BaseTreatmentPlanResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    context?: string;
  };
}

/**
 * Interface for successful responses returning a single treatment plan.
 */
export interface TreatmentPlanResponse extends BaseTreatmentPlanResponse {
  success: true;
  data: TreatmentPlan;
}

/**
 * Interface for successful responses returning multiple treatment plans.
 */
export interface TreatmentPlansResponse extends BaseTreatmentPlanResponse {
  success: true;
  data: TreatmentPlan[];
}

/**
 * Interface for paginated responses of treatment plans.
 * Includes pagination metadata along with the treatment plans.
 */
export interface PaginatedTreatmentPlansResponse extends BaseTreatmentPlanResponse {
  success: true;
  data: TreatmentPlan[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Interface for filtered query results of treatment plans.
 * Includes the applied filter criteria along with the treatment plans.
 */
export interface FilteredTreatmentPlansResponse extends BaseTreatmentPlanResponse {
  success: true;
  data: TreatmentPlan[];
  filter: {
    applied: Partial<FilterDto>;
    count: number;
  };
}

/**
 * Interface for combined paginated and filtered query results.
 * Includes both pagination metadata and filter criteria.
 */
export interface PaginatedFilteredTreatmentPlansResponse extends BaseTreatmentPlanResponse {
  success: true;
  data: TreatmentPlan[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filter: {
    applied: Partial<FilterDto>;
    count: number;
  };
}

/**
 * Type representing all possible response types for treatment plan operations.
 */
export type TreatmentPlanResponseType =
  | TreatmentPlanResponse
  | TreatmentPlansResponse
  | PaginatedTreatmentPlansResponse
  | FilteredTreatmentPlansResponse
  | PaginatedFilteredTreatmentPlansResponse
  | TreatmentPlanErrorResponse;

/**
 * Factory function to create a successful single treatment plan response.
 * @param treatmentPlan The treatment plan to include in the response
 * @param requestId Optional request ID for tracing
 * @returns A standardized successful response with the treatment plan
 */
export function createTreatmentPlanResponse(
  treatmentPlan: TreatmentPlan,
  requestId?: string
): TreatmentPlanResponse {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    requestId,
    data: treatmentPlan,
  };
}

/**
 * Factory function to create a successful multiple treatment plans response.
 * @param treatmentPlans The treatment plans to include in the response
 * @param requestId Optional request ID for tracing
 * @returns A standardized successful response with the treatment plans
 */
export function createTreatmentPlansResponse(
  treatmentPlans: TreatmentPlan[],
  requestId?: string
): TreatmentPlansResponse {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    requestId,
    data: treatmentPlans,
  };
}

/**
 * Factory function to create a paginated treatment plans response.
 * @param treatmentPlans The treatment plans to include in the response
 * @param pagination The pagination parameters used for the query
 * @param total The total number of treatment plans matching the query
 * @param requestId Optional request ID for tracing
 * @returns A standardized paginated response with the treatment plans
 */
export function createPaginatedTreatmentPlansResponse(
  treatmentPlans: TreatmentPlan[],
  pagination: PaginationDto,
  total: number,
  requestId?: string
): PaginatedTreatmentPlansResponse {
  const limit = pagination.limit || 10;
  const page = pagination.page || 1;
  const pages = Math.ceil(total / limit);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    requestId,
    data: treatmentPlans,
    pagination: {
      total,
      page,
      limit,
      pages,
    },
  };
}

/**
 * Factory function to create a filtered treatment plans response.
 * @param treatmentPlans The treatment plans to include in the response
 * @param filter The filter criteria applied to the query
 * @param requestId Optional request ID for tracing
 * @returns A standardized filtered response with the treatment plans
 */
export function createFilteredTreatmentPlansResponse(
  treatmentPlans: TreatmentPlan[],
  filter: Partial<FilterDto>,
  requestId?: string
): FilteredTreatmentPlansResponse {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    requestId,
    data: treatmentPlans,
    filter: {
      applied: filter,
      count: treatmentPlans.length,
    },
  };
}

/**
 * Factory function to create a paginated and filtered treatment plans response.
 * @param treatmentPlans The treatment plans to include in the response
 * @param pagination The pagination parameters used for the query
 * @param filter The filter criteria applied to the query
 * @param total The total number of treatment plans matching the query
 * @param requestId Optional request ID for tracing
 * @returns A standardized paginated and filtered response with the treatment plans
 */
export function createPaginatedFilteredTreatmentPlansResponse(
  treatmentPlans: TreatmentPlan[],
  pagination: PaginationDto,
  filter: Partial<FilterDto>,
  total: number,
  requestId?: string
): PaginatedFilteredTreatmentPlansResponse {
  const limit = pagination.limit || 10;
  const page = pagination.page || 1;
  const pages = Math.ceil(total / limit);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    requestId,
    data: treatmentPlans,
    pagination: {
      total,
      page,
      limit,
      pages,
    },
    filter: {
      applied: filter,
      count: treatmentPlans.length,
    },
  };
}

/**
 * Factory function to create an error response for treatment plan operations.
 * @param code The error code
 * @param message The error message
 * @param details Optional additional error details
 * @param context Optional context information about where the error occurred
 * @param requestId Optional request ID for tracing
 * @returns A standardized error response
 */
export function createTreatmentPlanErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>,
  context?: string,
  requestId?: string
): TreatmentPlanErrorResponse {
  return {
    success: false,
    timestamp: new Date().toISOString(),
    requestId,
    error: {
      code,
      message,
      details,
      context,
    },
  };
}