import { describe, expect, it, jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the provider error classes and related types
import {
  ProviderNotFoundError,
  ProviderUnavailableError,
  ProviderSpecialtyMismatchError,
  ProviderCredentialsError,
  ProviderDirectoryError
} from '../../../../src/journey/care/provider-errors';
import { ErrorType, ErrorCategory } from '../../../../src/types';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';

/**
 * Test suite for Care journey provider error classes
 * Verifies error code prefixing, context capture, classification, and HTTP status code mapping
 */
describe('Care Journey Provider Errors', () => {
  // Sample provider data for testing
  const providerId = 'provider-123';
  const providerName = 'Dr. Jane Smith';
  const specialty = 'cardiology';
  const requestedSpecialty = 'neurology';
  const availability = {
    startDate: new Date('2023-06-01'),
    endDate: new Date('2023-06-30'),
    slots: ['morning', 'afternoon']
  };

  describe('ProviderNotFoundError', () => {
    it('should create error with CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderNotFoundError(providerId);

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should capture provider ID in error context', () => {
      const error = new ProviderNotFoundError(providerId);

      expect(error.context).toBeDefined();
      expect(error.context.provider).toBeDefined();
      expect(error.context.provider.id).toBe(providerId);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new ProviderNotFoundError(providerId);

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to NOT_FOUND HTTP status code', () => {
      const error = new ProviderNotFoundError(providerId);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should include provider ID in error message', () => {
      const error = new ProviderNotFoundError(providerId);

      expect(error.message).toContain(providerId);
    });
  });

  describe('ProviderUnavailableError', () => {
    it('should create error with CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderUnavailableError(providerId, providerName, availability);

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should capture provider availability details in error context', () => {
      const error = new ProviderUnavailableError(providerId, providerName, availability);

      expect(error.context).toBeDefined();
      expect(error.context.provider).toBeDefined();
      expect(error.context.provider.id).toBe(providerId);
      expect(error.context.provider.name).toBe(providerName);
      expect(error.context.provider.availability).toEqual(availability);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new ProviderUnavailableError(providerId, providerName, availability);

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to CONFLICT HTTP status code', () => {
      const error = new ProviderUnavailableError(providerId, providerName, availability);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should include provider name and availability information in error message', () => {
      const error = new ProviderUnavailableError(providerId, providerName, availability);

      expect(error.message).toContain(providerName);
      expect(error.message).toContain('unavailable');
    });
  });

  describe('ProviderSpecialtyMismatchError', () => {
    it('should create error with CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderSpecialtyMismatchError(providerId, providerName, specialty, requestedSpecialty);

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should capture provider specialty details in error context', () => {
      const error = new ProviderSpecialtyMismatchError(providerId, providerName, specialty, requestedSpecialty);

      expect(error.context).toBeDefined();
      expect(error.context.provider).toBeDefined();
      expect(error.context.provider.id).toBe(providerId);
      expect(error.context.provider.name).toBe(providerName);
      expect(error.context.provider.specialty).toBe(specialty);
      expect(error.context.provider.requestedSpecialty).toBe(requestedSpecialty);
    });

    it('should be classified as a VALIDATION error type', () => {
      const error = new ProviderSpecialtyMismatchError(providerId, providerName, specialty, requestedSpecialty);

      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should map to BAD_REQUEST HTTP status code', () => {
      const error = new ProviderSpecialtyMismatchError(providerId, providerName, specialty, requestedSpecialty);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should include specialty mismatch details in error message', () => {
      const error = new ProviderSpecialtyMismatchError(providerId, providerName, specialty, requestedSpecialty);

      expect(error.message).toContain(providerName);
      expect(error.message).toContain(specialty);
      expect(error.message).toContain(requestedSpecialty);
    });
  });

  describe('ProviderCredentialsError', () => {
    it('should create error with CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderCredentialsError(providerId, providerName);

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should capture provider details in error context', () => {
      const error = new ProviderCredentialsError(providerId, providerName);

      expect(error.context).toBeDefined();
      expect(error.context.provider).toBeDefined();
      expect(error.context.provider.id).toBe(providerId);
      expect(error.context.provider.name).toBe(providerName);
    });

    it('should be classified as a VALIDATION error type', () => {
      const error = new ProviderCredentialsError(providerId, providerName);

      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should map to UNAUTHORIZED HTTP status code', () => {
      const error = new ProviderCredentialsError(providerId, providerName);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should include provider name in error message', () => {
      const error = new ProviderCredentialsError(providerId, providerName);

      expect(error.message).toContain(providerName);
      expect(error.message).toContain('credentials');
    });
  });

  describe('ProviderDirectoryError', () => {
    const directoryService = 'External Provider Directory';
    const originalError = new Error('Connection timeout');

    it('should create error with CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should capture directory service details in error context', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.context).toBeDefined();
      expect(error.context.provider).toBeDefined();
      expect(error.context.provider.directoryService).toBe(directoryService);
    });

    it('should store original error as cause', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.cause).toBe(originalError);
    });

    it('should be classified as an EXTERNAL error type', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should be categorized as an EXTERNAL error category', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.category).toBe(ErrorCategory.EXTERNAL);
    });

    it('should map to SERVICE_UNAVAILABLE HTTP status code', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should include directory service name in error message', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.message).toContain(directoryService);
    });

    it('should include fallback strategy information in error details', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.details).toBeDefined();
      expect(error.details.fallbackStrategy).toBeDefined();
      expect(typeof error.details.fallbackStrategy).toBe('string');
      expect(error.details.fallbackStrategy.length).toBeGreaterThan(0);
    });

    it('should include retry information in error details', () => {
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.details).toBeDefined();
      expect(error.details.retryable).toBeDefined();
      expect(typeof error.details.retryable).toBe('boolean');
      expect(error.details.retryAfter).toBeDefined();
      expect(typeof error.details.retryAfter).toBe('number');
    });
  });

  describe('Error Recovery and Fallback Strategies', () => {
    it('should provide fallback options for ProviderDirectoryError', () => {
      const directoryService = 'External Provider Directory';
      const originalError = new Error('Connection timeout');
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.getFallbackOptions).toBeDefined();
      expect(typeof error.getFallbackOptions).toBe('function');

      const fallbackOptions = error.getFallbackOptions();
      expect(fallbackOptions).toBeDefined();
      expect(Array.isArray(fallbackOptions)).toBe(true);
      expect(fallbackOptions.length).toBeGreaterThan(0);
    });

    it('should provide retry strategy for ProviderDirectoryError', () => {
      const directoryService = 'External Provider Directory';
      const originalError = new Error('Connection timeout');
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.getRetryStrategy).toBeDefined();
      expect(typeof error.getRetryStrategy).toBe('function');

      const retryStrategy = error.getRetryStrategy();
      expect(retryStrategy).toBeDefined();
      expect(retryStrategy.maxRetries).toBeDefined();
      expect(typeof retryStrategy.maxRetries).toBe('number');
      expect(retryStrategy.backoffFactor).toBeDefined();
      expect(typeof retryStrategy.backoffFactor).toBe('number');
    });

    it('should provide alternative providers when directory service is unavailable', () => {
      const directoryService = 'External Provider Directory';
      const originalError = new Error('Connection timeout');
      const error = new ProviderDirectoryError(directoryService, originalError);

      expect(error.getAlternativeProviders).toBeDefined();
      expect(typeof error.getAlternativeProviders).toBe('function');

      const alternativeProviders = error.getAlternativeProviders();
      expect(alternativeProviders).toBeDefined();
      expect(Array.isArray(alternativeProviders)).toBe(true);
    });
  });
});