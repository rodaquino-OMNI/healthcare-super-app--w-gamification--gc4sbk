/**
 * @file Plan Journey Interfaces
 * @description Centralized export file for all Plan Journey interfaces, types, and enums.
 * This file serves as the main entry point for importing type definitions related to the
 * Plan Journey, including plans, claims, coverage, benefits, and documents.
 * 
 * @package @austa/interfaces
 * @module journey/plan
 */

// Re-export from sub-modules if they exist in the future
// export * from './claims';
// export * from './plans';
// export * from './benefits';
// export * from './coverage';

/**
 * Represents the status of an insurance claim.
 */
export type ClaimStatus = 'pending' | 'approved' | 'denied' | 'additional_info_required';

/**
 * Represents the type of an insurance claim.
 */
export type ClaimType = 'medical' | 'dental' | 'vision' | 'prescription' | 'other';

/**
 * Represents the type of an insurance plan.
 */
export type PlanType = 'HMO' | 'PPO' | 'EPO' | 'POS' | 'indemnity';

/**
 * Represents the type of insurance coverage.
 */
export type CoverageType = 
  | 'medical_visit' 
  | 'specialist_visit' 
  | 'emergency_care' 
  | 'preventive_care' 
  | 'prescription_drugs' 
  | 'mental_health' 
  | 'rehabilitation' 
  | 'durable_medical_equipment' 
  | 'lab_tests' 
  | 'imaging' 
  | 'other';

/**
 * Represents a document associated with a claim.
 * @internal This interface is used internally within claims but not intended for direct external use.
 */
export interface Document {
  id: string;
  type: string;
  filePath: string;
  uploadedAt: string;
}

/**
 * Represents an insurance claim.
 */
export interface Claim {
  id: string;
  planId: string;
  type: ClaimType;
  amount: number;
  status: ClaimStatus;
  submittedAt: string;
  documents: Document[];
}

/**
 * Represents an insurance plan.
 */
export interface Plan {
  id: string;
  userId: string;
  planNumber: string;
  type: PlanType;
  validityStart: string;
  validityEnd: string;
  coverageDetails: Record<string, any>;
  coverages: Coverage[];
  benefits: Benefit[];
  claims: Claim[];
}

/**
 * Represents insurance coverage details.
 */
export interface Coverage {
  id: string;
  planId: string;
  type: CoverageType;
  details: string;
  limitations?: string;
  coPayment?: number;
}

/**
 * Represents a benefit available under an insurance plan.
 */
export interface Benefit {
  id: string;
  planId: string;
  type: string;
  description: string;
  limitations?: string;
  usage?: string;
}