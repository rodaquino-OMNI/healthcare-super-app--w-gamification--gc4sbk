/**
 * Request handling interfaces for the AUSTA SuperApp
 * 
 * This file defines standardized TypeScript interfaces for API request payloads
 * across the application, including generic request patterns, pagination parameters,
 * filtering, and sorting structures used by all journey APIs.
 * 
 * These interfaces enable consistent request typing for frontend API clients
 * and backend validation, ensuring type safety across all API interactions.
 */

import { ErrorJourney } from './error.types';

/**
 * Base request interface for all API requests
 */
export interface ApiRequest {
  requestId?: string;
  timestamp?: string;
  journey?: ErrorJourney;
}

/**
 * Pagination parameters for paginated requests
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Default page size if not specified */
  defaultPageSize?: number;
  /** Maximum allowed page size */
  maxPageSize?: number;
}

/**
 * Cursor-based pagination parameters for infinite scrolling
 */
export interface CursorPaginationParams {
  /** Cursor for the next page of results */
  cursor?: string;
  /** Number of items to retrieve */
  limit?: number;
  /** Direction of pagination */
  direction?: 'forward' | 'backward';
}

/**
 * Sorting parameters for sorted requests
 */
export interface SortParams {
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Multiple sort criteria */
  sort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
}

/**
 * Filter operator types for building complex filters
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUALS = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'ncontains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
  BETWEEN = 'between',
  NOT_BETWEEN = 'nbetween'
}

/**
 * Filter condition for a single field
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Logical filter group with AND/OR conditions
 */
export interface FilterGroup {
  logic: 'and' | 'or';
  filters: Array<FilterCondition | FilterGroup>;
}

/**
 * Filter parameters for filtered requests
 */
export interface FilterParams {
  /** Simple key-value filters (field equals value) */
  filters?: Record<string, unknown>;
  /** Complex filter with logical operators */
  filter?: FilterCondition | FilterGroup;
  /** Search term for text search across multiple fields */
  search?: string;
  /** Fields to search in when using search parameter */
  searchFields?: string[];
}

/**
 * Field selection parameters for requests that support field selection
 */
export interface FieldSelectionParams {
  /** Fields to include in the response */
  fields?: string[];
  /** Fields to exclude from the response */
  exclude?: string[];
  /** Whether to include related entities */
  include?: string[];
  /** Depth of included relations */
  depth?: number;
}

/**
 * Date range parameters for time-based filtering
 */
export interface DateRangeParams {
  /** Start date for the range */
  startDate?: string;
  /** End date for the range */
  endDate?: string;
  /** Predefined date range (today, yesterday, last7days, etc.) */
  dateRange?: string;
  /** Timezone for date calculations */
  timezone?: string;
}

/**
 * Geolocation parameters for location-based requests
 */
export interface GeoLocationParams {
  /** Latitude coordinate */
  latitude?: number;
  /** Longitude coordinate */
  longitude?: number;
  /** Search radius in kilometers */
  radius?: number;
  /** Unit of distance (km, mi) */
  unit?: 'km' | 'mi';
}

/**
 * Combined query parameters for list endpoints
 */
export interface QueryParams extends 
  PaginationParams, 
  SortParams, 
  FilterParams, 
  FieldSelectionParams, 
  DateRangeParams {
  /** Additional custom parameters */
  [key: string]: unknown;
}

/**
 * Request envelope for all API requests
 */
export interface RequestEnvelope<T> extends ApiRequest {
  data: T;
}

/**
 * Batch operation request for multiple items
 */
export interface BatchRequest<T> extends ApiRequest {
  items: Array<T & { id: string }>;
  options?: {
    /** Whether to stop processing on first error */
    stopOnError?: boolean;
    /** Whether to run operations in parallel */
    parallel?: boolean;
    /** Timeout for the entire batch operation */
    timeout?: number;
  };
}

/**
 * File upload request
 */
export interface FileUploadRequest extends ApiRequest {
  /** File metadata */
  metadata?: {
    /** Original filename */
    filename: string;
    /** MIME type */
    mimeType: string;
    /** File size in bytes */
    size: number;
    /** Additional metadata */
    [key: string]: unknown;
  };
  /** Upload options */
  options?: {
    /** Whether to generate thumbnails */
    generateThumbnail?: boolean;
    /** Whether the file is public or private */
    visibility?: 'public' | 'private';
    /** Time-to-live in seconds */
    ttl?: number;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Allowed MIME types */
    allowedTypes?: string[];
  };
}

/**
 * Bulk file upload request
 */
export interface BulkFileUploadRequest extends ApiRequest {
  files: FileUploadRequest[];
  options?: {
    /** Whether to stop processing on first error */
    stopOnError?: boolean;
    /** Whether to run uploads in parallel */
    parallel?: boolean;
    /** Timeout for the entire batch operation */
    timeout?: number;
  };
}

/**
 * Health journey specific request context
 */
export interface HealthJourneyContext {
  journey: ErrorJourney.HEALTH;
  /** User's health profile ID */
  healthProfileId?: string;
  /** Connected device ID */
  deviceId?: string;
  /** Health goal ID */
  goalId?: string;
  /** Medical event ID */
  medicalEventId?: string;
}

/**
 * Care journey specific request context
 */
export interface CareJourneyContext {
  journey: ErrorJourney.CARE;
  /** Appointment ID */
  appointmentId?: string;
  /** Healthcare provider ID */
  providerId?: string;
  /** Medication ID */
  medicationId?: string;
  /** Telemedicine session ID */
  sessionId?: string;
  /** Treatment plan ID */
  treatmentPlanId?: string;
}

/**
 * Plan journey specific request context
 */
export interface PlanJourneyContext {
  journey: ErrorJourney.PLAN;
  /** Insurance claim ID */
  claimId?: string;
  /** Coverage ID */
  coverageId?: string;
  /** Benefit ID */
  benefitId?: string;
  /** Document ID */
  documentId?: string;
  /** Insurance plan ID */
  planId?: string;
}

/**
 * Gamification specific request context
 */
export interface GamificationContext {
  journey: ErrorJourney.GAMIFICATION;
  /** Achievement ID */
  achievementId?: string;
  /** Quest ID */
  questId?: string;
  /** Reward ID */
  rewardId?: string;
  /** Game profile ID */
  profileId?: string;
}

/**
 * Authentication specific request context
 */
export interface AuthContext {
  journey: ErrorJourney.AUTH;
  /** User ID */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Device ID */
  deviceId?: string;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Notification specific request context
 */
export interface NotificationContext {
  journey: ErrorJourney.NOTIFICATION;
  /** Notification ID */
  notificationId?: string;
  /** Template ID */
  templateId?: string;
  /** Channel ID */
  channelId?: string;
  /** Preference ID */
  preferenceId?: string;
}

/**
 * Union type of all journey-specific contexts
 */
export type JourneyContext =
  | HealthJourneyContext
  | CareJourneyContext
  | PlanJourneyContext
  | GamificationContext
  | AuthContext
  | NotificationContext;

/**
 * Request with journey-specific context
 */
export interface JourneyRequest<T, C extends JourneyContext = JourneyContext> extends RequestEnvelope<T> {
  context: C;
}

/**
 * Create operation request
 */
export interface CreateRequest<T> extends ApiRequest {
  data: T;
}

/**
 * Update operation request
 */
export interface UpdateRequest<T> extends ApiRequest {
  id: string;
  data: Partial<T>;
  /** Whether to return the updated entity */
  returnEntity?: boolean;
}

/**
 * Patch operation request using JSON Patch format
 */
export interface PatchRequest extends ApiRequest {
  id: string;
  /** JSON Patch operations */
  operations: Array<{
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
    path: string;
    value?: unknown;
    from?: string;
  }>;
  /** Whether to return the updated entity */
  returnEntity?: boolean;
}

/**
 * Delete operation request
 */
export interface DeleteRequest extends ApiRequest {
  id: string;
  /** Whether to perform a soft delete */
  soft?: boolean;
  /** Whether to cascade the deletion to related entities */
  cascade?: boolean;
}

/**
 * Bulk delete operation request
 */
export interface BulkDeleteRequest extends ApiRequest {
  ids: string[];
  /** Whether to perform a soft delete */
  soft?: boolean;
  /** Whether to cascade the deletion to related entities */
  cascade?: boolean;
  /** Whether to stop processing on first error */
  stopOnError?: boolean;
}

/**
 * Get by ID operation request
 */
export interface GetByIdRequest extends ApiRequest, FieldSelectionParams {
  id: string;
}

/**
 * List operation request
 */
export interface ListRequest extends ApiRequest, QueryParams {}

/**
 * Search operation request
 */
export interface SearchRequest extends ApiRequest, QueryParams {
  /** Search query */
  query: string;
  /** Fields to search in */
  fields?: string[];
  /** Whether to use fuzzy matching */
  fuzzy?: boolean;
  /** Minimum score for results */
  minScore?: number;
}

/**
 * Export operation request
 */
export interface ExportRequest extends ApiRequest, FilterParams {
  /** Export format */
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  /** Fields to include in the export */
  fields?: string[];
  /** Custom filename */
  filename?: string;
  /** Whether to include headers */
  includeHeaders?: boolean;
}

/**
 * Import operation request
 */
export interface ImportRequest extends ApiRequest {
  /** Import format */
  format: 'csv' | 'xlsx' | 'json';
  /** Whether to validate data before import */
  validate?: boolean;
  /** Whether to update existing records */
  updateExisting?: boolean;
  /** Field to use as unique identifier */
  identifierField?: string;
  /** Whether to stop processing on first error */
  stopOnError?: boolean;
}

/**
 * WebSocket subscription request
 */
export interface WebSocketSubscriptionRequest extends ApiRequest {
  /** Event types to subscribe to */
  events: string[];
  /** Filters for events */
  filters?: Record<string, unknown>;
  /** Subscription options */
  options?: {
    /** Whether to receive past events */
    includePastEvents?: boolean;
    /** Maximum number of past events to receive */
    maxPastEvents?: number;
    /** Time-to-live for the subscription in seconds */
    ttl?: number;
  };
}

/**
 * GraphQL operation request
 */
export interface GraphQLRequest<T = Record<string, unknown>> extends ApiRequest {
  /** GraphQL query or mutation */
  query: string;
  /** Variables for the operation */
  variables?: T;
  /** Operation name for multi-operation documents */
  operationName?: string;
  /** Whether to use persisted queries */
  usePersistedQuery?: boolean;
  /** Persisted query ID */
  persistedQueryId?: string;
}

/**
 * Creates a request envelope
 */
export function createRequestEnvelope<T>(data: T, journey?: ErrorJourney): RequestEnvelope<T> {
  return {
    data,
    journey,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  };
}

/**
 * Creates a journey-specific request
 */
export function createJourneyRequest<T, C extends JourneyContext>(
  data: T,
  context: C
): JourneyRequest<T, C> {
  return {
    data,
    context,
    journey: context.journey,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  };
}

/**
 * Generates a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Creates a filter condition
 */
export function createFilterCondition<T>(field: keyof T & string, operator: FilterOperator, value: unknown): FilterCondition {
  return { field, operator, value };
}

/**
 * Creates an AND filter group
 */
export function createAndFilterGroup(filters: Array<FilterCondition | FilterGroup>): FilterGroup {
  return { logic: 'and', filters };
}

/**
 * Creates an OR filter group
 */
export function createOrFilterGroup(filters: Array<FilterCondition | FilterGroup>): FilterGroup {
  return { logic: 'or', filters };
}

/**
 * Creates pagination parameters
 */
export function createPaginationParams(page: number = 1, pageSize: number = 20): PaginationParams {
  return { page, pageSize };
}

/**
 * Creates cursor pagination parameters
 */
export function createCursorPaginationParams(cursor?: string, limit: number = 20): CursorPaginationParams {
  return { cursor, limit, direction: 'forward' };
}

/**
 * Creates sort parameters
 */
export function createSortParams<T>(sortBy: keyof T & string, sortDirection: 'asc' | 'desc' = 'asc'): SortParams {
  return { sortBy, sortDirection };
}

/**
 * Creates multiple sort criteria
 */
export function createMultiSortParams<T>(sortCriteria: Array<{ field: keyof T & string; direction: 'asc' | 'desc' }>): SortParams {
  return { sort: sortCriteria as Array<{ field: string; direction: 'asc' | 'desc' }> };
}

/**
 * Creates date range parameters
 */
export function createDateRangeParams(startDate: string, endDate: string, timezone?: string): DateRangeParams {
  return { startDate, endDate, timezone };
}

/**
 * Creates predefined date range parameters
 */
export function createPredefinedDateRangeParams(dateRange: string, timezone?: string): DateRangeParams {
  return { dateRange, timezone };
}

/**
 * Creates geolocation parameters
 */
export function createGeoLocationParams(latitude: number, longitude: number, radius: number = 10, unit: 'km' | 'mi' = 'km'): GeoLocationParams {
  return { latitude, longitude, radius, unit };
}