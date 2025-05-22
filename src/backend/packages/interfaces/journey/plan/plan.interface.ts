/**
 * @file Plan interface definition for the AUSTA SuperApp
 * @description Defines the IPlan interface that models insurance plan data structure
 * throughout the application. This interface provides type definitions for plan
 * properties including id, name, description, provider, price, effective dates,
 * status, and related associations.
 */

import { ICoverage } from './coverage.interface';
import { IBenefit } from './benefit.interface';
import { IClaim } from './claim.interface';

/**
 * Interface representing an insurance plan in the AUSTA SuperApp.
 * This interface serves as a shared contract for plan data across all services
 * and provides a standardized structure for plan-related operations.
 */
export interface IPlan {
  /**
   * Unique identifier for the plan
   */
  id: string;

  /**
   * User ID associated with this plan
   */
  userId: string;

  /**
   * Insurance plan number or identifier
   */
  planNumber: string;

  /**
   * Name of the insurance plan
   */
  name?: string;

  /**
   * Description of the insurance plan and its key features
   */
  description?: string;

  /**
   * Type of insurance plan (e.g., individual, family, corporate)
   */
  type: string;

  /**
   * Insurance provider name
   */
  provider?: string;

  /**
   * Monthly premium amount for the plan
   */
  monthlyPremium?: number;

  /**
   * Date when the plan becomes valid
   */
  validityStart: Date;

  /**
   * Date when the plan validity ends
   */
  validityEnd: Date;

  /**
   * Current status of the plan (e.g., active, inactive, pending)
   */
  status?: string;

  /**
   * Detailed coverage information stored as JSON
   * Contains high-level overview of plan coverage that can be displayed on cards
   */
  coverageDetails: Record<string, any>;

  /**
   * Journey identifier, typically set to the PLAN journey
   */
  journey: string;

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