import { HttpStatus } from '@nestjs/common';
import {
  ProviderNotFoundError,
  ProviderUnavailableError,
  ProviderSpecialtyMismatchError,
  ProviderCredentialsError,
  ProviderPersistenceError,
  ProviderDirectoryError,
  ProviderIntegrationError,
  ProviderErrorCode
} from '../../../../src/journey/care/provider-errors';
import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';

describe('Care Journey Provider Errors', () => {
  describe('ProviderNotFoundError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Provider with ID 12345 not found';
      const details = { providerId: '12345' };
      
      const error = new ProviderNotFoundError(message, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProviderNotFoundError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(ProviderErrorCode.PROVIDER_NOT_FOUND);
      expect(error.details).toEqual(details);
    });

    it('should use CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderNotFoundError('Provider not found');
      
      expect(error.code).toBe('CARE_PROVIDER_001');
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should map to HTTP 422 Unprocessable Entity status', () => {
      const error = new ProviderNotFoundError('Provider not found');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should capture provider context in details', () => {
      const details = { 
        providerId: '12345',
        searchCriteria: { specialty: 'CARDIOLOGY', location: 'NYC' }
      };
      
      const error = new ProviderNotFoundError('Provider not found', details);
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toEqual(details);
      expect(serialized.error.details.providerId).toBe('12345');
    });

    it('should support error cause chains', () => {
      const cause = new Error('Database query failed');
      const error = new ProviderNotFoundError('Provider not found', undefined, cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('ProviderUnavailableError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Dr. Smith is not accepting new patients at this time';
      const details = { providerId: '12345', reason: 'FULL_SCHEDULE' };
      
      const error = new ProviderUnavailableError(message, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProviderUnavailableError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(ProviderErrorCode.PROVIDER_UNAVAILABLE);
      expect(error.details).toEqual(details);
    });

    it('should use CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderUnavailableError('Provider unavailable');
      
      expect(error.code).toBe('CARE_PROVIDER_002');
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should map to HTTP 422 Unprocessable Entity status', () => {
      const error = new ProviderUnavailableError('Provider unavailable');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should capture availability context in details', () => {
      const details = { 
        providerId: '12345',
        reason: 'ON_LEAVE',
        availableAfter: '2023-06-15T00:00:00Z'
      };
      
      const error = new ProviderUnavailableError('Provider unavailable', details);
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toEqual(details);
      expect(serialized.error.details.reason).toBe('ON_LEAVE');
      expect(serialized.error.details.availableAfter).toBe('2023-06-15T00:00:00Z');
    });
  });

  describe('ProviderSpecialtyMismatchError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Dermatologist cannot treat cardiac conditions';
      const details = { 
        providerId: '12345', 
        providerSpecialty: 'DERMATOLOGY',
        requiredSpecialty: 'CARDIOLOGY'
      };
      
      const error = new ProviderSpecialtyMismatchError(message, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProviderSpecialtyMismatchError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(ProviderErrorCode.PROVIDER_SPECIALTY_MISMATCH);
      expect(error.details).toEqual(details);
    });

    it('should use CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderSpecialtyMismatchError('Specialty mismatch');
      
      expect(error.code).toBe('CARE_PROVIDER_003');
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should map to HTTP 422 Unprocessable Entity status', () => {
      const error = new ProviderSpecialtyMismatchError('Specialty mismatch');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should capture specialty context in details', () => {
      const details = { 
        providerId: '12345', 
        providerSpecialty: 'DERMATOLOGY',
        requiredSpecialty: 'CARDIOLOGY',
        condition: 'heart arrhythmia'
      };
      
      const error = new ProviderSpecialtyMismatchError('Specialty mismatch', details);
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toEqual(details);
      expect(serialized.error.details.providerSpecialty).toBe('DERMATOLOGY');
      expect(serialized.error.details.requiredSpecialty).toBe('CARDIOLOGY');
    });
  });

  describe('ProviderCredentialsError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Provider license number is invalid or expired';
      const details = { 
        providerId: '12345', 
        licenseNumber: 'MD12345',
        validationErrors: ['LICENSE_EXPIRED']
      };
      
      const error = new ProviderCredentialsError(message, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProviderCredentialsError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(ProviderErrorCode.PROVIDER_CREDENTIALS_INVALID);
      expect(error.details).toEqual(details);
    });

    it('should use CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderCredentialsError('Invalid credentials');
      
      expect(error.code).toBe('CARE_PROVIDER_101');
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should map to HTTP 400 Bad Request status', () => {
      const error = new ProviderCredentialsError('Invalid credentials');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should capture validation context in details', () => {
      const details = { 
        providerId: '12345', 
        licenseNumber: 'MD12345',
        validationErrors: ['LICENSE_EXPIRED', 'INVALID_FORMAT']
      };
      
      const error = new ProviderCredentialsError('Invalid credentials', details);
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toEqual(details);
      expect(serialized.error.details.validationErrors).toContain('LICENSE_EXPIRED');
      expect(serialized.error.details.validationErrors).toContain('INVALID_FORMAT');
    });
  });

  describe('ProviderPersistenceError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Failed to update provider information in database';
      const details = { providerId: '12345', operation: 'UPDATE' };
      const cause = new Error('Database connection failed');
      
      const error = new ProviderPersistenceError(message, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProviderPersistenceError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(ProviderErrorCode.PROVIDER_PERSISTENCE_ERROR);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should use CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderPersistenceError('Persistence error');
      
      expect(error.code).toBe('CARE_PROVIDER_201');
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should map to HTTP 500 Internal Server Error status', () => {
      const error = new ProviderPersistenceError('Persistence error');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should capture database operation context in details', () => {
      const details = { 
        providerId: '12345', 
        operation: 'UPDATE',
        table: 'providers',
        errorCode: 'DB_CONSTRAINT_VIOLATION'
      };
      
      const error = new ProviderPersistenceError('Persistence error', details);
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toEqual(details);
      expect(serialized.error.details.operation).toBe('UPDATE');
      expect(serialized.error.details.errorCode).toBe('DB_CONSTRAINT_VIOLATION');
    });
  });

  describe('ProviderDirectoryError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Provider directory service unavailable';
      const details = { retryAfter: 30 };
      const cause = new Error('Connection timeout');
      
      const error = new ProviderDirectoryError(message, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProviderDirectoryError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(ProviderErrorCode.PROVIDER_DIRECTORY_ERROR);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should use CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderDirectoryError('Directory error');
      
      expect(error.code).toBe('CARE_PROVIDER_301');
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should map to HTTP 502 Bad Gateway status', () => {
      const error = new ProviderDirectoryError('Directory error');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should provide fallback strategy for cached providers', () => {
      const cachedProviders = [
        { id: '123', name: 'Dr. Smith', specialty: 'CARDIOLOGY' },
        { id: '456', name: 'Dr. Jones', specialty: 'DERMATOLOGY' }
      ];
      
      const result = ProviderDirectoryError.withFallback(cachedProviders);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('123');
      expect(result[0].fromCache).toBe(true);
      expect(result[0].cacheTimestamp).toBeDefined();
      expect(result[1].id).toBe('456');
      expect(result[1].fromCache).toBe(true);
      expect(result[1].cacheTimestamp).toBeDefined();
    });
  });

  describe('ProviderIntegrationError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Failed to synchronize provider calendar with external system';
      const details = { providerId: '12345', system: 'EHR_SYSTEM' };
      const cause = new Error('API returned 500');
      
      const error = new ProviderIntegrationError(message, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProviderIntegrationError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(ProviderErrorCode.PROVIDER_INTEGRATION_ERROR);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should use CARE_PROVIDER_ prefixed error code', () => {
      const error = new ProviderIntegrationError('Integration error');
      
      expect(error.code).toBe('CARE_PROVIDER_302');
      expect(error.code.startsWith('CARE_PROVIDER_')).toBe(true);
    });

    it('should map to HTTP 502 Bad Gateway status', () => {
      const error = new ProviderIntegrationError('Integration error');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should capture external system context in details', () => {
      const details = { 
        providerId: '12345', 
        system: 'EHR_SYSTEM',
        endpoint: '/api/calendar/sync',
        statusCode: 500,
        responseBody: { error: 'Internal server error' }
      };
      
      const error = new ProviderIntegrationError('Integration error', details);
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toEqual(details);
      expect(serialized.error.details.system).toBe('EHR_SYSTEM');
      expect(serialized.error.details.statusCode).toBe(500);
    });
  });
});