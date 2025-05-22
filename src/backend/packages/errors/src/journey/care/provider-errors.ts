/**
 * @file Provider Errors
 * @description Specialized error classes for the Provider domain in the Care journey.
 * These errors handle validation, business logic, technical, and external system errors
 * related to healthcare provider operations.
 *
 * @module @austa/errors/journey/care/provider
 */

import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Error codes specific to the Provider domain in the Care journey.
 * These codes are used for error tracking, documentation, and localization.
 */
export enum ProviderErrorCode {
  // Business error codes
  PROVIDER_NOT_FOUND = 'CARE_PROVIDER_001',
  PROVIDER_UNAVAILABLE = 'CARE_PROVIDER_002',
  PROVIDER_SPECIALTY_MISMATCH = 'CARE_PROVIDER_003',
  
  // Validation error codes
  PROVIDER_CREDENTIALS_INVALID = 'CARE_PROVIDER_101',
  
  // Technical error codes
  PROVIDER_PERSISTENCE_ERROR = 'CARE_PROVIDER_201',
  
  // External system error codes
  PROVIDER_DIRECTORY_ERROR = 'CARE_PROVIDER_301',
  PROVIDER_INTEGRATION_ERROR = 'CARE_PROVIDER_302'
}

/**
 * Error thrown when a requested provider cannot be found in the system.
 * This is a business logic error that occurs when attempting to access
 * a provider that doesn't exist or has been removed from the directory.
 *
 * @example
 * throw new ProviderNotFoundError('Provider with ID 12345 not found', { providerId: '12345' });
 */
export class ProviderNotFoundError extends AppException {
  /**
   * Creates a new ProviderNotFoundError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      ProviderErrorCode.PROVIDER_NOT_FOUND,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderNotFoundError.prototype);
  }
}

/**
 * Error thrown when a provider is not available for scheduling or consultation.
 * This is a business logic error that occurs when a provider is fully booked,
 * on leave, or otherwise unavailable for the requested time period.
 *
 * @example
 * throw new ProviderUnavailableError(
 *   'Dr. Smith is not accepting new patients at this time',
 *   { providerId: '12345', reason: 'FULL_SCHEDULE' }
 * );
 */
export class ProviderUnavailableError extends AppException {
  /**
   * Creates a new ProviderUnavailableError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      ProviderErrorCode.PROVIDER_UNAVAILABLE,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderUnavailableError.prototype);
  }
}

/**
 * Error thrown when a provider's specialty doesn't match the required specialty for a care need.
 * This is a business logic error that occurs when attempting to book with a provider
 * who doesn't have the appropriate qualifications for the patient's condition.
 *
 * @example
 * throw new ProviderSpecialtyMismatchError(
 *   'Dermatologist cannot treat cardiac conditions',
 *   { 
 *     providerId: '12345', 
 *     providerSpecialty: 'DERMATOLOGY',
 *     requiredSpecialty: 'CARDIOLOGY'
 *   }
 * );
 */
export class ProviderSpecialtyMismatchError extends AppException {
  /**
   * Creates a new ProviderSpecialtyMismatchError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      ProviderErrorCode.PROVIDER_SPECIALTY_MISMATCH,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderSpecialtyMismatchError.prototype);
  }
}

/**
 * Error thrown when provider credentials are invalid or cannot be verified.
 * This is a validation error that occurs when provider information fails validation
 * checks, such as license verification or credential expiration.
 *
 * @example
 * throw new ProviderCredentialsError(
 *   'Provider license number is invalid or expired',
 *   { 
 *     providerId: '12345', 
 *     licenseNumber: 'MD12345',
 *     validationErrors: ['LICENSE_EXPIRED']
 *   }
 * );
 */
export class ProviderCredentialsError extends AppException {
  /**
   * Creates a new ProviderCredentialsError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      ProviderErrorCode.PROVIDER_CREDENTIALS_INVALID,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderCredentialsError.prototype);
  }
}

/**
 * Error thrown when there's a technical issue with provider data persistence.
 * This is a technical error that occurs when there's a failure in storing,
 * updating, or retrieving provider data from the database.
 *
 * @example
 * throw new ProviderPersistenceError(
 *   'Failed to update provider information in database',
 *   { providerId: '12345', operation: 'UPDATE' },
 *   originalError
 * );
 */
export class ProviderPersistenceError extends AppException {
  /**
   * Creates a new ProviderPersistenceError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      ProviderErrorCode.PROVIDER_PERSISTENCE_ERROR,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderPersistenceError.prototype);
  }
}

/**
 * Error thrown when there's an issue with the external provider directory service.
 * This is an external system error that occurs when the integration with
 * the provider directory service fails or returns unexpected results.
 *
 * @example
 * throw new ProviderDirectoryError(
 *   'Provider directory service unavailable',
 *   { retryAfter: 30 },
 *   originalError
 * );
 */
export class ProviderDirectoryError extends AppException {
  /**
   * Creates a new ProviderDirectoryError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      ProviderErrorCode.PROVIDER_DIRECTORY_ERROR,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderDirectoryError.prototype);
  }

  /**
   * Provides a fallback strategy for handling provider directory service failures.
   * This method can be used to implement graceful degradation when the external
   * provider directory is unavailable.
   * 
   * @param cachedProviders - Array of cached providers to use as fallback
   * @returns Array of providers from cache with a flag indicating they're from cache
   */
  static withFallback(cachedProviders: any[]): any[] {
    return cachedProviders.map(provider => ({
      ...provider,
      fromCache: true,
      cacheTimestamp: new Date().toISOString()
    }));
  }
}

/**
 * Error thrown when there's an issue with other provider integration services.
 * This is an external system error that occurs when integrations with
 * provider-related external systems (e.g., scheduling, EHR) fail.
 *
 * @example
 * throw new ProviderIntegrationError(
 *   'Failed to synchronize provider calendar with external system',
 *   { providerId: '12345', system: 'EHR_SYSTEM' },
 *   originalError
 * );
 */
export class ProviderIntegrationError extends AppException {
  /**
   * Creates a new ProviderIntegrationError instance.
   *
   * @param message - Human-readable error message
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      ProviderErrorCode.PROVIDER_INTEGRATION_ERROR,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderIntegrationError.prototype);
  }
}