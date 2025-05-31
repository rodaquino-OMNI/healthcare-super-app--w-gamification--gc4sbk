/**
 * @file Plan Types
 * @description Defines TypeScript interfaces for insurance plans within the Plan journey.
 * These types establish the core data model for the Plan journey, defining relationships
 * between plans, coverages, benefits, and claims.
 */

import { Benefit } from './benefits.types';
import { Claim } from './claims.types';
import { Coverage, CoverageType } from './coverage.types';

/**
 * Represents the type of an insurance plan.
 * Different plan types have different network restrictions, cost structures, and coverage models.
 * 
 * @example
 * // Using PlanType in a component
 * const planType: PlanType = PlanType.PPO;
 */
export enum PlanType {
  /** Health Maintenance Organization - Requires referrals from primary care physician */
  HMO = 'HMO',
  /** Preferred Provider Organization - More flexibility with out-of-network care */
  PPO = 'PPO',
  /** Exclusive Provider Organization - No out-of-network coverage except emergencies */
  EPO = 'EPO',
  /** Point of Service - Hybrid of HMO and PPO */
  POS = 'POS',
  /** Indemnity Plan - Traditional fee-for-service plan */
  INDEMNITY = 'indemnity'
}

/**
 * Represents detailed coverage information for a specific insurance plan.
 * This provides structured access to coverage details beyond the basic Coverage interface.
 */
export interface PlanCoverageDetails {
  /** Annual deductible amount before insurance begins to pay */
  deductible: number;
  
  /** Maximum out-of-pocket expenses for the year */
  outOfPocketMax: number;
  
  /** Percentage of costs covered by insurance after deductible */
  coinsurance: number;
  
  /** Whether the plan covers out-of-network providers */
  outOfNetworkCoverage: boolean;
  
  /** Lifetime maximum benefit amount, if applicable */
  lifetimeMaximum?: number;
  
  /** Coverage details specific to each coverage type */
  coverageByType: Record<CoverageType, {
    /** Whether this type of service is covered */
    covered: boolean;
    
    /** Co-payment amount for this service type */
    copay?: number;
    
    /** Coinsurance percentage for this service type */
    coinsurance?: number;
    
    /** Any specific limitations for this service type */
    limitations?: string;
  }>;
}

/**
 * Represents an insurance plan.
 * 
 * An insurance plan is the core entity in the Plan journey, containing information about
 * the user's insurance coverage, benefits, and claims. It defines the relationship between
 * these entities and provides access to all plan-related data.
 * 
 * @example
 * // Creating a Plan object
 * const plan: Plan = {
 *   id: '123',
 *   userId: 'user-456',
 *   planNumber: 'PLN-789',
 *   type: PlanType.PPO,
 *   name: 'Premium Health Plan',
 *   provider: 'AUSTA Insurance',
 *   validityStart: new Date('2023-01-01'),
 *   validityEnd: new Date('2023-12-31'),
 *   coverageDetails: { ... },
 *   coverages: [],
 *   benefits: [],
 *   claims: []
 * };
 */
export interface Plan {
  /** Unique identifier for the plan */
  id: string;
  
  /** Reference to the user who owns this plan */
  userId: string;
  
  /** Plan number as assigned by the insurance provider */
  planNumber: string;
  
  /** Type of insurance plan */
  type: PlanType;
  
  /** Human-readable name of the plan */
  name: string;
  
  /** Name of the insurance provider */
  provider: string;
  
  /** Start date of plan validity */
  validityStart: Date | string;
  
  /** End date of plan validity */
  validityEnd: Date | string;
  
  /** Detailed coverage information */
  coverageDetails: PlanCoverageDetails;
  
  /** List of specific coverages included in the plan */
  coverages: Coverage[];
  
  /** List of additional benefits provided by the plan */
  benefits: Benefit[];
  
  /** List of claims filed under this plan */
  claims: Claim[];
  
  /** Group number for employer-provided plans */
  groupNumber?: string;
  
  /** Network of healthcare providers */
  network?: string;
  
  /** Plan tier or level (e.g., 'bronze', 'silver', 'gold', 'platinum') */
  tier?: string;
  
  /** Monthly premium amount */
  premium?: number;
  
  /** Whether the plan is currently active */
  isActive?: boolean;
  
  /** Date when the plan was created or enrolled */
  enrollmentDate?: Date | string;
}

/**
 * Represents a request to retrieve plan details.
 */
export interface PlanDetailsRequest {
  /** The unique identifier of the plan to retrieve */
  planId: string;
}

/**
 * Represents a response containing detailed plan information.
 */
export interface PlanDetailsResponse {
  /** The plan details */
  plan: Plan;
  
  /** Additional plan-related information */
  additionalInfo?: {
    /** Contact information for customer service */
    customerService?: {
      phone: string;
      email: string;
      hours: string;
    };
    
    /** URLs to important plan documents */
    documents?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
  };
}