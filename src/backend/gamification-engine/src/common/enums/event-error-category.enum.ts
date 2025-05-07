/**
 * Categorizes errors that occur during event processing to determine retry behavior.
 */
export enum EventErrorCategory {
  /**
   * Errors related to input validation or malformed data.
   * These errors are not retryable as they require fixing the input data.
   */
  VALIDATION = 'validation',

  /**
   * Errors related to business rule violations.
   * These errors are not retryable as they indicate a logical conflict with business rules.
   */
  BUSINESS_RULE = 'business_rule',

  /**
   * Temporary errors that may resolve on retry, such as network timeouts or temporary service unavailability.
   * These errors are retryable with exponential backoff.
   */
  TRANSIENT = 'transient',

  /**
   * Errors from external dependencies or third-party services.
   * These errors may be retryable depending on the specific error.
   */
  EXTERNAL_DEPENDENCY = 'external_dependency',

  /**
   * Internal system errors such as database failures or unexpected exceptions.
   * These errors may be retryable but indicate potential system issues.
   */
  SYSTEM = 'system',
}