import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';
import { ProviderErrorCode } from './error-codes';

/**
 * Error thrown when a provider cannot be found in the system.
 * This is a business logic error that occurs when attempting to access
 * or operate on a provider that does not exist in the database.
 */
export class ProviderNotFoundError extends AppException {
  /**
   * Creates a new ProviderNotFoundError instance.
   * 
   * @param providerId - ID of the provider that was not found
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providerId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Provider with ID ${providerId} could not be found. Please verify the provider ID or search for available providers in your area.`,
      ErrorType.BUSINESS,
      ProviderErrorCode.NOT_FOUND,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a provider is not available for scheduling.
 * This is a business logic error that occurs when attempting to schedule
 * with a provider who is not accepting new patients or has no available slots.
 */
export class ProviderUnavailableError extends AppException {
  /**
   * Creates a new ProviderUnavailableError instance.
   * 
   * @param providerId - ID of the unavailable provider
   * @param reason - Specific reason for unavailability (e.g., "Not accepting new patients", "No available slots")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providerId: string,
    reason: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Provider with ID ${providerId} is currently unavailable: ${reason}. Please try selecting a different provider or check back later for availability.`,
      ErrorType.BUSINESS,
      ProviderErrorCode.UNAVAILABLE,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a provider's specialty doesn't match the required specialty.
 * This is a business logic error that occurs when attempting to schedule
 * an appointment with a provider who doesn't have the appropriate specialty.
 */
export class ProviderSpecialtyMismatchError extends AppException {
  /**
   * Creates a new ProviderSpecialtyMismatchError instance.
   * 
   * @param providerId - ID of the provider
   * @param requiredSpecialty - The specialty that was required
   * @param actualSpecialty - The provider's actual specialty
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providerId: string,
    requiredSpecialty: string,
    actualSpecialty: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Provider with ID ${providerId} has specialty "${actualSpecialty}" but "${requiredSpecialty}" was required. Please select a provider with the appropriate specialty for your needs.`,
      ErrorType.BUSINESS,
      ProviderErrorCode.SPECIALTY_MISMATCH,
      details,
      cause
    );
  }
}

/**
 * Error thrown when provider credentials are invalid.
 * This is a validation error that occurs when provider credentials
 * fail validation requirements.
 */
export class ProviderCredentialsError extends AppException {
  /**
   * Creates a new ProviderCredentialsError instance.
   * 
   * @param providerId - ID of the provider with invalid credentials
   * @param validationIssues - Description of the validation issues
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providerId: string,
    validationIssues: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Provider with ID ${providerId} has invalid credentials: ${validationIssues}. Please update the provider information with valid credentials.`,
      ErrorType.VALIDATION,
      ProviderErrorCode.INVALID_CREDENTIALS,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there are issues with the provider directory integration.
 * This is an external system error that occurs when the application fails to
 * communicate with or retrieve data from the external provider directory.
 */
export class ProviderDirectoryError extends AppException {
  /**
   * Creates a new ProviderDirectoryError instance.
   * 
   * @param operation - The operation that was being performed (e.g., "search", "retrieve")
   * @param errorDetails - Details about the external system error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    operation: string,
    errorDetails: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} provider information from directory: ${errorDetails}. The system will use cached provider data if available. Please try again later.`,
      ErrorType.EXTERNAL,
      ProviderErrorCode.DIRECTORY_ERROR,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in persisting provider data.
 * This is a technical error that occurs when the application fails to
 * save, update, or delete provider information in the database.
 */
export class ProviderDataPersistenceError extends AppException {
  /**
   * Creates a new ProviderDataPersistenceError instance.
   * 
   * @param operation - The database operation that failed (e.g., "create", "update", "delete")
   * @param providerId - ID of the provider (if available)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    operation: string,
    providerId?: string,
    details?: any,
    cause?: Error
  ) {
    const providerIdMessage = providerId ? ` with ID ${providerId}` : '';
    super(
      `Failed to ${operation} provider data${providerIdMessage} in the database. This is a temporary system issue. Please try again later.`,
      ErrorType.TECHNICAL,
      ProviderErrorCode.PERSISTENCE_ERROR,
      details,
      cause
    );
  }
}