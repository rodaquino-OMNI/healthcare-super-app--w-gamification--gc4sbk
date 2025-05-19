import { BaseError, ErrorType, JourneyContext, SerializedError } from '../base';
import { serializeError, SerializeOptions, redactSensitiveInfo } from './serialize';

/**
 * Interface for deserialized error objects.
 * Provides a standardized structure for reconstructing errors from serialized data.
 */
export interface DeserializedError {
  /** The reconstructed error object */
  error: Error | BaseError;
  /** Whether the error was successfully deserialized with its original type */
  preservedType: boolean;
}

/**
 * Configuration options for error deserialization.
 */
export interface DeserializeOptions {
  /** Whether to attempt to reconstruct the original error type */
  reconstructType?: boolean;
  /** Whether to include the original stack trace if available */
  includeStack?: boolean;
  /** Default error type to use if type cannot be determined */
  defaultErrorType?: ErrorType;
  /** Default journey context to use if not present in serialized error */
  defaultJourneyContext?: JourneyContext;
}

/**
 * Default deserialization options.
 */
const getDefaultDeserializeOptions = (): DeserializeOptions => {
  return {
    reconstructType: true,
    includeStack: true,
    defaultErrorType: ErrorType.TECHNICAL,
    defaultJourneyContext: JourneyContext.SYSTEM,
  };
};

/**
 * Registry of error constructors for reconstructing typed errors.
 * This is populated by registerErrorType and used by deserializeError.
 */
const errorTypeRegistry: Record<string, new (...args: any[]) => Error | BaseError> = {};

/**
 * Registers an error type constructor for deserialization.
 * This allows the deserializer to reconstruct the original error type.
 * 
 * @param errorName - The name of the error class
 * @param constructor - The constructor function for the error class
 */
export const registerErrorType = (
  errorName: string,
  constructor: new (...args: any[]) => Error | BaseError
): void => {
  errorTypeRegistry[errorName] = constructor;
};

/**
 * Deserializes a serialized error back into an Error or BaseError instance.
 * Attempts to reconstruct the original error type if possible.
 * 
 * @param serialized - The serialized error object
 * @param options - Deserialization options
 * @returns The deserialized error object and type preservation status
 */
export const deserializeError = (
  serialized: SerializedError,
  options: DeserializeOptions = getDefaultDeserializeOptions(),
): DeserializedError => {
  // Handle case where input is not a valid serialized error
  if (!serialized || typeof serialized !== 'object' || !('name' in serialized) || !('message' in serialized)) {
    return {
      error: new Error('Invalid serialized error format'),
      preservedType: false,
    };
  }

  let error: Error | BaseError;
  let preservedType = false;

  // Attempt to reconstruct the original error type if requested
  if (options.reconstructType && serialized.name && errorTypeRegistry[serialized.name]) {
    try {
      const ErrorConstructor = errorTypeRegistry[serialized.name];
      
      // For BaseError subclasses
      if (serialized.type && typeof serialized.code === 'string') {
        const context = serialized.originalError?.context || {};
        const details = serialized.details;
        const suggestion = serialized.originalError?.suggestion;
        const cause = serialized.cause ? deserializeError(serialized.cause, options).error : undefined;
        
        error = new ErrorConstructor(
          serialized.message,
          serialized.type as ErrorType,
          serialized.code,
          context,
          details,
          suggestion,
          cause instanceof Error ? cause : undefined
        );
        preservedType = true;
      } else {
        // For standard Error subclasses
        error = new ErrorConstructor(serialized.message);
        preservedType = true;
      }
    } catch (e) {
      // Fallback to generic error if reconstruction fails
      console.warn(`Failed to reconstruct error type ${serialized.name}:`, e);
      error = new Error(serialized.message);
    }
  } else if (serialized.type && typeof serialized.code === 'string') {
    // Create a BaseError if type and code are available
    const context = serialized.originalError?.context || {};
    const details = serialized.details;
    const suggestion = serialized.originalError?.suggestion;
    const cause = serialized.cause ? deserializeError(serialized.cause, options).error : undefined;
    
    error = new BaseError(
      serialized.message,
      serialized.type as ErrorType,
      serialized.code,
      context,
      details,
      suggestion,
      cause instanceof Error ? cause : undefined
    );
  } else {
    // Fallback to standard Error
    error = new Error(serialized.message);
  }

  // Set the name property to match the original error
  error.name = serialized.name;

  // Include stack trace if available and requested
  if (options.includeStack && serialized.stack) {
    error.stack = serialized.stack;
  }

  // Copy any additional properties from the original error
  if (serialized.originalError) {
    for (const [key, value] of Object.entries(serialized.originalError)) {
      if (!['message', 'name', 'stack', 'cause', 'type', 'code', 'context', 'details', 'suggestion'].includes(key)) {
        (error as any)[key] = value;
      }
    }
  }

  return { error, preservedType };
};

/**
 * Serializes an error for transmission across service boundaries.
 * 
 * @param error - The error to serialize
 * @param options - Serialization options
 * @returns A serialized representation of the error
 */
export const serializeErrorForTransport = (
  error: unknown,
  options?: SerializeOptions,
): SerializedError => {
  return serializeError(error, options);
};

/**
 * Deserializes an error received from another service.
 * 
 * @param serialized - The serialized error received from another service
 * @param options - Deserialization options
 * @returns The deserialized error object
 */
export const deserializeErrorFromTransport = (
  serialized: SerializedError,
  options?: DeserializeOptions,
): Error | BaseError => {
  return deserializeError(serialized, options).error;
};

/**
 * Serializes and then deserializes an error to create a deep clone.
 * Useful for creating independent copies of error objects.
 * 
 * @param error - The error to clone
 * @returns A deep clone of the error
 */
export const cloneError = (error: Error | BaseError): Error | BaseError => {
  const serialized = serializeErrorForTransport(error, { includeStack: true, includeOriginalError: true });
  return deserializeErrorFromTransport(serialized, { reconstructType: true, includeStack: true });
};

// Register the BaseError type for deserialization
registerErrorType('BaseError', BaseError);

// Export all from serialize.ts for backward compatibility
export { serializeError, SerializeOptions, redactSensitiveInfo };