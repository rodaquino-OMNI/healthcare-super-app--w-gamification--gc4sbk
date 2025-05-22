/**
 * @file Plan Journey Error Index
 * @description Primary barrel file for all Plan journey-specific error classes.
 * This file provides a centralized export point for Plans, Benefits, Coverage, Claims, and Documents errors,
 * enabling consistent error handling across the Plan journey.
 *
 * @module @austa/errors/journey/plan
 */

// Import error types and codes
import * as Types from './types';
import * as ErrorCodes from './error-codes';

// Import domain-specific error modules
import * as Plans from './plans-errors';
import * as Benefits from './benefits-errors';
import * as Coverage from './coverage-errors';
import * as Claims from './claims-errors';
import * as Documents from './documents-errors';

/**
 * Re-export all Plan journey error types and codes
 */
export { Types, ErrorCodes };

/**
 * Re-export all Plan journey domain-specific error modules
 * This enables consumers to import errors in a structured way:
 * 
 * @example
 * // Import specific domain namespace
 * import { Claims } from '@austa/errors/journey/plan';
 * 
 * // Use domain-specific errors
 * throw new Claims.ClaimNotFoundError('Claim not found', {
 *   claimId: '12345',
 *   userId: 'user-789'
 * });
 *
 * @example
 * // Import specific error class directly
 * import { Claims } from '@austa/errors/journey/plan';
 * const { ClaimNotFoundError } = Claims;
 * 
 * // Use the error class
 * throw new ClaimNotFoundError('Claim not found', {
 *   claimId: '12345',
 *   userId: 'user-789'
 * });
 */
export {
  Plans,
  Benefits,
  Coverage,
  Claims,
  Documents
};

/**
 * Plan Journey Error Namespace
 * Provides a structured way to access all Plan journey-specific error classes.
 * 
 * @namespace
 */
export namespace Plan {
  /**
   * Plan Error Types and Codes
   * Contains type definitions and error code constants for the Plan journey.
   */
  export import Types = Types;
  export import ErrorCodes = ErrorCodes;
  
  /**
   * Plans Domain Error Namespace
   * Contains all error classes specific to plan selection, comparison, and management.
   * 
   * @namespace
   */
  export import Plans = Plans;
  
  /**
   * Benefits Domain Error Namespace
   * Contains all error classes specific to benefit lookup, utilization tracking, and eligibility verification.
   * 
   * @namespace
   */
  export import Benefits = Benefits;
  
  /**
   * Coverage Domain Error Namespace
   * Contains all error classes specific to coverage verification, network provider validation, and service eligibility checks.
   * 
   * @namespace
   */
  export import Coverage = Coverage;
  
  /**
   * Claims Domain Error Namespace
   * Contains all error classes specific to claim submission, status tracking, and processing.
   * 
   * @namespace
   */
  export import Claims = Claims;
  
  /**
   * Documents Domain Error Namespace
   * Contains all error classes specific to document upload, verification, and management.
   * 
   * @namespace
   */
  export import Documents = Documents;
}