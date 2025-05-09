/**
 * @file errors.ts
 * @description Error classes for event versioning in the AUSTA SuperApp.
 * This module provides specialized error classes for handling versioning-related errors,
 * enabling better error handling and reporting throughout the event processing pipeline.
 */

import { EventVersion } from './types';

/**
 * Base error class for event schema errors
 */
export class EventSchemaError extends Error {
  /** Error code for categorization */
  code: string;
  /** Additional context for the error */
  context: Record<string, any>;

  /**
   * Create a new event schema error
   * @param message Error message
   * @param context Additional context
   * @param code Error code
   */
  constructor(message: string, context: Record<string, any> = {}, code: string = 'EVENT_SCHEMA_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EventSchemaError.prototype);
  }

  /**
   * Convert the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Error thrown when schema registration fails
 */
export class EventSchemaRegistrationError extends EventSchemaError {
  /**
   * Create a new schema registration error
   * @param message Error message
   * @param context Additional context
   */
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, context, 'EVENT_SCHEMA_REGISTRATION_ERROR');
    Object.setPrototypeOf(this, EventSchemaRegistrationError.prototype);
  }
}

/**
 * Error thrown when a schema is not found
 */
export class EventSchemaNotFoundError extends EventSchemaError {
  /**
   * Create a new schema not found error
   * @param message Error message
   * @param context Additional context
   */
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, context, 'EVENT_SCHEMA_NOT_FOUND_ERROR');
    Object.setPrototypeOf(this, EventSchemaNotFoundError.prototype);
  }
}

/**
 * Error thrown when schema validation fails
 */
export class EventSchemaValidationError extends EventSchemaError {
  /** Validation errors */
  errors: any[];

  /**
   * Create a new schema validation error
   * @param message Error message
   * @param errors Validation errors
   * @param context Additional context
   */
  constructor(message: string, errors: any[] = [], context: Record<string, any> = {}) {
    super(message, { ...context, errors }, 'EVENT_SCHEMA_VALIDATION_ERROR');
    this.errors = errors;
    Object.setPrototypeOf(this, EventSchemaValidationError.prototype);
  }

  /**
   * Convert the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      errors: this.errors
    };
  }
}

/**
 * Error thrown when schema version is invalid
 */
export class EventSchemaVersionError extends EventSchemaError {
  /**
   * Create a new schema version error
   * @param message Error message
   * @param context Additional context
   */
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, context, 'EVENT_SCHEMA_VERSION_ERROR');
    Object.setPrototypeOf(this, EventSchemaVersionError.prototype);
  }
}

/**
 * Error thrown when schema compatibility check fails
 */
export class EventSchemaCompatibilityError extends EventSchemaError {
  /** Source version */
  sourceVersion: EventVersion;
  /** Target version */
  targetVersion: EventVersion;
  /** Incompatibilities found */
  incompatibilities: string[];

  /**
   * Create a new schema compatibility error
   * @param message Error message
   * @param sourceVersion Source version
   * @param targetVersion Target version
   * @param incompatibilities Incompatibilities found
   * @param context Additional context
   */
  constructor(
    message: string,
    sourceVersion: EventVersion,
    targetVersion: EventVersion,
    incompatibilities: string[] = [],
    context: Record<string, any> = {}
  ) {
    super(
      message,
      { ...context, sourceVersion, targetVersion, incompatibilities },
      'EVENT_SCHEMA_COMPATIBILITY_ERROR'
    );
    this.sourceVersion = sourceVersion;
    this.targetVersion = targetVersion;
    this.incompatibilities = incompatibilities;
    Object.setPrototypeOf(this, EventSchemaCompatibilityError.prototype);
  }

  /**
   * Convert the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      sourceVersion: this.sourceVersion,
      targetVersion: this.targetVersion,
      incompatibilities: this.incompatibilities
    };
  }
}

/**
 * Error thrown when event migration fails
 */
export class EventMigrationError extends EventSchemaError {
  /** Source version */
  sourceVersion: EventVersion;
  /** Target version */
  targetVersion: EventVersion;
  /** Original event */
  originalEvent: any;

  /**
   * Create a new event migration error
   * @param message Error message
   * @param sourceVersion Source version
   * @param targetVersion Target version
   * @param originalEvent Original event
   * @param context Additional context
   */
  constructor(
    message: string,
    sourceVersion: EventVersion,
    targetVersion: EventVersion,
    originalEvent: any,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      { ...context, sourceVersion, targetVersion },
      'EVENT_MIGRATION_ERROR'
    );
    this.sourceVersion = sourceVersion;
    this.targetVersion = targetVersion;
    this.originalEvent = originalEvent;
    Object.setPrototypeOf(this, EventMigrationError.prototype);
  }

  /**
   * Convert the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      sourceVersion: this.sourceVersion,
      targetVersion: this.targetVersion,
      // Don't include the original event in JSON to avoid potentially large payloads
      hasOriginalEvent: !!this.originalEvent
    };
  }
}

/**
 * Error thrown when event type is invalid or missing
 */
export class EventTypeError extends EventSchemaError {
  /**
   * Create a new event type error
   * @param message Error message
   * @param context Additional context
   */
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, context, 'EVENT_TYPE_ERROR');
    Object.setPrototypeOf(this, EventTypeError.prototype);
  }
}

/**
 * Error thrown when journey validation fails
 */
export class JourneyValidationError extends EventSchemaError {
  /** Journey identifier */
  journey: string;
  /** Validation errors */
  errors: any[];

  /**
   * Create a new journey validation error
   * @param message Error message
   * @param journey Journey identifier
   * @param errors Validation errors
   * @param context Additional context
   */
  constructor(
    message: string,
    journey: string,
    errors: any[] = [],
    context: Record<string, any> = {}
  ) {
    super(
      message,
      { ...context, journey, errors },
      'JOURNEY_VALIDATION_ERROR'
    );
    this.journey = journey;
    this.errors = errors;
    Object.setPrototypeOf(this, JourneyValidationError.prototype);
  }

  /**
   * Convert the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      journey: this.journey,
      errors: this.errors
    };
  }
}