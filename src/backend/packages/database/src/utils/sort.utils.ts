/**
 * @file sort.utils.ts
 * @description Provides sorting utilities for database queries, offering type-safe construction
 * of sort criteria for Prisma queries across journey services. Implements multi-field sorting
 * with direction control (ASC/DESC) and nulls handling (NULLS FIRST/LAST). Includes specialized
 * sorting for time-series data in TimescaleDB with performance optimizations.
 */

import { SortDirection, SortCriterion, SortParams, TypedSortParams } from '../types/query.types';
import { JourneyId } from '../types/journey.types';

// -----------------------------------------------------------------------------
// Core Sorting Types
// -----------------------------------------------------------------------------

/**
 * Enum for null handling in sort operations
 */
export enum NullsPosition {
  /**
   * Place null values first in the sort order
   */
  FIRST = 'nullsFirst',

  /**
   * Place null values last in the sort order
   */
  LAST = 'nullsLast'
}

/**
 * Extended sort criterion with additional options for advanced sorting
 */
export interface ExtendedSortCriterion extends SortCriterion {
  /**
   * Explicit null handling strategy
   * @default NullsPosition.LAST for ASC, NullsPosition.FIRST for DESC
   */
  nullsPosition?: NullsPosition;

  /**
   * Whether to use a database index for this sort
   * Setting to false can be useful when you know an index won't help
   * @default true
   */
  useIndex?: boolean;

  /**
   * Priority of this sort criterion when multiple fields are sorted
   * Lower numbers indicate higher priority
   * @default 0
   */
  priority?: number;

  /**
   * For time-series data, specifies the time bucket size for aggregation
   * Example: '1 hour', '1 day', '1 month'
   * Only applicable for TimescaleDB time-series data
   */
  timeBucket?: string;

  /**
   * For journey-specific sorting, indicates the journey this sort belongs to
   */
  journeyId?: JourneyId;
}

/**
 * Extended sort parameters with additional options
 */
export type ExtendedSortParams = ExtendedSortCriterion | ExtendedSortCriterion[];

/**
 * Sort strategy options for optimizing sort operations
 */
export enum SortStrategy {
  /**
   * Standard sorting using database engine's default sort implementation
   */
  STANDARD = 'standard',

  /**
   * Optimized for time-series data using TimescaleDB features
   */
  TIMESCALE = 'timescale',

  /**
   * Uses covering indexes for sort operations when available
   */
  COVERING_INDEX = 'coveringIndex',

  /**
   * Optimized for large datasets with limited memory
   */
  MEMORY_OPTIMIZED = 'memoryOptimized',

  /**
   * Uses materialized views or pre-computed sorts when available
   */
  MATERIALIZED = 'materialized'
}

/**
 * Configuration options for sort operations
 */
export interface SortOptions {
  /**
   * The sort strategy to use
   * @default SortStrategy.STANDARD
   */
  strategy?: SortStrategy;

  /**
   * Whether to use case-insensitive sorting for string fields
   * @default false
   */
  caseInsensitive?: boolean;

  /**
   * Default nulls position when not specified in individual criteria
   * @default NullsPosition.LAST
   */
  defaultNullsPosition?: NullsPosition;

  /**
   * Maximum number of sort fields to use
   * Useful for limiting complex sorts that might impact performance
   * @default No limit
   */
  maxSortFields?: number;

  /**
   * For time-series data, specifies the default time bucket size
   * Example: '1 hour', '1 day', '1 month'
   */
  defaultTimeBucket?: string;

  /**
   * Journey ID for journey-specific sort optimizations
   */
  journeyId?: JourneyId;
}

// -----------------------------------------------------------------------------
// Prisma Sort Utilities
// -----------------------------------------------------------------------------

/**
 * Converts a SortDirection to a Prisma-compatible sort direction
 * 
 * @param direction The sort direction
 * @returns Prisma-compatible sort direction ('asc' or 'desc')
 */
export function toPrismaSortDirection(direction: SortDirection = SortDirection.ASC): 'asc' | 'desc' {
  return direction.toLowerCase() as 'asc' | 'desc';
}

/**
 * Converts NullsPosition to a Prisma-compatible nulls position
 * 
 * @param position The nulls position
 * @param direction The sort direction (used for default nulls position)
 * @returns Prisma-compatible nulls position ('first' or 'last')
 */
export function toPrismaNullsPosition(
  position?: NullsPosition,
  direction: SortDirection = SortDirection.ASC
): 'first' | 'last' {
  // If position is explicitly provided, use it
  if (position === NullsPosition.FIRST) return 'first';
  if (position === NullsPosition.LAST) return 'last';

  // Default behavior: nulls last for ASC, nulls first for DESC
  return direction === SortDirection.ASC ? 'last' : 'first';
}

/**
 * Creates a Prisma-compatible sort object from sort criteria
 * 
 * @param sortParams The sort parameters to convert
 * @param options Additional sort options
 * @returns A Prisma-compatible sort object
 */
export function createPrismaSort<T>(
  sortParams: SortParams | ExtendedSortParams | TypedSortParams<T>,
  options: SortOptions = {}
): Record<string, any> {
  // Handle empty sort params
  if (!sortParams) return {};

  // Convert single criterion to array for consistent handling
  const criteria = Array.isArray(sortParams) ? sortParams : [sortParams];

  // Apply max sort fields limit if specified
  const limitedCriteria = options.maxSortFields
    ? criteria.slice(0, options.maxSortFields)
    : criteria;

  // Sort by priority if available (for ExtendedSortCriterion)
  const prioritizedCriteria = limitedCriteria.sort((a, b) => {
    const aPriority = (a as ExtendedSortCriterion).priority ?? 0;
    const bPriority = (b as ExtendedSortCriterion).priority ?? 0;
    return aPriority - bPriority;
  });

  // Build the Prisma sort object
  const result: Record<string, any> = {};

  for (const criterion of prioritizedCriteria) {
    // Handle TypedSortParams format
    if (typeof criterion === 'object' && !('field' in criterion)) {
      // TypedSortParams format: { fieldName: SortDirection | { direction, nullsFirst, ... } }
      for (const [field, value] of Object.entries(criterion)) {
        if (typeof value === 'string') {
          // Simple format: { fieldName: 'asc' | 'desc' }
          result[field] = toPrismaSortDirection(value as SortDirection);
        } else if (typeof value === 'object') {
          // Extended format: { fieldName: { direction, nullsFirst, ... } }
          const direction = value.direction ?? SortDirection.ASC;
          const nullsPosition = value.nullsFirst === true
            ? NullsPosition.FIRST
            : value.nullsFirst === false
              ? NullsPosition.LAST
              : options.defaultNullsPosition;

          result[field] = {
            sort: toPrismaSortDirection(direction),
            nulls: toPrismaNullsPosition(nullsPosition, direction)
          };

          // Add case insensitivity if specified
          if (value.caseInsensitive || options.caseInsensitive) {
            result[field].mode = 'insensitive';
          }
        }
      }
    } else {
      // Standard SortCriterion or ExtendedSortCriterion format
      const { field, direction = SortDirection.ASC } = criterion as SortCriterion;
      const extendedCriterion = criterion as ExtendedSortCriterion;
      const nullsPosition = extendedCriterion.nullsPosition ?? options.defaultNullsPosition;

      result[field] = {
        sort: toPrismaSortDirection(direction),
        nulls: toPrismaNullsPosition(nullsPosition, direction)
      };

      // Add case insensitivity if specified
      if (extendedCriterion.caseInsensitive || options.caseInsensitive) {
        result[field].mode = 'insensitive';
      }
    }
  }

  return result;
}

/**
 * Creates a sort object for a specific field
 * 
 * @param field The field to sort by
 * @param direction The sort direction
 * @param nullsPosition The nulls position
 * @param caseInsensitive Whether to use case-insensitive sorting
 * @returns A sort criterion object
 */
export function sortBy(
  field: string,
  direction: SortDirection = SortDirection.ASC,
  nullsPosition?: NullsPosition,
  caseInsensitive: boolean = false
): ExtendedSortCriterion {
  return {
    field,
    direction,
    nullsPosition,
    caseInsensitive
  };
}

/**
 * Creates an ascending sort for a field
 * 
 * @param field The field to sort by
 * @param nullsPosition The nulls position
 * @param caseInsensitive Whether to use case-insensitive sorting
 * @returns A sort criterion object with ascending direction
 */
export function sortAsc(
  field: string,
  nullsPosition: NullsPosition = NullsPosition.LAST,
  caseInsensitive: boolean = false
): ExtendedSortCriterion {
  return sortBy(field, SortDirection.ASC, nullsPosition, caseInsensitive);
}

/**
 * Creates a descending sort for a field
 * 
 * @param field The field to sort by
 * @param nullsPosition The nulls position
 * @param caseInsensitive Whether to use case-insensitive sorting
 * @returns A sort criterion object with descending direction
 */
export function sortDesc(
  field: string,
  nullsPosition: NullsPosition = NullsPosition.FIRST,
  caseInsensitive: boolean = false
): ExtendedSortCriterion {
  return sortBy(field, SortDirection.DESC, nullsPosition, caseInsensitive);
}

/**
 * Combines multiple sort criteria into a single sort parameter
 * 
 * @param criteria The sort criteria to combine
 * @returns Combined sort parameters
 */
export function combineSorts(
  ...criteria: (ExtendedSortCriterion | ExtendedSortCriterion[])[]
): ExtendedSortCriterion[] {
  return criteria.flatMap(criterion => 
    Array.isArray(criterion) ? criterion : [criterion]
  );
}

// -----------------------------------------------------------------------------
// TimescaleDB Sorting Utilities
// -----------------------------------------------------------------------------

/**
 * Creates a sort criterion optimized for TimescaleDB time-series data
 * 
 * @param timeField The timestamp field to sort by
 * @param direction The sort direction
 * @param timeBucket Optional time bucket for aggregation (e.g., '1 hour', '1 day')
 * @returns A sort criterion optimized for time-series data
 */
export function timeSeriesSort(
  timeField: string,
  direction: SortDirection = SortDirection.DESC,
  timeBucket?: string
): ExtendedSortCriterion {
  return {
    field: timeField,
    direction,
    nullsPosition: direction === SortDirection.ASC ? NullsPosition.LAST : NullsPosition.FIRST,
    timeBucket,
    priority: 0, // Time field typically has highest priority
    useIndex: true // Time-series data should use indexes
  };
}

/**
 * Creates a sort criterion for TimescaleDB with time bucketing
 * 
 * @param timeField The timestamp field to sort by
 * @param timeBucket Time bucket size (e.g., '1 hour', '1 day', '1 month')
 * @param direction The sort direction
 * @returns A sort criterion with time bucketing
 */
export function timeBucketSort(
  timeField: string,
  timeBucket: string,
  direction: SortDirection = SortDirection.DESC
): ExtendedSortCriterion {
  return timeSeriesSort(timeField, direction, timeBucket);
}

/**
 * Creates a sort criterion for the most recent time-series data
 * 
 * @param timeField The timestamp field to sort by
 * @returns A sort criterion for most recent data first
 */
export function mostRecentSort(timeField: string): ExtendedSortCriterion {
  return timeSeriesSort(timeField, SortDirection.DESC);
}

/**
 * Creates a sort criterion for the oldest time-series data
 * 
 * @param timeField The timestamp field to sort by
 * @returns A sort criterion for oldest data first
 */
export function oldestSort(timeField: string): ExtendedSortCriterion {
  return timeSeriesSort(timeField, SortDirection.ASC);
}

// -----------------------------------------------------------------------------
// Journey-Specific Sort Presets
// -----------------------------------------------------------------------------

/**
 * Health journey sort presets for common query patterns
 */
export const HealthSortPresets = {
  /**
   * Sort health metrics by timestamp (newest first)
   */
  metricsByTimestampDesc: (): ExtendedSortCriterion[] => [
    timeSeriesSort('timestamp', SortDirection.DESC),
    sortBy('metricType', SortDirection.ASC)
  ],

  /**
   * Sort health metrics by timestamp (oldest first)
   */
  metricsByTimestampAsc: (): ExtendedSortCriterion[] => [
    timeSeriesSort('timestamp', SortDirection.ASC),
    sortBy('metricType', SortDirection.ASC)
  ],

  /**
   * Sort health metrics by type and timestamp
   */
  metricsByTypeAndTimestamp: (): ExtendedSortCriterion[] => [
    sortBy('metricType', SortDirection.ASC),
    timeSeriesSort('timestamp', SortDirection.DESC)
  ],

  /**
   * Sort health goals by progress (highest first)
   */
  goalsByProgressDesc: (): ExtendedSortCriterion[] => [
    sortBy('progress', SortDirection.DESC, NullsPosition.LAST),
    sortBy('targetDate', SortDirection.ASC)
  ],

  /**
   * Sort health goals by target date (soonest first)
   */
  goalsByTargetDate: (): ExtendedSortCriterion[] => [
    sortBy('targetDate', SortDirection.ASC, NullsPosition.LAST),
    sortBy('progress', SortDirection.DESC)
  ],

  /**
   * Sort device connections by last sync time (most recent first)
   */
  devicesByLastSync: (): ExtendedSortCriterion[] => [
    timeSeriesSort('lastSyncTime', SortDirection.DESC),
    sortBy('deviceName', SortDirection.ASC, undefined, true)
  ]
};

/**
 * Care journey sort presets for common query patterns
 */
export const CareSortPresets = {
  /**
   * Sort appointments by date (upcoming first)
   */
  upcomingAppointments: (): ExtendedSortCriterion[] => [
    sortBy('appointmentDate', SortDirection.ASC, NullsPosition.LAST),
    sortBy('appointmentTime', SortDirection.ASC, NullsPosition.LAST)
  ],

  /**
   * Sort appointments by date (past first)
   */
  pastAppointments: (): ExtendedSortCriterion[] => [
    sortBy('appointmentDate', SortDirection.DESC, NullsPosition.LAST),
    sortBy('appointmentTime', SortDirection.DESC, NullsPosition.LAST)
  ],

  /**
   * Sort providers by rating (highest first)
   */
  providersByRating: (): ExtendedSortCriterion[] => [
    sortBy('rating', SortDirection.DESC, NullsPosition.LAST),
    sortBy('reviewCount', SortDirection.DESC, NullsPosition.LAST),
    sortBy('name', SortDirection.ASC, undefined, true)
  ],

  /**
   * Sort medications by next dose time (soonest first)
   */
  medicationsByNextDose: (): ExtendedSortCriterion[] => [
    sortBy('nextDoseTime', SortDirection.ASC, NullsPosition.LAST),
    sortBy('name', SortDirection.ASC, undefined, true)
  ],

  /**
   * Sort treatments by start date (most recent first)
   */
  treatmentsByStartDate: (): ExtendedSortCriterion[] => [
    sortBy('startDate', SortDirection.DESC, NullsPosition.LAST),
    sortBy('name', SortDirection.ASC, undefined, true)
  ]
};

/**
 * Plan journey sort presets for common query patterns
 */
export const PlanSortPresets = {
  /**
   * Sort claims by submission date (most recent first)
   */
  claimsBySubmissionDate: (): ExtendedSortCriterion[] => [
    timeSeriesSort('submissionDate', SortDirection.DESC),
    sortBy('status', SortDirection.ASC)
  ],

  /**
   * Sort claims by status and submission date
   */
  claimsByStatusAndDate: (): ExtendedSortCriterion[] => [
    sortBy('status', SortDirection.ASC),
    timeSeriesSort('submissionDate', SortDirection.DESC)
  ],

  /**
   * Sort benefits by utilization (highest first)
   */
  benefitsByUtilization: (): ExtendedSortCriterion[] => [
    sortBy('utilizationPercentage', SortDirection.DESC, NullsPosition.LAST),
    sortBy('name', SortDirection.ASC, undefined, true)
  ],

  /**
   * Sort plans by coverage level (highest first)
   */
  plansByCoverage: (): ExtendedSortCriterion[] => [
    sortBy('coverageLevel', SortDirection.DESC, NullsPosition.LAST),
    sortBy('monthlyCost', SortDirection.ASC, NullsPosition.LAST),
    sortBy('name', SortDirection.ASC, undefined, true)
  ],

  /**
   * Sort documents by upload date (most recent first)
   */
  documentsByUploadDate: (): ExtendedSortCriterion[] => [
    timeSeriesSort('uploadDate', SortDirection.DESC),
    sortBy('documentType', SortDirection.ASC),
    sortBy('name', SortDirection.ASC, undefined, true)
  ]
};

/**
 * Gamification journey sort presets for common query patterns
 */
export const GamificationSortPresets = {
  /**
   * Sort achievements by unlock date (most recent first)
   */
  achievementsByUnlockDate: (): ExtendedSortCriterion[] => [
    timeSeriesSort('unlockedAt', SortDirection.DESC),
    sortBy('name', SortDirection.ASC, undefined, true)
  ],

  /**
   * Sort achievements by rarity (rarest first)
   */
  achievementsByRarity: (): ExtendedSortCriterion[] => [
    sortBy('rarity', SortDirection.ASC, NullsPosition.LAST),
    sortBy('name', SortDirection.ASC, undefined, true)
  ],

  /**
   * Sort leaderboard entries by score (highest first)
   */
  leaderboardByScore: (): ExtendedSortCriterion[] => [
    sortBy('score', SortDirection.DESC, NullsPosition.LAST),
    timeSeriesSort('lastUpdated', SortDirection.DESC)
  ],

  /**
   * Sort quests by completion percentage (highest first)
   */
  questsByCompletion: (): ExtendedSortCriterion[] => [
    sortBy('completionPercentage', SortDirection.DESC, NullsPosition.LAST),
    sortBy('expiresAt', SortDirection.ASC, NullsPosition.LAST),
    sortBy('name', SortDirection.ASC, undefined, true)
  ],

  /**
   * Sort rewards by redemption date (most recent first)
   */
  rewardsByRedemptionDate: (): ExtendedSortCriterion[] => [
    timeSeriesSort('redeemedAt', SortDirection.DESC),
    sortBy('name', SortDirection.ASC, undefined, true)
  ]
};

// -----------------------------------------------------------------------------
// Sort Strategy Optimization
// -----------------------------------------------------------------------------

/**
 * Determines the optimal sort strategy based on sort criteria and options
 * 
 * @param sortParams The sort parameters
 * @param options Additional sort options
 * @returns The optimal sort strategy
 */
export function determineSortStrategy(
  sortParams: SortParams | ExtendedSortParams,
  options: SortOptions = {}
): SortStrategy {
  // If strategy is explicitly specified, use it
  if (options.strategy) return options.strategy;

  // Convert single criterion to array for consistent handling
  const criteria = Array.isArray(sortParams) ? sortParams : [sortParams];

  // Check for time-series data
  const hasTimeBucket = criteria.some(criterion => 
    (criterion as ExtendedSortCriterion).timeBucket !== undefined
  );
  const hasTimeField = criteria.some(criterion => 
    ['timestamp', 'createdAt', 'updatedAt', 'date', 'time', 'datetime'].includes((criterion as SortCriterion).field)
  );

  if (hasTimeBucket || (hasTimeField && options.defaultTimeBucket)) {
    return SortStrategy.TIMESCALE;
  }

  // For large datasets, use memory optimization
  if (criteria.length > 3) {
    return SortStrategy.MEMORY_OPTIMIZED;
  }

  // Default to standard strategy
  return SortStrategy.STANDARD;
}

/**
 * Applies sort strategy optimizations to sort parameters
 * 
 * @param sortParams The sort parameters to optimize
 * @param options Additional sort options
 * @returns Optimized sort parameters
 */
export function optimizeSortParams(
  sortParams: SortParams | ExtendedSortParams,
  options: SortOptions = {}
): ExtendedSortParams {
  // Determine the optimal strategy if not specified
  const strategy = options.strategy || determineSortStrategy(sortParams, options);
  
  // Convert single criterion to array for consistent handling
  const criteria = Array.isArray(sortParams) ? sortParams : [sortParams];
  
  // Apply strategy-specific optimizations
  switch (strategy) {
    case SortStrategy.TIMESCALE:
      return optimizeTimescaleSort(criteria, options);
    
    case SortStrategy.MEMORY_OPTIMIZED:
      return optimizeMemorySort(criteria, options);
    
    case SortStrategy.COVERING_INDEX:
      return optimizeCoveringIndexSort(criteria, options);
    
    case SortStrategy.MATERIALIZED:
      return optimizeMaterializedSort(criteria, options);
    
    case SortStrategy.STANDARD:
    default:
      return criteria as ExtendedSortParams;
  }
}

/**
 * Optimizes sort parameters for TimescaleDB time-series data
 * 
 * @param criteria The sort criteria to optimize
 * @param options Additional sort options
 * @returns Optimized sort parameters for TimescaleDB
 */
function optimizeTimescaleSort(
  criteria: (SortCriterion | ExtendedSortCriterion)[],
  options: SortOptions
): ExtendedSortCriterion[] {
  return criteria.map(criterion => {
    const extendedCriterion = criterion as ExtendedSortCriterion;
    const field = extendedCriterion.field;
    
    // Apply time bucket if not already specified
    if (
      ['timestamp', 'createdAt', 'updatedAt', 'date', 'time', 'datetime'].includes(field) &&
      !extendedCriterion.timeBucket &&
      options.defaultTimeBucket
    ) {
      return {
        ...extendedCriterion,
        timeBucket: options.defaultTimeBucket,
        useIndex: true
      };
    }
    
    return extendedCriterion;
  });
}

/**
 * Optimizes sort parameters for memory-constrained environments
 * 
 * @param criteria The sort criteria to optimize
 * @param options Additional sort options
 * @returns Optimized sort parameters for memory efficiency
 */
function optimizeMemorySort(
  criteria: (SortCriterion | ExtendedSortCriterion)[],
  options: SortOptions
): ExtendedSortCriterion[] {
  // Limit the number of sort fields to reduce memory usage
  const maxFields = options.maxSortFields || 3;
  return criteria.slice(0, maxFields).map(criterion => {
    const extendedCriterion = criterion as ExtendedSortCriterion;
    return {
      ...extendedCriterion,
      useIndex: true // Prefer index usage for memory efficiency
    };
  });
}

/**
 * Optimizes sort parameters to use covering indexes when possible
 * 
 * @param criteria The sort criteria to optimize
 * @param options Additional sort options
 * @returns Optimized sort parameters for covering indexes
 */
function optimizeCoveringIndexSort(
  criteria: (SortCriterion | ExtendedSortCriterion)[],
  options: SortOptions
): ExtendedSortCriterion[] {
  // This is a simplified implementation
  // In a real-world scenario, this would use database metadata to identify covering indexes
  return criteria.map(criterion => {
    const extendedCriterion = criterion as ExtendedSortCriterion;
    return {
      ...extendedCriterion,
      useIndex: true
    };
  });
}

/**
 * Optimizes sort parameters to use materialized views when possible
 * 
 * @param criteria The sort criteria to optimize
 * @param options Additional sort options
 * @returns Optimized sort parameters for materialized views
 */
function optimizeMaterializedSort(
  criteria: (SortCriterion | ExtendedSortCriterion)[],
  options: SortOptions
): ExtendedSortCriterion[] {
  // This is a simplified implementation
  // In a real-world scenario, this would use database metadata to identify materialized views
  return criteria.map(criterion => {
    const extendedCriterion = criterion as ExtendedSortCriterion;
    return {
      ...extendedCriterion,
      useIndex: true
    };
  });
}

// -----------------------------------------------------------------------------
// Journey-Specific Sort Utilities
// -----------------------------------------------------------------------------

/**
 * Creates journey-specific sort parameters based on journey ID
 * 
 * @param journeyId The journey ID
 * @param sortType The type of sort to create
 * @param customOptions Additional sort options
 * @returns Journey-specific sort parameters
 */
export function createJourneySort(
  journeyId: JourneyId,
  sortType: string,
  customOptions: SortOptions = {}
): ExtendedSortParams {
  const options = { ...customOptions, journeyId };
  
  switch (journeyId) {
    case 'health':
      return createHealthSort(sortType, options);
    
    case 'care':
      return createCareSort(sortType, options);
    
    case 'plan':
      return createPlanSort(sortType, options);
    
    default:
      throw new Error(`Unknown journey ID: ${journeyId}`);
  }
}

/**
 * Creates health journey-specific sort parameters
 * 
 * @param sortType The type of health sort to create
 * @param options Additional sort options
 * @returns Health journey-specific sort parameters
 */
export function createHealthSort(
  sortType: string,
  options: SortOptions = {}
): ExtendedSortParams {
  switch (sortType) {
    case 'metricsByTimestampDesc':
      return optimizeSortParams(HealthSortPresets.metricsByTimestampDesc(), options);
    
    case 'metricsByTimestampAsc':
      return optimizeSortParams(HealthSortPresets.metricsByTimestampAsc(), options);
    
    case 'metricsByTypeAndTimestamp':
      return optimizeSortParams(HealthSortPresets.metricsByTypeAndTimestamp(), options);
    
    case 'goalsByProgressDesc':
      return optimizeSortParams(HealthSortPresets.goalsByProgressDesc(), options);
    
    case 'goalsByTargetDate':
      return optimizeSortParams(HealthSortPresets.goalsByTargetDate(), options);
    
    case 'devicesByLastSync':
      return optimizeSortParams(HealthSortPresets.devicesByLastSync(), options);
    
    default:
      throw new Error(`Unknown health sort type: ${sortType}`);
  }
}

/**
 * Creates care journey-specific sort parameters
 * 
 * @param sortType The type of care sort to create
 * @param options Additional sort options
 * @returns Care journey-specific sort parameters
 */
export function createCareSort(
  sortType: string,
  options: SortOptions = {}
): ExtendedSortParams {
  switch (sortType) {
    case 'upcomingAppointments':
      return optimizeSortParams(CareSortPresets.upcomingAppointments(), options);
    
    case 'pastAppointments':
      return optimizeSortParams(CareSortPresets.pastAppointments(), options);
    
    case 'providersByRating':
      return optimizeSortParams(CareSortPresets.providersByRating(), options);
    
    case 'medicationsByNextDose':
      return optimizeSortParams(CareSortPresets.medicationsByNextDose(), options);
    
    case 'treatmentsByStartDate':
      return optimizeSortParams(CareSortPresets.treatmentsByStartDate(), options);
    
    default:
      throw new Error(`Unknown care sort type: ${sortType}`);
  }
}

/**
 * Creates plan journey-specific sort parameters
 * 
 * @param sortType The type of plan sort to create
 * @param options Additional sort options
 * @returns Plan journey-specific sort parameters
 */
export function createPlanSort(
  sortType: string,
  options: SortOptions = {}
): ExtendedSortParams {
  switch (sortType) {
    case 'claimsBySubmissionDate':
      return optimizeSortParams(PlanSortPresets.claimsBySubmissionDate(), options);
    
    case 'claimsByStatusAndDate':
      return optimizeSortParams(PlanSortPresets.claimsByStatusAndDate(), options);
    
    case 'benefitsByUtilization':
      return optimizeSortParams(PlanSortPresets.benefitsByUtilization(), options);
    
    case 'plansByCoverage':
      return optimizeSortParams(PlanSortPresets.plansByCoverage(), options);
    
    case 'documentsByUploadDate':
      return optimizeSortParams(PlanSortPresets.documentsByUploadDate(), options);
    
    default:
      throw new Error(`Unknown plan sort type: ${sortType}`);
  }
}

/**
 * Creates gamification-specific sort parameters
 * 
 * @param sortType The type of gamification sort to create
 * @param options Additional sort options
 * @returns Gamification-specific sort parameters
 */
export function createGamificationSort(
  sortType: string,
  options: SortOptions = {}
): ExtendedSortParams {
  switch (sortType) {
    case 'achievementsByUnlockDate':
      return optimizeSortParams(GamificationSortPresets.achievementsByUnlockDate(), options);
    
    case 'achievementsByRarity':
      return optimizeSortParams(GamificationSortPresets.achievementsByRarity(), options);
    
    case 'leaderboardByScore':
      return optimizeSortParams(GamificationSortPresets.leaderboardByScore(), options);
    
    case 'questsByCompletion':
      return optimizeSortParams(GamificationSortPresets.questsByCompletion(), options);
    
    case 'rewardsByRedemptionDate':
      return optimizeSortParams(GamificationSortPresets.rewardsByRedemptionDate(), options);
    
    default:
      throw new Error(`Unknown gamification sort type: ${sortType}`);
  }
}