/**
 * @file Plan Journey Interfaces
 * @description Centralized export file for all Plan journey interface definitions.
 * 
 * This barrel file provides a unified import entry point for all Plan journey types,
 * enabling consistent importing of Plan types across the application using a single
 * import statement. This reduces import clutter and facilitates type sharing between
 * web and mobile platforms.
 * 
 * @example
 * // Import all Plan journey types
 * import { Plan, Claim, Coverage, Benefit } from '@austa/interfaces/plan';
 * 
 * // Or import specific types
 * import { ClaimStatus, ClaimType } from '@austa/interfaces/plan';
 */

// Claims-related types
export type {
  ClaimStatus,
  ClaimType,
  ClaimDenialReason,
  Claim,
  ClaimSubmissionRequest,
  ClaimStatusUpdateRequest
} from './claims.types';

// Plan-related types
export {
  PlanType
} from './plans.types';

export type {
  PlanCoverageDetails,
  Plan,
  PlanDetailsRequest,
  PlanDetailsResponse
} from './plans.types';

// Coverage-related types
export {
  CoverageType
} from './coverage.types';

export type {
  Coverage
} from './coverage.types';

// Benefit-related types
export type {
  BenefitType,
  BenefitUsage,
  BenefitLimitations,
  Benefit,
  BenefitDetailsRequest,
  BenefitDetailsResponse
} from './benefits.types';

// Document-related types
export type {
  Document,
  DocumentType,
  DocumentMetadata
} from './documents.types';