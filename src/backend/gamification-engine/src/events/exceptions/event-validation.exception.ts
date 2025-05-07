import { HttpStatus } from '@nestjs/common';
import { BaseEventException, BaseEventExceptionMetadata } from './base-event.exception';

/**
 * Interface for validation error details
 */
export interface ValidationErrorDetail {
  /**
   * The field/property that failed validation
   */
  field: string;

  /**
   * The validation error message for this field
   */
  message: string;

  /**
   * The expected value or type
   */
  expected?: string;

  /**
   * The actual value or type that was received
   */
  received?: string;

  /**
   * The validation constraint that failed
   */
  constraint?: string;
}

/**
 * Metadata for event validation exceptions
 */
export interface EventValidationExceptionMetadata extends BaseEventExceptionMetadata {
  /**
   * The event type that failed validation
   */
  eventType?: string;

  /**
   * The event version that failed validation
   */
  eventVersion?: string;

  /**
   * Detailed validation errors for specific fields
   */
  validationErrors?: ValidationErrorDetail[];

  /**
   * The schema identifier used for validation
   */
  schemaId?: string;
}

/**
 * Exception thrown when an event fails schema validation.
 * 
 * This exception is used when incoming events fail to conform to the expected
 * structure defined in the @austa/interfaces package. It provides detailed
 * information about which fields failed validation and why, helping clients
 * to correct their requests.
 */
export class EventValidationException extends BaseEventException {
  /**
   * The event type that failed validation
   */
  private readonly eventType?: string;

  /**
   * The event version that failed validation
   */
  private readonly eventVersion?: string;

  /**
   * Detailed validation errors for specific fields
   */
  private readonly validationErrors: ValidationErrorDetail[];

  /**
   * The schema identifier used for validation
   */
  private readonly schemaId?: string;

  /**
   * Creates a new EventValidationException
   * 
   * @param message The error message
   * @param metadata Additional metadata for the exception
   */
  constructor(message: string, metadata: EventValidationExceptionMetadata = {}) {
    // Set default status code to 400 Bad Request for validation errors
    const statusCode = metadata.statusCode || HttpStatus.BAD_REQUEST;
    
    // Set error type to CLIENT for validation errors
    const errorType = 'CLIENT';
    
    // Set default error code if not provided
    const errorCode = metadata.errorCode || 'EVENT_VALIDATION_ERROR';
    
    // Call parent constructor with enhanced metadata
    super(message, {
      ...metadata,
      statusCode,
      errorType,
      errorCode,
    });

    // Set specific properties for this exception type
    this.eventType = metadata.eventType;
    this.eventVersion = metadata.eventVersion;
    this.validationErrors = metadata.validationErrors || [];
    this.schemaId = metadata.schemaId;

    // Set name explicitly for better error identification
    this.name = 'EventValidationException';

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, EventValidationException.prototype);
  }

  /**
   * Get the event type that failed validation
   */
  public getEventType(): string | undefined {
    return this.eventType;
  }

  /**
   * Get the event version that failed validation
   */
  public getEventVersion(): string | undefined {
    return this.eventVersion;
  }

  /**
   * Get the detailed validation errors
   */
  public getValidationErrors(): ValidationErrorDetail[] {
    return [...this.validationErrors];
  }

  /**
   * Get the schema identifier used for validation
   */
  public getSchemaId(): string | undefined {
    return this.schemaId;
  }

  /**
   * Check if there are any field-specific validation errors
   */
  public hasFieldErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  /**
   * Get validation errors for a specific field
   * 
   * @param fieldName The field name to get errors for
   */
  public getFieldErrors(fieldName: string): ValidationErrorDetail[] {
    return this.validationErrors.filter(error => error.field === fieldName);
  }

  /**
   * Create a human-readable error message from the validation errors
   */
  public getFormattedMessage(): string {
    if (!this.hasFieldErrors()) {
      return this.message;
    }

    const baseMessage = `Event validation failed for ${this.eventType || 'unknown'} event`;
    const fieldErrors = this.validationErrors.map(error => 
      `- ${error.field}: ${error.message}${error.expected ? ` (expected: ${error.expected})` : ''}`
    ).join('\n');

    return `${baseMessage}:\n${fieldErrors}`;
  }

  /**
   * Serialize the exception for logging and monitoring
   */
  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      validationErrors: this.validationErrors,
      schemaId: this.schemaId,
    };
  }

  /**
   * Create an EventValidationException from a Zod validation error
   * 
   * @param zodError The Zod validation error
   * @param eventType The event type that failed validation
   * @param eventVersion The event version that failed validation
   * @param schemaId The schema identifier used for validation
   */
  public static fromZodError(
    zodError: any,
    eventType?: string,
    eventVersion?: string,
    schemaId?: string,
  ): EventValidationException {
    // Extract validation errors from Zod error format
    const validationErrors: ValidationErrorDetail[] = zodError.errors?.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      expected: error.expected,
      received: error.received,
      constraint: error.code,
    })) || [];

    return new EventValidationException(
      `Event validation failed for ${eventType || 'unknown'} event`,
      {
        eventType,
        eventVersion,
        schemaId,
        validationErrors,
        errorCode: 'EVENT_SCHEMA_VALIDATION_ERROR',
      },
    );
  }

  /**
   * Create an EventValidationException from a class-validator validation error
   * 
   * @param validationErrors The class-validator validation errors
   * @param eventType The event type that failed validation
   * @param eventVersion The event version that failed validation
   * @param schemaId The schema identifier used for validation
   */
  public static fromClassValidatorErrors(
    validationErrors: any[],
    eventType?: string,
    eventVersion?: string,
    schemaId?: string,
  ): EventValidationException {
    // Extract validation errors from class-validator format
    const errors: ValidationErrorDetail[] = [];
    
    for (const error of validationErrors) {
      const field = error.property;
      
      if (error.constraints) {
        // Add each constraint violation as a separate error detail
        for (const [constraint, message] of Object.entries(error.constraints)) {
          errors.push({
            field,
            message: message as string,
            constraint,
          });
        }
      }
      
      // Process nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.fromClassValidatorErrors(
          error.children,
          eventType,
          eventVersion,
          schemaId,
        ).getValidationErrors();
        
        // Prefix nested errors with parent field name
        for (const nestedError of nestedErrors) {
          errors.push({
            ...nestedError,
            field: `${field}.${nestedError.field}`,
          });
        }
      }
    }

    return new EventValidationException(
      `Event validation failed for ${eventType || 'unknown'} event`,
      {
        eventType,
        eventVersion,
        schemaId,
        validationErrors: errors,
        errorCode: 'EVENT_DTO_VALIDATION_ERROR',
      },
    );
  }
}