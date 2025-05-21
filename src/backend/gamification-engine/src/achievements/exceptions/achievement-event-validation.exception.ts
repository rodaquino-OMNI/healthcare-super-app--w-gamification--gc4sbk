import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when an achievement event fails validation.
 * This is a client error (400 Bad Request) that includes details about the validation failures.
 */
export class AchievementEventValidationException extends HttpException {
  /**
   * Creates a new instance of AchievementEventValidationException.
   * 
   * @param eventType The type of event that failed validation
   * @param validationErrors Array of validation error messages or object with field-specific errors
   * @param eventPayload The original event payload that failed validation (for debugging)
   * @param schemaVersion The version of the schema that was used for validation
   */
  constructor(
    private readonly eventType: string,
    private readonly validationErrors: string[] | Record<string, string[]>,
    private readonly eventPayload: Record<string, any>,
    private readonly schemaVersion?: string,
  ) {
    // Create a user-friendly error message
    const errorMessage = Array.isArray(validationErrors)
      ? `Invalid achievement event: ${validationErrors.join(', ')}`
      : `Invalid achievement event: validation failed for ${Object.keys(validationErrors).length} fields`;
    
    // Pass the error message and status code to the parent HttpException
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        error: 'Achievement Event Validation Error',
        details: {
          eventType,
          validationErrors,
          schemaVersion,
        },
      },
      HttpStatus.BAD_REQUEST,
    );

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AchievementEventValidationException.prototype);
  }

  /**
   * Gets the type of event that failed validation.
   */
  getEventType(): string {
    return this.eventType;
  }

  /**
   * Gets the validation errors that caused this exception.
   */
  getValidationErrors(): string[] | Record<string, string[]> {
    return this.validationErrors;
  }

  /**
   * Gets the original event payload that failed validation.
   * This is useful for debugging purposes.
   */
  getEventPayload(): Record<string, any> {
    return this.eventPayload;
  }

  /**
   * Gets the schema version that was used for validation, if available.
   */
  getSchemaVersion(): string | undefined {
    return this.schemaVersion;
  }
}