import { BaseError, ErrorType, JourneyContext } from '../base';

/**
 * Base class for all business logic errors.
 * Used for errors related to business rule violations.
 */
export class BusinessError extends BaseError {
  /**
   * Creates a new BusinessError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the business error
   * @param context - Additional context information about the error
   * @param suggestion - Suggested action to resolve the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    suggestion?: string,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      code,
      context,
      details,
      suggestion,
      cause
    );
    this.name = 'BusinessError';
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class ResourceNotFoundError extends BusinessError {
  /**
   * Creates a new ResourceNotFoundError instance.
   * 
   * @param resourceType - Type of resource that was not found
   * @param resourceId - ID of the resource that was not found
   * @param context - Additional context information about the error
   */
  constructor(
    resourceType: string,
    resourceId: string | number,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `${resourceType} not found with ID: ${resourceId}`,
      'RESOURCE_NOT_FOUND',
      { resourceType, resourceId },
      context,
      `Please check that the ${resourceType} exists and that you have permission to access it`
    );
    this.name = 'ResourceNotFoundError';
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}

/**
 * Error thrown when a resource already exists.
 */
export class ResourceExistsError extends BusinessError {
  /**
   * Creates a new ResourceExistsError instance.
   * 
   * @param resourceType - Type of resource that already exists
   * @param identifier - Identifier of the resource that already exists
   * @param context - Additional context information about the error
   */
  constructor(
    resourceType: string,
    identifier: string | number | Record<string, any>,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    const identifierStr = typeof identifier === 'object' 
      ? JSON.stringify(identifier) 
      : identifier.toString();
    
    super(
      `${resourceType} already exists with identifier: ${identifierStr}`,
      'RESOURCE_EXISTS',
      { resourceType, identifier },
      context,
      `Please use a different identifier or update the existing ${resourceType}`
    );
    this.name = 'ResourceExistsError';
    Object.setPrototypeOf(this, ResourceExistsError.prototype);
  }
}

/**
 * Error thrown when a business rule is violated.
 */
export class BusinessRuleViolationError extends BusinessError {
  /**
   * Creates a new BusinessRuleViolationError instance.
   * 
   * @param ruleName - Name of the business rule that was violated
   * @param message - Human-readable error message
   * @param details - Additional details about the rule violation
   * @param context - Additional context information about the error
   */
  constructor(
    ruleName: string,
    message: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      message,
      'BUSINESS_RULE_VIOLATION',
      { ruleName, ...details },
      context
    );
    this.name = 'BusinessRuleViolationError';
    Object.setPrototypeOf(this, BusinessRuleViolationError.prototype);
  }
}

/**
 * Error thrown when there is a conflict in the current state.
 */
export class ConflictError extends BusinessError {
  /**
   * Creates a new ConflictError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the conflict
   * @param context - Additional context information about the error
   */
  constructor(
    message: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      message,
      'CONFLICT',
      details,
      context,
      'Please resolve the conflict and try again'
    );
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error thrown when a user has insufficient permissions.
 */
export class InsufficientPermissionsError extends BusinessError {
  /**
   * Creates a new InsufficientPermissionsError instance.
   * 
   * @param requiredPermission - Permission that was required
   * @param context - Additional context information about the error
   */
  constructor(
    requiredPermission: string,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `Insufficient permissions: ${requiredPermission} is required`,
      'INSUFFICIENT_PERMISSIONS',
      { requiredPermission },
      context,
      'Please contact an administrator to request the necessary permissions'
    );
    this.name = 'InsufficientPermissionsError';
    Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
  }
}

/**
 * Error thrown when an operation is attempted in an invalid state.
 */
export class InvalidStateError extends BusinessError {
  /**
   * Creates a new InvalidStateError instance.
   * 
   * @param currentState - Current state of the resource
   * @param expectedState - Expected state of the resource
   * @param resourceType - Type of resource
   * @param context - Additional context information about the error
   */
  constructor(
    currentState: string,
    expectedState: string | string[],
    resourceType: string,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    const expectedStateStr = Array.isArray(expectedState) 
      ? expectedState.join(', ') 
      : expectedState;
    
    super(
      `Invalid state: ${resourceType} is in state '${currentState}' but expected '${expectedStateStr}'`,
      'INVALID_STATE',
      { currentState, expectedState, resourceType },
      context,
      `The ${resourceType} must be in state '${expectedStateStr}' to perform this operation`
    );
    this.name = 'InvalidStateError';
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}