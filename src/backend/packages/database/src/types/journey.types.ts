/**
 * Journey Types
 * 
 * This file defines TypeScript interfaces and types specific to the journey-centered
 * architecture of the AUSTA SuperApp. It provides strongly-typed definitions for
 * journey-specific database operations, ensuring that each journey (Health, Care, Plan)
 * has appropriate type constraints and database access patterns tailored to its
 * specific requirements.
 */

import { JOURNEY_IDS, JOURNEY_NAMES, JOURNEY_COLORS, JOURNEY_ICONS, JOURNEY_ROUTES } from '@app/shared/constants/journey.constants';

/**
 * Type representing valid journey IDs
 * Derived from the JOURNEY_IDS constant to ensure type safety
 */
export type JourneyId = typeof JOURNEY_IDS[keyof typeof JOURNEY_IDS];

/**
 * Interface for journey metadata that includes all journey-specific properties
 */
export interface JourneyMetadata {
  id: JourneyId;
  name: string;
  color: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  icon: string;
  route: string;
}

/**
 * Type guard to check if a string is a valid journey ID
 * @param id - The ID to check
 * @returns Boolean indicating if the ID is a valid journey ID
 */
export function isValidJourneyId(id: string): id is JourneyId {
  return Object.values(JOURNEY_IDS).includes(id as JourneyId);
}

/**
 * Interface for journey-specific database operation options
 * These options are used to customize database operations for each journey
 */
export interface JourneyDatabaseOptions {
  /** The journey ID this operation is associated with */
  journeyId: JourneyId;
  
  /** Whether to include cross-journey relationships in the results */
  includeCrossJourneyRelationships?: boolean;
  
  /** Whether to emit events to the gamification engine for this operation */
  emitGamificationEvents?: boolean;
  
  /** Custom timeout for journey-specific operations (in milliseconds) */
  timeout?: number;
  
  /** Whether to use journey-specific caching strategies */
  useJourneyCaching?: boolean;
}

/**
 * Default options for journey database operations
 */
export const DEFAULT_JOURNEY_DATABASE_OPTIONS: Omit<JourneyDatabaseOptions, 'journeyId'> = {
  includeCrossJourneyRelationships: false,
  emitGamificationEvents: true,
  useJourneyCaching: true,
};

/**
 * Interface for cross-journey relationship metadata
 * Used to define relationships between entities across different journeys
 */
export interface CrossJourneyRelationship {
  /** Source journey ID */
  sourceJourneyId: JourneyId;
  
  /** Source entity type */
  sourceEntityType: string;
  
  /** Source entity ID */
  sourceEntityId: string;
  
  /** Target journey ID */
  targetJourneyId: JourneyId;
  
  /** Target entity type */
  targetEntityType: string;
  
  /** Target entity ID */
  targetEntityId: string;
  
  /** Relationship type (e.g., 'belongs_to', 'references', etc.) */
  relationshipType: string;
  
  /** Additional metadata for the relationship */
  metadata?: Record<string, any>;
  
  /** When the relationship was created */
  createdAt: Date;
  
  /** When the relationship was last updated */
  updatedAt: Date;
}

/**
 * Base interface for journey-specific query parameters
 * Extends this interface for journey-specific query parameter types
 */
export interface BaseJourneyQueryParams {
  /** The journey ID this query is associated with */
  journeyId: JourneyId;
}

/**
 * Health journey-specific query parameters
 */
export interface HealthJourneyQueryParams extends BaseJourneyQueryParams {
  /** Ensures this is specifically for the health journey */
  journeyId: typeof JOURNEY_IDS.HEALTH;
  
  /** Filter by metric types (for health metrics) */
  metricTypes?: string[];
  
  /** Filter by time range (for time-series data) */
  timeRange?: {
    start: Date;
    end: Date;
  };
  
  /** Filter by device types (for device connections) */
  deviceTypes?: string[];
  
  /** Include goal progress in results */
  includeGoalProgress?: boolean;
}

/**
 * Care journey-specific query parameters
 */
export interface CareJourneyQueryParams extends BaseJourneyQueryParams {
  /** Ensures this is specifically for the care journey */
  journeyId: typeof JOURNEY_IDS.CARE;
  
  /** Filter by appointment status */
  appointmentStatus?: string[];
  
  /** Filter by provider types */
  providerTypes?: string[];
  
  /** Filter by date range for appointments */
  appointmentDateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Include telemedicine session data */
  includeTelemedicineSessions?: boolean;
}

/**
 * Plan journey-specific query parameters
 */
export interface PlanJourneyQueryParams extends BaseJourneyQueryParams {
  /** Ensures this is specifically for the plan journey */
  journeyId: typeof JOURNEY_IDS.PLAN;
  
  /** Filter by plan types */
  planTypes?: string[];
  
  /** Filter by claim status */
  claimStatus?: string[];
  
  /** Filter by benefit categories */
  benefitCategories?: string[];
  
  /** Include document references in results */
  includeDocuments?: boolean;
}

/**
 * Union type for all journey-specific query parameters
 */
export type JourneyQueryParams = 
  | HealthJourneyQueryParams 
  | CareJourneyQueryParams 
  | PlanJourneyQueryParams;

/**
 * Type for journey-specific database operation results
 * Includes metadata about the operation and the actual result data
 */
export interface JourneyDatabaseResult<T> {
  /** The journey ID this result is associated with */
  journeyId: JourneyId;
  
  /** The actual data returned from the operation */
  data: T;
  
  /** Metadata about the operation */
  metadata: {
    /** When the operation was executed */
    timestamp: Date;
    
    /** How long the operation took (in milliseconds) */
    executionTimeMs: number;
    
    /** Whether the result was served from cache */
    fromCache: boolean;
    
    /** Whether gamification events were emitted for this operation */
    gamificationEventsEmitted: boolean;
    
    /** Cross-journey relationships included in the result */
    crossJourneyRelationships?: CrossJourneyRelationship[];
  };
}

/**
 * Interface for journey context factory options
 * Used when creating journey-specific database contexts
 */
export interface JourneyContextFactoryOptions {
  /** The journey ID for the context being created */
  journeyId: JourneyId;
  
  /** Connection options specific to this journey */
  connectionOptions?: {
    /** Maximum number of connections for this journey */
    maxConnections?: number;
    
    /** Connection timeout in milliseconds */
    connectionTimeout?: number;
    
    /** Whether to use SSL for connections */
    useSSL?: boolean;
  };
  
  /** Caching options for this journey */
  cachingOptions?: {
    /** Whether to enable caching for this journey */
    enabled: boolean;
    
    /** Default TTL for cached items (in seconds) */
    defaultTtl: number;
    
    /** Maximum cache size (in items) */
    maxSize?: number;
  };
  
  /** Transaction options for this journey */
  transactionOptions?: {
    /** Default isolation level for transactions */
    defaultIsolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    
    /** Default timeout for transactions (in milliseconds) */
    defaultTimeout?: number;
  };
  
  /** Gamification integration options */
  gamificationOptions?: {
    /** Whether to automatically emit events to the gamification engine */
    autoEmitEvents: boolean;
    
    /** Entity types that should trigger gamification events */
    trackedEntityTypes: string[];
    
    /** Operations that should trigger gamification events */
    trackedOperations: ('create' | 'update' | 'delete' | 'read')[];
  };
}

/**
 * Default factory options for journey contexts
 */
export const DEFAULT_JOURNEY_CONTEXT_FACTORY_OPTIONS: Omit<JourneyContextFactoryOptions, 'journeyId'> = {
  connectionOptions: {
    maxConnections: 10,
    connectionTimeout: 5000,
    useSSL: true,
  },
  cachingOptions: {
    enabled: true,
    defaultTtl: 300, // 5 minutes
    maxSize: 1000,
  },
  transactionOptions: {
    defaultIsolationLevel: 'ReadCommitted',
    defaultTimeout: 5000,
  },
  gamificationOptions: {
    autoEmitEvents: true,
    trackedEntityTypes: [],
    trackedOperations: ['create', 'update'],
  },
};

/**
 * Type for journey-specific error codes
 * Each journey has its own set of error codes for specific error scenarios
 */
export type JourneyErrorCode = 
  | `HEALTH_${string}` 
  | `CARE_${string}` 
  | `PLAN_${string}` 
  | `JOURNEY_${string}`;

/**
 * Interface for journey-specific database errors
 * Extends Error with journey-specific properties
 */
export interface JourneyDatabaseError extends Error {
  /** The journey ID this error is associated with */
  journeyId: JourneyId;
  
  /** Journey-specific error code */
  code: JourneyErrorCode;
  
  /** HTTP status code equivalent for this error */
  statusCode: number;
  
  /** Whether this error is retryable */
  isRetryable: boolean;
  
  /** The original error that caused this error (if any) */
  cause?: Error;
  
  /** Additional context for debugging */
  context?: Record<string, any>;
}