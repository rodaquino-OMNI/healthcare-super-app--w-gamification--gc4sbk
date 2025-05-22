/**
 * Journey Types
 * 
 * This file defines TypeScript interfaces and types specific to the journey-centered architecture
 * of the AUSTA SuperApp. It provides strongly-typed definitions for journey-specific database
 * operations, ensuring that each journey (Health, Care, Plan) has appropriate type constraints
 * and database access patterns tailored to its specific requirements.
 */

import { JOURNEY_IDS, JOURNEY_NAMES, JOURNEY_COLORS, JOURNEY_ICONS, JOURNEY_ROUTES } from '../../../shared/src/constants/journey.constants';
import { DatabaseErrorType } from '../errors/database-error.types';

/**
 * Valid journey IDs type derived from the JOURNEY_IDS constant
 * This ensures type safety when specifying journey IDs throughout the application
 */
export type JourneyId = typeof JOURNEY_IDS[keyof typeof JOURNEY_IDS];

/**
 * Journey metadata interface that includes all journey-specific properties
 * Used for journey context initialization and configuration
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
 * Journey context configuration interface
 * Provides configuration options for journey-specific database contexts
 */
export interface JourneyContextConfig {
  /**
   * Journey ID for this context
   */
  journeyId: JourneyId;
  
  /**
   * Maximum number of concurrent connections for this journey
   * @default 10
   */
  maxConnections?: number;
  
  /**
   * Enable query logging for this journey context
   * @default false in production, true in development
   */
  enableLogging?: boolean;
  
  /**
   * Transaction timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  transactionTimeout?: number;
  
  /**
   * Error types that should be automatically retried
   * @default [DatabaseErrorType.CONNECTION, DatabaseErrorType.TRANSACTION]
   */
  retryableErrorTypes?: DatabaseErrorType[];
  
  /**
   * Maximum number of retry attempts for retryable errors
   * @default 3
   */
  maxRetryAttempts?: number;
}

/**
 * Base interface for all journey-specific database operations
 * Provides common methods that all journey contexts must implement
 */
export interface JourneyDatabaseOperations {
  /**
   * Get the journey ID associated with this context
   */
  getJourneyId(): JourneyId;
  
  /**
   * Get the journey metadata associated with this context
   */
  getJourneyMetadata(): JourneyMetadata;
  
  /**
   * Check if an entity belongs to this journey
   * @param entityId ID of the entity to check
   * @param entityType Type of the entity to check
   */
  belongsToJourney(entityId: string, entityType: string): Promise<boolean>;
  
  /**
   * Get the configuration for this journey context
   */
  getConfig(): JourneyContextConfig;
}

/**
 * Cross-journey relationship type
 * Defines a relationship between entities from different journeys
 */
export interface CrossJourneyRelationship {
  /**
   * Source journey ID
   */
  sourceJourneyId: JourneyId;
  
  /**
   * Source entity ID
   */
  sourceEntityId: string;
  
  /**
   * Source entity type
   */
  sourceEntityType: string;
  
  /**
   * Target journey ID
   */
  targetJourneyId: JourneyId;
  
  /**
   * Target entity ID
   */
  targetEntityId: string;
  
  /**
   * Target entity type
   */
  targetEntityType: string;
  
  /**
   * Relationship type
   */
  relationshipType: string;
  
  /**
   * Metadata for the relationship
   */
  metadata?: Record<string, any>;
  
  /**
   * Created at timestamp
   */
  createdAt: Date;
  
  /**
   * Updated at timestamp
   */
  updatedAt: Date;
}

/**
 * Base query parameters interface for journey-specific queries
 * Extends standard query parameters with journey-specific fields
 */
export interface JourneyQueryParams {
  /**
   * Journey ID to filter by
   */
  journeyId?: JourneyId;
  
  /**
   * User ID to filter by
   */
  userId?: string;
  
  /**
   * Include entities from related journeys
   * @default false
   */
  includeRelatedJourneys?: boolean;
  
  /**
   * Related journey IDs to include
   * Only used if includeRelatedJourneys is true
   */
  relatedJourneyIds?: JourneyId[];
}

/**
 * Health journey specific query parameters
 * Extends the base journey query parameters with health-specific fields
 */
export interface HealthJourneyQueryParams extends JourneyQueryParams {
  /**
   * Metric types to filter by
   */
  metricTypes?: string[];
  
  /**
   * Date range start for time-series data
   */
  dateRangeStart?: Date;
  
  /**
   * Date range end for time-series data
   */
  dateRangeEnd?: Date;
  
  /**
   * Device IDs to filter by
   */
  deviceIds?: string[];
  
  /**
   * Goal types to filter by
   */
  goalTypes?: string[];
  
  /**
   * Goal status to filter by
   */
  goalStatus?: string[];
}

/**
 * Care journey specific query parameters
 * Extends the base journey query parameters with care-specific fields
 */
export interface CareJourneyQueryParams extends JourneyQueryParams {
  /**
   * Provider IDs to filter by
   */
  providerIds?: string[];
  
  /**
   * Appointment status to filter by
   */
  appointmentStatus?: string[];
  
  /**
   * Date range start for appointments
   */
  appointmentDateStart?: Date;
  
  /**
   * Date range end for appointments
   */
  appointmentDateEnd?: Date;
  
  /**
   * Medication IDs to filter by
   */
  medicationIds?: string[];
  
  /**
   * Treatment IDs to filter by
   */
  treatmentIds?: string[];
}

/**
 * Plan journey specific query parameters
 * Extends the base journey query parameters with plan-specific fields
 */
export interface PlanJourneyQueryParams extends JourneyQueryParams {
  /**
   * Plan IDs to filter by
   */
  planIds?: string[];
  
  /**
   * Benefit IDs to filter by
   */
  benefitIds?: string[];
  
  /**
   * Claim status to filter by
   */
  claimStatus?: string[];
  
  /**
   * Date range start for claims
   */
  claimDateStart?: Date;
  
  /**
   * Date range end for claims
   */
  claimDateEnd?: Date;
  
  /**
   * Document types to filter by
   */
  documentTypes?: string[];
}

/**
 * Journey-specific database operations for the Health journey
 * Extends the base journey database operations with health-specific methods
 */
export interface HealthJourneyDatabaseOperations extends JourneyDatabaseOperations {
  /**
   * Find health metrics with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering health metrics
   */
  findHealthMetrics(params: HealthJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find health goals with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering health goals
   */
  findHealthGoals(params: HealthJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find device connections with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering device connections
   */
  findDeviceConnections(params: HealthJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find medical events with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering medical events
   */
  findMedicalEvents(params: HealthJourneyQueryParams): Promise<any[]>;
  
  /**
   * Create a new health metric
   * @param data Health metric data
   * @param userId User ID
   */
  createHealthMetric(data: any, userId: string): Promise<any>;
  
  /**
   * Create a new health goal
   * @param data Health goal data
   * @param userId User ID
   */
  createHealthGoal(data: any, userId: string): Promise<any>;
  
  /**
   * Update a health goal
   * @param goalId Goal ID
   * @param data Updated goal data
   * @param userId User ID
   */
  updateHealthGoal(goalId: string, data: any, userId: string): Promise<any>;
  
  /**
   * Connect a device to a user's account
   * @param data Device connection data
   * @param userId User ID
   */
  connectDevice(data: any, userId: string): Promise<any>;
  
  /**
   * Disconnect a device from a user's account
   * @param deviceId Device ID
   * @param userId User ID
   */
  disconnectDevice(deviceId: string, userId: string): Promise<boolean>;
}

/**
 * Journey-specific database operations for the Care journey
 * Extends the base journey database operations with care-specific methods
 */
export interface CareJourneyDatabaseOperations extends JourneyDatabaseOperations {
  /**
   * Find appointments with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering appointments
   */
  findAppointments(params: CareJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find providers with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering providers
   */
  findProviders(params: CareJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find medications with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering medications
   */
  findMedications(params: CareJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find treatments with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering treatments
   */
  findTreatments(params: CareJourneyQueryParams): Promise<any[]>;
  
  /**
   * Create a new appointment
   * @param data Appointment data
   * @param userId User ID
   */
  createAppointment(data: any, userId: string): Promise<any>;
  
  /**
   * Update an appointment
   * @param appointmentId Appointment ID
   * @param data Updated appointment data
   * @param userId User ID
   */
  updateAppointment(appointmentId: string, data: any, userId: string): Promise<any>;
  
  /**
   * Cancel an appointment
   * @param appointmentId Appointment ID
   * @param reason Cancellation reason
   * @param userId User ID
   */
  cancelAppointment(appointmentId: string, reason: string, userId: string): Promise<boolean>;
  
  /**
   * Add a medication to a user's profile
   * @param data Medication data
   * @param userId User ID
   */
  addMedication(data: any, userId: string): Promise<any>;
  
  /**
   * Update a medication
   * @param medicationId Medication ID
   * @param data Updated medication data
   * @param userId User ID
   */
  updateMedication(medicationId: string, data: any, userId: string): Promise<any>;
  
  /**
   * Record medication adherence
   * @param medicationId Medication ID
   * @param data Adherence data
   * @param userId User ID
   */
  recordMedicationAdherence(medicationId: string, data: any, userId: string): Promise<any>;
}

/**
 * Journey-specific database operations for the Plan journey
 * Extends the base journey database operations with plan-specific methods
 */
export interface PlanJourneyDatabaseOperations extends JourneyDatabaseOperations {
  /**
   * Find plans with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering plans
   */
  findPlans(params: PlanJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find benefits with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering benefits
   */
  findBenefits(params: PlanJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find claims with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering claims
   */
  findClaims(params: PlanJourneyQueryParams): Promise<any[]>;
  
  /**
   * Find documents with optional filtering, sorting, and pagination
   * @param params Query parameters for filtering documents
   */
  findDocuments(params: PlanJourneyQueryParams): Promise<any[]>;
  
  /**
   * Get plan details
   * @param planId Plan ID
   * @param userId User ID
   */
  getPlanDetails(planId: string, userId: string): Promise<any>;
  
  /**
   * Submit a new claim
   * @param data Claim data
   * @param userId User ID
   */
  submitClaim(data: any, userId: string): Promise<any>;
  
  /**
   * Update a claim
   * @param claimId Claim ID
   * @param data Updated claim data
   * @param userId User ID
   */
  updateClaim(claimId: string, data: any, userId: string): Promise<any>;
  
  /**
   * Upload a document
   * @param data Document data
   * @param userId User ID
   */
  uploadDocument(data: any, userId: string): Promise<any>;
  
  /**
   * Get coverage information
   * @param planId Plan ID
   * @param userId User ID
   */
  getCoverageInfo(planId: string, userId: string): Promise<any>;
}

/**
 * Journey-specific gamification event interface
 * Defines the structure of events sent to the gamification engine
 */
export interface JourneyGamificationEvent {
  /**
   * Event type
   */
  eventType: string;
  
  /**
   * Journey ID where the event originated
   */
  journeyId: JourneyId;
  
  /**
   * User ID associated with the event
   */
  userId: string;
  
  /**
   * Timestamp when the event occurred
   */
  timestamp: Date;
  
  /**
   * Entity ID associated with the event (if applicable)
   */
  entityId?: string;
  
  /**
   * Entity type associated with the event (if applicable)
   */
  entityType?: string;
  
  /**
   * Additional metadata for the event
   */
  metadata?: Record<string, any>;
}

/**
 * Factory function type for creating journey-specific database contexts
 */
export type JourneyContextFactory<T extends JourneyDatabaseOperations> = (
  config: JourneyContextConfig
) => T;

/**
 * Map of journey IDs to their corresponding database operation interfaces
 * This type mapping ensures that the correct interface is used for each journey
 */
export interface JourneyDatabaseOperationsMap {
  [JOURNEY_IDS.HEALTH]: HealthJourneyDatabaseOperations;
  [JOURNEY_IDS.CARE]: CareJourneyDatabaseOperations;
  [JOURNEY_IDS.PLAN]: PlanJourneyDatabaseOperations;
}

/**
 * Type that maps a journey ID to its corresponding database operations interface
 * This enables type-safe access to journey-specific database operations
 */
export type JourneyOperationsForId<T extends JourneyId> = JourneyDatabaseOperationsMap[T];