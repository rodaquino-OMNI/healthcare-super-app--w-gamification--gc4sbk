/**
 * @file plans.types.ts
 * @description Defines TypeScript interfaces for insurance plans within the Plan journey.
 * These types establish the core data model for the Plan journey, defining relationships
 * between plans, coverages, benefits, and claims.
 */

import { BaseEntity, UserOwned } from '@austa/interfaces/common/model';
import { Benefit } from '@austa/interfaces/plan/benefits.types';
import { Claim } from '@austa/interfaces/plan/claims.types';
import { Coverage } from '@austa/interfaces/plan/coverage.types';

/**
 * Represents the type of an insurance plan.
 * Different plan types have different network restrictions, cost structures, and coverage models.
 */
export enum PlanType {
  /** Health Maintenance Organization - Restricted network, primary care physician required */
  HMO = 'HMO',
  
  /** Preferred Provider Organization - Flexible network, higher premiums */
  PPO = 'PPO',
  
  /** Exclusive Provider Organization - In-network only except emergencies, no PCP required */
  EPO = 'EPO',
  
  /** Point of Service - PCP required, some out-of-network coverage */
  POS = 'POS',
  
  /** Indemnity Plan - Maximum flexibility, higher out-of-pocket costs */
  INDEMNITY = 'indemnity'
}

/**
 * Represents the status of an insurance plan.
 */
export enum PlanStatus {
  /** Plan is active and coverage is in effect */
  ACTIVE = 'active',
  
  /** Plan is pending activation (e.g., waiting for payment or approval) */
  PENDING = 'pending',
  
  /** Plan has expired or been terminated */
  EXPIRED = 'expired',
  
  /** Plan is temporarily suspended */
  SUSPENDED = 'suspended',
  
  /** Plan is in renewal process */
  RENEWING = 'renewing'
}

/**
 * Represents the network type for a plan.
 */
export enum NetworkType {
  /** In-network providers only */
  IN_NETWORK_ONLY = 'in_network_only',
  
  /** Both in-network and out-of-network with different coverage levels */
  MIXED = 'mixed',
  
  /** Any provider (rare) */
  ANY = 'any'
}

/**
 * Represents detailed coverage information for a specific plan.
 * This extends beyond the basic Coverage interface to include plan-specific details.
 */
export interface PlanCoverageDetails {
  /** Annual deductible amount in currency units */
  annualDeductible: number;
  
  /** Out-of-pocket maximum in currency units */
  outOfPocketMax: number;
  
  /** Lifetime maximum coverage (if applicable) */
  lifetimeMaximum?: number;
  
  /** Whether the plan includes prescription drug coverage */
  includesPrescriptionDrugs: boolean;
  
  /** Whether the plan includes dental coverage */
  includesDental: boolean;
  
  /** Whether the plan includes vision coverage */
  includesVision: boolean;
  
  /** Whether the plan includes mental health coverage */
  includesMentalHealth: boolean;
  
  /** Network type for this plan */
  networkType: NetworkType;
  
  /** Additional coverage details as key-value pairs */
  additionalDetails?: Record<string, any>;
}

/**
 * Represents an insurance plan.
 * 
 * An insurance plan is the core entity in the Plan journey, representing the user's
 * health insurance policy. It contains information about coverage, benefits, and claims,
 * as well as plan-specific details like validity dates and plan numbers.
 */
export interface Plan extends UserOwned {
  /**
   * Unique identifier for the plan
   */
  id: string;
  
  /**
   * Reference to the user who owns this plan
   */
  userId: string;
  
  /**
   * Plan number assigned by the insurance provider
   */
  planNumber: string;
  
  /**
   * Type of insurance plan (HMO, PPO, etc.)
   */
  type: PlanType;
  
  /**
   * Current status of the plan
   */
  status: PlanStatus;
  
  /**
   * Human-readable name of the plan
   */
  name: string;
  
  /**
   * Insurance provider name
   */
  providerName: string;
  
  /**
   * ISO 8601 date when the plan coverage begins
   */
  validityStart: string;
  
  /**
   * ISO 8601 date when the plan coverage ends
   */
  validityEnd: string;
  
  /**
   * Detailed coverage information specific to this plan
   */
  coverageDetails: PlanCoverageDetails;
  
  /**
   * Array of specific coverages included in this plan
   */
  coverages: Coverage[];
  
  /**
   * Array of benefits available under this plan
   */
  benefits: Benefit[];
  
  /**
   * Array of claims submitted under this plan
   */
  claims: Claim[];
  
  /**
   * Monthly premium amount in currency units
   */
  monthlyPremium?: number;
  
  /**
   * Group number if this is a group plan
   */
  groupNumber?: string;
  
  /**
   * Member ID for the primary plan holder
   */
  memberId?: string;
  
  /**
   * Array of dependent members covered by this plan
   */
  dependents?: PlanMember[];
  
  /**
   * Additional plan metadata as key-value pairs
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a member (dependent) covered under an insurance plan.
 */
export interface PlanMember {
  /**
   * Unique identifier for the plan member
   */
  id: string;
  
  /**
   * Reference to the plan this member is covered under
   */
  planId: string;
  
  /**
   * Full name of the member
   */
  name: string;
  
  /**
   * Date of birth in ISO 8601 format
   */
  dateOfBirth: string;
  
  /**
   * Relationship to the primary plan holder
   */
  relationship: 'self' | 'spouse' | 'child' | 'other';
  
  /**
   * Member ID assigned by the insurance provider
   */
  memberId: string;
  
  /**
   * Whether this is the primary plan holder
   */
  isPrimary: boolean;
}

/**
 * Represents a request to create a new insurance plan.
 */
export interface CreatePlanRequest {
  /**
   * Plan number assigned by the insurance provider
   */
  planNumber: string;
  
  /**
   * Type of insurance plan
   */
  type: PlanType;
  
  /**
   * Human-readable name of the plan
   */
  name: string;
  
  /**
   * Insurance provider name
   */
  providerName: string;
  
  /**
   * ISO 8601 date when the plan coverage begins
   */
  validityStart: string;
  
  /**
   * ISO 8601 date when the plan coverage ends
   */
  validityEnd: string;
  
  /**
   * Detailed coverage information specific to this plan
   */
  coverageDetails: PlanCoverageDetails;
  
  /**
   * Monthly premium amount in currency units
   */
  monthlyPremium?: number;
  
  /**
   * Group number if this is a group plan
   */
  groupNumber?: string;
  
  /**
   * Member ID for the primary plan holder
   */
  memberId?: string;
}

/**
 * Represents a request to update an existing insurance plan.
 */
export interface UpdatePlanRequest {
  /**
   * Type of insurance plan
   */
  type?: PlanType;
  
  /**
   * Current status of the plan
   */
  status?: PlanStatus;
  
  /**
   * Human-readable name of the plan
   */
  name?: string;
  
  /**
   * Insurance provider name
   */
  providerName?: string;
  
  /**
   * ISO 8601 date when the plan coverage begins
   */
  validityStart?: string;
  
  /**
   * ISO 8601 date when the plan coverage ends
   */
  validityEnd?: string;
  
  /**
   * Detailed coverage information specific to this plan
   */
  coverageDetails?: Partial<PlanCoverageDetails>;
  
  /**
   * Monthly premium amount in currency units
   */
  monthlyPremium?: number;
  
  /**
   * Group number if this is a group plan
   */
  groupNumber?: string;
  
  /**
   * Member ID for the primary plan holder
   */
  memberId?: string;
}

/**
 * Represents a summary of an insurance plan with essential information.
 * Used for list views and dashboard displays.
 */
export interface PlanSummary {
  /**
   * Unique identifier for the plan
   */
  id: string;
  
  /**
   * Human-readable name of the plan
   */
  name: string;
  
  /**
   * Type of insurance plan
   */
  type: PlanType;
  
  /**
   * Current status of the plan
   */
  status: PlanStatus;
  
  /**
   * Insurance provider name
   */
  providerName: string;
  
  /**
   * ISO 8601 date when the plan coverage begins
   */
  validityStart: string;
  
  /**
   * ISO 8601 date when the plan coverage ends
   */
  validityEnd: string;
  
  /**
   * Monthly premium amount in currency units
   */
  monthlyPremium?: number;
  
  /**
   * Count of active claims under this plan
   */
  activeClaims: number;
}