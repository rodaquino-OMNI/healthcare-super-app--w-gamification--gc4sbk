import { ConfigurationError } from '@austa/errors/categories/technical.errors';
import { ErrorType } from '@austa/errors/types';

/**
 * Base class for all environment variable related errors.
 * Extends ConfigurationError to maintain consistent error handling patterns.
 */
export class EnvironmentVariableError extends ConfigurationError {
  /**
   * Creates a new EnvironmentVariableError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param variableName - The name of the environment variable with the issue
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    code = 'ENV_VARIABLE_ERROR',
    variableName?: string,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, code, variableName, details, {
      ...context,
      component: 'environment',
      severity: 'critical',
      failFast: true
    }, cause);
  }

  /**
   * The name of the environment variable that caused the error.
   */
  get variableName(): string | undefined {
    return this.context.configKey;
  }
}

/**
 * Error thrown when a required environment variable is missing.
 */
export class MissingEnvironmentVariableError extends EnvironmentVariableError {
  /**
   * Creates a new MissingEnvironmentVariableError instance.
   * 
   * @param variableName - The name of the missing environment variable
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   */
  constructor(
    variableName: string,
    message = `Missing required environment variable: ${variableName}`,
    details?: any,
    context?: any
  ) {
    super(message, 'MISSING_ENV_VARIABLE', variableName, details, {
      ...context,
      severity: 'critical',
      failFast: true
    });
  }

  /**
   * Creates a MissingEnvironmentVariableError with journey context.
   * 
   * @param variableName - The name of the missing environment variable
   * @param journey - The journey context (health, care, plan, etc.)
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new MissingEnvironmentVariableError instance with journey context
   */
  static forJourney(
    variableName: string,
    journey: string,
    message = `Missing required environment variable for ${journey} journey: ${variableName}`,
    details?: any,
    context?: any
  ): MissingEnvironmentVariableError {
    return new MissingEnvironmentVariableError(variableName, message, details, {
      ...context,
      journey
    });
  }
}

/**
 * Error thrown when an environment variable has an invalid value.
 */
export class InvalidEnvironmentVariableError extends EnvironmentVariableError {
  /**
   * Creates a new InvalidEnvironmentVariableError instance.
   * 
   * @param variableName - The name of the environment variable with an invalid value
   * @param actualValue - The actual value of the environment variable
   * @param expectedFormat - Description of the expected format or constraints
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    variableName: string,
    public readonly actualValue: string,
    public readonly expectedFormat: string,
    message = `Invalid value for environment variable ${variableName}: "${actualValue}". Expected: ${expectedFormat}`,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(message, 'INVALID_ENV_VARIABLE', variableName, details, {
      ...context,
      actualValue,
      expectedFormat,
      severity: 'critical',
      failFast: true
    }, cause);
  }

  /**
   * Creates an InvalidEnvironmentVariableError for a specific validation rule.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param validationRule - The validation rule that failed (e.g., 'url', 'numeric', 'enum')
   * @param expectedFormat - Description of the expected format or constraints
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new InvalidEnvironmentVariableError instance
   */
  static forValidationRule(
    variableName: string,
    actualValue: string,
    validationRule: string,
    expectedFormat: string,
    message = `Invalid value for environment variable ${variableName}: "${actualValue}". Failed ${validationRule} validation. Expected: ${expectedFormat}`,
    details?: any,
    context?: any
  ): InvalidEnvironmentVariableError {
    return new InvalidEnvironmentVariableError(
      variableName,
      actualValue,
      expectedFormat,
      message,
      {
        ...details,
        validationRule
      },
      context
    );
  }
}

/**
 * Error thrown when an environment variable has a value of the wrong type.
 */
export class EnvironmentVariableTypeError extends InvalidEnvironmentVariableError {
  /**
   * Creates a new EnvironmentVariableTypeError instance.
   * 
   * @param variableName - The name of the environment variable with the wrong type
   * @param actualValue - The actual value of the environment variable
   * @param expectedType - The expected type (e.g., 'number', 'boolean', 'array')
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    variableName: string,
    actualValue: string,
    public readonly expectedType: string,
    message = `Invalid type for environment variable ${variableName}: "${actualValue}". Expected type: ${expectedType}`,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(
      variableName,
      actualValue,
      `type ${expectedType}`,
      message,
      {
        ...details,
        expectedType
      },
      context,
      cause
    );
  }

  /**
   * Creates an EnvironmentVariableTypeError for a numeric type.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new EnvironmentVariableTypeError instance
   */
  static forNumeric(
    variableName: string,
    actualValue: string,
    message = `Invalid numeric value for environment variable ${variableName}: "${actualValue}". Expected a valid number.`,
    details?: any,
    context?: any
  ): EnvironmentVariableTypeError {
    return new EnvironmentVariableTypeError(
      variableName,
      actualValue,
      'number',
      message,
      details,
      context
    );
  }

  /**
   * Creates an EnvironmentVariableTypeError for a boolean type.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new EnvironmentVariableTypeError instance
   */
  static forBoolean(
    variableName: string,
    actualValue: string,
    message = `Invalid boolean value for environment variable ${variableName}: "${actualValue}". Expected 'true', 'false', '1', or '0'.`,
    details?: any,
    context?: any
  ): EnvironmentVariableTypeError {
    return new EnvironmentVariableTypeError(
      variableName,
      actualValue,
      'boolean',
      message,
      details,
      context
    );
  }

  /**
   * Creates an EnvironmentVariableTypeError for an array type.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param delimiter - The expected delimiter for array items
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new EnvironmentVariableTypeError instance
   */
  static forArray(
    variableName: string,
    actualValue: string,
    delimiter = ',',
    message = `Invalid array value for environment variable ${variableName}: "${actualValue}". Expected items separated by '${delimiter}'.`,
    details?: any,
    context?: any
  ): EnvironmentVariableTypeError {
    return new EnvironmentVariableTypeError(
      variableName,
      actualValue,
      `array (items separated by '${delimiter}')`,
      message,
      {
        ...details,
        delimiter
      },
      context
    );
  }

  /**
   * Creates an EnvironmentVariableTypeError for a JSON type.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new EnvironmentVariableTypeError instance
   */
  static forJson(
    variableName: string,
    actualValue: string,
    message = `Invalid JSON value for environment variable ${variableName}. Expected valid JSON.`,
    details?: any,
    context?: any,
    cause?: Error
  ): EnvironmentVariableTypeError {
    return new EnvironmentVariableTypeError(
      variableName,
      actualValue,
      'JSON',
      message,
      details,
      context,
      cause
    );
  }
}

/**
 * Error thrown when an environment variable fails validation rules.
 */
export class EnvironmentVariableValidationError extends InvalidEnvironmentVariableError {
  /**
   * Creates a new EnvironmentVariableValidationError instance.
   * 
   * @param variableName - The name of the environment variable that failed validation
   * @param actualValue - The actual value of the environment variable
   * @param validationRule - The validation rule that failed
   * @param expectedConstraint - Description of the expected constraints
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    variableName: string,
    actualValue: string,
    public readonly validationRule: string,
    expectedConstraint: string,
    message = `Environment variable ${variableName} with value "${actualValue}" failed validation: ${validationRule}. Expected: ${expectedConstraint}`,
    details?: any,
    context?: any,
    cause?: Error
  ) {
    super(
      variableName,
      actualValue,
      expectedConstraint,
      message,
      {
        ...details,
        validationRule
      },
      context,
      cause
    );
  }

  /**
   * Creates an EnvironmentVariableValidationError for a range validation.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param min - The minimum allowed value
   * @param max - The maximum allowed value
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new EnvironmentVariableValidationError instance
   */
  static forRange(
    variableName: string,
    actualValue: string,
    min: number,
    max: number,
    message = `Environment variable ${variableName} with value "${actualValue}" is out of range. Expected value between ${min} and ${max}.`,
    details?: any,
    context?: any
  ): EnvironmentVariableValidationError {
    return new EnvironmentVariableValidationError(
      variableName,
      actualValue,
      'range',
      `value between ${min} and ${max}`,
      message,
      {
        ...details,
        min,
        max
      },
      context
    );
  }

  /**
   * Creates an EnvironmentVariableValidationError for a pattern validation.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param pattern - The regex pattern that the value should match
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new EnvironmentVariableValidationError instance
   */
  static forPattern(
    variableName: string,
    actualValue: string,
    pattern: string | RegExp,
    message = `Environment variable ${variableName} with value "${actualValue}" does not match required pattern.`,
    details?: any,
    context?: any
  ): EnvironmentVariableValidationError {
    const patternStr = pattern instanceof RegExp ? pattern.toString() : pattern;
    return new EnvironmentVariableValidationError(
      variableName,
      actualValue,
      'pattern',
      `value matching ${patternStr}`,
      message,
      {
        ...details,
        pattern: patternStr
      },
      context
    );
  }

  /**
   * Creates an EnvironmentVariableValidationError for an enum validation.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param allowedValues - The allowed values for the environment variable
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new EnvironmentVariableValidationError instance
   */
  static forEnum(
    variableName: string,
    actualValue: string,
    allowedValues: string[],
    message = `Environment variable ${variableName} with value "${actualValue}" is not one of the allowed values: ${allowedValues.join(', ')}.`,
    details?: any,
    context?: any
  ): EnvironmentVariableValidationError {
    return new EnvironmentVariableValidationError(
      variableName,
      actualValue,
      'enum',
      `one of [${allowedValues.join(', ')}]`,
      message,
      {
        ...details,
        allowedValues
      },
      context
    );
  }

  /**
   * Creates an EnvironmentVariableValidationError for a URL validation.
   * 
   * @param variableName - The name of the environment variable
   * @param actualValue - The actual value of the environment variable
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   * @returns A new EnvironmentVariableValidationError instance
   */
  static forUrl(
    variableName: string,
    actualValue: string,
    message = `Environment variable ${variableName} with value "${actualValue}" is not a valid URL.`,
    details?: any,
    context?: any,
    cause?: Error
  ): EnvironmentVariableValidationError {
    return new EnvironmentVariableValidationError(
      variableName,
      actualValue,
      'url',
      'valid URL',
      message,
      details,
      context,
      cause
    );
  }
}

/**
 * Error thrown when multiple environment variable errors occur.
 * Aggregates multiple errors for batch validation scenarios.
 */
export class EnvironmentVariableBatchError extends EnvironmentVariableError {
  /**
   * Creates a new EnvironmentVariableBatchError instance.
   * 
   * @param errors - Array of environment variable errors
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   */
  constructor(
    public readonly errors: EnvironmentVariableError[],
    message = `Multiple environment variable errors (${errors.length})`,
    code = 'ENV_BATCH_VALIDATION_ERROR',
    details?: any,
    context?: any
  ) {
    super(message, code, undefined, {
      ...details,
      errorCount: errors.length,
      errorSummary: errors.map(err => ({
        variableName: err.variableName,
        message: err.message
      }))
    }, context);
  }

  /**
   * Returns a formatted string with all error messages.
   * 
   * @returns A string with all error messages, one per line
   */
  getFormattedErrors(): string {
    return this.errors
      .map((err, index) => `${index + 1}. ${err.message}`)
      .join('\n');
  }

  /**
   * Returns an object mapping variable names to error messages.
   * 
   * @returns An object with variable names as keys and error messages as values
   */
  getErrorMap(): Record<string, string> {
    return this.errors.reduce((map, err) => {
      if (err.variableName) {
        map[err.variableName] = err.message;
      }
      return map;
    }, {} as Record<string, string>);
  }

  /**
   * Creates a new EnvironmentVariableBatchError from an array of errors.
   * Filters out non-environment variable errors.
   * 
   * @param errors - Array of errors (can include non-environment variable errors)
   * @param message - Human-readable error message (optional, will be generated if not provided)
   * @param details - Additional details about the error (optional)
   * @param context - Additional context information about the error (optional)
   * @returns A new EnvironmentVariableBatchError instance, or null if no environment variable errors
   */
  static fromErrors(
    errors: Error[],
    message?: string,
    details?: any,
    context?: any
  ): EnvironmentVariableBatchError | null {
    const envErrors = errors.filter(
      (err): err is EnvironmentVariableError => err instanceof EnvironmentVariableError
    );

    if (envErrors.length === 0) {
      return null;
    }

    const defaultMessage = `Multiple environment variable errors (${envErrors.length})`;
    return new EnvironmentVariableBatchError(
      envErrors,
      message || defaultMessage,
      'ENV_BATCH_VALIDATION_ERROR',
      details,
      context
    );
  }
}

/**
 * Utility function to handle environment variable errors with a fallback value.
 * If the callback throws an EnvironmentVariableError, returns the fallback value.
 * 
 * @param callback - Function that might throw an EnvironmentVariableError
 * @param fallbackValue - Value to return if an error occurs
 * @param errorHandler - Optional function to handle the error
 * @returns The result of the callback or the fallback value
 */
export function withEnvErrorFallback<T>(
  callback: () => T,
  fallbackValue: T,
  errorHandler?: (error: EnvironmentVariableError) => void
): T {
  try {
    return callback();
  } catch (error) {
    if (error instanceof EnvironmentVariableError && errorHandler) {
      errorHandler(error);
    }
    return fallbackValue;
  }
}

/**
 * Utility function to collect all environment variable errors instead of throwing immediately.
 * Executes all validation functions and collects any errors that occur.
 * 
 * @param validations - Array of validation functions that might throw EnvironmentVariableError
 * @param throwOnError - Whether to throw a batch error if any validations fail (default: true)
 * @returns Array of errors that occurred, or empty array if all validations passed
 * @throws EnvironmentVariableBatchError if any validations fail and throwOnError is true
 */
export function collectEnvErrors(
  validations: Array<() => void>,
  throwOnError = true
): EnvironmentVariableError[] {
  const errors: EnvironmentVariableError[] = [];

  for (const validate of validations) {
    try {
      validate();
    } catch (error) {
      if (error instanceof EnvironmentVariableError) {
        errors.push(error);
      } else if (error instanceof Error) {
        // Wrap non-environment errors in an EnvironmentVariableError
        errors.push(
          new EnvironmentVariableError(
            `Unexpected error during environment validation: ${error.message}`,
            'ENV_UNEXPECTED_ERROR',
            undefined,
            undefined,
            undefined,
            error
          )
        );
      }
    }
  }

  if (throwOnError && errors.length > 0) {
    throw new EnvironmentVariableBatchError(errors);
  }

  return errors;
}

/**
 * Utility function to validate multiple environment variables and throw a batch error if any fail.
 * 
 * @param validations - Record mapping variable names to validation functions
 * @returns True if all validations passed
 * @throws EnvironmentVariableBatchError if any validations fail
 */
export function validateEnvBatch(
  validations: Record<string, () => void>
): boolean {
  const validationFunctions = Object.entries(validations).map(
    ([variableName, validate]) => () => {
      try {
        validate();
      } catch (error) {
        if (error instanceof EnvironmentVariableError) {
          throw error;
        } else if (error instanceof Error) {
          throw new EnvironmentVariableError(
            `Error validating ${variableName}: ${error.message}`,
            'ENV_VALIDATION_ERROR',
            variableName,
            undefined,
            undefined,
            error
          );
        }
      }
    }
  );

  const errors = collectEnvErrors(validationFunctions, false);
  
  if (errors.length > 0) {
    throw new EnvironmentVariableBatchError(errors);
  }
  
  return true;
}