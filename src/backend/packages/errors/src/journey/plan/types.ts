/**
 * Plan journey error types
 */
export enum PlanErrorType {
  BENEFIT = 'BENEFIT',
  CLAIM = 'CLAIM',
  COVERAGE = 'COVERAGE',
  DOCUMENT = 'DOCUMENT',
  PLAN_SELECTION = 'PLAN_SELECTION'
}

/**
 * Claim status
 */
export enum ClaimStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  DENIED = 'denied',
  PENDING_INFORMATION = 'pending_information'
}

/**
 * Coverage status
 */
export enum CoverageStatus {
  COVERED = 'covered',
  NOT_COVERED = 'not_covered',
  PARTIALLY_COVERED = 'partially_covered',
  REQUIRES_PREAUTHORIZATION = 'requires_preauthorization',
  REQUIRES_REFERRAL = 'requires_referral'
}

/**
 * Document status
 */
export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Plan status
 */
export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired'
}