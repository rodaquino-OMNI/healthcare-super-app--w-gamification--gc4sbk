/**
 * @file Plan Journey Test Fixtures
 * 
 * This file centralizes exports of all Plan journey test fixtures, providing a single import point
 * for test suites. It makes it easy to access all plan-related test fixtures without having to
 * import from multiple files, simplifying test setup and improving maintainability.
 */

// Import all fixture modules
import * as benefitsFixtures from './benefits.fixtures';
import * as claimsFixtures from './claims.fixtures';
import * as coverageFixtures from './coverage.fixtures';
import * as documentsFixtures from './documents.fixtures';
import * as insurancePlansFixtures from './insurance-plans.fixtures';

// Re-export all fixtures
export { benefitsFixtures, claimsFixtures, coverageFixtures, documentsFixtures, insurancePlansFixtures };

// Export individual fixture categories for direct access
export * from './benefits.fixtures';
export * from './claims.fixtures';
export * from './coverage.fixtures';
export * from './documents.fixtures';
export * from './insurance-plans.fixtures';

/**
 * Convenience function to get a complete set of fixtures for a standard insurance plan test scenario.
 * Includes a plan, its benefits, coverage details, and sample claims.
 * 
 * @param planType The type of insurance plan (basic, standard, premium)
 * @returns A complete set of fixtures for the specified plan type
 */
export function getCompletePlanTestFixtures(planType: 'basic' | 'standard' | 'premium' = 'standard') {
  // Map the planType parameter to the actual plan type name in Portuguese
  const planTypeMap = {
    basic: 'Básico',
    standard: 'Standard',
    premium: 'Premium'
  };
  
  const planTypeName = planTypeMap[planType];
  
  // Get the insurance plan fixture
  const plan = insurancePlansFixtures.getPlanFixtureByType(planTypeName);
  
  // Get the benefits for this plan
  const benefits = benefitsFixtures.getBenefitsByPlanType(planTypeName);
  
  // Get the coverage details for this plan
  const coverage = coverageFixtures.getCoverageByPlanType(planTypeName);
  
  // Get sample claims for this plan
  const claims = claimsFixtures.getClaimsByPlanType(planTypeName);
  
  // Get sample documents for this plan
  const documents = documentsFixtures.getDocumentsByPlanType(planTypeName);
  
  return {
    plan,
    benefits,
    coverage,
    claims,
    documents
  };
}

/**
 * Convenience function to get fixtures for testing the claim submission and processing flow.
 * Includes sample claims in different states, associated documents, and coverage information.
 * 
 * @param claimType The type of claim to get fixtures for
 * @returns A set of fixtures for testing the claim flow
 */
export function getClaimFlowTestFixtures(claimType: 'medical' | 'exam' | 'therapy' | 'hospital' | 'medication' = 'medical') {
  // Map the claimType parameter to the actual claim type name in Portuguese
  const claimTypeMap = {
    medical: 'Consulta Médica',
    exam: 'Exame',
    therapy: 'Terapia',
    hospital: 'Internação',
    medication: 'Medicamento'
  };
  
  const claimTypeName = claimTypeMap[claimType];
  
  // Get claims of the specified type in different states
  const submittedClaim = claimsFixtures.getClaimByTypeAndStatus(claimTypeName, 'submitted');
  const processingClaim = claimsFixtures.getClaimByTypeAndStatus(claimTypeName, 'processing');
  const approvedClaim = claimsFixtures.getClaimByTypeAndStatus(claimTypeName, 'approved');
  const rejectedClaim = claimsFixtures.getClaimByTypeAndStatus(claimTypeName, 'rejected');
  
  // Get documents associated with these claims
  const claimDocuments = documentsFixtures.getDocumentsByClaim(submittedClaim.id);
  
  // Get coverage information relevant to this claim type
  const coverageInfo = coverageFixtures.getCoverageByClaimType(claimTypeName);
  
  return {
    claims: {
      submitted: submittedClaim,
      processing: processingClaim,
      approved: approvedClaim,
      rejected: rejectedClaim
    },
    documents: claimDocuments,
    coverage: coverageInfo
  };
}

/**
 * Convenience function to get fixtures for testing the plan comparison feature.
 * Includes details for all plan types with their benefits, coverage, and cost information.
 * 
 * @returns A set of fixtures for testing plan comparison
 */
export function getPlanComparisonTestFixtures() {
  // Get all plan types
  const basicPlan = getCompletePlanTestFixtures('basic');
  const standardPlan = getCompletePlanTestFixtures('standard');
  const premiumPlan = getCompletePlanTestFixtures('premium');
  
  return {
    basic: basicPlan,
    standard: standardPlan,
    premium: premiumPlan
  };
}

/**
 * Convenience function to get fixtures for testing document management features.
 * Includes various document types in different verification states.
 * 
 * @returns A set of fixtures for testing document management
 */
export function getDocumentManagementTestFixtures() {
  // Get documents in different verification states
  const pendingDocuments = documentsFixtures.getDocumentsByVerificationStatus('pending');
  const verifiedDocuments = documentsFixtures.getDocumentsByVerificationStatus('verified');
  const rejectedDocuments = documentsFixtures.getDocumentsByVerificationStatus('rejected');
  
  // Get documents of different types
  const policyDocuments = documentsFixtures.getDocumentsByType('policy');
  const receiptDocuments = documentsFixtures.getDocumentsByType('receipt');
  const medicalDocuments = documentsFixtures.getDocumentsByType('medical');
  
  return {
    byStatus: {
      pending: pendingDocuments,
      verified: verifiedDocuments,
      rejected: rejectedDocuments
    },
    byType: {
      policy: policyDocuments,
      receipt: receiptDocuments,
      medical: medicalDocuments
    }
  };
}

/**
 * Convenience function to get fixtures for testing benefit calculation features.
 * Includes benefits with different coverage percentages, limits, and conditions.
 * 
 * @returns A set of fixtures for testing benefit calculation
 */
export function getBenefitCalculationTestFixtures() {
  // Get benefits with different coverage percentages
  const fullCoverageBenefits = benefitsFixtures.getBenefitsByCoveragePercentage(100);
  const partialCoverageBenefits = benefitsFixtures.getBenefitsByCoveragePercentage(80);
  const lowCoverageBenefits = benefitsFixtures.getBenefitsByCoveragePercentage(50);
  
  // Get benefits with different limits
  const unlimitedBenefits = benefitsFixtures.getBenefitsByLimit('unlimited');
  const limitedBenefits = benefitsFixtures.getBenefitsByLimit('limited');
  
  return {
    byCoverage: {
      full: fullCoverageBenefits,
      partial: partialCoverageBenefits,
      low: lowCoverageBenefits
    },
    byLimit: {
      unlimited: unlimitedBenefits,
      limited: limitedBenefits
    }
  };
}