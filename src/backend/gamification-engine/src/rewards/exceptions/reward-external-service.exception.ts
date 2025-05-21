import { AppException, ErrorType } from 'src/backend/shared/src/exceptions/exceptions.types';

/**
 * Enum representing different types of external services that the rewards system interacts with.
 */
export enum ExternalServiceType {
  PROFILE_SERVICE = 'profile-service',
  NOTIFICATION_SERVICE = 'notification-service',
  PAYMENT_SERVICE = 'payment-service',
  INVENTORY_SERVICE = 'inventory-service'
}

/**
 * Interface defining the circuit breaker state information for external services.
 */
export interface CircuitBreakerInfo {
  /** Whether the circuit breaker is open (service considered unavailable) */
  isOpen: boolean;
  /** Timestamp when the circuit breaker will attempt to close again */
  resetTimestamp?: Date;
  /** Number of consecutive failures that triggered the circuit breaker */
  failureCount: number;
  /** Threshold of failures before opening the circuit */
  failureThreshold: number;
}

/**
 * Interface defining fallback strategy information for external service failures.
 */
export interface FallbackStrategyInfo {
  /** Type of fallback strategy being used */
  type: 'cached-data' | 'default-behavior' | 'degraded-feature' | 'none';
  /** Description of the fallback strategy */
  description: string;
  /** Timestamp when the cached data was last updated (if using cached data) */
  cacheTimestamp?: Date;
  /** Whether the fallback strategy was successful */
  successful: boolean;
}

/**
 * Exception thrown when an external service interaction fails during reward operations.
 * 
 * This specialized exception provides detailed context about the external service failure,
 * including circuit breaker state and fallback strategy information, supporting resilient
 * error handling patterns for external dependencies.
 */
export class RewardExternalServiceException extends AppException {
  /**
   * Creates a new RewardExternalServiceException instance.
   * 
   * @param message - Human-readable error message
   * @param serviceType - Type of external service that failed
   * @param operationContext - Description of the operation that was being performed
   * @param circuitBreakerInfo - Information about the circuit breaker state
   * @param fallbackStrategy - Information about the fallback strategy applied
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(
    message: string,
    public readonly serviceType: ExternalServiceType,
    public readonly operationContext: string,
    public readonly circuitBreakerInfo: CircuitBreakerInfo,
    public readonly fallbackStrategy: FallbackStrategyInfo,
    details?: any,
    cause?: Error
  ) {
    // Use the EXTERNAL error type for all external service failures
    super(
      message,
      ErrorType.EXTERNAL,
      `REWARD_EXT_${serviceType.toUpperCase()}`,
      {
        serviceType,
        operationContext,
        circuitBreakerInfo,
        fallbackStrategy,
        ...details
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RewardExternalServiceException.prototype);
  }

  /**
   * Creates a RewardExternalServiceException for profile service failures.
   * 
   * @param operationContext - Description of the profile operation that failed
   * @param circuitBreakerInfo - Information about the circuit breaker state
   * @param fallbackStrategy - Information about the fallback strategy applied
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   * @returns A new RewardExternalServiceException instance
   */
  static profileServiceFailure(
    operationContext: string,
    circuitBreakerInfo: CircuitBreakerInfo,
    fallbackStrategy: FallbackStrategyInfo,
    details?: any,
    cause?: Error
  ): RewardExternalServiceException {
    return new RewardExternalServiceException(
      `Profile service operation failed: ${operationContext}`,
      ExternalServiceType.PROFILE_SERVICE,
      operationContext,
      circuitBreakerInfo,
      fallbackStrategy,
      details,
      cause
    );
  }

  /**
   * Creates a RewardExternalServiceException for notification service failures.
   * 
   * @param operationContext - Description of the notification operation that failed
   * @param circuitBreakerInfo - Information about the circuit breaker state
   * @param fallbackStrategy - Information about the fallback strategy applied
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   * @returns A new RewardExternalServiceException instance
   */
  static notificationServiceFailure(
    operationContext: string,
    circuitBreakerInfo: CircuitBreakerInfo,
    fallbackStrategy: FallbackStrategyInfo,
    details?: any,
    cause?: Error
  ): RewardExternalServiceException {
    return new RewardExternalServiceException(
      `Notification service operation failed: ${operationContext}`,
      ExternalServiceType.NOTIFICATION_SERVICE,
      operationContext,
      circuitBreakerInfo,
      fallbackStrategy,
      details,
      cause
    );
  }

  /**
   * Creates a RewardExternalServiceException for payment service failures.
   * 
   * @param operationContext - Description of the payment operation that failed
   * @param circuitBreakerInfo - Information about the circuit breaker state
   * @param fallbackStrategy - Information about the fallback strategy applied
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   * @returns A new RewardExternalServiceException instance
   */
  static paymentServiceFailure(
    operationContext: string,
    circuitBreakerInfo: CircuitBreakerInfo,
    fallbackStrategy: FallbackStrategyInfo,
    details?: any,
    cause?: Error
  ): RewardExternalServiceException {
    return new RewardExternalServiceException(
      `Payment service operation failed: ${operationContext}`,
      ExternalServiceType.PAYMENT_SERVICE,
      operationContext,
      circuitBreakerInfo,
      fallbackStrategy,
      details,
      cause
    );
  }

  /**
   * Creates a RewardExternalServiceException for inventory service failures.
   * 
   * @param operationContext - Description of the inventory operation that failed
   * @param circuitBreakerInfo - Information about the circuit breaker state
   * @param fallbackStrategy - Information about the fallback strategy applied
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   * @returns A new RewardExternalServiceException instance
   */
  static inventoryServiceFailure(
    operationContext: string,
    circuitBreakerInfo: CircuitBreakerInfo,
    fallbackStrategy: FallbackStrategyInfo,
    details?: any,
    cause?: Error
  ): RewardExternalServiceException {
    return new RewardExternalServiceException(
      `Inventory service operation failed: ${operationContext}`,
      ExternalServiceType.INVENTORY_SERVICE,
      operationContext,
      circuitBreakerInfo,
      fallbackStrategy,
      details,
      cause
    );
  }

  /**
   * Returns a JSON representation of the exception with additional external service context.
   * Extends the base AppException toJSON method with circuit breaker and fallback information.
   * 
   * @returns JSON object with standardized error structure and external service details
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    // Add external service specific information to the error response
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        serviceType: this.serviceType,
        operationContext: this.operationContext,
        circuitBreaker: {
          isOpen: this.circuitBreakerInfo.isOpen,
          resetTimestamp: this.circuitBreakerInfo.resetTimestamp?.toISOString(),
          failureCount: this.circuitBreakerInfo.failureCount,
          failureThreshold: this.circuitBreakerInfo.failureThreshold
        },
        fallbackStrategy: {
          type: this.fallbackStrategy.type,
          description: this.fallbackStrategy.description,
          cacheTimestamp: this.fallbackStrategy.cacheTimestamp?.toISOString(),
          successful: this.fallbackStrategy.successful
        }
      }
    };
  }
}