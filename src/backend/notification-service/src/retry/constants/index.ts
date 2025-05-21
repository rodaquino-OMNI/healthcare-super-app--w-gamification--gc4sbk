/**
 * @file index.ts
 * Barrel file that exports all retry-related constants from the module.
 * This centralized export pattern simplifies imports and enforces proper
 * encapsulation of the retry module's constants.
 */

// Export all constants from reason-codes.constants.ts
export {
  ErrorClassification,
  ReasonCodeMetadata,
  ReasonCodeMap,
  PUSH_REASON_CODES,
  EMAIL_REASON_CODES,
  SMS_REASON_CODES,
  IN_APP_REASON_CODES,
  PUSH_REASON_CODE_MAP,
  EMAIL_REASON_CODE_MAP,
  SMS_REASON_CODE_MAP,
  IN_APP_REASON_CODE_MAP,
  ALL_REASON_CODE_MAP,
  getReasonCodeMetadata,
  isReasonCodeRetryable,
  getMaxRetriesForReasonCode,
  getErrorClassificationForReasonCode
} from './reason-codes.constants';

// Export all constants from default-config.constants.ts
export {
  DEFAULT_MAX_RETRY_ATTEMPTS,
  DEFAULT_INITIAL_DELAY_MS,
  DEFAULT_MAX_DELAY_MS,
  DEFAULT_BACKOFF_FACTOR,
  DEFAULT_JITTER_FACTOR,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_POLICY,
  DEFAULT_RETRY_CONFIG,
  MULTI_PHASE_RETRY_CONFIG
} from './default-config.constants';

// Export all constants from error-types.constants.ts
export {
  ErrorType,
  ERROR_TYPE_CHARACTERISTICS,
  HTTP_STATUS_TO_ERROR_TYPE,
  classifyError
} from './error-types.constants';

// Export all constants from policy-types.constants.ts
export {
  RetryPolicyType,
  RetryPolicyOptions,
  DEFAULT_RETRY_POLICY_OPTIONS,
  isValidRetryPolicyType,
  getRetryPolicyOptions
} from './policy-types.constants';

// Add alias for RetryPolicyType as PolicyType for backward compatibility
export { RetryPolicyType as PolicyType } from './policy-types.constants';