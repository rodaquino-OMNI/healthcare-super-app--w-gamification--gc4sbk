/**
 * @file business.errors.ts
 * @description Defines specialized error classes for business logic errors.
 * These errors represent violations of business rules and constraints that
 * prevent operations from being completed successfully. They are used to
 * provide clear, context-aware error messages to clients about why their
 * requested operations cannot be performed.
 */

import { BaseError, ErrorType, JourneyContext, ErrorContext } from '../base';
import { ERROR_CODE_PREFIXES, ERROR_MESSAGES } from '../constants';

/**
 * Base class for all business-related errors.
 * Extends BaseError with ErrorType.BUSINESS.
 */
export class BusinessError extends BaseError {
  /**
   * Creates a new BusinessError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code: string,
    context: ErrorContext = {},
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, ErrorType.BUSINESS, code, context, details, suggestion, cause);
  }
}

/**
 * Error thrown when a requested resource cannot be found.
 * Used when a client requests a resource that does not exist or is not accessible.
 */
export class ResourceNotFoundError extends BusinessError {
  /**
   * Creates a new ResourceNotFoundError instance.
   * 
   * @param resourceType - Type of resource that was not found (e.g., 'user', 'appointment')
   * @param resourceId - Identifier of the resource that was not found
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    resourceType: string,
    resourceId: string | number,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.RESOURCE_NOT_FOUND.replace('{resource}', resourceType);
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_NOT_FOUND`;
    const context: ErrorContext = {
      journey: journeyContext,
      resourceType,
      resourceId: resourceId.toString()
    };

    super(message, code, context, details, suggestion || `Check if the ${resourceType} exists and you have permission to access it.`, cause);
  }
}

/**
 * Error thrown when a resource already exists and cannot be created again.
 * Used when a client attempts to create a resource that already exists.
 */
export class ResourceExistsError extends BusinessError {
  /**
   * Creates a new ResourceExistsError instance.
   * 
   * @param resourceType - Type of resource that already exists (e.g., 'user', 'appointment')
   * @param identifier - Field name that must be unique (e.g., 'email', 'username')
   * @param value - Value of the identifier that already exists
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    resourceType: string,
    identifier: string,
    value: string | number,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.RESOURCE_ALREADY_EXISTS
      .replace('{resource}', resourceType)
      .replace('{identifier}', identifier);
    
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_ALREADY_EXISTS`;
    const context: ErrorContext = {
      journey: journeyContext,
      resourceType,
      identifier,
      value: value.toString()
    };

    super(
      message, 
      code, 
      context, 
      details, 
      suggestion || `Use a different ${identifier} or update the existing ${resourceType}.`,
      cause
    );
  }
}

/**
 * Error thrown when a business rule is violated.
 * Used to represent violations of specific business rules or constraints.
 */
export class BusinessRuleViolationError extends BusinessError {
  /**
   * Creates a new BusinessRuleViolationError instance.
   * 
   * @param rule - Name or description of the business rule that was violated
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    rule: string,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.BUSINESS_RULE_VIOLATION.replace('{rule}', rule);
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_RULE_VIOLATION`;
    const context: ErrorContext = {
      journey: journeyContext,
      rule
    };

    super(message, code, context, details, suggestion, cause);
  }
}

/**
 * Error thrown when an operation would result in a conflict with existing data.
 * Used when a requested operation would violate data integrity or consistency.
 */
export class ConflictError extends BusinessError {
  /**
   * Creates a new ConflictError instance.
   * 
   * @param resourceType - Type of resource with the conflict
   * @param conflictReason - Reason for the conflict
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    resourceType: string,
    conflictReason: string,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.DEPENDENCY_CONFLICT.replace('{dependency}', conflictReason);
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_CONFLICT`;
    const context: ErrorContext = {
      journey: journeyContext,
      resourceType,
      conflictReason
    };

    super(message, code, context, details, suggestion, cause);
  }
}

/**
 * Error thrown when a user does not have sufficient permissions for an operation.
 * Used when a user attempts to perform an action they are not authorized to perform.
 */
export class InsufficientPermissionsError extends BusinessError {
  /**
   * Creates a new InsufficientPermissionsError instance.
   * 
   * @param action - The action the user attempted to perform
   * @param resourceType - Type of resource the user attempted to access
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    action: string,
    resourceType: string,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.INSUFFICIENT_PERMISSIONS
      .replace('{action}', action)
      .replace('{resource}', resourceType);
    
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_INSUFFICIENT_PERMISSIONS`;
    const context: ErrorContext = {
      journey: journeyContext,
      action,
      resourceType
    };

    super(
      message, 
      code, 
      context, 
      details, 
      suggestion || 'Contact an administrator if you believe you should have access to this resource.',
      cause
    );
  }
}

/**
 * Error thrown when an invalid state transition is attempted.
 * Used when a resource cannot transition from its current state to the requested state.
 */
export class InvalidStateError extends BusinessError {
  /**
   * Creates a new InvalidStateError instance.
   * 
   * @param resourceType - Type of resource with the invalid state transition
   * @param currentState - Current state of the resource
   * @param targetState - Target state that was requested
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    resourceType: string,
    currentState: string,
    targetState: string,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.INVALID_STATE_TRANSITION
      .replace('{resource}', resourceType)
      .replace('{currentState}', currentState)
      .replace('{targetState}', targetState);
    
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_INVALID_STATE`;
    const context: ErrorContext = {
      journey: journeyContext,
      resourceType,
      currentState,
      targetState
    };

    super(message, code, context, details, suggestion, cause);
  }
}

/**
 * Error thrown when a resource limit has been exceeded.
 * Used when a user has reached a limit for a particular resource or operation.
 */
export class LimitExceededError extends BusinessError {
  /**
   * Creates a new LimitExceededError instance.
   * 
   * @param resourceType - Type of resource that has reached its limit
   * @param limit - The limit that was exceeded
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    resourceType: string,
    limit: number,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.LIMIT_EXCEEDED.replace('{resource}', resourceType);
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_LIMIT_EXCEEDED`;
    const context: ErrorContext = {
      journey: journeyContext,
      resourceType,
      limit: limit.toString()
    };

    super(
      message, 
      code, 
      context, 
      details, 
      suggestion || `The maximum limit of ${limit} for ${resourceType} has been reached.`,
      cause
    );
  }
}

/**
 * Error thrown when a concurrent modification is detected.
 * Used when a resource has been modified by another user since it was retrieved.
 */
export class ConcurrentModificationError extends BusinessError {
  /**
   * Creates a new ConcurrentModificationError instance.
   * 
   * @param resourceType - Type of resource that was concurrently modified
   * @param resourceId - Identifier of the resource that was concurrently modified
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    resourceType: string,
    resourceId: string | number,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = ERROR_MESSAGES.BUSINESS.CONCURRENT_MODIFICATION.replace('{resource}', resourceType);
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_CONCURRENT_MODIFICATION`;
    const context: ErrorContext = {
      journey: journeyContext,
      resourceType,
      resourceId: resourceId.toString()
    };

    super(
      message, 
      code, 
      context, 
      details, 
      suggestion || `Refresh the ${resourceType} and try again.`,
      cause
    );
  }
}

/**
 * Error thrown when an operation is not allowed due to the current account status.
 * Used when an account is locked, disabled, or otherwise restricted.
 */
export class AccountStatusError extends BusinessError {
  /**
   * Creates a new AccountStatusError instance.
   * 
   * @param status - Current status of the account (e.g., 'locked', 'disabled')
   * @param reason - Reason for the account status
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    status: 'locked' | 'disabled' | 'suspended',
    reason: string,
    journeyContext: JourneyContext = JourneyContext.AUTH,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    let message: string;
    if (status === 'locked') {
      message = ERROR_MESSAGES.BUSINESS.ACCOUNT_LOCKED.replace('{reason}', reason);
    } else if (status === 'disabled') {
      message = ERROR_MESSAGES.BUSINESS.ACCOUNT_DISABLED;
    } else {
      message = `Your account has been ${status} due to ${reason}`;
    }
    
    const code = `${ERROR_CODE_PREFIXES.AUTH}_ACCOUNT_${status.toUpperCase()}`;
    const context: ErrorContext = {
      journey: journeyContext,
      accountStatus: status,
      reason
    };

    super(message, code, context, details, suggestion, cause);
  }
}

/**
 * Error thrown when a dependency required for an operation is missing or invalid.
 * Used when an operation depends on another resource or condition that is not satisfied.
 */
export class DependencyError extends BusinessError {
  /**
   * Creates a new DependencyError instance.
   * 
   * @param dependencyType - Type of dependency that is missing or invalid
   * @param operation - Operation that requires the dependency
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    dependencyType: string,
    operation: string,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = `The operation '${operation}' requires ${dependencyType} which is missing or invalid`;
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_DEPENDENCY_ERROR`;
    const context: ErrorContext = {
      journey: journeyContext,
      dependencyType,
      operation
    };

    super(
      message, 
      code, 
      context, 
      details, 
      suggestion || `Ensure that ${dependencyType} is available before attempting this operation.`,
      cause
    );
  }
}

/**
 * Error thrown when a feature is disabled or not available.
 * Used when a user attempts to use a feature that is not available to them.
 */
export class FeatureNotAvailableError extends BusinessError {
  /**
   * Creates a new FeatureNotAvailableError instance.
   * 
   * @param featureName - Name of the feature that is not available
   * @param reason - Reason why the feature is not available
   * @param journeyContext - The journey context in which the error occurred
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    featureName: string,
    reason: string,
    journeyContext: JourneyContext = JourneyContext.SYSTEM,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    const message = `The feature '${featureName}' is not available: ${reason}`;
    const code = `${ERROR_CODE_PREFIXES.GENERAL}_FEATURE_UNAVAILABLE`;
    const context: ErrorContext = {
      journey: journeyContext,
      featureName,
      reason
    };

    super(message, code, context, details, suggestion, cause);
  }
}