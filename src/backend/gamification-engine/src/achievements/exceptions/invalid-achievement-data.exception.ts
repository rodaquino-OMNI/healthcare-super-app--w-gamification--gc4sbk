import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Interface representing validation errors for achievement data fields.
 * Maps field names to specific error messages.
 */
export interface AchievementValidationErrors {
  [field: string]: string | string[];
}

/**
 * Exception thrown when achievement data fails validation.
 * Provides structured validation error details to help clients correct their requests.
 * 
 * @example
 * // Throwing the exception with field-specific errors
 * throw new InvalidAchievementDataException({
 *   title: 'Title is required',
 *   xpReward: 'XP reward must be a positive number',
 *   criteria: ['Invalid criteria format', 'Criteria must include a condition']
 * });
 */
export class InvalidAchievementDataException extends AppException {
  /**
   * Creates a new InvalidAchievementDataException instance.
   * 
   * @param validationErrors - Object mapping field names to error messages
   * @param message - Optional custom error message (defaults to generic validation error message)
   */
  constructor(
    public readonly validationErrors: AchievementValidationErrors,
    message: string = 'Achievement data validation failed'
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'GAME_400', // Error code for validation errors in gamification domain
      { validationErrors },
      undefined
    );

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InvalidAchievementDataException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with detailed validation errors.
   * Overrides the base toJSON method to include field-specific validation errors.
   * 
   * @returns JSON object with standardized error structure and validation details
   */
  toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        validation: this.validationErrors,
        details: this.details
      }
    };
  }

  /**
   * Creates an instance with errors from class-validator validation errors.
   * Useful when working with NestJS validation pipes.
   * 
   * @param errors - Array of validation errors from class-validator
   * @returns A new InvalidAchievementDataException instance
   */
  static fromValidationErrors(errors: any[]): InvalidAchievementDataException {
    const validationErrors: AchievementValidationErrors = {};
    
    // Process class-validator errors into a field-error map
    errors.forEach(error => {
      const property = error.property;
      const constraints = error.constraints || {};
      
      // Extract error messages from constraints
      validationErrors[property] = Object.values(constraints);
    });
    
    return new InvalidAchievementDataException(validationErrors);
  }

  /**
   * Creates an instance with a single field error.
   * Convenience method for simple validation failures.
   * 
   * @param field - The field that failed validation
   * @param errorMessage - The validation error message
   * @returns A new InvalidAchievementDataException instance
   */
  static forField(field: string, errorMessage: string): InvalidAchievementDataException {
    return new InvalidAchievementDataException({ [field]: errorMessage });
  }
}