/**
 * Request Types for AUSTA SuperApp API
 * 
 * This file defines the TypeScript interfaces and types for API requests
 * across the AUSTA SuperApp. It provides a consistent request structure
 * for all journeys and ensures proper type safety between frontend and backend.
 */

import { FieldValidationError } from './error.types';

/**
 * Generic API request interface that all request types extend
 */
export interface ApiRequest<T> {
  data: T;                // Request payload data
  requestId?: string;     // Optional request ID for tracing
  timestamp?: string;     // ISO timestamp when request was generated
  journeyContext?: JourneyRequestContext; // Optional journey context
}

/**
 * Journey-specific request context
 */
export interface JourneyRequestContext {
  journeyId: 'health' | 'care' | 'plan'; // Journey identifier
  source: 'web' | 'mobile';              // Request source platform
  language?: string;                     // User language preference (e.g., 'pt-BR')
  timezone?: string;                     // User timezone (e.g., 'America/Sao_Paulo')
  sessionId?: string;                    // Current session identifier
}

/**
 * Pagination request parameters for paginated requests
 */
export interface PaginationParams {
  page?: number;          // Page number (1-based, defaults to 1)
  pageSize?: number;      // Number of items per page (defaults to service-defined value)
  includeTotal?: boolean; // Whether to include total counts (may impact performance)
}

/**
 * Cursor-based pagination parameters for infinite scrolling
 */
export interface CursorPaginationParams {
  cursor?: string;        // Cursor for pagination (null/undefined for first page)
  limit?: number;         // Number of items to return (defaults to service-defined value)
  direction?: 'forward' | 'backward'; // Pagination direction (defaults to 'forward')
}

/**
 * Sorting parameters for requests that support sorting
 */
export interface SortParams {
  sortBy: string;         // Field to sort by
  sortOrder: 'asc' | 'desc'; // Sort direction
}

/**
 * Multi-field sorting parameters
 */
export interface MultiSortParams {
  sort: Array<{
    field: string;        // Field to sort by
    order: 'asc' | 'desc'; // Sort direction
  }>;
}

/**
 * Filter operator types for field filtering
 */
export type FilterOperator = 
  | 'eq'      // Equal
  | 'neq'     // Not equal
  | 'gt'      // Greater than
  | 'gte'     // Greater than or equal
  | 'lt'      // Less than
  | 'lte'     // Less than or equal
  | 'in'      // In array
  | 'nin'     // Not in array
  | 'contains' // Contains substring (for strings)
  | 'startsWith' // Starts with substring (for strings)
  | 'endsWith'   // Ends with substring (for strings)
  | 'exists'     // Field exists
  | 'between'    // Between two values (inclusive)
;

/**
 * Single field filter definition
 */
export interface FieldFilter<T = unknown> {
  field: string;          // Field to filter on
  operator: FilterOperator; // Filter operator
  value: T;               // Filter value
}

/**
 * Logical filter group with AND/OR operations
 */
export interface FilterGroup {
  logic: 'and' | 'or';    // Logical operator for the group
  filters: Array<FieldFilter | FilterGroup>; // Nested filters or groups
}

/**
 * Filter parameters for requests that support filtering
 */
export interface FilterParams {
  filter: FieldFilter | FilterGroup | Array<FieldFilter>;
}

/**
 * Date range filter for time-based queries
 */
export interface DateRangeFilter {
  startDate: string;      // ISO date string for range start
  endDate: string;        // ISO date string for range end
  field?: string;         // Field to apply date range (defaults to service-defined field)
}

/**
 * Search parameters for text search
 */
export interface SearchParams {
  query: string;          // Search query text
  fields?: string[];      // Fields to search in (defaults to service-defined fields)
  fuzzy?: boolean;        // Whether to use fuzzy matching
  minScore?: number;      // Minimum relevance score (0-1)
}

/**
 * Common request parameters that can be used across different requests
 */
export interface CommonRequestParams {
  pagination?: PaginationParams | CursorPaginationParams;
  sort?: SortParams | MultiSortParams;
  filter?: FilterParams;
  search?: SearchParams;
  dateRange?: DateRangeFilter;
  include?: string[];     // Related resources to include
  fields?: string[];      // Fields to include (for sparse fieldsets)
  language?: string;      // Response language preference
}

/**
 * Request envelope that wraps all API requests
 */
export interface RequestEnvelope<T> {
  request: ApiRequest<T>; // The API request
  meta: {
    apiVersion: string;   // API version
    clientTime: string;   // Client time when request was generated
    clientInfo?: {        // Client information
      platform: 'web' | 'mobile' | 'tablet';
      os?: string;        // Operating system
      appVersion?: string; // Application version
      deviceId?: string;  // Device identifier
    };
    journey?: string;     // Optional journey context
  };
}

/**
 * Batch operation request for multiple items
 */
export interface BatchOperationRequest<T> extends ApiRequest<{
  items: T[];            // Items to process in batch
  continueOnError?: boolean; // Whether to continue processing on error
  options?: Record<string, unknown>; // Additional operation-specific options
}> {}

/**
 * File upload request
 */
export interface FileUploadRequest extends ApiRequest<{
  fileName: string;       // Name of the file
  fileSize: number;       // Size of the file in bytes
  mimeType: string;       // MIME type of the file
  purpose: string;        // Purpose of the file (e.g., 'claim-document', 'profile-picture')
  metadata?: Record<string, unknown>; // Additional file metadata
}> {}

/**
 * Validation request for pre-validating data
 */
export interface ValidationRequest<T> extends ApiRequest<{
  data: T;                // Data to validate
  validateOnly?: boolean; // If true, only validate without saving
}> {}

/**
 * Health-specific request context
 */
export interface HealthRequestContext extends JourneyRequestContext {
  journeyId: 'health';    // Always 'health' for health journey
  deviceId?: string;      // Connected health device ID
  metricTypes?: string[]; // Types of health metrics being requested
}

/**
 * Care-specific request context
 */
export interface CareRequestContext extends JourneyRequestContext {
  journeyId: 'care';      // Always 'care' for care journey
  providerId?: string;    // Healthcare provider ID if applicable
  specialtyId?: string;   // Medical specialty ID if applicable
}

/**
 * Plan-specific request context
 */
export interface PlanRequestContext extends JourneyRequestContext {
  journeyId: 'plan';      // Always 'plan' for plan journey
  planId?: string;        // Insurance plan ID if applicable
  memberId?: string;      // Member ID for insurance
}

/**
 * Type guard to check if a request context is for the health journey
 */
export function isHealthRequestContext(
  context: JourneyRequestContext
): context is HealthRequestContext {
  return context.journeyId === 'health';
}

/**
 * Type guard to check if a request context is for the care journey
 */
export function isCareRequestContext(
  context: JourneyRequestContext
): context is CareRequestContext {
  return context.journeyId === 'care';
}

/**
 * Type guard to check if a request context is for the plan journey
 */
export function isPlanRequestContext(
  context: JourneyRequestContext
): context is PlanRequestContext {
  return context.journeyId === 'plan';
}

/**
 * Helper function to create a basic API request
 */
export function createApiRequest<T>(data: T, journeyId?: 'health' | 'care' | 'plan'): ApiRequest<T> {
  return {
    data,
    timestamp: new Date().toISOString(),
    journeyContext: journeyId ? {
      journeyId,
      source: typeof window !== 'undefined' ? 'web' : 'mobile',
    } : undefined,
  };
}

/**
 * Helper function to create a request envelope
 */
export function createRequestEnvelope<T>(
  request: ApiRequest<T>,
  apiVersion = '1.0',
  journey?: string
): RequestEnvelope<T> {
  return {
    request,
    meta: {
      apiVersion,
      clientTime: new Date().toISOString(),
      clientInfo: {
        platform: typeof window !== 'undefined' ? 'web' : 'mobile',
        appVersion: process.env.APP_VERSION || '1.0.0',
      },
      journey,
    },
  };
}