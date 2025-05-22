import { AppException, ErrorType } from '@backend/shared/src/exceptions/exceptions.types';

/**
 * Base class for all business logic errors in the AUSTA SuperApp.
 * Extends AppException with ErrorType.BUSINESS to ensure consistent error handling.
 * Business errors represent situations where an operation cannot be completed due to
 * business rules or constraints, typically resulting in HTTP 422 Unprocessable Entity.
 */
export abstract class BusinessError extends AppException {
  /**
   * Creates a new BusinessError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization (e.g., "HEALTH_B001")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, ErrorType.BUSINESS, code, details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

/**
 * Error thrown when a requested resource cannot be found.
 * Used when attempting to access or modify a resource that doesn't exist.
 */
export class ResourceNotFoundError extends BusinessError {
  /**
   * Creates a new ResourceNotFoundError instance.
   * 
   * @param resourceType - Type of resource that was not found (e.g., "User", "Appointment")
   * @param resourceId - Identifier of the resource that was not found
   * @param journeyContext - Optional journey context (e.g., "health", "care", "plan")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string | number,
    public readonly journeyContext?: string,
    details?: any,
    cause?: Error
  ) {
    const journeyPrefix = journeyContext ? `${journeyContext.toUpperCase()}_` : '';
    const code = `${journeyPrefix}B001_RESOURCE_NOT_FOUND`;
    const message = `${resourceType} with ID ${resourceId} not found${journeyContext ? ` in ${journeyContext} journey` : ''}`;
    
    super(message, code, details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}

/**
 * Error thrown when attempting to create a resource that already exists.
 * Used to prevent duplicate resources when uniqueness is required.
 */
export class ResourceExistsError extends BusinessError {
  /**
   * Creates a new ResourceExistsError instance.
   * 
   * @param resourceType - Type of resource that already exists (e.g., "User", "Appointment")
   * @param identifierField - Field that identifies the duplicate (e.g., "email", "code")
   * @param identifierValue - Value of the identifier that caused the duplicate
   * @param journeyContext - Optional journey context (e.g., "health", "care", "plan")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly resourceType: string,
    public readonly identifierField: string,
    public readonly identifierValue: string | number,
    public readonly journeyContext?: string,
    details?: any,
    cause?: Error
  ) {
    const journeyPrefix = journeyContext ? `${journeyContext.toUpperCase()}_` : '';
    const code = `${journeyPrefix}B002_RESOURCE_EXISTS`;
    const message = `${resourceType} with ${identifierField} '${identifierValue}' already exists${journeyContext ? ` in ${journeyContext} journey` : ''}`;
    
    super(message, code, details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ResourceExistsError.prototype);
  }
}

/**
 * Error thrown when a business rule or constraint is violated.
 * Used for domain-specific validation that goes beyond simple input validation.
 */
export class BusinessRuleViolationError extends BusinessError {
  /**
   * Creates a new BusinessRuleViolationError instance.
   * 
   * @param ruleName - Name of the business rule that was violated
   * @param message - Human-readable description of the violation
   * @param journeyContext - Optional journey context (e.g., "health", "care", "plan")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly ruleName: string,
    message: string,
    public readonly journeyContext?: string,
    details?: any,
    cause?: Error
  ) {
    const journeyPrefix = journeyContext ? `${journeyContext.toUpperCase()}_` : '';
    const code = `${journeyPrefix}B003_RULE_VIOLATION`;
    
    super(message, code, { ruleName, ...details }, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BusinessRuleViolationError.prototype);
  }
}

/**
 * Error thrown when an operation would result in a conflict with existing data or state.
 * Used for concurrent modification issues or conflicting operations.
 */
export class ConflictError extends BusinessError {
  /**
   * Creates a new ConflictError instance.
   * 
   * @param resourceType - Type of resource with the conflict (e.g., "Appointment", "Schedule")
   * @param conflictReason - Reason for the conflict (e.g., "time_overlap", "version_mismatch")
   * @param message - Human-readable description of the conflict
   * @param journeyContext - Optional journey context (e.g., "health", "care", "plan")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly resourceType: string,
    public readonly conflictReason: string,
    message: string,
    public readonly journeyContext?: string,
    details?: any,
    cause?: Error
  ) {
    const journeyPrefix = journeyContext ? `${journeyContext.toUpperCase()}_` : '';
    const code = `${journeyPrefix}B004_CONFLICT`;
    
    super(message, code, { resourceType, conflictReason, ...details }, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error thrown when a user lacks the necessary permissions to perform an operation.
 * Used for authorization failures related to business rules rather than authentication.
 */
export class InsufficientPermissionsError extends BusinessError {
  /**
   * Creates a new InsufficientPermissionsError instance.
   * 
   * @param resourceType - Type of resource being accessed (e.g., "Appointment", "MedicalRecord")
   * @param operation - Operation that was attempted (e.g., "read", "update", "delete")
   * @param requiredPermission - Permission that would be required (optional)
   * @param journeyContext - Optional journey context (e.g., "health", "care", "plan")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly resourceType: string,
    public readonly operation: string,
    public readonly requiredPermission?: string,
    public readonly journeyContext?: string,
    details?: any,
    cause?: Error
  ) {
    const journeyPrefix = journeyContext ? `${journeyContext.toUpperCase()}_` : '';
    const code = `${journeyPrefix}B005_INSUFFICIENT_PERMISSIONS`;
    let message = `Insufficient permissions to ${operation} ${resourceType}`;
    
    if (requiredPermission) {
      message += ` (requires '${requiredPermission}')`;
    }
    
    if (journeyContext) {
      message += ` in ${journeyContext} journey`;
    }
    
    super(message, code, details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
  }
}

/**
 * Error thrown when an operation is not allowed due to the current state of a resource.
 * Used for state transition violations in workflows and processes.
 */
export class InvalidStateError extends BusinessError {
  /**
   * Creates a new InvalidStateError instance.
   * 
   * @param resourceType - Type of resource with invalid state (e.g., "Appointment", "Claim")
   * @param currentState - Current state of the resource
   * @param attemptedOperation - Operation that was attempted
   * @param allowedStates - States in which the operation would be allowed (optional)
   * @param journeyContext - Optional journey context (e.g., "health", "care", "plan")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly resourceType: string,
    public readonly currentState: string,
    public readonly attemptedOperation: string,
    public readonly allowedStates?: string[],
    public readonly journeyContext?: string,
    details?: any,
    cause?: Error
  ) {
    const journeyPrefix = journeyContext ? `${journeyContext.toUpperCase()}_` : '';
    const code = `${journeyPrefix}B006_INVALID_STATE`;
    
    let message = `Cannot ${attemptedOperation} ${resourceType} in '${currentState}' state`;
    
    if (allowedStates && allowedStates.length > 0) {
      message += ` (allowed states: ${allowedStates.map(s => `'${s}'`).join(', ')})`;
    }
    
    if (journeyContext) {
      message += ` in ${journeyContext} journey`;
    }
    
    super(message, code, { currentState, allowedStates, ...details }, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}