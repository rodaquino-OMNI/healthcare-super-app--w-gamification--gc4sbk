import { HttpStatus } from '@nestjs/common';
import { ValidationError } from '@austa/errors';
import { GamificationEvent } from '@austa/interfaces/gamification';

/**
 * Exception thrown when an event fails schema validation.
 * This is a client error (400 Bad Request) that occurs when the event payload
 * does not conform to the expected schema structure.
 */
export class EventValidationException extends ValidationError {
  /**
   * Creates a new EventValidationException instance.
   * 
   * @param message - Human-readable error message
   * @param validationErrors - Detailed validation errors by field
   * @param eventType - Type of event that failed validation
   * @param eventId - ID of the event that failed validation (if available)
   */
  constructor(
    message: string,
    private readonly validationErrors: Record<string, string[]>,
    private readonly eventType?: string,
    private readonly eventId?: string,
  ) {
    super(
      message,
      {
        status: HttpStatus.BAD_REQUEST,
        code: 'GAMIFICATION_EVENT_VALIDATION_ERROR',
        validationErrors,
        eventType,
        eventId,
      }
    );
  }

  /**
   * Creates an EventValidationException from a Zod validation error.
   * 
   * @param zodError - The Zod validation error
   * @param event - The event that failed validation (if available)
   * @returns A new EventValidationException with formatted error details
   */
  static fromZodError(zodError: any, event?: Partial<GamificationEvent>): EventValidationException {
    const validationErrors: Record<string, string[]> = {};
    
    // Format Zod validation errors into field-specific messages
    if (zodError.issues && Array.isArray(zodError.issues)) {
      zodError.issues.forEach((issue: any) => {
        const path = issue.path.join('.');
        if (!validationErrors[path]) {
          validationErrors[path] = [];
        }
        validationErrors[path].push(issue.message);
      });
    }

    // Create a human-readable error message
    const errorCount = Object.keys(validationErrors).length;
    const message = errorCount === 1
      ? `Event validation failed: ${Object.keys(validationErrors)[0]} is invalid`
      : `Event validation failed with ${errorCount} errors`;

    return new EventValidationException(
      message,
      validationErrors,
      event?.type,
      event?.id,
    );
  }

  /**
   * Creates an EventValidationException for a missing required field.
   * 
   * @param fieldName - Name of the required field that is missing
   * @param event - The event that failed validation (if available)
   * @returns A new EventValidationException for the missing field
   */
  static missingRequiredField(fieldName: string, event?: Partial<GamificationEvent>): EventValidationException {
    const validationErrors: Record<string, string[]> = {
      [fieldName]: [`${fieldName} is required`],
    };

    return new EventValidationException(
      `Event validation failed: ${fieldName} is required`,
      validationErrors,
      event?.type,
      event?.id,
    );
  }

  /**
   * Creates an EventValidationException for an invalid field value.
   * 
   * @param fieldName - Name of the field with an invalid value
   * @param expectedType - Expected type or format of the field
   * @param event - The event that failed validation (if available)
   * @returns A new EventValidationException for the invalid field
   */
  static invalidFieldValue(
    fieldName: string,
    expectedType: string,
    event?: Partial<GamificationEvent>
  ): EventValidationException {
    const validationErrors: Record<string, string[]> = {
      [fieldName]: [`${fieldName} must be a valid ${expectedType}`],
    };

    return new EventValidationException(
      `Event validation failed: ${fieldName} must be a valid ${expectedType}`,
      validationErrors,
      event?.type,
      event?.id,
    );
  }

  /**
   * Creates an EventValidationException for an unsupported event type.
   * 
   * @param eventType - The unsupported event type
   * @param supportedTypes - List of supported event types
   * @returns A new EventValidationException for the unsupported event type
   */
  static unsupportedEventType(
    eventType: string,
    supportedTypes: string[]
  ): EventValidationException {
    const validationErrors: Record<string, string[]> = {
      type: [`Unsupported event type: ${eventType}. Supported types: ${supportedTypes.join(', ')}`],
    };

    return new EventValidationException(
      `Event validation failed: Unsupported event type: ${eventType}`,
      validationErrors,
      eventType,
      undefined,
    );
  }

  /**
   * Returns the validation errors by field.
   */
  getValidationErrors(): Record<string, string[]> {
    return this.validationErrors;
  }

  /**
   * Returns the event type that failed validation.
   */
  getEventType(): string | undefined {
    return this.eventType;
  }

  /**
   * Returns the event ID that failed validation.
   */
  getEventId(): string | undefined {
    return this.eventId;
  }
}