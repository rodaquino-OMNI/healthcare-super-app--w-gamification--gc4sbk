/**
 * @file benefit.interface.ts
 * @description Defines the IBenefit interface for modeling insurance plan benefits
 * throughout the Plan Journey. This interface provides a standardized data structure
 * for benefit information used across services and UI components.
 * 
 * Part of the @austa/interfaces package, this interface ensures type safety and
 * consistent data structures when working with benefit information across the
 * AUSTA SuperApp platform.
 *
 * @package @austa/interfaces
 * @module journey/plan
 */

/**
 * Interface representing an insurance plan benefit within the Plan Journey.
 * Benefits are specific advantages or services provided to the insured as part of their
 * insurance plan coverage.
 *
 * This interface is used by multiple components across the platform:
 * - Plan Service: For storing and retrieving benefit information
 * - API Gateway: For exposing benefit data through GraphQL
 * - Web/Mobile UI: For displaying benefit details in the BenefitCard component
 * - Gamification Engine: For tracking benefit utilization events
 *
 * @see IPlan - Parent interface that contains benefits as a property
 * @see ICoverage - Related interface for coverage details
 */
export interface IBenefit {
  /**
   * Unique identifier for the benefit
   * @example "b12345"
   */
  id: string;

  /**
   * Reference to the associated plan's unique identifier
   * This establishes the relationship between the benefit and its parent plan
   * @example "p67890"
   */
  planId: string;

  /**
   * The category or classification of the benefit
   * @example "Dental", "Vision", "Prescription", "Specialist"
   */
  type: string;

  /**
   * Detailed explanation of what the benefit covers
   * @example "Covers 100% of preventive dental care including cleanings and check-ups"
   */
  description: string;

  /**
   * Any restrictions or conditions that apply to the benefit
   * @example "Limited to two cleanings per year"
   */
  limitations?: string;

  /**
   * Information about how the benefit has been utilized
   * @example "1 of 2 cleanings used"
   */
  usage?: string;

  /**
   * The maximum coverage amount for this benefit, if applicable
   * @example 1500
   */
  maxCoverage?: number;

  /**
   * The percentage of costs covered by the insurance plan for this benefit
   * @example 80
   */
  coveragePercentage?: number;

  /**
   * The amount the insured must pay before the benefit coverage begins
   * @example 250
   */
  deductible?: number;

  /**
   * The fixed amount the insured must pay for each service under this benefit
   * @example 25
   */
  copay?: number;

  /**
   * Date when the benefit becomes available
   * @example "2023-01-01T00:00:00Z"
   */
  effectiveDate?: string;

  /**
   * Date when the benefit expires
   * @example "2023-12-31T23:59:59Z"
   */
  expirationDate?: string;

  /**
   * Additional metadata or configuration for the benefit
   * Stored as a JSON object to allow for flexible extension
   */
  metadata?: Record<string, any>;
}