import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Error code prefix for medication-related errors in the Care journey.
 * Format: CARE_MED_XXX where XXX is a specific error code number
 */
const ERROR_CODE_PREFIX = 'CARE_MED_';

/**
 * Error thrown when a requested medication cannot be found.
 * This is a business logic error as it relates to the application's domain rules.
 */
export class MedicationNotFoundError extends AppException {
  /**
   * Creates a new MedicationNotFoundError instance.
   * 
   * @param medicationId - ID of the medication that was not found
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public readonly medicationId: string,
    message: string = `Medication with ID ${medicationId} not found`,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}001`,
      { medicationId },
      cause
    );
  }
}

/**
 * Error thrown when a potential drug interaction is detected.
 * This is a business logic error related to medication safety.
 */
export class MedicationInteractionError extends AppException {
  /**
   * Creates a new MedicationInteractionError instance.
   * 
   * @param medications - Array of medication IDs involved in the interaction
   * @param interactionType - Type of interaction (e.g., 'contraindication', 'warning')
   * @param interactionDescription - Description of the interaction
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public readonly medications: string[],
    public readonly interactionType: string,
    public readonly interactionDescription: string,
    message: string = `Medication interaction detected: ${interactionDescription}`,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}002`,
      { medications, interactionType, interactionDescription },
      cause
    );
  }
}

/**
 * Error thrown when medication dosage validation fails.
 * This is a validation error as it relates to input validation.
 */
export class MedicationDosageError extends AppException {
  /**
   * Creates a new MedicationDosageError instance.
   * 
   * @param medicationId - ID of the medication with invalid dosage
   * @param providedDosage - The dosage that was provided
   * @param validationDetails - Details about the validation failure
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public readonly medicationId: string,
    public readonly providedDosage: string,
    public readonly validationDetails: Record<string, any>,
    message: string = `Invalid medication dosage: ${providedDosage}`,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      `${ERROR_CODE_PREFIX}003`,
      { medicationId, providedDosage, validationDetails },
      cause
    );
  }
}

/**
 * Error thrown when medication adherence tracking encounters an issue.
 * This is a business logic error related to medication adherence monitoring.
 */
export class MedicationAdherenceError extends AppException {
  /**
   * Creates a new MedicationAdherenceError instance.
   * 
   * @param userId - ID of the user whose adherence is being tracked
   * @param medicationId - ID of the medication
   * @param adherenceIssue - Description of the adherence issue
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public readonly userId: string,
    public readonly medicationId: string,
    public readonly adherenceIssue: string,
    message: string = `Medication adherence issue: ${adherenceIssue}`,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}004`,
      { userId, medicationId, adherenceIssue },
      cause
    );
  }
}

/**
 * Error thrown when medication data persistence fails.
 * This is a technical error as it relates to database operations.
 */
export class MedicationPersistenceError extends AppException {
  /**
   * Creates a new MedicationPersistenceError instance.
   * 
   * @param operation - The database operation that failed (e.g., 'create', 'update', 'delete')
   * @param medicationId - ID of the medication (if applicable)
   * @param details - Additional details about the error
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public readonly operation: string,
    public readonly medicationId?: string,
    public readonly details?: Record<string, any>,
    message: string = `Failed to ${operation} medication data`,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      `${ERROR_CODE_PREFIX}005`,
      { operation, medicationId, details },
      cause
    );
  }
}

/**
 * Error thrown when external drug information lookup fails.
 * This is an external system error as it relates to external service integration.
 */
export class MedicationExternalLookupError extends AppException {
  /**
   * Creates a new MedicationExternalLookupError instance.
   * 
   * @param externalSystem - The external system that failed (e.g., 'drugDatabase', 'formulary')
   * @param lookupParameters - Parameters used for the lookup
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public readonly externalSystem: string,
    public readonly lookupParameters: Record<string, any>,
    message: string = `Failed to lookup medication information from ${externalSystem}`,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      `${ERROR_CODE_PREFIX}006`,
      { externalSystem, lookupParameters },
      cause
    );
  }
}

/**
 * Error thrown when pharmacy integration for prescription fulfillment fails.
 * This is an external system error as it relates to external service integration.
 */
export class PharmacyIntegrationError extends AppException {
  /**
   * Creates a new PharmacyIntegrationError instance.
   * 
   * @param pharmacyId - ID of the pharmacy
   * @param prescriptionId - ID of the prescription
   * @param operationType - Type of operation that failed (e.g., 'submit', 'status', 'cancel')
   * @param details - Additional details about the error
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public readonly pharmacyId: string,
    public readonly prescriptionId: string,
    public readonly operationType: string,
    public readonly details?: Record<string, any>,
    message: string = `Pharmacy integration error for operation: ${operationType}`,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      `${ERROR_CODE_PREFIX}007`,
      { pharmacyId, prescriptionId, operationType, details },
      cause
    );
  }
}