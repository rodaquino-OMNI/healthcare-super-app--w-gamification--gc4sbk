/**
 * @file index.ts
 * @description Central export file for all API interface types in the AUSTA SuperApp.
 * 
 * This file collects and re-exports all API interface types from across the
 * application, providing a single point of import for components and services
 * that need these types. It organizes exports by domain (journey) and protocol
 * to maintain a clear structure while ensuring consistent usage patterns.
 */

// Protocol-specific API types
import * as GraphQL from './graphql.types';
import * as REST from './rest.types';
import * as WebSocket from './websocket.types';

// Common API types
import * as Request from './request.types';
import * as Response from './response.types';
import * as Error from './error.types';

// Journey-specific API types
import * as Auth from './auth.api';
import * as Health from './health.api';
import * as Care from './care.api';
import * as Plan from './plan.api';
import * as Gamification from './gamification.api';

// Re-export all types with namespaces
export {
  // Protocol-specific API types
  GraphQL,
  REST,
  WebSocket,
  
  // Common API types
  Request,
  Response,
  Error,
  
  // Journey-specific API types
  Auth,
  Health,
  Care,
  Plan,
  Gamification
};

// Export common types directly for convenience
export type {
  // Common request types
  PaginationParams,
  FilterParams,
  SortParams,
  RequestEnvelope,
  RequestContext
} from './request.types';

// Common response types
export type {
  ApiResponse,
  PaginatedResponse,
  ResponseEnvelope,
  SuccessResponse,
  ErrorResponse
} from './response.types';

// Common error types
export {
  ErrorCode,
  ErrorType,
  ErrorSeverity
} from './error.types';

export type {
  ApiError,
  ValidationError,
  FieldError
} from './error.types';