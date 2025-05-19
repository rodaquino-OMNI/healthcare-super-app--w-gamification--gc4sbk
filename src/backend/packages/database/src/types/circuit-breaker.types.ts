/**
 * Enum representing the possible states of a circuit breaker
 */
export enum CircuitState {
  /**
   * Circuit is closed and operations are allowed to proceed normally
   */
  CLOSED = 'CLOSED',
  
  /**
   * Circuit is open and operations are blocked to prevent cascading failures
   */
  OPEN = 'OPEN',
  
  /**
   * Circuit is allowing a limited number of operations to test if the system has recovered
   */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Enum representing the types of database operations
 * Different operation types can have different failure thresholds
 */
export enum OperationType {
  /**
   * Read operations (SELECT, etc.)
   */
  READ = 'READ',
  
  /**
   * Write operations (INSERT, UPDATE, DELETE, etc.)
   */
  WRITE = 'WRITE',
  
  /**
   * Transaction operations (BEGIN, COMMIT, ROLLBACK, etc.)
   */
  TRANSACTION = 'TRANSACTION',
  
  /**
   * Database migration operations
   */
  MIGRATION = 'MIGRATION',
}

/**
 * Interface for journey-specific failure thresholds
 */
export interface JourneyThresholds {
  [journeyName: string]: {
    [OperationType.READ]?: number;
    [OperationType.WRITE]?: number;
    [OperationType.TRANSACTION]?: number;
    [OperationType.MIGRATION]?: number;
  };
}

/**
 * Configuration options for the circuit breaker middleware
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures required to open the circuit for each operation type
   */
  failureThreshold: {
    [OperationType.READ]: number;
    [OperationType.WRITE]: number;
    [OperationType.TRANSACTION]: number;
    [OperationType.MIGRATION]: number;
  };
  
  /**
   * Time in milliseconds to wait before attempting to close the circuit
   * This will be multiplied by 2^recoveryAttempt for exponential backoff
   */
  resetTimeout: number;
  
  /**
   * Maximum number of operations allowed in half-open state
   */
  halfOpenMaxOperations: number;
  
  /**
   * Whether to emit monitoring events for circuit state changes
   */
  monitoringEnabled: boolean;
  
  /**
   * Journey-specific failure thresholds that override the default thresholds
   */
  journeySpecificThresholds: JourneyThresholds;
}

/**
 * Interface for circuit breaker statistics
 */
export interface CircuitBreakerStats {
  /**
   * Current state of the circuit breaker
   */
  state: CircuitState;
  
  /**
   * Current failure counts for each operation type
   */
  failureCounts: {
    [key in OperationType]: number;
  };
  
  /**
   * Number of recovery attempts made
   */
  recoveryAttempts: number;
  
  /**
   * Timestamp of the last state change
   */
  lastStateChange: Date;
  
  /**
   * Timestamp of the next recovery attempt (if circuit is open)
   */
  nextRecoveryAttempt?: Date;
}