import { Injectable, Inject } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { ExternalResponseFormatError } from '@austa/errors/categories';
import { GamificationEvent } from '@austa/interfaces/gamification/events';

/**
 * Service for validating event schemas against registered schemas.
 * 
 * This service ensures that all events processed by the gamification engine
 * conform to the expected schema for their event type, providing type safety
 * and consistent data structures across the application.
 */
@Injectable()
export class EventSchemaValidationService {
  /**
   * Creates a new instance of the EventSchemaValidationService.
   * 
   * @param logger Service for logging
   * @param schemaRegistry Registry of event schemas for validation
   */
  constructor(
    private readonly logger: LoggerService,
    @Inject('EVENT_SCHEMA_REGISTRY') private readonly schemaRegistry: any
  ) {}

  /**
   * Validates an event against its schema.
   * 
   * @param event The event to validate
   * @param eventType Optional event type override
   * @throws ExternalResponseFormatError if validation fails
   */
  validate(event: any, eventType?: string): void {
    const type = eventType || event.type;
    
    if (!type) {
      throw new ExternalResponseFormatError('Event is missing type property');
    }
    
    // Get schema for event type
    const schema = this.schemaRegistry.schemas[type];
    if (!schema) {
      throw new ExternalResponseFormatError(`No schema found for event type: ${type}`);
    }
    
    // Convert plain object to class instance
    const eventInstance = plainToInstance(GamificationEvent, event);
    
    // Validate against schema
    const errors = validateSync(eventInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    });
    
    if (errors.length > 0) {
      const validationErrors = this.formatValidationErrors(errors);
      
      this.logger.error(
        `Event validation failed for type ${type}`,
        { eventType: type, errors: validationErrors },
        'EventSchemaValidationService'
      );
      
      throw new ExternalResponseFormatError(`Event validation failed: ${validationErrors}`);
    }
  }
  
  /**
   * Formats validation errors into a readable string.
   * 
   * @param errors Array of validation errors
   * @returns Formatted error string
   */
  private formatValidationErrors(errors: ValidationError[]): string {
    return errors.map(error => {
      if (error.children && error.children.length > 0) {
        return `${error.property}: ${this.formatValidationErrors(error.children)}`;
      }
      return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
    }).join('; ');
  }
  
  /**
   * Checks if a schema exists for the given event type.
   * 
   * @param eventType The event type to check
   * @returns True if a schema exists, false otherwise
   */
  hasSchema(eventType: string): boolean {
    return !!this.schemaRegistry.schemas[eventType];
  }
  
  /**
   * Gets the schema version for the given event type.
   * 
   * @param eventType The event type to check
   * @returns The schema version or null if not found
   */
  getSchemaVersion(eventType: string): string | null {
    if (!this.hasSchema(eventType)) {
      return null;
    }
    
    return this.schemaRegistry.schemaVersion;
  }
  
  /**
   * Gets all registered event types.
   * 
   * @returns Array of registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Object.keys(this.schemaRegistry.schemas);
  }
}