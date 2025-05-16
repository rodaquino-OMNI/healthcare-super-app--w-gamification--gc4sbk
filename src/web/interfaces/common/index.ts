/**
 * @file Common Interfaces
 * @description Central export point for all common TypeScript interfaces in the AUSTA SuperApp.
 * 
 * This file provides a single entry point for importing common utility types, model interfaces,
 * error types, response structures, validation schemas, and status types. It simplifies imports
 * and ensures consistency across the codebase for shared interfaces that span multiple domains.
 * 
 * @example
 * // Import specific types
 * import { BaseEntity, PaginatedResponse } from '@austa/interfaces/common';
 * 
 * // Import all types from a specific category
 * import { ErrorTypes } from '@austa/interfaces/common';
 * 
 * // Import everything
 * import * as Common from '@austa/interfaces/common';
 */

// Re-export all utility types
import * as UtilityTypes from './types';
export { UtilityTypes };

// Re-export all model interfaces
import * as Models from './model';
export { Models };

// Re-export all error interfaces and types
import * as ErrorTypes from './error';
export { ErrorTypes };

// Re-export all response interfaces
import * as ResponseTypes from './response';
export { ResponseTypes };

// Re-export all validation schemas and utilities
import * as ValidationTypes from './validation';
export { ValidationTypes };

// Re-export all status enums and types
import * as StatusTypes from './status';
export { StatusTypes };

// Direct exports of commonly used types for convenience

// Utility Types
export type {
  Nullable,
  Optional,
  Maybe,
  Dictionary,
  NullableDictionary,
  OptionalDictionary,
  PartialObject,
  RequiredObject,
  ReadonlyObject,
  DeepReadonly,
  ArrayElement,
  NonEmptyArray,
  KeysOfType,
  PickByType,
  OmitByType,
  AsyncFunction,
  UnwrapPromise,
  PropertyKey,
  Constructor,
  ExactlyOne,
  AtLeast,
  UnionToIntersection,
  SingleOrArray,
  ValueOrGetter,
  OmitFunctions,
  PickFunctions,
  MaybePromise,
  PartialShallow,
  DeepPartial,
  NonNullableProperties,
  NullableProperties,
  OptionalProperties,
  MaybeProperties,
  AtLeastOne,
  ExactlyOneProperty,
  RequiredNonNullable
} from './types';

// Model Interfaces
export type {
  BaseEntity,
  UserOwned,
  Auditable,
  PaginatedResponse,
  PaginationParams,
  SortDirection,
  SortOptions,
  FilterOperator,
  FilterCondition,
  FilterOptions,
  QueryParams,
  SoftDeleteable,
  Activatable,
  Versionable,
  Taggable
} from './model';

// Error Types
export {
  ErrorCode,
  HealthErrorCode,
  CareErrorCode,
  PlanErrorCode,
  GamificationErrorCode,
  ErrorType,
  ERROR_TYPE_STATUS_MAP,
  ERROR_CATEGORY_TYPE_MAP,
  isAppError,
  isValidationError,
  isBusinessError,
  isTechnicalError,
  isExternalError,
  isJourneyError,
  isHealthError,
  isCareError,
  isPlanError,
  isGamificationError
} from './error';

export type {
  AppError,
  ValidationError,
  BusinessError,
  TechnicalError,
  ExternalError,
  HealthError,
  CareError,
  PlanError,
  GamificationError,
  ErrorOptions,
  ValidationErrorOptions
} from './error';

// Response Types
export {
  ErrorSeverity,
  ErrorCategory,
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
  isCollectionResponse,
  isValidationErrorResponse
} from './response';

export type {
  ApiResponse,
  SuccessResponse,
  PaginationMeta,
  CollectionMeta,
  PaginatedResponse as PaginatedApiResponse,
  CollectionResponse,
  ErrorDetails,
  ValidationErrorDetails,
  ErrorResponse,
  ValidationErrorResponse
} from './response';

// Validation Types
export {
  CommonValidation,
  PaginationParamsSchema,
  DateRangeParamsSchema,
  IdParamSchema,
  SearchParamsSchema,
  ValidationUtils,
  SchemaTypes,
  ValidationErrorMessages
} from './validation';

export type {
  PaginationParams as ValidationPaginationParams,
  DateRangeParams,
  IdParam,
  SearchParams
} from './validation';

// Status Types
export {
  ActiveStatus,
  ProgressStatus,
  ApprovalStatus,
  VisibilityStatus,
  ProcessStageStatus,
  HealthGoalStatus,
  DeviceConnectionStatus,
  AppointmentStatus,
  MedicationStatus,
  NotificationStatus,
  AchievementStatus,
  QuestStatus
} from './status';

export type { ClaimStatus } from './status';