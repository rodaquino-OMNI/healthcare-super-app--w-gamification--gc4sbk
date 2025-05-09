/**
 * @file Plan journey-specific error classes for the AUSTA SuperApp
 * @description This file serves as the primary barrel file for all Plan journey-specific errors,
 * providing a centralized export point for Plans, Benefits, Coverage, Claims, and Documents error classes.
 * 
 * The error classes are organized by domain to ensure consistent error handling
 * across the Plan journey. Each domain has its own namespace with specific error classes.
 * 
 * @example
 * // Import all Plan journey errors
 * import * as Plan from '@austa/errors/journey/plan';
 * 
 * // Use domain-specific errors
 * throw new Plan.Plans.PlanNotFoundError('Plan not found');
 * throw new Plan.Benefits.BenefitNotCoveredError('Benefit not covered by plan');
 * throw new Plan.Coverage.ServiceNotCoveredError('Service not covered');
 * throw new Plan.Claims.ClaimNotFoundError('Claim not found');
 * throw new Plan.Documents.DocumentNotFoundError('Document not found');
 */

// Import domain-specific error modules
import * as Plans from './plans-errors';
import * as Benefits from './benefits-errors';
import * as Coverage from './coverage-errors';
import * as Claims from './claims-errors';
import * as Documents from './documents-errors';

// Import error types and codes
import * as Types from './types';
import * as ErrorCodes from './error-codes';

/**
 * Re-export all domain-specific error modules
 */
export {
  Plans,
  Benefits,
  Coverage,
  Claims,
  Documents,
  Types,
  ErrorCodes
};

/**
 * @namespace Plans
 * @description Plan journey-specific error classes for plan selection, comparison, and management
 */

/**
 * @namespace Benefits
 * @description Plan journey-specific error classes for benefit lookup, utilization tracking, and eligibility verification
 */

/**
 * @namespace Coverage
 * @description Plan journey-specific error classes for coverage verification, network provider validation, and service eligibility checks
 */

/**
 * @namespace Claims
 * @description Plan journey-specific error classes for claim submission, status tracking, and processing
 */

/**
 * @namespace Documents
 * @description Plan journey-specific error classes for document upload, verification, and management
 */