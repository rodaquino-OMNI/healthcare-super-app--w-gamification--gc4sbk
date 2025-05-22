/**
 * @file Plan Journey Test Fixtures Index
 * 
 * Centralizes exports of all Plan journey test fixtures, providing a single import point for test suites.
 * This file makes it easy to access all plan-related test fixtures without having to import from multiple files,
 * simplifying test setup and improving maintainability.
 */

// Import all fixture modules
import * as insurancePlans from './insurance-plans.fixtures';
import * as benefits from './benefits.fixtures';
import * as coverage from './coverage.fixtures';
import * as claims from './claims.fixtures';
import * as documents from './documents.fixtures';

// Re-export all fixture modules with descriptive names
export const planFixtures = {
  /**
   * Insurance plan fixtures for testing plan selection, comparison, and management
   */
  insurancePlans,
  
  /**
   * Benefit fixtures for testing benefit eligibility, calculation, and display
   */
  benefits,
  
  /**
   * Coverage fixtures for testing coverage calculation and eligibility verification
   */
  coverage,
  
  /**
   * Claim fixtures for testing claim submission, processing, and reimbursement
   */
  claims,
  
  /**
   * Document fixtures for testing document uploading, validation, and retrieval
   */
  documents,
};

// Named exports for direct imports
export { insurancePlans, benefits, coverage, claims, documents };

/**
 * Convenience function to get a complete set of fixtures for a basic plan journey test
 * Includes a standard insurance plan, basic coverage, and common benefits
 */
export function getBasicPlanTestFixtures() {
  return {
    plan: insurancePlans.standardPlan,
    coverage: coverage.standardCoverage,
    benefits: benefits.standardBenefits,
  };
}

/**
 * Convenience function to get a complete set of fixtures for claim processing tests
 * Includes a standard insurance plan, coverage, and a set of claims in different states
 */
export function getClaimProcessingFixtures() {
  return {
    plan: insurancePlans.standardPlan,
    coverage: coverage.standardCoverage,
    claims: {
      submitted: claims.submittedClaim,
      processing: claims.processingClaim,
      approved: claims.approvedClaim,
      rejected: claims.rejectedClaim,
      needsInfo: claims.needsInfoClaim,
    },
    documents: {
      receipt: documents.receiptDocument,
      medicalReport: documents.medicalReportDocument,
    },
  };
}

/**
 * Convenience function to get a complete set of fixtures for document management tests
 * Includes various document types in different verification states
 */
export function getDocumentManagementFixtures() {
  return {
    documents: {
      pending: documents.pendingDocument,
      verified: documents.verifiedDocument,
      rejected: documents.rejectedDocument,
      expired: documents.expiredDocument,
    },
    claim: claims.submittedClaim,
    plan: insurancePlans.premiumPlan,
  };
}

/**
 * Convenience function to get a complete set of fixtures for coverage calculation tests
 * Includes plans with different coverage levels and various medical service types
 */
export function getCoverageCalculationFixtures() {
  return {
    plans: {
      basic: insurancePlans.basicPlan,
      standard: insurancePlans.standardPlan,
      premium: insurancePlans.premiumPlan,
    },
    coverage: {
      basic: coverage.basicCoverage,
      standard: coverage.standardCoverage,
      premium: coverage.premiumCoverage,
    },
    benefits: {
      basic: benefits.basicBenefits,
      standard: benefits.standardBenefits,
      premium: benefits.premiumBenefits,
    },
  };
}

/**
 * Default export for backwards compatibility
 */
export default planFixtures;