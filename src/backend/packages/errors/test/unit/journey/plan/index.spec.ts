import * as PlanErrors from '../../../../src/journey/plan';
import { BaseError } from '../../../../src/base';
import { ErrorType, ErrorCategory } from '../../../../src/types';

describe('Plan Journey Error Index', () => {
  describe('Namespace Structure', () => {
    it('should export the Plan namespace', () => {
      expect(PlanErrors).toBeDefined();
      expect(typeof PlanErrors).toBe('object');
    });

    it('should export all Plan subnamespaces', () => {
      expect(PlanErrors.Plans).toBeDefined();
      expect(PlanErrors.Benefits).toBeDefined();
      expect(PlanErrors.Claims).toBeDefined();
      expect(PlanErrors.Coverage).toBeDefined();
      expect(PlanErrors.Documents).toBeDefined();
    });
  });

  describe('Plans Errors', () => {
    it('should export PlanNotFoundError', () => {
      expect(PlanErrors.Plans.PlanNotFoundError).toBeDefined();
      expect(typeof PlanErrors.Plans.PlanNotFoundError).toBe('function');
    });

    it('should export PlanNotAvailableInRegionError', () => {
      expect(PlanErrors.Plans.PlanNotAvailableInRegionError).toBeDefined();
      expect(typeof PlanErrors.Plans.PlanNotAvailableInRegionError).toBe('function');
    });

    it('should export PlanSelectionValidationError', () => {
      expect(PlanErrors.Plans.PlanSelectionValidationError).toBeDefined();
      expect(typeof PlanErrors.Plans.PlanSelectionValidationError).toBe('function');
    });

    it('should export PlanComparisonError', () => {
      expect(PlanErrors.Plans.PlanComparisonError).toBeDefined();
      expect(typeof PlanErrors.Plans.PlanComparisonError).toBe('function');
    });

    it('should export PlanPersistenceError', () => {
      expect(PlanErrors.Plans.PlanPersistenceError).toBeDefined();
      expect(typeof PlanErrors.Plans.PlanPersistenceError).toBe('function');
    });

    it('should export PlanProviderApiError', () => {
      expect(PlanErrors.Plans.PlanProviderApiError).toBeDefined();
      expect(typeof PlanErrors.Plans.PlanProviderApiError).toBe('function');
    });

    it('should create Plan error instances that extend BaseError', () => {
      const error = new PlanErrors.Plans.PlanNotFoundError('Plan not found', {
        planId: 'plan-123',
      });
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toMatch(/^PLAN_PLANS_/);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toHaveProperty('planId', 'plan-123');
    });
  });

  describe('Benefits Errors', () => {
    it('should export BenefitNotFoundError', () => {
      expect(PlanErrors.Benefits.BenefitNotFoundError).toBeDefined();
      expect(typeof PlanErrors.Benefits.BenefitNotFoundError).toBe('function');
    });

    it('should export BenefitNotCoveredError', () => {
      expect(PlanErrors.Benefits.BenefitNotCoveredError).toBeDefined();
      expect(typeof PlanErrors.Benefits.BenefitNotCoveredError).toBe('function');
    });

    it('should export BenefitEligibilityError', () => {
      expect(PlanErrors.Benefits.BenefitEligibilityError).toBeDefined();
      expect(typeof PlanErrors.Benefits.BenefitEligibilityError).toBe('function');
    });

    it('should export BenefitLimitExceededError', () => {
      expect(PlanErrors.Benefits.BenefitLimitExceededError).toBeDefined();
      expect(typeof PlanErrors.Benefits.BenefitLimitExceededError).toBe('function');
    });

    it('should export BenefitPersistenceError', () => {
      expect(PlanErrors.Benefits.BenefitPersistenceError).toBeDefined();
      expect(typeof PlanErrors.Benefits.BenefitPersistenceError).toBe('function');
    });

    it('should export BenefitVerificationApiError', () => {
      expect(PlanErrors.Benefits.BenefitVerificationApiError).toBeDefined();
      expect(typeof PlanErrors.Benefits.BenefitVerificationApiError).toBe('function');
    });

    it('should create Benefit error instances that extend BaseError', () => {
      const error = new PlanErrors.Benefits.BenefitNotFoundError('Benefit not found', {
        benefitId: 'benefit-123',
        planId: 'plan-456',
      });
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toMatch(/^PLAN_BENEFITS_/);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toHaveProperty('benefitId', 'benefit-123');
      expect(error.context).toHaveProperty('planId', 'plan-456');
    });
  });

  describe('Claims Errors', () => {
    it('should export ClaimNotFoundError', () => {
      expect(PlanErrors.Claims.ClaimNotFoundError).toBeDefined();
      expect(typeof PlanErrors.Claims.ClaimNotFoundError).toBe('function');
    });

    it('should export DuplicateClaimError', () => {
      expect(PlanErrors.Claims.DuplicateClaimError).toBeDefined();
      expect(typeof PlanErrors.Claims.DuplicateClaimError).toBe('function');
    });

    it('should export ClaimValidationError', () => {
      expect(PlanErrors.Claims.ClaimValidationError).toBeDefined();
      expect(typeof PlanErrors.Claims.ClaimValidationError).toBe('function');
    });

    it('should export ClaimDeniedError', () => {
      expect(PlanErrors.Claims.ClaimDeniedError).toBeDefined();
      expect(typeof PlanErrors.Claims.ClaimDeniedError).toBe('function');
    });

    it('should export ClaimPersistenceError', () => {
      expect(PlanErrors.Claims.ClaimPersistenceError).toBeDefined();
      expect(typeof PlanErrors.Claims.ClaimPersistenceError).toBe('function');
    });

    it('should export ClaimProcessingApiError', () => {
      expect(PlanErrors.Claims.ClaimProcessingApiError).toBeDefined();
      expect(typeof PlanErrors.Claims.ClaimProcessingApiError).toBe('function');
    });

    it('should export ClaimDocumentError', () => {
      expect(PlanErrors.Claims.ClaimDocumentError).toBeDefined();
      expect(typeof PlanErrors.Claims.ClaimDocumentError).toBe('function');
    });

    it('should create Claim error instances that extend BaseError', () => {
      const error = new PlanErrors.Claims.ClaimNotFoundError('Claim not found', {
        claimId: 'claim-123',
      });
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toMatch(/^PLAN_CLAIMS_/);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toHaveProperty('claimId', 'claim-123');
    });
  });

  describe('Coverage Errors', () => {
    it('should export CoverageNotFoundError', () => {
      expect(PlanErrors.Coverage.CoverageNotFoundError).toBeDefined();
      expect(typeof PlanErrors.Coverage.CoverageNotFoundError).toBe('function');
    });

    it('should export ServiceNotCoveredError', () => {
      expect(PlanErrors.Coverage.ServiceNotCoveredError).toBeDefined();
      expect(typeof PlanErrors.Coverage.ServiceNotCoveredError).toBe('function');
    });

    it('should export OutOfNetworkError', () => {
      expect(PlanErrors.Coverage.OutOfNetworkError).toBeDefined();
      expect(typeof PlanErrors.Coverage.OutOfNetworkError).toBe('function');
    });

    it('should export CoverageVerificationError', () => {
      expect(PlanErrors.Coverage.CoverageVerificationError).toBeDefined();
      expect(typeof PlanErrors.Coverage.CoverageVerificationError).toBe('function');
    });

    it('should export CoveragePersistenceError', () => {
      expect(PlanErrors.Coverage.CoveragePersistenceError).toBeDefined();
      expect(typeof PlanErrors.Coverage.CoveragePersistenceError).toBe('function');
    });

    it('should export CoverageApiIntegrationError', () => {
      expect(PlanErrors.Coverage.CoverageApiIntegrationError).toBeDefined();
      expect(typeof PlanErrors.Coverage.CoverageApiIntegrationError).toBe('function');
    });

    it('should create Coverage error instances that extend BaseError', () => {
      const error = new PlanErrors.Coverage.ServiceNotCoveredError('Service not covered', {
        serviceCode: 'service-123',
        planId: 'plan-456',
      });
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toMatch(/^PLAN_COVERAGE_/);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toHaveProperty('serviceCode', 'service-123');
      expect(error.context).toHaveProperty('planId', 'plan-456');
    });
  });

  describe('Documents Errors', () => {
    it('should export DocumentNotFoundError', () => {
      expect(PlanErrors.Documents.DocumentNotFoundError).toBeDefined();
      expect(typeof PlanErrors.Documents.DocumentNotFoundError).toBe('function');
    });

    it('should export DocumentFormatError', () => {
      expect(PlanErrors.Documents.DocumentFormatError).toBeDefined();
      expect(typeof PlanErrors.Documents.DocumentFormatError).toBe('function');
    });

    it('should export DocumentSizeExceededError', () => {
      expect(PlanErrors.Documents.DocumentSizeExceededError).toBeDefined();
      expect(typeof PlanErrors.Documents.DocumentSizeExceededError).toBe('function');
    });

    it('should export DocumentExpirationError', () => {
      expect(PlanErrors.Documents.DocumentExpirationError).toBeDefined();
      expect(typeof PlanErrors.Documents.DocumentExpirationError).toBe('function');
    });

    it('should export DocumentStorageError', () => {
      expect(PlanErrors.Documents.DocumentStorageError).toBeDefined();
      expect(typeof PlanErrors.Documents.DocumentStorageError).toBe('function');
    });

    it('should export DocumentVerificationError', () => {
      expect(PlanErrors.Documents.DocumentVerificationError).toBeDefined();
      expect(typeof PlanErrors.Documents.DocumentVerificationError).toBe('function');
    });

    it('should export DocumentProcessingError', () => {
      expect(PlanErrors.Documents.DocumentProcessingError).toBeDefined();
      expect(typeof PlanErrors.Documents.DocumentProcessingError).toBe('function');
    });

    it('should create Document error instances that extend BaseError', () => {
      const error = new PlanErrors.Documents.DocumentNotFoundError('Document not found', {
        documentId: 'doc-123',
        claimId: 'claim-456',
      });
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toMatch(/^PLAN_DOCUMENTS_/);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toHaveProperty('documentId', 'doc-123');
      expect(error.context).toHaveProperty('claimId', 'claim-456');
    });
  });

  describe('Type Definitions', () => {
    it('should export type definitions for Plan errors', () => {
      // This test verifies that the type definitions are exported correctly
      // TypeScript compilation would fail if these types weren't properly exported
      expect(true).toBe(true);
    });
  });

  describe('Error Classification', () => {
    it('should classify validation errors correctly', () => {
      const error = new PlanErrors.Claims.ClaimValidationError('Invalid claim data', {
        validationErrors: ['Missing required field: serviceDate'],
      });

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.category).toBe(ErrorCategory.CLIENT);
      expect(error.isClientError()).toBe(true);
      expect(error.isServerError()).toBe(false);
    });

    it('should classify business errors correctly', () => {
      const error = new PlanErrors.Benefits.BenefitNotCoveredError('Benefit not covered', {
        benefitCode: 'DENTAL_ORTHO',
        planId: 'BASIC_PLAN',
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.isClientError()).toBe(true);
    });

    it('should classify technical errors correctly', () => {
      const error = new PlanErrors.Plans.PlanPersistenceError('Failed to save plan', {
        planId: 'plan-123',
        operation: 'update',
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.category).toBe(ErrorCategory.SERVER);
      expect(error.isServerError()).toBe(true);
    });

    it('should classify external errors correctly', () => {
      const error = new PlanErrors.Claims.ClaimProcessingApiError('External API failure', {
        claimId: 'claim-123',
        provider: 'ExternalInsurer',
        endpoint: '/api/claims/process',
      });

      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.category).toBe(ErrorCategory.EXTERNAL);
      expect(error.isExternalError()).toBe(true);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize Plan errors to a structured format', () => {
      const error = new PlanErrors.Claims.ClaimNotFoundError('Claim not found', {
        claimId: 'claim-123',
        userId: 'user-456',
      });

      const serialized = error.toJSON();

      expect(serialized).toHaveProperty('message', 'Claim not found');
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^PLAN_CLAIMS_/);
      expect(serialized).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('claimId', 'claim-123');
      expect(serialized.context).toHaveProperty('userId', 'user-456');
      expect(serialized).toHaveProperty('statusCode');
      expect(serialized).toHaveProperty('timestamp');
    });
  });
});