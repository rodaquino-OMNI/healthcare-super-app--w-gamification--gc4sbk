/**
 * @file Plan Journey Interfaces
 * @description Centralized export file for all Plan journey interface definitions.
 * This barrel file provides a unified import entry point for all Plan-related types,
 * enabling consistent importing across the application and facilitating type sharing
 * between web and mobile platforms.
 */

// Re-export all claim-related types
export type {
  ClaimStatus,
  ClaimType,
  ClaimDenialReason,
  Claim,
  ClaimSubmissionRequest,
  ClaimSubmissionResponse,
  ClaimStatusUpdateRequest
} from './claims.types';

// Re-export claim status transition constant
export { VALID_CLAIM_STATUS_TRANSITIONS } from './claims.types';

// Re-export all document-related types
export type {
  DocumentType,
  Document,
  DocumentUploadResponse,
  DocumentUploadRequest
} from './documents.types';

// Re-export all benefit-related types
export type {
  BenefitType,
  BenefitStatus,
  BenefitUsage,
  Benefit,
  CreateBenefitRequest,
  UpdateBenefitRequest
} from './benefits.types';

// Re-export coverage-related types
export { CoverageType } from './coverage.types';
export type { Coverage } from './coverage.types';

// Re-export all plan-related types
export { 
  PlanType,
  PlanStatus,
  NetworkType 
} from './plans.types';

export type {
  PlanCoverageDetails,
  Plan,
  PlanMember,
  CreatePlanRequest,
  UpdatePlanRequest,
  PlanSummary
} from './plans.types';