/**
 * @file Barrel file that exports all interfaces and enums from the retry/interfaces directory.
 * 
 * This file simplifies imports and provides a single point of access for all retry-related
 * interfaces and types. It improves developer experience by reducing import statements and
 * enforcing consistent interface usage across the notification service's retry functionality.
 *
 * @module retry/interfaces
 */

/**
 * Re-export the RetryStatus enum that represents the possible states of a retry operation
 * (PENDING, IN_PROGRESS, SUCCEEDED, FAILED, EXHAUSTED).
 */
export * from './retry-status.enum';

/**
 * Re-export the IRetryableOperation interface that represents operations eligible for
 * retry handling. It provides methods for executing operations, accessing operation metadata,
 * and handling results or errors.
 */
export * from './retryable-operation.interface';

/**
 * Re-export the IDlqEntry interface that represents entries in the dead-letter queue
 * for failed notification operations that have exhausted their retry attempts.
 */
export * from './dlq-entry.interface';

/**
 * Re-export configuration interfaces for retry operations including IRetryOptions,
 * IFixedDelayOptions, and IExponentialBackoffOptions.
 */
export * from './retry-options.interface';

/**
 * Re-export the IRetryPolicy interface that serves as a contract for all retry
 * strategy implementations (e.g., fixed delay, exponential backoff).
 */
export * from './retry-policy.interface';