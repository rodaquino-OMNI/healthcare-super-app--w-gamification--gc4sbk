/**
 * @file index.ts
 * @description Centralized export file for all Plan Journey interfaces, types, and enums.
 * This file serves as the main entry point for importing type definitions related to
 * the Plan Journey, including plans, claims, coverage, benefits, and documents.
 *
 * @module @austa/interfaces/journey/plan
 */

// Export all interfaces and types from their respective files
export { IBenefit } from './benefit.interface';
export { IClaim, IClaimDocument, IClaimEvent, ClaimStatus, ICreateClaim, IUpdateClaim } from './claim.interface';
export { ICoverage } from './coverage.interface';
export { IDocument } from './document.interface';
export { IPlan } from './plan.interface';

/**
 * Type representing the possible types of insurance claims.
 */
export type ClaimType = 'medical' | 'dental' | 'vision' | 'prescription' | 'other';

/**
 * Type representing the possible types of insurance plans.
 */
export type PlanType = 'HMO' | 'PPO' | 'EPO' | 'POS' | 'indemnity';

/**
 * Type representing the possible types of insurance coverage.
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