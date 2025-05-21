/**
 * @file Common DTO Barrel File
 * @description Exports all common Data Transfer Objects (DTOs) used throughout the gamification engine.
 * This file serves as a single entry point for accessing all common DTOs, improving code organization
 * and reducing import verbosity. It also re-exports relevant interfaces from @austa/interfaces
 * to ensure type consistency across the application.
 */

// Re-export all DTOs from local files
export * from './api-query.dto';
export * from './base-response.dto';
export * from './error-response.dto';
export * from './filter.dto';
export * from './pagination.dto';
export * from './sort.dto';

// Re-export relevant interfaces from @austa/interfaces

/**
 * @namespace CommonInterfaces
 * @description Common interfaces re-exported from @austa/interfaces for consistent type definitions
 */
import {
  ApiResponse,
  PaginatedResponse,
  CollectionResponse,
} from '@austa/interfaces/common/response';

import {
  ErrorResponse,
  ErrorCode,
  ValidationError,
  FieldError,
} from '@austa/interfaces/common/error';

import {
  BaseEntity,
  Pagination,
  SortOptions,
  FilterOptions,
} from '@austa/interfaces/common/model';

import {
  Nullable,
  Optional,
  Dictionary,
  RecordOf,
} from '@austa/interfaces/common/types';

/**
 * @namespace GamificationInterfaces
 * @description Gamification-specific interfaces re-exported from @austa/interfaces
 */
import {
  GamificationEventType,
  BaseGamificationEvent,
} from '@austa/interfaces/gamification/events';

// Re-export common interfaces
export {
  // Common response interfaces
  ApiResponse,
  PaginatedResponse,
  CollectionResponse,
  
  // Error interfaces
  ErrorResponse,
  ErrorCode,
  ValidationError,
  FieldError,
  
  // Model interfaces
  BaseEntity,
  Pagination,
  SortOptions,
  FilterOptions,
  
  // Utility types
  Nullable,
  Optional,
  Dictionary,
  RecordOf,
  
  // Gamification event interfaces
  GamificationEventType,
  BaseGamificationEvent,
};

/**
 * @namespace DtoUtilities
 * @description Utility types for working with DTOs
 */

/**
 * Extracts the response type from a DTO class
 * @template T - The DTO class type
 */
export type ResponseType<T> = T extends { toResponse(): infer R } ? R : never;

/**
 * Creates a partial DTO type with all properties optional
 * @template T - The DTO class type
 */
export type PartialDto<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Creates a type that picks only specific properties from a DTO
 * @template T - The DTO class type
 * @template K - The keys to pick
 */
export type PickDto<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Creates a type that omits specific properties from a DTO
 * @template T - The DTO class type
 * @template K - The keys to omit
 */
export type OmitDto<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

/**
 * Creates a readonly version of a DTO type
 * @template T - The DTO class type
 */
export type ReadonlyDto<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Creates a type for a collection of DTOs
 * @template T - The DTO class type
 */
export type DtoCollection<T> = T[];