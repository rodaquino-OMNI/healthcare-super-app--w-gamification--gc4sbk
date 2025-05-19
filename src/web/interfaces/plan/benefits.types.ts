/**
 * @file benefits.types.ts
 * @description Defines TypeScript interfaces for insurance benefits within the Plan journey.
 * These types establish the data contract for benefit display components and benefit-related logic.
 */

import { BaseEntity } from '../common/model';

/**
 * Represents the type of benefit available under an insurance plan.
 * Examples include wellness programs, dental coverage, vision care, etc.
 */
export type BenefitType = 
  | 'wellness_program'
  | 'dental'
  | 'vision'
  | 'mental_health'
  | 'alternative_medicine'
  | 'fitness'
  | 'nutrition'
  | 'travel_insurance'
  | 'telehealth'
  | 'maternity'
  | 'preventive_care'
  | 'other';

/**
 * Represents the status of a benefit's availability.
 */
export type BenefitStatus = 'active' | 'inactive' | 'pending' | 'expired';

/**
 * Represents usage metrics for a benefit.
 */
export interface BenefitUsage {
  /**
   * The total number of times this benefit can be used
   */
  limit: number;
  
  /**
   * The number of times this benefit has been used
   */
  used: number;
  
  /**
   * The remaining number of times this benefit can be used
   */
  remaining: number;
  
  /**
   * The date when the benefit usage resets, if applicable
   */
  resetDate?: string;
}

/**
 * Represents a benefit available under an insurance plan.
 * Benefits are additional services or perks provided to the insured beyond standard coverage.
 */
export interface Benefit extends BaseEntity {
  /**
   * Unique identifier for the benefit
   */
  id: string;
  
  /**
   * Reference to the plan this benefit belongs to
   */
  planId: string;
  
  /**
   * The type of benefit
   */
  type: BenefitType;
  
  /**
   * Human-readable name of the benefit
   */
  name: string;
  
  /**
   * Detailed description of what the benefit provides
   */
  description: string;
  
  /**
   * Current status of the benefit
   */
  status: BenefitStatus;
  
  /**
   * Any limitations or restrictions on the benefit
   * Examples: "Limited to 3 visits per year", "Available only at in-network providers"
   */
  limitations?: string;
  
  /**
   * Detailed usage metrics for the benefit, if applicable
   * Tracks how many times the benefit has been used and how many uses remain
   */
  usage?: BenefitUsage;
  
  /**
   * The monetary value of the benefit, if applicable
   */
  monetaryValue?: number;
  
  /**
   * The date when the benefit becomes available
   */
  availableFrom?: string;
  
  /**
   * The date when the benefit expires
   */
  availableUntil?: string;
  
  /**
   * Instructions on how to use or claim the benefit
   */
  instructions?: string;
  
  /**
   * Any additional metadata associated with the benefit
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a request to add a new benefit to a plan.
 */
export interface CreateBenefitRequest {
  /**
   * The plan to add the benefit to
   */
  planId: string;
  
  /**
   * The type of benefit
   */
  type: BenefitType;
  
  /**
   * Human-readable name of the benefit
   */
  name: string;
  
  /**
   * Detailed description of what the benefit provides
   */
  description: string;
  
  /**
   * Any limitations or restrictions on the benefit
   */
  limitations?: string;
  
  /**
   * The monetary value of the benefit, if applicable
   */
  monetaryValue?: number;
  
  /**
   * The date when the benefit becomes available
   */
  availableFrom?: string;
  
  /**
   * The date when the benefit expires
   */
  availableUntil?: string;
  
  /**
   * Instructions on how to use or claim the benefit
   */
  instructions?: string;
}

/**
 * Represents a request to update an existing benefit.
 */
export interface UpdateBenefitRequest {
  /**
   * Human-readable name of the benefit
   */
  name?: string;
  
  /**
   * Detailed description of what the benefit provides
   */
  description?: string;
  
  /**
   * Current status of the benefit
   */
  status?: BenefitStatus;
  
  /**
   * Any limitations or restrictions on the benefit
   */
  limitations?: string;
  
  /**
   * The monetary value of the benefit, if applicable
   */
  monetaryValue?: number;
  
  /**
   * The date when the benefit becomes available
   */
  availableFrom?: string;
  
  /**
   * The date when the benefit expires
   */
  availableUntil?: string;
  
  /**
   * Instructions on how to use or claim the benefit
   */
  instructions?: string;
}