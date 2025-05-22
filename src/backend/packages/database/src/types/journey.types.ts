/**
 * Enum representing the different journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  /**
   * Health journey for tracking health metrics, goals, and medical events
   */
  HEALTH = 'health',
  
  /**
   * Care journey for managing appointments, medications, and treatments
   */
  CARE = 'care',
  
  /**
   * Plan journey for insurance plans, benefits, and claims
   */
  PLAN = 'plan',
}

/**
 * Interface for journey-specific database context
 */
export interface JourneyDatabaseContext {
  /**
   * Type of journey this context is for
   */
  journeyType: JourneyType;
  
  /**
   * Journey-specific configuration options
   */
  config: JourneyDatabaseConfig;
  
  /**
   * Journey-specific models and their configurations
   */
  models: Record<string, JourneyModelConfig>;
}

/**
 * Configuration options for journey-specific database operations
 */
export interface JourneyDatabaseConfig {
  /**
   * Whether to enable soft deletion for this journey
   */
  enableSoftDeletion?: boolean;
  
  /**
   * Whether to enable multi-tenancy for this journey
   */
  enableMultiTenancy?: boolean;
  
  /**
   * Whether to enable audit trail for this journey
   */
  enableAuditTrail?: boolean;
  
  /**
   * Default filter options for this journey
   */
  defaultFilters?: Record<string, any>;
  
  /**
   * Custom transformation rules for this journey
   */
  customTransformations?: Array<{
    modelName: string;
    operation: string;
    transform: (args: any, context: any) => any;
  }>;
}

/**
 * Configuration for a specific model within a journey
 */
export interface JourneyModelConfig {
  /**
   * Name of the model
   */
  name: string;
  
  /**
   * Whether this model supports soft deletion
   */
  softDeletable?: boolean;
  
  /**
   * Whether this model supports multi-tenancy
   */
  multiTenant?: boolean;
  
  /**
   * Whether this model has audit trail fields
   */
  auditable?: boolean;
  
  /**
   * Whether this model has timestamp fields
   */
  timestamped?: boolean;
  
  /**
   * Default filter options for this model
   */
  defaultFilters?: Record<string, any>;
  
  /**
   * Available indexes for this model
   */
  indexes?: Array<{
    name: string;
    fields: string[];
  }>;
}

/**
 * Health journey-specific database context
 */
export interface HealthJourneyDatabaseContext extends JourneyDatabaseContext {
  journeyType: JourneyType.HEALTH;
  
  /**
   * Health-specific configuration options
   */
  healthConfig?: {
    /**
     * Default date range for health metrics queries
     */
    defaultMetricDateRange?: {
      days: number;
    };
    
    /**
     * Whether to automatically include device information with metrics
     */
    includeDeviceInfo?: boolean;
  };
}

/**
 * Care journey-specific database context
 */
export interface CareJourneyDatabaseContext extends JourneyDatabaseContext {
  journeyType: JourneyType.CARE;
  
  /**
   * Care-specific configuration options
   */
  careConfig?: {
    /**
     * Default appointment status filter
     */
    defaultAppointmentStatusFilter?: string[];
    
    /**
     * Whether to automatically include provider information with appointments
     */
    includeProviderInfo?: boolean;
  };
}

/**
 * Plan journey-specific database context
 */
export interface PlanJourneyDatabaseContext extends JourneyDatabaseContext {
  journeyType: JourneyType.PLAN;
  
  /**
   * Plan-specific configuration options
   */
  planConfig?: {
    /**
     * Default claim status filter
     */
    defaultClaimStatusFilter?: string[];
    
    /**
     * Whether to automatically include benefit information with plans
     */
    includeBenefitInfo?: boolean;
  };
}