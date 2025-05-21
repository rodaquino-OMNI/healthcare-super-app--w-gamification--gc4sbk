/**
 * @file Error Types and Classification
 * @description Defines comprehensive error type enumerations and interfaces for the gamification engine.
 * Contains error codes, categories, and standardized metadata structures that ensure consistent
 * error classification across all modules.
 */

/**
 * Enum representing different types of errors in the application.
 * Used to categorize exceptions for consistent error handling across services.
 */
export enum ErrorType {
  /**
   * Validation errors - input data fails validation requirements
   * Maps to HTTP 400 Bad Request
   */
  VALIDATION = 'validation',
  
  /**
   * Business logic errors - operation cannot be completed due to business rules
   * Maps to HTTP 422 Unprocessable Entity
   */
  BUSINESS = 'business',
  
  /**
   * Technical errors - unexpected system errors and exceptions
   * Maps to HTTP 500 Internal Server Error
   */
  TECHNICAL = 'technical',
  
  /**
   * External system errors - failures in external services or dependencies
   * Maps to HTTP 502 Bad Gateway
   */
  EXTERNAL = 'external'
}

/**
 * Enum representing the severity levels for errors.
 * Used for alerting and monitoring prioritization.
 */
export enum ErrorSeverity {
  /**
   * Low severity - minor issues that don't significantly impact functionality
   */
  LOW = 'low',
  
  /**
   * Medium severity - issues that impact functionality but have workarounds
   */
  MEDIUM = 'medium',
  
  /**
   * High severity - issues that significantly impact core functionality
   */
  HIGH = 'high',
  
  /**
   * Critical severity - issues that completely break core functionality
   * and require immediate attention
   */
  CRITICAL = 'critical'
}

/**
 * Enum representing different categories of system errors.
 * Provides more specific classification for system-level issues.
 */
export enum SystemErrorCategory {
  /**
   * Database errors - issues with database connections, queries, or transactions
   */
  DATABASE = 'database',
  
  /**
   * Network errors - issues with network connectivity or timeouts
   */
  NETWORK = 'network',
  
  /**
   * File system errors - issues with file operations
   */
  FILE_SYSTEM = 'file_system',
  
  /**
   * Memory errors - issues with memory allocation or usage
   */
  MEMORY = 'memory',
  
  /**
   * Configuration errors - issues with system configuration
   */
  CONFIGURATION = 'configuration',
  
  /**
   * Dependency errors - issues with internal service dependencies
   */
  DEPENDENCY = 'dependency',
  
  /**
   * Security errors - issues related to security mechanisms
   */
  SECURITY = 'security',
  
  /**
   * Kafka errors - issues with Kafka message processing
   */
  KAFKA = 'kafka',
  
  /**
   * Cache errors - issues with cache operations
   */
  CACHE = 'cache',
  
  /**
   * Timeout errors - operations that exceeded their time limit
   */
  TIMEOUT = 'timeout',
  
  /**
   * Resource errors - issues with resource allocation or limits
   */
  RESOURCE = 'resource',
  
  /**
   * Unexpected errors - unclassified or unexpected system issues
   */
  UNEXPECTED = 'unexpected'
}

/**
 * Enum representing different domains in the gamification engine.
 * Used for error code prefixing and context identification.
 */
export enum ErrorDomain {
  /**
   * Gamification domain - core gamification engine functionality
   */
  GAMIFICATION = 'GAMIFICATION',
  
  /**
   * Achievement domain - achievement-related functionality
   */
  ACHIEVEMENT = 'ACHIEVEMENT',
  
  /**
   * Event domain - event processing functionality
   */
  EVENT = 'EVENT',
  
  /**
   * Quest domain - quest-related functionality
   */
  QUEST = 'QUEST',
  
  /**
   * Reward domain - reward-related functionality
   */
  REWARD = 'REWARD',
  
  /**
   * Profile domain - user profile functionality
   */
  PROFILE = 'PROFILE',
  
  /**
   * System domain - system-level functionality
   */
  SYSTEM = 'SYSTEM',
  
  /**
   * Leaderboard domain - leaderboard-related functionality
   */
  LEADERBOARD = 'LEADERBOARD',
  
  /**
   * Rule domain - rule evaluation functionality
   */
  RULE = 'RULE'
}

/**
 * Interface for error code structure to ensure consistent
 * error code formatting across the application.
 */
export interface IErrorCode {
  /**
   * The domain or service that generated the error
   * e.g., 'GAMIFICATION', 'ACHIEVEMENT', 'EVENT'
   */
  domain: string;
  
  /**
   * The specific error code within the domain
   * e.g., '001', '002'
   */
  code: string;
  
  /**
   * Formats the error code as a string in the format DOMAIN_CODE
   * e.g., 'GAMIFICATION_001'
   */
  toString(): string;
}

/**
 * Class implementing the IErrorCode interface for creating
 * standardized error codes throughout the application.
 */
export class ErrorCode implements IErrorCode {
  /**
   * Creates a new ErrorCode instance.
   * 
   * @param domain - The domain or service that generated the error
   * @param code - The specific error code within the domain
   */
  constructor(
    public readonly domain: string,
    public readonly code: string
  ) {}
  
  /**
   * Formats the error code as a string in the format DOMAIN_CODE
   * 
   * @returns The formatted error code string
   */
  toString(): string {
    return `${this.domain}_${this.code}`;
  }
  
  /**
   * Creates a new ErrorCode for the gamification domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static gamification(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.GAMIFICATION, code);
  }
  
  /**
   * Creates a new ErrorCode for the achievement domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static achievement(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.ACHIEVEMENT, code);
  }
  
  /**
   * Creates a new ErrorCode for the event domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static event(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.EVENT, code);
  }
  
  /**
   * Creates a new ErrorCode for the quest domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static quest(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.QUEST, code);
  }
  
  /**
   * Creates a new ErrorCode for the reward domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static reward(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.REWARD, code);
  }
  
  /**
   * Creates a new ErrorCode for the profile domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static profile(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.PROFILE, code);
  }
  
  /**
   * Creates a new ErrorCode for the system domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static system(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.SYSTEM, code);
  }
  
  /**
   * Creates a new ErrorCode for the leaderboard domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static leaderboard(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.LEADERBOARD, code);
  }
  
  /**
   * Creates a new ErrorCode for the rule domain.
   * 
   * @param code - The specific error code
   * @returns A new ErrorCode instance
   */
  static rule(code: string): ErrorCode {
    return new ErrorCode(ErrorDomain.RULE, code);
  }
}

/**
 * Interface for structured error metadata to provide additional context
 * for debugging and troubleshooting errors.
 */
export interface IErrorMetadata {
  // Error identification
  timestamp: string;           // When the error occurred
  correlationId?: string;      // For tracing across services
  requestId?: string;          // ID of the request that caused the error
  userId?: string;             // User associated with the error
  journeyType?: string;        // Journey context (Health, Care, Plan)
  
  // Error classification
  domain?: string;             // Domain that generated the error
  component?: string;          // Component that generated the error
  source?: string;             // Source file or module
  category?: string;           // More specific error category
  
  // Error details
  details?: Record<string, any>; // Additional error-specific details
  context?: Record<string, any>; // Context about what was happening
  stack?: string;               // Stack trace (sanitized for production)
  cause?: Error | unknown;       // Original cause of the error
  
  // Monitoring and alerting
  severity?: ErrorSeverity | string; // Error severity
  requiresAlert?: boolean;     // Whether this error should trigger alerts
  
  // Recovery information
  recoverable?: boolean;       // Whether the system can recover automatically
  retryable?: boolean;         // Whether the operation can be retried
  retryCount?: number;         // Number of retry attempts made
  retryAfter?: number;         // Suggested delay before retry (ms)
  suggestedAction?: string;    // Recommended action to resolve
}