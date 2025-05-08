import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType } from '@austa/errors';

/**
 * Base class for exceptions related to external dependency failures.
 * 
 * Provides context for circuit breaker implementations, fallback strategies,
 * and degraded service operations when integrations with external systems fail.
 * 
 * This exception is used for failures in external services such as:
 * - Third-party APIs
 * - External databases
 * - Message brokers (Kafka, RabbitMQ)
 * - Cloud services
 */
export class ExternalDependencyException extends BaseError {
  /**
   * Name of the external dependency that failed
   */
  readonly dependencyName: string;

  /**
   * Type of dependency (api, database, messaging, etc.)
   */
  readonly dependencyType: string;

  /**
   * Information about available fallback strategies
   */
  readonly fallbackOptions?: {
    hasFallback: boolean;
    fallbackType?: string;
  };

  /**
   * Creates a new ExternalDependencyException
   * 
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    code?: string;
    cause?: Error;
    details?: Record<string, any>;
    dependencyName: string;
    dependencyType?: string;
    fallbackOptions?: {
      hasFallback: boolean;
      fallbackType?: string;
    };
  }) {
    super(message, {
      type: ErrorType.EXTERNAL,
      code: options.code || 'GAMIFICATION_EXTERNAL_DEPENDENCY_ERROR',
      cause: options.cause,
      details: {
        ...options.details,
        dependencyName: options.dependencyName,
        dependencyType: options.dependencyType || 'unknown',
      },
      statusCode: HttpStatus.BAD_GATEWAY,
    });

    this.dependencyName = options.dependencyName;
    this.dependencyType = options.dependencyType || 'unknown';
    this.fallbackOptions = options.fallbackOptions;

    // Add fallback information to details if available
    if (this.fallbackOptions) {
      this.details.fallback = this.fallbackOptions;
    }
  }

  /**
   * Checks if a fallback strategy is available for this dependency
   * 
   * @returns True if a fallback is available, false otherwise
   */
  hasFallback(): boolean {
    return this.fallbackOptions?.hasFallback || false;
  }

  /**
   * Gets the type of fallback available
   * 
   * @returns Fallback type or undefined if no fallback is available
   */
  getFallbackType(): string | undefined {
    return this.fallbackOptions?.fallbackType;
  }
}

// Export the ExternalDependencyException as the default export
export default ExternalDependencyException;