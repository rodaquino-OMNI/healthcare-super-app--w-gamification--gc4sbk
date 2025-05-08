/**
 * @file Plan interface definition for the AUSTA SuperApp
 * @description Defines the IPlan interface that models insurance plan data structure throughout the application
 */

import { ICoverage } from './coverage.interface';
import { IBenefit } from './benefit.interface';
import { IClaim } from './claim.interface';
import { IJourneyIdentifier } from '@austa/interfaces/common/journey.interface';

/**
 * Interface representing an insurance plan in the AUSTA SuperApp.
 * This interface provides a standardized contract for plan data across all services.
 * It includes all essential properties of an insurance plan including identifiers,
 * validity dates, coverage details, and related associations.
 */
export interface IPlan {
  /**
   * Unique identifier for the plan
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * User ID associated with this plan
   * @example "a7ef5830-c762-4a93-9c2b-5d51648ec8e2"
   */
  userId: string;

  /**
   * Insurance plan number or identifier
   * @example "PLN-2023-78945"
   */
  planNumber: string;

  /**
   * Name of the insurance plan
   * @example "Premium Health Plus"
   */
  name?: string;

  /**
   * Description of the insurance plan
   * @example "Comprehensive health coverage with dental and vision benefits"
   */
  description?: string;

  /**
   * Type of insurance plan (e.g., individual, family, corporate)
   * @example "family"
   */
  type: string;

  /**
   * Insurance provider name
   * @example "AUSTA Insurance"
   */
  provider?: string;

  /**
   * Monthly premium amount
   * @example 299.99
   */
  premium?: number;

  /**
   * Currency code for the premium
   * @example "BRL"
   */
  currency?: string;

  /**
   * Date when the plan becomes valid
   * @example "2023-01-01T00:00:00.000Z"
   */
  validityStart: Date;

  /**
   * Date when the plan validity ends
   * @example "2023-12-31T23:59:59.999Z"
   */
  validityEnd: Date;

  /**
   * Current status of the plan (active, inactive, pending, expired)
   * @example "active"
   */
  status?: string;

  /**
   * Detailed coverage information stored as JSON
   * Contains high-level overview of plan coverage that can be displayed on cards
   */
  coverageDetails: object;

  /**
   * Journey identifier, typically references the PLAN journey
   */
  journey: IJourneyIdentifier;

  /**
   * Timestamp when the plan record was created
   */
  createdAt: Date;

  /**
   * Timestamp when the plan record was last updated
   */
  updatedAt: Date;

  /**
   * Related coverage details
   * One plan can have multiple coverage types (medical, dental, vision, etc.)
   */
  coverages?: ICoverage[];

  /**
   * Related benefits associated with this plan
   */
  benefits?: IBenefit[];

  /**
   * Related claims filed under this plan
   */
  claims?: IClaim[];
}