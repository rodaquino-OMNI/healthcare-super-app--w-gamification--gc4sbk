import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Error code prefix for medication-related errors in the Care journey.
 * Format: CARE_MED_XXX where XXX is a specific error code number
 */
const ERROR_CODE_PREFIX = 'CARE_MED_';

/**
 * Error thrown when a medication record cannot be found.
 * Used when attempting to access, update, or delete a non-existent medication.
 */
export class MedicationNotFoundError extends AppException {
  constructor(medicationId: string, details?: any) {
    super(
      `Medication with ID ${medicationId} not found`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}001`,
      details
    );
  }
}

/**
 * Error thrown when a potential drug interaction is detected.
 * Used during medication safety checks to prevent harmful drug combinations.
 */
export class MedicationInteractionError extends AppException {
  constructor(medicationName: string, interactingWith: string, details?: any) {
    super(
      `Potential interaction detected between ${medicationName} and ${interactingWith}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}002`,
      details
    );
  }
}

/**
 * Error thrown when medication dosage information is invalid.
 * Used during prescription validation to ensure proper dosing.
 */
export class MedicationDosageError extends AppException {
  constructor(medicationName: string, message: string, details?: any) {
    super(
      `Invalid dosage for ${medicationName}: ${message}`,
      ErrorType.VALIDATION,
      `${ERROR_CODE_PREFIX}003`,
      details
    );
  }
}

/**
 * Error thrown when there are issues with medication adherence tracking.
 * Used when recording or analyzing medication consumption patterns.
 */
export class MedicationAdherenceError extends AppException {
  constructor(medicationName: string, message: string, details?: any) {
    super(
      `Medication adherence issue for ${medicationName}: ${message}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}004`,
      details
    );
  }
}

/**
 * Error thrown when there are database or persistence issues with medication data.
 * Used for technical errors during CRUD operations on medication records.
 */
export class MedicationPersistenceError extends AppException {
  constructor(operation: string, cause?: Error, details?: any) {
    super(
      `Failed to ${operation} medication data`,
      ErrorType.TECHNICAL,
      `${ERROR_CODE_PREFIX}005`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when external drug information lookup fails.
 * Used when integrating with external drug databases or information services.
 */
export class MedicationExternalLookupError extends AppException {
  constructor(medicationName: string, service: string, cause?: Error, details?: any) {
    super(
      `Failed to retrieve information for ${medicationName} from ${service}`,
      ErrorType.EXTERNAL,
      `${ERROR_CODE_PREFIX}006`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when integration with pharmacy systems fails.
 * Used for prescription fulfillment and electronic prescription transmission.
 */
export class PharmacyIntegrationError extends AppException {
  constructor(pharmacyName: string, operation: string, cause?: Error, details?: any) {
    super(
      `Failed to ${operation} with pharmacy ${pharmacyName}`,
      ErrorType.EXTERNAL,
      `${ERROR_CODE_PREFIX}007`,
      details,
      cause
    );
  }
}