/**
 * Interface defining the structure of insurance coverage details within the Plan Journey.
 * 
 * Coverage represents specific insurance coverage types and details provided by an insurance plan.
 * This interface is used across the platform for consistent coverage data modeling and type safety.
 */
export interface ICoverage {
  /**
   * Unique identifier for the coverage
   */
  id: string;

  /**
   * Reference to the associated insurance plan
   * This creates a type-safe relationship with the IPlan interface
   */
  planId: string;

  /**
   * Type of coverage (e.g., medical, dental, vision, etc.)
   */
  type: string;

  /**
   * Detailed description of what is covered
   */
  details: string;

  /**
   * Description of any limitations or exclusions
   * Optional as some coverage types may not have specific limitations
   */
  limitations?: string;

  /**
   * Amount of co-payment required, if any
   * Optional as some coverage types may not require co-payment
   */
  coPayment?: number;

  /**
   * Date when the coverage was created
   * Used for auditing and tracking purposes
   */
  createdAt?: Date;

  /**
   * Date when the coverage was last updated
   * Used for versioning and change tracking
   */
  updatedAt?: Date;

  /**
   * Additional metadata or configuration for the coverage
   * Allows for extensibility without changing the interface
   */
  metadata?: Record<string, any>;
}