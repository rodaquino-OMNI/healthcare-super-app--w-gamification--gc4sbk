/**
 * Interface defining the structure of an insurance benefit within the Plan Journey.
 * 
 * Benefits represent specific services, coverages, or advantages provided by an insurance plan.
 * This interface is used across the platform for consistent benefit data modeling and type safety.
 */
export interface IBenefit {
  /**
   * Unique identifier for the benefit
   */
  id: string;

  /**
   * Reference to the associated insurance plan
   * This creates a type-safe relationship with the IPlan interface
   */
  planId: string;

  /**
   * The category or type of benefit (e.g., "Dental", "Vision", "Prescription")
   */
  type: string;

  /**
   * Detailed description of what the benefit covers
   */
  description: string;

  /**
   * Any restrictions, caps, or conditions on the benefit usage
   * Optional as some benefits may not have limitations
   */
  limitations?: string;

  /**
   * Information about how the benefit has been used by the plan holder
   * Optional as new benefits may not have usage data yet
   */
  usage?: string;

  /**
   * Coverage percentage or amount for this specific benefit
   * Optional as some benefits may not have a specific coverage value
   */
  coverage?: number;

  /**
   * Date when the benefit becomes available
   * Optional as it may match the plan's validity start date
   */
  availableFrom?: Date;

  /**
   * Date when the benefit expires
   * Optional as it may match the plan's validity end date
   */
  availableTo?: Date;

  /**
   * Additional metadata or configuration for the benefit
   * Allows for extensibility without changing the interface
   */
  metadata?: Record<string, any>;
}