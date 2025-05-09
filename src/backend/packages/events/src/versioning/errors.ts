/**
 * @file errors.ts
 * @description Defines custom error classes for versioning-related failures with structured
 * error information for improved debugging and error handling. Includes specific error types
 * for version detection failures, incompatible versions, migration failures, and transformation errors.
 */

/**
 * Base error class for versioning-related errors
 * Provides structured error information with error code and context
 */
export class VersioningError extends Error {
  /**
   * Error code for categorization
   */
  public readonly code: string;
  
  /**
   * Additional context for debugging
   */
  public readonly context?: Record<string, any>;
  
  /**
   * Creates a new versioning error
   * @param code Error code for categorization
   * @param message Human-readable error message
   * @param context Additional context for debugging
   */
  constructor(code: string, message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'VersioningError';
    this.code = code;
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersioningError.prototype);
  }
  
  /**
   * Converts the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context
    };
  }
}

/**
 * Error class for version detection failures
 */
export class VersionDetectionError extends VersioningError {
  constructor(message: string, context?: Record<string, any>) {
    super('VERSION_DETECTION_FAILED', message, context);
    this.name = 'VersionDetectionError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersionDetectionError.prototype);
  }
}

/**
 * Error class for version compatibility failures
 */
export class VersionCompatibilityError extends VersioningError {
  constructor(message: string, context?: Record<string, any>) {
    super('VERSION_COMPATIBILITY_FAILED', message, context);
    this.name = 'VersionCompatibilityError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersionCompatibilityError.prototype);
  }
}

/**
 * Error class for migration failures
 */
export class MigrationError extends VersioningError {
  constructor(message: string, context?: Record<string, any>) {
    super('MIGRATION_FAILED', message, context);
    this.name = 'MigrationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MigrationError.prototype);
  }
}

/**
 * Error class for transformation failures
 */
export class TransformationError extends VersioningError {
  constructor(message: string, context?: Record<string, any>) {
    super('TRANSFORMATION_FAILED', message, context);
    this.name = 'TransformationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransformationError.prototype);
  }
}

/**
 * Error class for schema validation failures
 */
export class SchemaValidationError extends VersioningError {
  /**
   * Validation errors
   */
  public readonly validationErrors: Array<{
    path: string;
    message: string;
  }>;
  
  constructor(
    message: string,
    validationErrors: Array<{ path: string; message: string }>,
    context?: Record<string, any>
  ) {
    super('SCHEMA_VALIDATION_FAILED', message, context);
    this.name = 'SchemaValidationError';
    this.validationErrors = validationErrors;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
  
  /**
   * Converts the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

/**
 * Creates a version detection error
 * @param message Error message
 * @param context Additional context
 * @returns Version detection error
 */
export function createVersionDetectionError(
  message: string,
  context?: Record<string, any>
): VersionDetectionError {
  return new VersionDetectionError(message, context);
}

/**
 * Creates a version compatibility error
 * @param message Error message
 * @param context Additional context
 * @returns Version compatibility error
 */
export function createVersionCompatibilityError(
  message: string,
  context?: Record<string, any>
): VersionCompatibilityError {
  return new VersionCompatibilityError(message, context);
}

/**
 * Creates a migration error
 * @param message Error message
 * @param context Additional context
 * @returns Migration error
 */
export function createMigrationError(
  message: string,
  context?: Record<string, any>
): MigrationError {
  return new MigrationError(message, context);
}

/**
 * Creates a transformation error
 * @param message Error message
 * @param context Additional context
 * @returns Transformation error
 */
export function createTransformationError(
  message: string,
  context?: Record<string, any>
): TransformationError {
  return new TransformationError(message, context);
}

/**
 * Creates a schema validation error
 * @param message Error message
 * @param validationErrors Validation errors
 * @param context Additional context
 * @returns Schema validation error
 */
export function createSchemaValidationError(
  message: string,
  validationErrors: Array<{ path: string; message: string }>,
  context?: Record<string, any>
): SchemaValidationError {
  return new SchemaValidationError(message, validationErrors, context);
}