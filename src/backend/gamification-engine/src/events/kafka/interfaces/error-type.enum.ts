/**
 * Enum representing the types of errors that can occur during event processing
 */
export enum ErrorType {
  /**
   * Temporary errors that may resolve on retry (network issues, timeouts)
   */
  TRANSIENT = 'TRANSIENT',

  /**
   * Errors caused by invalid client input (validation errors)
   */
  CLIENT = 'CLIENT',

  /**
   * Errors in the system itself (bugs, configuration issues)
   */
  SYSTEM = 'SYSTEM',

  /**
   * Errors from external dependencies (third-party services)
   */
  EXTERNAL = 'EXTERNAL',
}