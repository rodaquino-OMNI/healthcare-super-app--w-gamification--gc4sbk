import { Injectable, Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventValidationError } from '../errors/kafka.errors';
import { ERROR_CODES } from '../constants/errors.constants';

/**
 * Service for validating event schemas against registered DTOs.
 * 
 * This service maintains a registry of event schemas (DTOs) and provides
 * validation capabilities to ensure events conform to their expected structure.
 */
@Injectable()
export class EventSchemaRegistry {
  private readonly logger = new Logger(EventSchemaRegistry.name);
  private readonly schemas = new Map<string, any>();

  /**
   * Registers a schema for a specific topic or event type.
   * 
   * @param key - The topic or event type identifier
   * @param schemaClass - The class (DTO) representing the schema
   */
  register(key: string, schemaClass: any): void {
    this.schemas.set(key, schemaClass);
    this.logger.log(`Registered schema for ${key}`);
  }

  /**
   * Validates a message against its registered schema.
   * 
   * @param key - The topic or event type identifier
   * @param message - The message to validate
   * @returns Promise resolving to void if validation succeeds
   * @throws EventValidationError if validation fails
   */
  async validate(key: string, message: any): Promise<void> {
    const schemaClass = this.schemas.get(key);
    
    if (!schemaClass) {
      this.logger.debug(`No schema registered for ${key}, skipping validation`);
      return;
    }
    
    try {
      // Transform plain object to class instance
      const instance = plainToInstance(schemaClass, message);
      
      // Validate the instance
      const errors = await validate(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
      });
      
      if (errors.length > 0) {
        const formattedErrors = errors.map(error => {
          const constraints = error.constraints ? Object.values(error.constraints) : [];
          return `${error.property}: ${constraints.join(', ')}`;
        }).join('; ');
        
        throw new EventValidationError(
          `Schema validation failed: ${formattedErrors}`,
          ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          { key, errors: formattedErrors }
        );
      }
    } catch (error) {
      if (error instanceof EventValidationError) {
        throw error;
      }
      
      throw new EventValidationError(
        `Schema validation error: ${error.message}`,
        ERROR_CODES.SCHEMA_VALIDATION_ERROR,
        { key },
        error
      );
    }
  }

  /**
   * Checks if a schema is registered for a specific key.
   * 
   * @param key - The topic or event type identifier
   * @returns True if a schema is registered, false otherwise
   */
  hasSchema(key: string): boolean {
    return this.schemas.has(key);
  }

  /**
   * Gets the schema class for a specific key.
   * 
   * @param key - The topic or event type identifier
   * @returns The schema class or undefined if not found
   */
  getSchema(key: string): any {
    return this.schemas.get(key);
  }

  /**
   * Removes a schema from the registry.
   * 
   * @param key - The topic or event type identifier
   * @returns True if the schema was removed, false if it wasn't registered
   */
  unregister(key: string): boolean {
    const result = this.schemas.delete(key);
    if (result) {
      this.logger.log(`Unregistered schema for ${key}`);
    }
    return result;
  }
}