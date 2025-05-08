/**
 * Defines the available retry policy types used throughout the notification service.
 * These policies determine how and when failed operations should be retried.
 */

import { ErrorType } from './error-types.constants';
import { NotificationPriority } from './default-config.constants';

/**
 * Enum representing the different types of retry policies available in the notification service.
 * Each policy type implements a specific strategy for determining retry timing and behavior.
 */
export enum RetryPolicyType {
  /**
   * Exponential backoff increases the delay between retry attempts exponentially.
   * 
   * Characteristics:
   * - Delay increases exponentially with each attempt (e.g., 1s, 2s, 4s, 8s, 16s)
   * - Optional jitter to prevent thundering herd problems
   * - Configurable backoff factor to control growth rate
   * - Maximum delay cap to prevent excessive waiting
   * 
   * Best for:
   * - Transient errors that may resolve with time
   * - Network-related issues
   * - Rate-limited external services
   * - High-volume operations
   */
  EXPONENTIAL_BACKOFF = 'exponential-backoff',

  /**
   * Linear backoff increases the delay between retry attempts linearly.
   * 
   * Characteristics:
   * - Delay increases linearly with each attempt (e.g., 1s, 2s, 3s, 4s, 5s)
   * - Optional jitter to prevent thundering herd problems
   * - Configurable increment to control growth rate
   * - Maximum delay cap to prevent excessive waiting
   * 
   * Best for:
   * - Moderately transient errors
   * - Services with predictable recovery times
   * - Operations with moderate priority
   */
  LINEAR = 'linear',

  /**
   * Fixed interval uses the same delay between all retry attempts.
   * 
   * Characteristics:
   * - Consistent delay between all attempts (e.g., 5s, 5s, 5s, 5s)
   * - Optional jitter to prevent thundering herd problems
   * - Simple configuration with just a delay value
   * 
   * Best for:
   * - In-app notifications with consistent processing times
   * - Operations with predictable recovery patterns
   * - Simple retry scenarios
   */
  FIXED = 'fixed-interval',

  /**
   * Max attempts policy focuses only on limiting the number of retry attempts.
   * 
   * Characteristics:
   * - No specific timing strategy, just limits total attempts
   * - Can be combined with other policies in a composite policy
   * - Simple configuration with just a max attempts value
   * 
   * Best for:
   * - Limiting resource usage for retry operations
   * - Preventing excessive retries for low-priority notifications
   * - Use as a component in composite policies
   */
  MAX_ATTEMPTS = 'max-attempts',

  /**
   * Composite policy combines multiple policies for sophisticated retry strategies.
   * 
   * Characteristics:
   * - Combines multiple policies with different behaviors
   * - Can apply different policies based on error type or other conditions
   * - Highly configurable for complex scenarios
   * 
   * Best for:
   * - Complex retry scenarios with multiple error types
   * - Different retry strategies based on error conditions
   * - Advanced retry requirements
   */
  COMPOSITE = 'composite'
}

/**
 * Interface for retry policy metadata.
 * Provides additional information about each policy type to assist with selection and configuration.
 */
export interface RetryPolicyMetadata {
  /** Human-readable description of the policy */
  description: string;
  /** Whether this policy uses time-based backoff */
  usesBackoff: boolean;
  /** Whether this policy supports jitter (randomization) */
  supportsJitter: boolean;
  /** Recommended error types for this policy */
  recommendedForErrorTypes: ErrorType[];
  /** Recommended notification channels for this policy */
  recommendedForChannels: string[];
  /** Recommended notification priorities for this policy */
  recommendedForPriorities: NotificationPriority[];
}

/**
 * Metadata for each retry policy type to guide policy selection and configuration.
 */
export const RETRY_POLICY_METADATA: Record<RetryPolicyType, RetryPolicyMetadata> = {
  [RetryPolicyType.EXPONENTIAL_BACKOFF]: {
    description: 'Increases delay exponentially between retry attempts',
    usesBackoff: true,
    supportsJitter: true,
    recommendedForErrorTypes: [ErrorType.TRANSIENT, ErrorType.EXTERNAL, ErrorType.SYSTEM],
    recommendedForChannels: ['push', 'email', 'sms'],
    recommendedForPriorities: [
      NotificationPriority.MEDIUM,
      NotificationPriority.HIGH,
      NotificationPriority.CRITICAL
    ]
  },
  [RetryPolicyType.LINEAR]: {
    description: 'Increases delay linearly between retry attempts',
    usesBackoff: true,
    supportsJitter: true,
    recommendedForErrorTypes: [ErrorType.TRANSIENT, ErrorType.EXTERNAL],
    recommendedForChannels: ['push', 'email', 'sms'],
    recommendedForPriorities: [
      NotificationPriority.LOW,
      NotificationPriority.MEDIUM
    ]
  },
  [RetryPolicyType.FIXED]: {
    description: 'Uses the same delay between all retry attempts',
    usesBackoff: false,
    supportsJitter: true,
    recommendedForErrorTypes: [ErrorType.TRANSIENT],
    recommendedForChannels: ['in-app'],
    recommendedForPriorities: [
      NotificationPriority.LOW,
      NotificationPriority.MEDIUM
    ]
  },
  [RetryPolicyType.MAX_ATTEMPTS]: {
    description: 'Focuses only on limiting the number of retry attempts',
    usesBackoff: false,
    supportsJitter: false,
    recommendedForErrorTypes: [ErrorType.TRANSIENT, ErrorType.EXTERNAL, ErrorType.SYSTEM],
    recommendedForChannels: ['push', 'email', 'sms', 'in-app'],
    recommendedForPriorities: [
      NotificationPriority.LOW,
      NotificationPriority.MEDIUM,
      NotificationPriority.HIGH,
      NotificationPriority.CRITICAL
    ]
  },
  [RetryPolicyType.COMPOSITE]: {
    description: 'Combines multiple policies for sophisticated retry strategies',
    usesBackoff: true,
    supportsJitter: true,
    recommendedForErrorTypes: [ErrorType.TRANSIENT, ErrorType.EXTERNAL, ErrorType.SYSTEM],
    recommendedForChannels: ['push', 'email', 'sms'],
    recommendedForPriorities: [
      NotificationPriority.HIGH,
      NotificationPriority.CRITICAL
    ]
  }
};

/**
 * Maps error types to recommended retry policy types.
 * This provides a type-safe way to select an appropriate policy based on error type.
 */
export const ERROR_TYPE_TO_POLICY_MAP: Record<ErrorType, RetryPolicyType> = {
  [ErrorType.TRANSIENT]: RetryPolicyType.EXPONENTIAL_BACKOFF,
  [ErrorType.CLIENT]: RetryPolicyType.MAX_ATTEMPTS, // Client errors shouldn't be retried, so just limit attempts
  [ErrorType.SYSTEM]: RetryPolicyType.EXPONENTIAL_BACKOFF,
  [ErrorType.EXTERNAL]: RetryPolicyType.EXPONENTIAL_BACKOFF
};

/**
 * Maps notification channels to recommended retry policy types.
 * This provides a type-safe way to select an appropriate policy based on channel.
 */
export const CHANNEL_TO_POLICY_MAP: Record<string, RetryPolicyType> = {
  'push': RetryPolicyType.EXPONENTIAL_BACKOFF,
  'email': RetryPolicyType.EXPONENTIAL_BACKOFF,
  'sms': RetryPolicyType.EXPONENTIAL_BACKOFF,
  'in-app': RetryPolicyType.FIXED
};

/**
 * Maps notification priorities to recommended retry policy types.
 * This provides a type-safe way to select an appropriate policy based on priority.
 */
export const PRIORITY_TO_POLICY_MAP: Record<NotificationPriority, RetryPolicyType> = {
  [NotificationPriority.LOW]: RetryPolicyType.FIXED,
  [NotificationPriority.MEDIUM]: RetryPolicyType.LINEAR,
  [NotificationPriority.HIGH]: RetryPolicyType.EXPONENTIAL_BACKOFF,
  [NotificationPriority.CRITICAL]: RetryPolicyType.COMPOSITE
};

/**
 * Helper function to determine if a policy type supports jitter.
 * 
 * @param policyType The policy type to check
 * @returns True if the policy supports jitter, false otherwise
 */
export function supportsPolicyJitter(policyType: RetryPolicyType): boolean {
  return RETRY_POLICY_METADATA[policyType].supportsJitter;
}

/**
 * Helper function to get the recommended policy type for an error type.
 * 
 * @param errorType The error type to get a policy for
 * @returns The recommended retry policy type
 */
export function getPolicyForErrorType(errorType: ErrorType): RetryPolicyType {
  return ERROR_TYPE_TO_POLICY_MAP[errorType];
}

/**
 * Helper function to get the recommended policy type for a notification channel.
 * 
 * @param channel The notification channel to get a policy for
 * @returns The recommended retry policy type
 */
export function getPolicyForChannel(channel: string): RetryPolicyType {
  return CHANNEL_TO_POLICY_MAP[channel] || RetryPolicyType.EXPONENTIAL_BACKOFF;
}

/**
 * Helper function to get the recommended policy type for a notification priority.
 * 
 * @param priority The notification priority to get a policy for
 * @returns The recommended retry policy type
 */
export function getPolicyForPriority(priority: NotificationPriority): RetryPolicyType {
  return PRIORITY_TO_POLICY_MAP[priority];
}

/**
 * Helper function to select the most appropriate policy based on error type, channel, and priority.
 * This provides a sophisticated policy selection mechanism that considers multiple factors.
 * 
 * @param errorType The type of error that occurred
 * @param channel The notification channel being used
 * @param priority The priority of the notification
 * @returns The most appropriate retry policy type
 */
export function selectRetryPolicy(
  errorType: ErrorType,
  channel: string,
  priority: NotificationPriority = NotificationPriority.MEDIUM
): RetryPolicyType {
  // For client errors, always use MAX_ATTEMPTS to limit retries
  if (errorType === ErrorType.CLIENT) {
    return RetryPolicyType.MAX_ATTEMPTS;
  }
  
  // For critical notifications, use COMPOSITE for sophisticated retry strategy
  if (priority === NotificationPriority.CRITICAL) {
    return RetryPolicyType.COMPOSITE;
  }
  
  // For system errors with high priority, use EXPONENTIAL_BACKOFF
  if (errorType === ErrorType.SYSTEM && 
      (priority === NotificationPriority.HIGH || priority === NotificationPriority.CRITICAL)) {
    return RetryPolicyType.EXPONENTIAL_BACKOFF;
  }
  
  // For external errors, use EXPONENTIAL_BACKOFF
  if (errorType === ErrorType.EXTERNAL) {
    return RetryPolicyType.EXPONENTIAL_BACKOFF;
  }
  
  // For in-app notifications with low/medium priority, use FIXED
  if (channel === 'in-app' && 
      (priority === NotificationPriority.LOW || priority === NotificationPriority.MEDIUM)) {
    return RetryPolicyType.FIXED;
  }
  
  // For transient errors with medium priority, use LINEAR
  if (errorType === ErrorType.TRANSIENT && priority === NotificationPriority.MEDIUM) {
    return RetryPolicyType.LINEAR;
  }
  
  // Default to EXPONENTIAL_BACKOFF for most scenarios
  return RetryPolicyType.EXPONENTIAL_BACKOFF;
}