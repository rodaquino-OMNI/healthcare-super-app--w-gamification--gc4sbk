import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Exception thrown when reward data fails validation.
 * Provides structured validation error details to help clients correct their requests.
 * This client error (400) includes validation details and field-specific errors.
 */
export class InvalidRewardDataException extends AppException {
  /**
   * Creates a new instance of InvalidRewardDataException.
   * 
   * @param validationErrors - The validation errors from class-validator
   * @param message - Optional custom error message
   * @param correlationId - Optional correlation ID for tracking the error across services
   */
  constructor(
    private readonly validationErrors: ValidationError[],
    message: string = 'Invalid reward data provided',
    private readonly correlationId?: string
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'REWARD_400',
      InvalidRewardDataException.formatValidationErrors(validationErrors)
    );
    
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InvalidRewardDataException.prototype);
  }

  /**
   * Formats validation errors into a structured object for client response.
   * 
   * @param errors - The validation errors from class-validator
   * @returns A structured object with field-specific validation errors
   */
  private static formatValidationErrors(errors: ValidationError[]): Record<string, any> {
    return {
      validationErrors: errors.map(error => ({
        field: error.property,
        value: error.value,
        constraints: error.constraints,
        children: error.children?.length ? InvalidRewardDataException.formatValidationErrors(error.children) : undefined
      })),
      domain: 'reward',
      component: 'gamification-engine'
    };
  }

  /**
   * Gets the validation errors.
   * 
   * @returns The validation errors
   */
  getValidationErrors(): ValidationError[] {
    return this.validationErrors;
  }

  /**
   * Gets a structured representation of the validation errors.
   * 
   * @returns A structured object with field-specific validation errors
   */
  getFormattedValidationErrors(): Record<string, any> {
    return InvalidRewardDataException.formatValidationErrors(this.validationErrors);
  }

  /**
   * Returns a JSON representation of the exception with reward-specific context.
   * 
   * @returns JSON object with standardized error structure and reward context
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        domain: 'reward',
        component: 'gamification-engine',
        correlationId: this.correlationId || 'unknown',
        httpStatus: HttpStatus.BAD_REQUEST
      }
    };
  }

  /**
   * Sets the correlation ID for tracking the error across services.
   * Useful for associating the error with a specific request or transaction.
   * 
   * @param correlationId - Unique identifier for the request or transaction
   * @returns The exception instance for method chaining
   */
  withCorrelationId(correlationId: string): InvalidRewardDataException {
    this.details.correlationId = correlationId;
    return this;
  }

  /**
   * Adds journey context to the exception details.
   * Useful for associating the error with a specific user journey.
   * 
   * @param journey - The journey identifier ('health', 'care', 'plan')
   * @returns The exception instance for method chaining
   */
  withJourneyContext(journey: string): InvalidRewardDataException {
    this.details.journey = journey;
    return this;
  }

  /**
   * Adds user context to the exception details.
   * Useful for associating the error with a specific user.
   * 
   * @param userId - The unique identifier of the user
   * @returns The exception instance for method chaining
   */
  withUserContext(userId: string): InvalidRewardDataException {
    this.details.userId = userId;
    return this;
  }
}