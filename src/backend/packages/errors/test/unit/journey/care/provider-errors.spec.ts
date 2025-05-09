import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../src/base';
import {
  ProviderNotFoundError,
  ProviderUnavailableError,
  ProviderSpecialtyMismatchError,
  ProviderCredentialsError,
  ProviderDirectoryError,
  ProviderDataPersistenceError
} from '../../../../../../src/journey/care/provider-errors';
import { ProviderErrorCode } from '../../../../../../src/journey/care/error-codes';

describe('Care Journey Provider Errors', () => {
  describe('ProviderNotFoundError', () => {
    const providerId = 'provider-123';
    const details = { searchCriteria: { specialty: 'cardiology' } };
    const cause = new Error('Database query returned no results');
    
    it('should create an error with the correct properties', () => {
      const error = new ProviderNotFoundError(providerId, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderNotFoundError');
      expect(error.message).toContain(providerId);
      expect(error.message).toContain('could not be found');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(ProviderErrorCode.NOT_FOUND);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should include provider ID in the error message', () => {
      const error = new ProviderNotFoundError(providerId);
      
      expect(error.message).toContain(`Provider with ID ${providerId}`);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ProviderNotFoundError(providerId);
      
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
    
    it('should create a proper serialized error response', () => {
      const error = new ProviderNotFoundError(providerId);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(ProviderErrorCode.NOT_FOUND);
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.message).toContain(providerId);
    });
  });
  
  describe('ProviderUnavailableError', () => {
    const providerId = 'provider-123';
    const reason = 'Not accepting new patients';
    const details = { availabilityStatus: 'closed' };
    const cause = new Error('Provider availability check failed');
    
    it('should create an error with the correct properties', () => {
      const error = new ProviderUnavailableError(providerId, reason, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderUnavailableError');
      expect(error.message).toContain(providerId);
      expect(error.message).toContain(reason);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(ProviderErrorCode.UNAVAILABLE);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should include provider ID and reason in the error message', () => {
      const error = new ProviderUnavailableError(providerId, reason);
      
      expect(error.message).toContain(`Provider with ID ${providerId}`);
      expect(error.message).toContain(`unavailable: ${reason}`);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ProviderUnavailableError(providerId, reason);
      
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
    
    it('should create a proper serialized error response', () => {
      const error = new ProviderUnavailableError(providerId, reason);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(ProviderErrorCode.UNAVAILABLE);
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.message).toContain(providerId);
      expect(serialized.error.message).toContain(reason);
    });
  });
  
  describe('ProviderSpecialtyMismatchError', () => {
    const providerId = 'provider-123';
    const requiredSpecialty = 'cardiology';
    const actualSpecialty = 'dermatology';
    const details = { patientCondition: 'heart disease' };
    const cause = new Error('Provider specialty validation failed');
    
    it('should create an error with the correct properties', () => {
      const error = new ProviderSpecialtyMismatchError(
        providerId, 
        requiredSpecialty, 
        actualSpecialty, 
        details, 
        cause
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderSpecialtyMismatchError');
      expect(error.message).toContain(providerId);
      expect(error.message).toContain(requiredSpecialty);
      expect(error.message).toContain(actualSpecialty);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(ProviderErrorCode.SPECIALTY_MISMATCH);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should include provider ID and specialties in the error message', () => {
      const error = new ProviderSpecialtyMismatchError(
        providerId, 
        requiredSpecialty, 
        actualSpecialty
      );
      
      expect(error.message).toContain(`Provider with ID ${providerId}`);
      expect(error.message).toContain(`has specialty "${actualSpecialty}"`);
      expect(error.message).toContain(`"${requiredSpecialty}" was required`);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ProviderSpecialtyMismatchError(
        providerId, 
        requiredSpecialty, 
        actualSpecialty
      );
      
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
    
    it('should create a proper serialized error response', () => {
      const error = new ProviderSpecialtyMismatchError(
        providerId, 
        requiredSpecialty, 
        actualSpecialty
      );
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(ProviderErrorCode.SPECIALTY_MISMATCH);
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.message).toContain(providerId);
      expect(serialized.error.message).toContain(requiredSpecialty);
      expect(serialized.error.message).toContain(actualSpecialty);
    });
  });
  
  describe('ProviderCredentialsError', () => {
    const providerId = 'provider-123';
    const validationIssues = 'Missing license number';
    const details = { credentialFields: ['licenseNumber', 'expirationDate'] };
    const cause = new Error('Credential validation failed');
    
    it('should create an error with the correct properties', () => {
      const error = new ProviderCredentialsError(
        providerId, 
        validationIssues, 
        details, 
        cause
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderCredentialsError');
      expect(error.message).toContain(providerId);
      expect(error.message).toContain(validationIssues);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(ProviderErrorCode.INVALID_CREDENTIALS);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should include provider ID and validation issues in the error message', () => {
      const error = new ProviderCredentialsError(providerId, validationIssues);
      
      expect(error.message).toContain(`Provider with ID ${providerId}`);
      expect(error.message).toContain(`invalid credentials: ${validationIssues}`);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ProviderCredentialsError(providerId, validationIssues);
      
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });
    
    it('should create a proper serialized error response', () => {
      const error = new ProviderCredentialsError(providerId, validationIssues);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(ProviderErrorCode.INVALID_CREDENTIALS);
      expect(serialized.error.type).toBe(ErrorType.VALIDATION);
      expect(serialized.error.message).toContain(providerId);
      expect(serialized.error.message).toContain(validationIssues);
    });
  });
  
  describe('ProviderDirectoryError', () => {
    const operation = 'search';
    const errorDetails = 'External API timeout';
    const details = { searchParams: { specialty: 'cardiology', location: '10001' } };
    const cause = new Error('External API request failed');
    
    it('should create an error with the correct properties', () => {
      const error = new ProviderDirectoryError(
        operation, 
        errorDetails, 
        details, 
        cause
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderDirectoryError');
      expect(error.message).toContain(operation);
      expect(error.message).toContain(errorDetails);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(ProviderErrorCode.DIRECTORY_ERROR);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should include operation and error details in the error message', () => {
      const error = new ProviderDirectoryError(operation, errorDetails);
      
      expect(error.message).toContain(`Failed to ${operation} provider information`);
      expect(error.message).toContain(errorDetails);
      expect(error.message).toContain('cached provider data');
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ProviderDirectoryError(operation, errorDetails);
      
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_GATEWAY);
    });
    
    it('should create a proper serialized error response', () => {
      const error = new ProviderDirectoryError(operation, errorDetails);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(ProviderErrorCode.DIRECTORY_ERROR);
      expect(serialized.error.type).toBe(ErrorType.EXTERNAL);
      expect(serialized.error.message).toContain(operation);
      expect(serialized.error.message).toContain(errorDetails);
    });
    
    it('should be identified as a retryable error', () => {
      const error = new ProviderDirectoryError(operation, errorDetails);
      
      expect(error.isRetryable()).toBe(true);
    });
  });
  
  describe('ProviderDataPersistenceError', () => {
    const operation = 'update';
    const providerId = 'provider-123';
    const details = { fields: ['specialty', 'availability'] };
    const cause = new Error('Database transaction failed');
    
    it('should create an error with the correct properties', () => {
      const error = new ProviderDataPersistenceError(
        operation, 
        providerId, 
        details, 
        cause
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderDataPersistenceError');
      expect(error.message).toContain(operation);
      expect(error.message).toContain(providerId);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(ProviderErrorCode.PERSISTENCE_ERROR);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should include operation and provider ID in the error message', () => {
      const error = new ProviderDataPersistenceError(operation, providerId);
      
      expect(error.message).toContain(`Failed to ${operation} provider data`);
      expect(error.message).toContain(`with ID ${providerId}`);
      expect(error.message).toContain('temporary system issue');
    });
    
    it('should handle missing provider ID gracefully', () => {
      const error = new ProviderDataPersistenceError(operation);
      
      expect(error.message).toContain(`Failed to ${operation} provider data`);
      expect(error.message).not.toContain('with ID');
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ProviderDataPersistenceError(operation, providerId);
      
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
    
    it('should create a proper serialized error response', () => {
      const error = new ProviderDataPersistenceError(operation, providerId);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(ProviderErrorCode.PERSISTENCE_ERROR);
      expect(serialized.error.type).toBe(ErrorType.TECHNICAL);
      expect(serialized.error.message).toContain(operation);
      expect(serialized.error.message).toContain(providerId);
    });
    
    it('should be identified as a retryable error', () => {
      const error = new ProviderDataPersistenceError(operation, providerId);
      
      expect(error.isRetryable()).toBe(true);
    });
  });
  
  describe('Error code prefixes', () => {
    it('should use error codes with CARE_PROV_ prefix', () => {
      // Check that all provider error codes start with the correct prefix
      expect(ProviderErrorCode.NOT_FOUND).toMatch(/^CARE_PROV_/);
      expect(ProviderErrorCode.UNAVAILABLE).toMatch(/^CARE_PROV_/);
      expect(ProviderErrorCode.SPECIALTY_MISMATCH).toMatch(/^CARE_PROV_/);
      expect(ProviderErrorCode.INVALID_CREDENTIALS).toMatch(/^CARE_PROV_/);
      expect(ProviderErrorCode.DIRECTORY_ERROR).toMatch(/^CARE_PROV_/);
      expect(ProviderErrorCode.PERSISTENCE_ERROR).toMatch(/^CARE_PROV_/);
    });
  });
});