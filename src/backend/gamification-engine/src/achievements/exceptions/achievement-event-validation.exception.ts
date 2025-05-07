import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ClientException } from '@app/errors';
import { ErrorType } from '@app/errors/journey/gamification';

/**
 * Exception thrown when an achievement event fails validation.
 * This is a client error (400 Bad Request) that includes details about the validation failures
 * and the original event payload for debugging purposes.
 *
 * Used when incoming achievement events fail schema validation before processing,
 * ensuring only valid events enter the processing pipeline.
 *
 * @class AchievementEventValidationException
 * @extends {ClientException}
 */
export class AchievementEventValidationException extends ClientException {
  /**
   * The original event payload that failed validation (sanitized for logging)
   */
  readonly eventPayload: Record<string, any>;

  /**
   * Detailed validation errors from class-validator
   */
  readonly validationErrors: ValidationError[];

  /**
   * Schema information for the expected event structure
   */
  readonly schemaInfo: {
    eventType: string;
    schemaVersion: string;
    requiredFields: string[];
    journeyType?: string;
  };

  /**
   * Creates an instance of AchievementEventValidationException.
   *
   * @param {string} message - Human-readable error message
   * @param {Record<string, any>} eventPayload - The original event payload that failed validation
   * @param {ValidationError[]} validationErrors - Detailed validation errors from class-validator
   * @param {Object} schemaInfo - Information about the expected event schema
   * @param {string} schemaInfo.eventType - The type of event that was expected
   * @param {string} schemaInfo.schemaVersion - The version of the schema that was used for validation
   * @param {string[]} schemaInfo.requiredFields - List of required fields for this event type
   * @param {string} [schemaInfo.journeyType] - The journey type associated with this event (health, care, plan)
   */
  constructor(
    message: string,
    eventPayload: Record<string, any>,
    validationErrors: ValidationError[],
    schemaInfo: {
      eventType: string;
      schemaVersion: string;
      requiredFields: string[];
      journeyType?: string;
    },
  ) {
    super(
      message,
      ErrorType.ACHIEVEMENT_EVENT_VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      {
        validationErrors: validationErrors.map(error => ({
          property: error.property,
          value: error.value,
          constraints: error.constraints || {},
        })),
        schemaInfo,
        eventType: schemaInfo.eventType,
      },
    );
    
    this.name = 'AchievementEventValidationException';
    this.eventPayload = this.sanitizePayload(eventPayload);
    this.validationErrors = validationErrors;
    this.schemaInfo = schemaInfo;
  }

  /**
   * Sanitizes the event payload to remove sensitive information before logging
   * @param {Record<string, any>} payload - The original event payload
   * @returns {Record<string, any>} - The sanitized payload
   * @private
   */
  private sanitizePayload(payload: Record<string, any>): Record<string, any> {
    if (!payload) return {};
    
    try {
      // Create a deep copy to avoid modifying the original
      const sanitized = JSON.parse(JSON.stringify(payload));
      
      // Remove sensitive fields if present
      const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];
      
      const sanitizeObject = (obj: Record<string, any>) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.includes(key)) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        });
      };
      
      sanitizeObject(sanitized);
      return sanitized;
    } catch (error) {
      // If serialization fails, return a simplified version
      return { serialization_failed: true, event_type: payload.type || 'unknown' };
    }
  }

  /**
   * Gets formatted validation errors for client response
   * @returns {Array<{property: string, constraints: Record<string, string>}>} Formatted validation errors
   */
  getFormattedValidationErrors(): Array<{
    property: string;
    constraints: Record<string, string>;
  }> {
    return this.validationErrors.map(error => ({
      property: error.property,
      constraints: error.constraints || {},
    }));
  }

  /**
   * Gets schema information for client response
   * @returns {Object} Schema information
   */
  getSchemaInfo(): Record<string, any> {
    return {
      eventType: this.schemaInfo.eventType,
      schemaVersion: this.schemaInfo.schemaVersion,
      requiredFields: this.schemaInfo.requiredFields,
      ...(this.schemaInfo.journeyType ? { journeyType: this.schemaInfo.journeyType } : {}),
    };
  }

  /**
   * Creates a response object suitable for returning to clients
   * Overrides the base toResponse method to include validation-specific details
   * @returns {Object} - Client-friendly error response
   */
  toResponse(): Record<string, any> {
    const baseResponse = super.toResponse();
    return {
      ...baseResponse,
      validationErrors: this.getFormattedValidationErrors(),
      schemaInfo: this.getSchemaInfo(),
    };
  }

  /**
   * Creates a detailed object for logging purposes
   * Overrides the base toLog method to include the event payload for debugging
   * @returns {Object} - Detailed error information for logging
   */
  toLog(): Record<string, any> {
    const baseLog = super.toLog();
    return {
      ...baseLog,
      eventPayload: this.eventPayload,
    };
  }
}