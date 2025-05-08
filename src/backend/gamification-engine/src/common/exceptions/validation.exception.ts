import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { ClientException } from './client.exception';

/**
 * Interface for field-specific validation errors
 */
export interface FieldValidationError {
  field: string;
  message: string;
  value?: any;
  constraints?: Record<string, string>;
}

/**
 * Interface for schema validation errors
 */
export interface SchemaValidationError {
  path: string;
  message: string;
  schemaPath?: string;
  value?: any;
}

/**
 * Specialized client exception for handling validation failures in API requests and event payloads.
 * Provides detailed field-specific validation errors to help clients correct their requests
 * while maintaining a consistent error response structure.
 */
export class ValidationException extends ClientException {
  /**
   * Creates a new ValidationException instance
   * 
   * @param message Human-readable error message
   * @param fieldErrors Optional array of field-specific validation errors
   * @param schemaErrors Optional array of schema validation errors
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    fieldErrors?: FieldValidationError[],
    schemaErrors?: SchemaValidationError[],
    cause?: Error,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    super(
      message,
      ErrorType.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      cause,
      {
        ...metadata,
        fieldErrors: fieldErrors || [],
        schemaErrors: schemaErrors || [],
      },
      context,
    );
  }

  /**
   * Creates a ValidationException from a class-validator error array
   * 
   * @param errors Array of class-validator validation errors
   * @param message Optional custom error message
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static fromClassValidatorErrors(
    errors: any[],
    message = 'Validation failed',
    context: ErrorContext = {},
  ): ValidationException {
    const fieldErrors: FieldValidationError[] = errors.map(error => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      value: error.value,
      constraints: error.constraints,
    }));

    return new ValidationException(
      message,
      fieldErrors,
      undefined,
      undefined,
      { errorCount: fieldErrors.length },
      context,
    );
  }

  /**
   * Creates a ValidationException from a Zod validation error
   * 
   * @param zodError Zod validation error
   * @param message Optional custom error message
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static fromZodError(
    zodError: any,
    message = 'Schema validation failed',
    context: ErrorContext = {},
  ): ValidationException {
    const schemaErrors: SchemaValidationError[] = zodError.errors?.map(error => ({
      path: error.path.join('.'),
      message: error.message,
      schemaPath: error.code,
      value: error.input,
    })) || [];

    return new ValidationException(
      message,
      undefined,
      schemaErrors,
      zodError,
      { errorCount: schemaErrors.length },
      context,
    );
  }

  /**
   * Creates a ValidationException from a JSON Schema validation error
   * 
   * @param jsonSchemaErrors JSON Schema validation errors
   * @param message Optional custom error message
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static fromJsonSchemaErrors(
    jsonSchemaErrors: any[],
    message = 'JSON Schema validation failed',
    context: ErrorContext = {},
  ): ValidationException {
    const schemaErrors: SchemaValidationError[] = jsonSchemaErrors.map(error => ({
      path: error.instancePath || error.dataPath || '',
      message: error.message || 'Invalid value',
      schemaPath: error.schemaPath,
      value: error.data,
    }));

    return new ValidationException(
      message,
      undefined,
      schemaErrors,
      new Error('JSON Schema validation failed'),
      { errorCount: schemaErrors.length },
      context,
    );
  }

  /**
   * Creates a ValidationException for a specific field error
   * 
   * @param field Field name that failed validation
   * @param message Error message
   * @param value Optional invalid value
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static forField(
    field: string,
    message: string,
    value?: any,
    context: ErrorContext = {},
  ): ValidationException {
    const fieldError: FieldValidationError = {
      field,
      message,
      value,
    };

    return new ValidationException(
      `Validation failed: ${message}`,
      [fieldError],
      undefined,
      undefined,
      { errorCount: 1 },
      context,
    );
  }

  /**
   * Creates a ValidationException for multiple field errors
   * 
   * @param errors Map of field names to error messages
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static forFields(
    errors: Record<string, string>,
    context: ErrorContext = {},
  ): ValidationException {
    const fieldErrors: FieldValidationError[] = Object.entries(errors).map(
      ([field, message]) => ({
        field,
        message,
      }),
    );

    return new ValidationException(
      'Multiple validation errors occurred',
      fieldErrors,
      undefined,
      undefined,
      { errorCount: fieldErrors.length },
      context,
    );
  }

  /**
   * Creates a ValidationException for a missing required field
   * 
   * @param field Required field that is missing
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static missingRequiredField(
    field: string,
    context: ErrorContext = {},
  ): ValidationException {
    return ValidationException.forField(
      field,
      `The ${field} field is required`,
      undefined,
      context,
    );
  }

  /**
   * Creates a ValidationException for an invalid field format
   * 
   * @param field Field with invalid format
   * @param expectedFormat Description of the expected format
   * @param value Invalid value
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static invalidFormat(
    field: string,
    expectedFormat: string,
    value?: any,
    context: ErrorContext = {},
  ): ValidationException {
    return ValidationException.forField(
      field,
      `The ${field} field must be in ${expectedFormat} format`,
      value,
      context,
    );
  }

  /**
   * Creates a ValidationException for a value outside of allowed range
   * 
   * @param field Field with out-of-range value
   * @param min Minimum allowed value
   * @param max Maximum allowed value
   * @param value Invalid value
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static outOfRange(
    field: string,
    min: number,
    max: number,
    value?: any,
    context: ErrorContext = {},
  ): ValidationException {
    return ValidationException.forField(
      field,
      `The ${field} field must be between ${min} and ${max}`,
      value,
      context,
    );
  }

  /**
   * Creates a ValidationException for an invalid enum value
   * 
   * @param field Field with invalid enum value
   * @param allowedValues Array of allowed values
   * @param value Invalid value
   * @param context Optional error context
   * @returns New ValidationException instance
   */
  static invalidEnumValue(
    field: string,
    allowedValues: any[],
    value?: any,
    context: ErrorContext = {},
  ): ValidationException {
    const allowedValuesStr = allowedValues.map(v => `'${v}'`).join(', ');
    return ValidationException.forField(
      field,
      `The ${field} field must be one of: ${allowedValuesStr}`,
      value,
      context,
    );
  }

  /**
   * Adds a field error to the existing validation exception
   * 
   * @param field Field name
   * @param message Error message
   * @param value Optional invalid value
   * @returns This instance for method chaining
   */
  addFieldError(field: string, message: string, value?: any): this {
    const fieldErrors = [...(this.metadata.fieldErrors || [])];
    fieldErrors.push({ field, message, value });
    
    this.addMetadata('fieldErrors', fieldErrors);
    this.addMetadata('errorCount', fieldErrors.length + (this.metadata.schemaErrors?.length || 0));
    
    return this;
  }

  /**
   * Adds a schema error to the existing validation exception
   * 
   * @param path JSON path to the invalid property
   * @param message Error message
   * @param schemaPath Optional JSON Schema path
   * @param value Optional invalid value
   * @returns This instance for method chaining
   */
  addSchemaError(path: string, message: string, schemaPath?: string, value?: any): this {
    const schemaErrors = [...(this.metadata.schemaErrors || [])];
    schemaErrors.push({ path, message, schemaPath, value });
    
    this.addMetadata('schemaErrors', schemaErrors);
    this.addMetadata('errorCount', schemaErrors.length + (this.metadata.fieldErrors?.length || 0));
    
    return this;
  }

  /**
   * Gets a summary of all validation errors
   * 
   * @returns Object containing counts and details of validation errors
   */
  getValidationErrorSummary(): Record<string, any> {
    const fieldErrors = this.metadata.fieldErrors || [];
    const schemaErrors = this.metadata.schemaErrors || [];
    
    return {
      totalErrors: fieldErrors.length + schemaErrors.length,
      fieldErrorCount: fieldErrors.length,
      schemaErrorCount: schemaErrors.length,
      fieldErrors: fieldErrors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>),
      schemaErrors: schemaErrors.map(error => ({
        path: error.path,
        message: error.message,
      })),
    };
  }

  /**
   * Gets client-safe metadata that can be included in responses
   * For validation errors, we include detailed validation error information
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    return {
      fieldErrors: this.metadata.fieldErrors || [],
      schemaErrors: this.metadata.schemaErrors?.map(error => ({
        path: error.path,
        message: error.message,
      })) || [],
      errorCount: this.metadata.errorCount || 0,
    };
  }
}