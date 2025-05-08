import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { SystemException } from './system.exception';

/**
 * External dependency types
 */
export enum ExternalDependencyType {
  API = 'API',
  DATABASE = 'DATABASE',
  MESSAGING = 'MESSAGING',
  CACHE = 'CACHE',
  STORAGE = 'STORAGE',
  AUTHENTICATION = 'AUTHENTICATION',
  PAYMENT = 'PAYMENT',
  NOTIFICATION = 'NOTIFICATION',
  OTHER = 'OTHER',
}

/**
 * Base class for exceptions related to external dependency failures.
 * Provides context for circuit breaker implementations, fallback strategies,
 * and degraded service operations when integrations with external systems fail.
 */
export class ExternalDependencyException extends SystemException {
  public readonly dependencyType: ExternalDependencyType;
  public readonly dependencyName: string;
  public readonly isTransient: boolean;
  public readonly hasFallback: boolean;
  
  /**
   * Creates a new ExternalDependencyException instance
   * 
   * @param message Human-readable error message
   * @param dependencyType Type of external dependency
   * @param dependencyName Name of the external dependency
   * @param errorType Error type classification
   * @param statusCode HTTP status code
   * @param isTransient Whether this error is likely temporary and can be retried
   * @param hasFallback Whether a fallback is available for this dependency
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    dependencyType: ExternalDependencyType = ExternalDependencyType.OTHER,
    dependencyName: string = 'unknown',
    errorType: ErrorType = ErrorType.EXTERNAL_SERVICE_ERROR,
    statusCode: HttpStatus = HttpStatus.BAD_GATEWAY,
    isTransient: boolean = true,
    hasFallback: boolean = false,
    cause?: Error,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    super(message, errorType, statusCode, cause, metadata, context);
    
    this.dependencyType = dependencyType;
    this.dependencyName = dependencyName;
    this.isTransient = isTransient;
    this.hasFallback = hasFallback;
    
    // Add dependency information to metadata
    this.addMetadata('dependencyType', dependencyType);
    this.addMetadata('dependencyName', dependencyName);
    this.addMetadata('isTransient', isTransient);
    this.addMetadata('hasFallback', hasFallback);
  }
  
  /**
   * Creates an API dependency exception
   * 
   * @param message Error message
   * @param apiName Name of the API
   * @param cause Original error
   * @param isTransient Whether this error is transient
   * @param hasFallback Whether a fallback is available
   * @returns ExternalDependencyException instance
   */
  static api(
    message: string,
    apiName: string,
    cause?: Error,
    isTransient: boolean = true,
    hasFallback: boolean = false,
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message,
      ExternalDependencyType.API,
      apiName,
      ErrorType.API_ERROR,
      HttpStatus.BAD_GATEWAY,
      isTransient,
      hasFallback,
      cause,
    );
  }
  
  /**
   * Creates a messaging dependency exception
   * 
   * @param message Error message
   * @param messagingSystem Name of the messaging system
   * @param cause Original error
   * @param isTransient Whether this error is transient
   * @param hasFallback Whether a fallback is available
   * @returns ExternalDependencyException instance
   */
  static messaging(
    message: string,
    messagingSystem: string,
    cause?: Error,
    isTransient: boolean = true,
    hasFallback: boolean = false,
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message,
      ExternalDependencyType.MESSAGING,
      messagingSystem,
      ErrorType.EVENT_PUBLISHING_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      isTransient,
      hasFallback,
      cause,
    );
  }
  
  /**
   * Creates a cache dependency exception
   * 
   * @param message Error message
   * @param cacheSystem Name of the cache system
   * @param cause Original error
   * @param isTransient Whether this error is transient
   * @param hasFallback Whether a fallback is available
   * @returns ExternalDependencyException instance
   */
  static cache(
    message: string,
    cacheSystem: string,
    cause?: Error,
    isTransient: boolean = true,
    hasFallback: boolean = true, // Caches often have fallbacks
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message,
      ExternalDependencyType.CACHE,
      cacheSystem,
      ErrorType.EXTERNAL_SERVICE_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      isTransient,
      hasFallback,
      cause,
    );
  }
  
  /**
   * Gets client-safe error message
   * For external dependency errors, we provide a generic message
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    if (this.hasFallback) {
      return 'The service is operating in degraded mode. Some features may be limited.';
    }
    
    if (this.isTransient) {
      return 'A temporary error occurred while communicating with an external service. Please try again later.';
    }
    
    return 'An error occurred while communicating with an external service. Our team has been notified.';
  }
  
  /**
   * Determines if this error should be retried
   * 
   * @returns True if this error is transient and can be retried
   */
  isTransientError(): boolean {
    return this.isTransient;
  }
  
  /**
   * Gets safe metadata for client responses
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    if (this.isTransient) {
      return {
        retryable: true,
        degraded: this.hasFallback,
      };
    }
    
    return this.hasFallback ? { degraded: true } : null;
  }
}