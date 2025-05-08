/**
 * @file coverage.interface.ts
 * @description Defines the ICoverage interface for insurance coverage details used throughout the Plan Journey.
 * This interface specifies the structure for coverage types, detailed descriptions, limitations,
 * copayment amounts, and relationships to insurance plans.
 */

import { IPlan } from './plan.interface';

/**
 * Interface representing insurance coverage details.
 * Used across the Plan Journey to provide consistent structure for coverage information.
 */
export interface ICoverage {
  /**
   * Unique identifier for the coverage
   */
  id: string;

  /**
   * Reference to the associated insurance plan
   * @see IPlan
   */
  planId: string;

  /**
   * Optional reference to the complete plan object
   * Used for relational data access when needed
   */
  plan?: IPlan;

  /**
   * Type of coverage (e.g., medical, dental, vision, etc.)
   * Categorizes the coverage for filtering and display purposes
   */
  type: string;

  /**
   * Detailed description of what is covered
   * Provides comprehensive information about the coverage benefits
   */
  details: string;

  /**
   * Description of any limitations or exclusions
   * Documents restrictions, waiting periods, or services not covered
   */
  limitations?: string;

  /**
   * Amount of co-payment required, if any
   * Represents the fixed amount a member must pay for covered services
   */
  coPayment?: number;

  /**
   * Timestamp when the coverage record was created
   */
  createdAt: Date;

  /**
   * Timestamp when the coverage record was last updated
   */
  updatedAt: Date;
}