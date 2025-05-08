/**
 * @file Common Exceptions Barrel File
 * @description Exports all exception classes and utilities from the common exceptions module.
 * Provides a clean import interface for other modules to access the exception handling framework,
 * simplifying dependency management and improving code organization.
 *
 * This file serves as the central point for importing all exception-related classes and utilities
 * throughout the gamification engine, ensuring consistent error handling patterns and reducing
 * code duplication.
 */

/**
 * Base Exception Classes
 * @description Foundation classes that all other exceptions extend
 */

/**
 * Base application exception class that all other exceptions extend
 * @description Provides standardized error structure with error codes, messages, and metadata
 */
export { default as AppExceptionBase } from './app-exception.base';

/**
 * Base HTTP exception class for REST API error responses
 * @description Maps internal error types to appropriate HTTP status codes
 */
export { default as HttpExceptionBase } from './http-exception.base';

/**
 * Error Types and Enums
 * @description Type definitions and enumerations for error classification
 */

/**
 * Error type enumeration for consistent error codes
 * @description Defines all possible error types with unique codes
 */
export { ErrorType, ErrorCategory, ErrorSeverity } from './error-types.enum';

/**
 * Error metadata and context type definitions
 * @description Type interfaces for structured error data
 */
export type { ErrorMetadata, ErrorContext } from './error-types.enum';

/**
 * Client Exceptions (HTTP 4xx)
 * @description Exceptions for client-side errors that return 4xx HTTP status codes
 */

/**
 * Base class for all client errors
 * @description Handles errors caused by client input with appropriate HTTP status codes
 */
export { default as ClientException } from './client.exception';

/**
 * Exception for validation failures in API requests
 * @description Provides detailed field-specific validation errors (400 Bad Request)
 */
export { default as ValidationException } from './validation.exception';

/**
 * Exception for resource not found scenarios
 * @description Handles cases where requested entities cannot be located (404 Not Found)
 */
export { default as NotFoundException } from './not-found.exception';

/**
 * Exception for authentication and authorization failures
 * @description Handles security-related errors with appropriate status codes (401/403)
 */
export { default as UnauthorizedException } from './unauthorized.exception';

/**
 * System Exceptions (HTTP 5xx)
 * @description Exceptions for server-side errors that return 5xx HTTP status codes
 */

/**
 * Base class for all system errors
 * @description Handles internal server errors and implementation bugs (500 Internal Server Error)
 */
export { default as SystemException } from './system.exception';

/**
 * Exception for database operation failures
 * @description Handles connection issues, query errors, and transaction failures
 */
export { default as DatabaseException } from './database.exception';

/**
 * External Dependency Exceptions
 * @description Exceptions for failures in external service integrations
 */

/**
 * Base class for external dependency failures
 * @description Provides context for circuit breaker implementations and fallback strategies
 */
export { default as ExternalDependencyException } from './external-dependency.exception';

/**
 * Specialized exception for Kafka-related errors
 * @description Handles producer/consumer issues and message processing failures
 */
export { default as KafkaException } from './kafka.exception';

/**
 * Transient Exceptions
 * @description Exceptions for temporary failures that can be automatically retried
 */

/**
 * Exception for transient errors with retry capabilities
 * @description Implements retry count tracking and backoff calculation
 */
export { default as TransientException } from './transient.exception';

/**
 * Utilities
 * @description Helper classes and functions for exception handling
 */

/**
 * Circuit breaker implementation for external service calls
 * @description Prevents cascading failures when external dependencies experience issues
 */
export { default as CircuitBreaker, CircuitState, CircuitOpenException, withCircuitBreaker, withCircuitBreakerAndFallback, CircuitBreakerRegistry } from './circuit-breaker';
export type { CircuitBreakerOptions } from './circuit-breaker';

/**
 * Utility functions for implementing retry logic
 * @description Provides configurable retry strategies with exponential backoff
 */
export * from './retry.utils';

/**
 * Retry utilities as a namespace for backward compatibility
 * @description Allows importing as RetryUtils.retryAsync() if preferred
 */
export * as RetryUtils from './retry.utils';

/**
 * NestJS exception filter for global exception handling
 * @description Transforms exceptions into standardized HTTP responses with proper logging and monitoring
 */
export { GamificationExceptionFilter } from './exception.filter';

/**
 * Domain-Specific Exceptions
 * @description Re-exports from domain modules for centralized exception access
 */

/**
 * Achievement Exceptions
 * @description Exceptions related to achievement operations including:
 * - AchievementNotFoundException: When a requested achievement doesn't exist
 * - UserAchievementNotFoundException: When a user-achievement relationship is missing
 * - InvalidAchievementDataException: For validation failures in achievement data
 * - DuplicateAchievementException: When attempting to create a duplicate achievement
 * - AchievementEventValidationException: For invalid achievement events
 * - AchievementEventProcessingException: For failures during event processing
 * - AchievementExternalServiceException: For external service integration failures
 */
export * from '../../achievements/exceptions';

/**
 * Event Exceptions
 * @description Exceptions related to event processing including:
 * - EventValidationException: For schema validation failures in events
 * - EventProcessingException: For failures during event processing
 * - EventKafkaException: For Kafka-related errors
 * - EventRetryableException: For transient errors that should be retried
 * - EventDeadLetterQueueException: For events that have exhausted retry attempts
 */
export * from '../../events/exceptions';

/**
 * Quest Exceptions
 * @description Exceptions related to quest operations including:
 * - QuestNotFoundException: When a requested quest doesn't exist
 * - QuestAlreadyStartedException: When attempting to start an already started quest
 * - QuestAlreadyCompletedException: When attempting to complete an already completed quest
 * - QuestNotStartedException: When attempting to complete a quest that hasn't been started
 * - QuestProcessingException: For internal errors during quest operations
 */
export * from '../../quests/exceptions';

/**
 * Reward Exceptions
 * @description Exceptions related to reward operations including:
 * - RewardNotFoundException: When a requested reward doesn't exist
 * - UserRewardNotFoundException: When a user-reward relationship is missing
 * - InvalidRewardDataException: For validation failures in reward data
 * - DuplicateRewardException: When attempting to create a duplicate reward
 * - RewardProcessingException: For internal errors during reward operations
 * - RewardExternalServiceException: For external service integration failures
 */
export * from '../../rewards/exceptions';

/**
 * Rule Exceptions
 * @description Exceptions related to rule evaluation and execution including:
 * - RuleNotFoundException: When a requested rule doesn't exist
 * - RuleDefinitionException: For validation errors in rule definitions
 * - RuleEvaluationException: For errors during rule condition evaluation
 * - RuleExecutionException: For failures when executing rule actions
 * - RuleLoadingException: For errors when loading rules from storage
 */
export * from '../../rules/exceptions';