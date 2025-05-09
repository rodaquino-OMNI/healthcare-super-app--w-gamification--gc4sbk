import * as PlanErrors from '../../../../src/journey/plan';
import { ErrorType, JourneyContext } from '../../../../src/base';
import { BusinessError } from '../../../../src/categories/business.errors';

describe('Plan Journey Error Index', () => {
  describe('Error Class Exports', () => {
    it('should export all Plan journey error classes', () => {
      // Verify that all expected error classes are exported
      expect(PlanErrors.PlanBenefitError).toBeDefined();
      expect(PlanErrors.ClaimError).toBeDefined();
      expect(PlanErrors.CoverageError).toBeDefined();
      expect(PlanErrors.DocumentError).toBeDefined();
      expect(PlanErrors.PlanSelectionError).toBeDefined();
    });

    it('should export types from types.ts', () => {
      // Verify that types are exported
      expect(PlanErrors.PlanErrorType).toBeDefined();
      expect(PlanErrors.ClaimStatus).toBeDefined();
      expect(PlanErrors.CoverageStatus).toBeDefined();
      expect(PlanErrors.DocumentStatus).toBeDefined();
      expect(PlanErrors.PlanStatus).toBeDefined();
    });
  });

  describe('Error Class Instantiation', () => {
    it('should create PlanBenefitError with correct properties', () => {
      const error = new PlanErrors.PlanBenefitError('Benefit not available', { benefitId: '123' });
      
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('PlanBenefitError');
      expect(error.message).toBe('Benefit not available');
      expect(error.code).toBe('PLAN_BENEFIT_ERROR');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.details).toEqual({ benefitId: '123' });
    });

    it('should create ClaimError with correct properties', () => {
      const error = new PlanErrors.ClaimError('Claim processing failed', { claimId: '456' });
      
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('ClaimError');
      expect(error.message).toBe('Claim processing failed');
      expect(error.code).toBe('CLAIM_ERROR');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.details).toEqual({ claimId: '456' });
    });

    it('should create CoverageError with correct properties', () => {
      const error = new PlanErrors.CoverageError('Service not covered', { serviceId: '789' });
      
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('CoverageError');
      expect(error.message).toBe('Service not covered');
      expect(error.code).toBe('COVERAGE_ERROR');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.details).toEqual({ serviceId: '789' });
    });

    it('should create DocumentError with correct properties', () => {
      const error = new PlanErrors.DocumentError('Document upload failed', { documentId: '101' });
      
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('DocumentError');
      expect(error.message).toBe('Document upload failed');
      expect(error.code).toBe('DOCUMENT_ERROR');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.details).toEqual({ documentId: '101' });
    });

    it('should create PlanSelectionError with correct properties', () => {
      const error = new PlanErrors.PlanSelectionError('Plan not available in region', { planId: '202', region: 'Northeast' });
      
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('PlanSelectionError');
      expect(error.message).toBe('Plan not available in region');
      expect(error.code).toBe('PLAN_SELECTION_ERROR');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.details).toEqual({ planId: '202', region: 'Northeast' });
    });
  });

  describe('Error Serialization', () => {
    it('should serialize Plan journey errors correctly', () => {
      const error = new PlanErrors.ClaimError('Claim processing failed', { claimId: '456' });
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', 'CLAIM_ERROR');
      expect(serialized.error).toHaveProperty('message', 'Claim processing failed');
      expect(serialized.error).toHaveProperty('details');
      expect(serialized.error.details).toEqual({ claimId: '456' });
    });

    it('should convert Plan journey errors to HTTP exceptions with correct status codes', () => {
      const error = new PlanErrors.CoverageError('Service not covered');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(422); // UNPROCESSABLE_ENTITY for business errors
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });
  });

  describe('Error Type Enums', () => {
    it('should define correct Plan error types', () => {
      expect(PlanErrors.PlanErrorType.BENEFIT).toBe('BENEFIT');
      expect(PlanErrors.PlanErrorType.CLAIM).toBe('CLAIM');
      expect(PlanErrors.PlanErrorType.COVERAGE).toBe('COVERAGE');
      expect(PlanErrors.PlanErrorType.DOCUMENT).toBe('DOCUMENT');
      expect(PlanErrors.PlanErrorType.PLAN_SELECTION).toBe('PLAN_SELECTION');
    });

    it('should define correct Claim status values', () => {
      expect(PlanErrors.ClaimStatus.SUBMITTED).toBe('submitted');
      expect(PlanErrors.ClaimStatus.IN_REVIEW).toBe('in_review');
      expect(PlanErrors.ClaimStatus.APPROVED).toBe('approved');
      expect(PlanErrors.ClaimStatus.DENIED).toBe('denied');
      expect(PlanErrors.ClaimStatus.PENDING_INFORMATION).toBe('pending_information');
    });

    it('should define correct Coverage status values', () => {
      expect(PlanErrors.CoverageStatus.COVERED).toBe('covered');
      expect(PlanErrors.CoverageStatus.NOT_COVERED).toBe('not_covered');
      expect(PlanErrors.CoverageStatus.PARTIALLY_COVERED).toBe('partially_covered');
      expect(PlanErrors.CoverageStatus.REQUIRES_PREAUTHORIZATION).toBe('requires_preauthorization');
      expect(PlanErrors.CoverageStatus.REQUIRES_REFERRAL).toBe('requires_referral');
    });

    it('should define correct Document status values', () => {
      expect(PlanErrors.DocumentStatus.PENDING).toBe('pending');
      expect(PlanErrors.DocumentStatus.APPROVED).toBe('approved');
      expect(PlanErrors.DocumentStatus.REJECTED).toBe('rejected');
      expect(PlanErrors.DocumentStatus.EXPIRED).toBe('expired');
    });

    it('should define correct Plan status values', () => {
      expect(PlanErrors.PlanStatus.ACTIVE).toBe('active');
      expect(PlanErrors.PlanStatus.INACTIVE).toBe('inactive');
      expect(PlanErrors.PlanStatus.PENDING).toBe('pending');
      expect(PlanErrors.PlanStatus.EXPIRED).toBe('expired');
    });
  });

  describe('Error Context and Journey Integration', () => {
    it('should support adding Plan journey context to errors', () => {
      const error = new PlanErrors.ClaimError('Claim processing failed')
        .withContext({ journey: JourneyContext.PLAN, userId: '123', requestId: 'req-456' });
      
      expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
      expect(error.context).toHaveProperty('userId', '123');
      expect(error.context).toHaveProperty('requestId', 'req-456');
    });

    it('should support adding suggestions to Plan journey errors', () => {
      const error = new PlanErrors.DocumentError('Document upload failed')
        .withSuggestion('Try uploading a smaller file or a different format');
      
      expect(error.suggestion).toBe('Try uploading a smaller file or a different format');
      
      const serialized = error.toJSON();
      expect(serialized.error).toHaveProperty('suggestion', 'Try uploading a smaller file or a different format');
    });

    it('should support adding cause to Plan journey errors', () => {
      const cause = new Error('Network error');
      const error = new PlanErrors.PlanSelectionError('Failed to retrieve plan details')
        .withCause(cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('Error Inheritance and Type Safety', () => {
    it('should maintain proper inheritance chain for Plan journey errors', () => {
      const benefitError = new PlanErrors.PlanBenefitError('Benefit not available');
      const claimError = new PlanErrors.ClaimError('Claim processing failed');
      const coverageError = new PlanErrors.CoverageError('Service not covered');
      const documentError = new PlanErrors.DocumentError('Document upload failed');
      const planSelectionError = new PlanErrors.PlanSelectionError('Plan not available in region');
      
      // All should be instances of BusinessError
      expect(benefitError).toBeInstanceOf(BusinessError);
      expect(claimError).toBeInstanceOf(BusinessError);
      expect(coverageError).toBeInstanceOf(BusinessError);
      expect(documentError).toBeInstanceOf(BusinessError);
      expect(planSelectionError).toBeInstanceOf(BusinessError);
      
      // Each should have its own class type
      expect(benefitError.name).toBe('PlanBenefitError');
      expect(claimError.name).toBe('ClaimError');
      expect(coverageError.name).toBe('CoverageError');
      expect(documentError.name).toBe('DocumentError');
      expect(planSelectionError.name).toBe('PlanSelectionError');
    });
  });
});