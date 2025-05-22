/**
 * @file Database Utilities Index
 * @description Centralized export point for all database utility functions.
 * This barrel file provides a clean, organized interface for importing database
 * utilities across the application, supporting all three core journeys (Health, Care, Plan)
 * and ensuring compatibility with both PostgreSQL and TimescaleDB.
 * 
 * Part of the AUSTA SuperApp refactoring to address critical build failures and architectural issues.
 * This file helps standardize module resolution across the monorepo and ensures consistent
 * functionality across journey services through shared code.
 *
 * @example
 * // Import all database utilities
 * import * as DatabaseUtils from '@austa/database/utils';
 *
 * @example
 * // Import specific utilities
 * import { createPaginationOptions, mapEntityToModel } from '@austa/database/utils';
 *
 * @example
 * // Import journey-specific utilities
 * import { createHealthMetricFilter, sortAppointmentsByDate, mapPlanEntity } from '@austa/database/utils';
 *
 * @example
 * // Import database-specific utilities
 * import { createTimeseriesQuery, optimizePostgresQuery } from '@austa/database/utils';
 */

// ===================================================================
// AUSTA SuperApp Database Utilities
// ===================================================================

/**
 * This index file centralizes all database utility exports to provide a clean,
 * organized interface for importing database utilities across the application.
 * 
 * It supports the three core journeys of the AUSTA SuperApp:
 * - Health Journey ("Minha Saúde")
 * - Care Journey ("Cuidar-me Agora")
 * - Plan Journey ("Meu Plano & Benefícios")
 *
 * It also ensures compatibility with both PostgreSQL and TimescaleDB,
 * which are used for different types of data in the application.
 */

// ===================================================================
// Core Database Utilities
// ===================================================================

/**
 * Entity mapping utilities for converting between database entities and domain models
 * with support for all journey domains (Health, Care, Plan).
 */
export * from './entity-mappers.utils';

/**
 * Validation utilities for ensuring data integrity before database operations
 * using Zod schemas and class-validator integration.
 */
export * from './validation.utils';

/**
 * Batch operation utilities for efficient bulk database operations
 * with automatic chunking and transaction support.
 */
export * from './batch.utils';

/**
 * Query building utilities for constructing optimized Prisma queries
 * with support for complex conditions and relations.
 */
export * from './query-builder.utils';

/**
 * Sorting utilities for database queries with multi-field support
 * and specialized time-series sorting for TimescaleDB.
 */
export * from './sort.utils';

/**
 * Filtering utilities for constructing type-safe Prisma filters
 * with support for various operators and nested relations.
 */
export * from './filter.utils';

/**
 * Pagination utilities for standardized pagination approaches
 * including cursor-based pagination for large datasets.
 */
export * from './pagination.utils';

// ===================================================================
// Journey-Specific Utility Re-exports
// ===================================================================

/**
 * Health Journey Database Utilities
 * Specialized utilities for health metrics, goals, and device data.
 */
export {
  // Filtering utilities for Health journey
  createHealthMetricFilter,
  createHealthGoalFilter,
  createDeviceConnectionFilter,
} from './filter.utils';

export {
  // Sorting utilities for Health journey
  sortHealthMetricsByTimestamp,
  sortHealthGoalsByPriority,
} from './sort.utils';

export {
  // Pagination utilities for Health journey
  paginateHealthMetrics,
} from './pagination.utils';

export {
  // Entity mapping utilities for Health journey
  mapHealthMetricEntity,
  mapHealthGoalEntity,
  mapDeviceConnectionEntity,
} from './entity-mappers.utils';

export {
  // Validation utilities for Health journey
  validateHealthMetricInput,
  validateHealthGoalInput,
} from './validation.utils';

export {
  // Batch operation utilities for Health journey
  batchCreateHealthMetrics,
  batchUpdateHealthGoals,
} from './batch.utils';

/**
 * Care Journey Database Utilities
 * Specialized utilities for appointments, medications, and providers.
 */
export {
  // Filtering utilities for Care journey
  createAppointmentFilter,
  createMedicationFilter,
  createProviderFilter,
} from './filter.utils';

export {
  // Sorting utilities for Care journey
  sortAppointmentsByDate,
  sortMedicationsByName,
} from './sort.utils';

export {
  // Pagination utilities for Care journey
  paginateAppointments,
} from './pagination.utils';

export {
  // Entity mapping utilities for Care journey
  mapAppointmentEntity,
  mapMedicationEntity,
  mapProviderEntity,
} from './entity-mappers.utils';

export {
  // Validation utilities for Care journey
  validateAppointmentInput,
  validateMedicationInput,
} from './validation.utils';

export {
  // Batch operation utilities for Care journey
  batchCreateAppointments,
  batchUpdateMedications,
} from './batch.utils';

/**
 * Plan Journey Database Utilities
 * Specialized utilities for plans, benefits, claims, and coverage.
 */
export {
  // Filtering utilities for Plan journey
  createPlanFilter,
  createBenefitFilter,
  createClaimFilter,
} from './filter.utils';

export {
  // Sorting utilities for Plan journey
  sortPlansByName,
  sortClaimsByStatus,
} from './sort.utils';

export {
  // Pagination utilities for Plan journey
  paginatePlans,
  paginateClaims,
} from './pagination.utils';

export {
  // Entity mapping utilities for Plan journey
  mapPlanEntity,
  mapBenefitEntity,
  mapClaimEntity,
} from './entity-mappers.utils';

export {
  // Validation utilities for Plan journey
  validatePlanInput,
  validateClaimInput,
} from './validation.utils';

export {
  // Batch operation utilities for Plan journey
  batchCreateClaims,
  batchUpdateBenefits,
} from './batch.utils';

// ===================================================================
// Database-Specific Utility Re-exports
// ===================================================================

/**
 * PostgreSQL-specific utilities
 * Optimized for standard PostgreSQL operations.
 */
export {
  // Transaction utilities for PostgreSQL
  createPostgresTransaction,
} from './batch.utils';

export {
  // Query optimization utilities for PostgreSQL
  optimizePostgresQuery,
  analyzePostgresQueryPlan,
  createPostgresJsonQuery,
} from './query-builder.utils';

/**
 * TimescaleDB-specific utilities
 * Specialized for time-series data operations.
 */
export {
  // Query utilities for TimescaleDB
  createTimeseriesQuery,
  createTimeseriesAggregation,
  createTimeseriesBuckets,
  optimizeTimeseriesQuery,
} from './query-builder.utils';

export {
  // Pagination utilities for TimescaleDB
  paginateTimeseriesData,
} from './pagination.utils';

export {
  // Batch operation utilities for TimescaleDB
  batchInsertTimeseries,
} from './batch.utils';