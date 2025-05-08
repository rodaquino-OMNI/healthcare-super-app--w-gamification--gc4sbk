/**
 * @file Barrel file that exports all interfaces and enums from the retry/interfaces directory.
 * This file simplifies imports and provides a single point of access for retry-related interfaces.
 * It improves developer experience by reducing import statements and enforcing consistent
 * interface usage across the notification service's retry functionality.
 */

// Export retry status enum
export { RetryStatus } from './retry-status.enum';

// Export retry operation interfaces
export { IRetryableOperation } from './retryable-operation.interface';

// Export dead-letter queue interfaces
export { IDlqEntry } from './dlq-entry.interface';

// Export retry options interfaces
export {
  IRetryOptions,
  IFixedDelayOptions,
  IExponentialBackoffOptions,
} from './retry-options.interface';

// Export retry policy interfaces
export { IRetryPolicy } from './retry-policy.interface';