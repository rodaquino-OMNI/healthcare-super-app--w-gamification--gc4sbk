import { BusinessError } from '../../categories/business.errors';
import { ErrorType } from '../../types';

/**
 * Error thrown when there's an issue with plan benefits
 */
export class PlanBenefitError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'PLAN_BENEFIT_ERROR',
      details
    );
    this.name = 'PlanBenefitError';
  }
}

/**
 * Error thrown when there's an issue with claims
 */
export class ClaimError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'CLAIM_ERROR',
      details
    );
    this.name = 'ClaimError';
  }
}

/**
 * Error thrown when there's an issue with coverage
 */
export class CoverageError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'COVERAGE_ERROR',
      details
    );
    this.name = 'CoverageError';
  }
}

/**
 * Error thrown when there's an issue with documents
 */
export class DocumentError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'DOCUMENT_ERROR',
      details
    );
    this.name = 'DocumentError';
  }
}

/**
 * Error thrown when there's an issue with plan selection
 */
export class PlanSelectionError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'PLAN_SELECTION_ERROR',
      details
    );
    this.name = 'PlanSelectionError';
  }
}

export * from './types';