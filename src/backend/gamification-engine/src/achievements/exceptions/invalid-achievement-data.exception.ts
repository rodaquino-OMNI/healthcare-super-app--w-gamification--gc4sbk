import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BaseAchievementException } from './base-achievement.exception';

/**
 * Exception thrown when achievement data fails validation.
 * Provides structured validation error details to help clients correct their requests.
 */
export class InvalidAchievementDataException extends BaseAchievementException {
  /**
   * Creates a new instance of InvalidAchievementDataException.
   * 
   * @param validationErrors - The validation errors from class-validator
   * @param message - Optional custom error message
   */
  constructor(
    private readonly validationErrors: ValidationError[],
    message: string = 'Invalid achievement data provided'
  ) {
    super(
      message,
      'ACH_VALIDATION_ERROR',
      HttpStatus.BAD_REQUEST,
      InvalidAchievementDataException.formatValidationErrors(validationErrors)
    );
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
        children: error.children?.length ? InvalidAchievementDataException.formatValidationErrors(error.children) : undefined
      }))
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
    return InvalidAchievementDataException.formatValidationErrors(this.validationErrors);
  }
}