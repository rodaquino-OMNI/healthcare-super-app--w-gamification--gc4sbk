import * as PlanErrors from '../../../../src/journey/plan';
import { Plan } from '../../../../src/journey/plan';
import { ErrorType } from '../../../../src/types';
import { BaseError } from '../../../../src/base';

/**
 * These tests verify that the Plan journey's error index file correctly exports
 * and namespaces all Plan journey error classes. This ensures that client code
 * can import error classes through the expected patterns and that the barrel file
 * structure is properly implemented.
 */
describe('Plan Journey Error Index', () => {
  /**
   * Test the direct exports from the index file
   */
  describe('Direct Exports', () => {
    it('should export all domain namespaces', () => {
      // Verify that all domain namespaces are exported
      expect(PlanErrors.Plans).toBeDefined();
      expect(PlanErrors.Benefits).toBeDefined();
      expect(PlanErrors.Coverage).toBeDefined();
      expect(PlanErrors.Claims).toBeDefined();
      expect(PlanErrors.Documents).toBeDefined();
    });

    it('should export Types and ErrorCodes', () => {
      // Verify that Types and ErrorCodes are exported
      expect(PlanErrors.Types).toBeDefined();
      expect(PlanErrors.ErrorCodes).toBeDefined();
    });
  });

  /**
   * Test the Plan namespace structure
   */
  describe('Plan Namespace', () => {
    it('should export all domain namespaces through Plan namespace', () => {
      // Verify that all domain namespaces are exported through Plan namespace
      expect(Plan.Plans).toBeDefined();
      expect(Plan.Benefits).toBeDefined();
      expect(Plan.Coverage).toBeDefined();
      expect(Plan.Claims).toBeDefined();
      expect(Plan.Documents).toBeDefined();
    });

    it('should export Types and ErrorCodes through Plan namespace', () => {
      // Verify that Types and ErrorCodes are exported through Plan namespace
      expect(Plan.Types).toBeDefined();
      expect(Plan.ErrorCodes).toBeDefined();
    });
  });

  /**
   * Test the Plans domain error classes
   */
  describe('Plans Domain Errors', () => {
    it('should export all Plans error classes', () => {
      // Verify that all Plans error classes are exported
      expect(Plan.Plans.PlanNotFoundError).toBeDefined();
      expect(Plan.Plans.PlanNotAvailableInRegionError).toBeDefined();
      expect(Plan.Plans.PlanSelectionValidationError).toBeDefined();
      expect(Plan.Plans.PlanComparisonError).toBeDefined();
      expect(Plan.Plans.PlanPersistenceError).toBeDefined();
      expect(Plan.Plans.PlanProviderApiError).toBeDefined();
    });

    it('should create proper Plans error instances', () => {
      // Create a Plans error instance
      const planError = new Plan.Plans.PlanNotFoundError('plan123');

      // Verify error properties
      expect(planError).toBeInstanceOf(BaseError);
      expect(planError.type).toBe(ErrorType.BUSINESS);
      expect(planError.code).toBe('PLAN_PLANS_001');
      expect(planError.message).toContain('plan123');
    });
  });

  /**
   * Test the Benefits domain error classes
   */
  describe('Benefits Domain Errors', () => {
    it('should export all Benefits error classes', () => {
      // Verify that all Benefits error classes are exported
      expect(Plan.Benefits.BenefitNotFoundError).toBeDefined();
      expect(Plan.Benefits.BenefitNotCoveredError).toBeDefined();
      expect(Plan.Benefits.BenefitEligibilityError).toBeDefined();
      expect(Plan.Benefits.BenefitLimitExceededError).toBeDefined();
      expect(Plan.Benefits.BenefitPersistenceError).toBeDefined();
      expect(Plan.Benefits.BenefitVerificationApiError).toBeDefined();
    });

    it('should create proper Benefits error instances', () => {
      // Create a Benefits error instance
      const benefitError = new Plan.Benefits.BenefitNotFoundError('benefit123');

      // Verify error properties
      expect(benefitError).toBeInstanceOf(BaseError);
      expect(benefitError.type).toBe(ErrorType.BUSINESS);
      expect(benefitError.code).toBe('PLAN_BENEFITS_001');
      expect(benefitError.message).toContain('benefit123');
    });
  });

  /**
   * Test the Coverage domain error classes
   */
  describe('Coverage Domain Errors', () => {
    it('should export all Coverage error classes', () => {
      // Verify that all Coverage error classes are exported
      expect(Plan.Coverage.CoverageNotFoundError).toBeDefined();
      expect(Plan.Coverage.ServiceNotCoveredError).toBeDefined();
      expect(Plan.Coverage.OutOfNetworkError).toBeDefined();
      expect(Plan.Coverage.CoverageVerificationError).toBeDefined();
      expect(Plan.Coverage.CoveragePersistenceError).toBeDefined();
      expect(Plan.Coverage.CoverageApiIntegrationError).toBeDefined();
    });

    it('should create proper Coverage error instances', () => {
      // Create a Coverage error instance
      const coverageError = new Plan.Coverage.CoverageNotFoundError('coverage123');

      // Verify error properties
      expect(coverageError).toBeInstanceOf(BaseError);
      expect(coverageError.type).toBe(ErrorType.BUSINESS);
      expect(coverageError.code).toBe('PLAN_COVERAGE_001');
      expect(coverageError.message).toContain('coverage123');
    });
  });

  /**
   * Test the Claims domain error classes
   */
  describe('Claims Domain Errors', () => {
    it('should export all Claims error classes', () => {
      // Verify that all Claims error classes are exported
      expect(Plan.Claims.ClaimNotFoundError).toBeDefined();
      expect(Plan.Claims.DuplicateClaimError).toBeDefined();
      expect(Plan.Claims.ClaimValidationError).toBeDefined();
      expect(Plan.Claims.ClaimDeniedError).toBeDefined();
      expect(Plan.Claims.ClaimPersistenceError).toBeDefined();
      expect(Plan.Claims.ClaimProcessingApiError).toBeDefined();
      expect(Plan.Claims.ClaimDocumentError).toBeDefined();
      expect(Plan.Claims.InvalidClaimStatusTransitionError).toBeDefined();
      expect(Plan.Claims.ClaimAdditionalInfoRequiredError).toBeDefined();
    });

    it('should create proper Claims error instances', () => {
      // Create a Claims error instance
      const claimError = new Plan.Claims.ClaimNotFoundError('claim123');

      // Verify error properties
      expect(claimError).toBeInstanceOf(BaseError);
      expect(claimError.type).toBe(ErrorType.BUSINESS);
      expect(claimError.code).toBe('PLAN_CLAIMS_001');
      expect(claimError.message).toContain('claim123');
    });
  });

  /**
   * Test the Documents domain error classes
   */
  describe('Documents Domain Errors', () => {
    it('should export all Documents error classes', () => {
      // Verify that all Documents error classes are exported
      expect(Plan.Documents.DocumentNotFoundError).toBeDefined();
      expect(Plan.Documents.DocumentFormatError).toBeDefined();
      expect(Plan.Documents.DocumentSizeExceededError).toBeDefined();
      expect(Plan.Documents.DocumentExpirationError).toBeDefined();
      expect(Plan.Documents.DocumentStorageError).toBeDefined();
      expect(Plan.Documents.DocumentVerificationError).toBeDefined();
      expect(Plan.Documents.DocumentProcessingError).toBeDefined();
    });

    it('should create proper Documents error instances', () => {
      // Create a Documents error instance
      const documentError = new Plan.Documents.DocumentNotFoundError('document123');

      // Verify error properties
      expect(documentError).toBeInstanceOf(BaseError);
      expect(documentError.type).toBe(ErrorType.BUSINESS);
      expect(documentError.code).toBe('PLAN_DOCUMENTS_001');
      expect(documentError.message).toContain('document123');
    });
  });

  /**
   * Test the Types and ErrorCodes exports
   */
  describe('Types and ErrorCodes', () => {
    it('should export all error type enums', () => {
      // Verify that all error type enums are exported
      expect(Plan.Types.PlanErrorDomain).toBeDefined();
      expect(Plan.Types.PlanErrorType).toBeDefined();
      expect(Plan.Types.BenefitErrorType).toBeDefined();
      expect(Plan.Types.CoverageErrorType).toBeDefined();
      expect(Plan.Types.ClaimErrorType).toBeDefined();
      expect(Plan.Types.DocumentErrorType).toBeDefined();
    });

    it('should export all error code constants', () => {
      // Verify that all error code constants are exported
      expect(Plan.ErrorCodes.PLAN_ERROR_CODES).toBeDefined();
      expect(Plan.ErrorCodes.PLAN_ERROR_CODES.PLAN_NOT_FOUND).toBe('PLAN_PLANS_001');
      expect(Plan.ErrorCodes.PLAN_ERROR_CODES.BENEFIT_NOT_FOUND).toBe('PLAN_BENEFITS_001');
      expect(Plan.ErrorCodes.PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED).toBe('PLAN_COVERAGE_001');
      expect(Plan.ErrorCodes.PLAN_ERROR_CODES.CLAIM_NOT_FOUND).toBe('PLAN_CLAIMS_001');
      expect(Plan.ErrorCodes.PLAN_ERROR_CODES.DOCUMENT_NOT_FOUND).toBe('PLAN_DOCUMENTS_001');
    });
  });

  /**
   * Test the type guards
   */
  describe('Type Guards', () => {
    it('should export type guard functions', () => {
      // Verify that all type guard functions are exported
      expect(Plan.Types.isPlanError).toBeDefined();
      expect(Plan.Types.isPlansDomainError).toBeDefined();
      expect(Plan.Types.isBenefitsDomainError).toBeDefined();
      expect(Plan.Types.isCoverageDomainError).toBeDefined();
      expect(Plan.Types.isClaimsDomainError).toBeDefined();
      expect(Plan.Types.isDocumentsDomainError).toBeDefined();
    });

    it('should correctly identify Plan errors', () => {
      // Create a Plan error
      const planError = new Plan.Plans.PlanNotFoundError('plan123');
      
      // Convert to error details format
      const errorDetails = {
        code: planError.code,
        type: planError.type,
        message: planError.message,
        context: {
          domain: Plan.Types.PlanErrorDomain.PLANS,
          data: { planId: 'plan123' }
        }
      };

      // Verify type guards
      expect(Plan.Types.isPlanError(errorDetails)).toBe(true);
      expect(Plan.Types.isPlansDomainError(errorDetails)).toBe(true);
      expect(Plan.Types.isBenefitsDomainError(errorDetails)).toBe(false);
    });
  });

  /**
   * Test import patterns
   */
  describe('Import Patterns', () => {
    it('should support direct import of domain namespaces', () => {
      // Import domain namespace directly
      const { Claims } = PlanErrors;
      
      // Create error using domain namespace
      const claimError = new Claims.ClaimNotFoundError('claim123');
      
      // Verify error properties
      expect(claimError).toBeInstanceOf(BaseError);
      expect(claimError.code).toBe('PLAN_CLAIMS_001');
    });

    it('should support direct import of error classes', () => {
      // Import error class directly
      const { ClaimNotFoundError } = PlanErrors.Claims;
      
      // Create error using direct import
      const claimError = new ClaimNotFoundError('claim123');
      
      // Verify error properties
      expect(claimError).toBeInstanceOf(BaseError);
      expect(claimError.code).toBe('PLAN_CLAIMS_001');
    });

    it('should support namespace import pattern', () => {
      // Create error using namespace pattern
      const claimError = new Plan.Claims.ClaimNotFoundError('claim123');
      
      // Verify error properties
      expect(claimError).toBeInstanceOf(BaseError);
      expect(claimError.code).toBe('PLAN_CLAIMS_001');
    });
  });

  /**
   * Test error inheritance and structure
   */
  describe('Error Inheritance', () => {
    it('should ensure all errors extend BaseError', () => {
      // Create errors from each domain
      const planError = new Plan.Plans.PlanNotFoundError('plan123');
      const benefitError = new Plan.Benefits.BenefitNotFoundError('benefit123');
      const coverageError = new Plan.Coverage.CoverageNotFoundError('coverage123');
      const claimError = new Plan.Claims.ClaimNotFoundError('claim123');
      const documentError = new Plan.Documents.DocumentNotFoundError('document123');
      
      // Verify all errors extend BaseError
      expect(planError).toBeInstanceOf(BaseError);
      expect(benefitError).toBeInstanceOf(BaseError);
      expect(coverageError).toBeInstanceOf(BaseError);
      expect(claimError).toBeInstanceOf(BaseError);
      expect(documentError).toBeInstanceOf(BaseError);
    });

    it('should maintain consistent error structure', () => {
      // Create an error
      const claimError = new Plan.Claims.ClaimNotFoundError('claim123');
      
      // Verify error structure
      expect(claimError).toHaveProperty('message');
      expect(claimError).toHaveProperty('type');
      expect(claimError).toHaveProperty('code');
      expect(claimError).toHaveProperty('context');
      expect(claimError).toHaveProperty('toJSON');
      expect(claimError).toHaveProperty('toHttpException');
    });
  });
});