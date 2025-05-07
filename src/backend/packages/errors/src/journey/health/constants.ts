/**
 * Error codes specific to the Health journey.
 */
export enum HealthErrorCodes {
  // Connection errors
  HEALTH_CONNECTION_FAILED = 'HEALTH_001',
  HEALTH_CONNECTION_TIMEOUT = 'HEALTH_002',
  HEALTH_SERVICE_UNAVAILABLE = 'HEALTH_003',
  
  // Metrics errors
  HEALTH_METRICS_RETRIEVAL_FAILED = 'HEALTH_101',
  HEALTH_METRICS_VALIDATION_FAILED = 'HEALTH_102',
  HEALTH_METRICS_PROCESSING_FAILED = 'HEALTH_103',
  
  // Device errors
  HEALTH_DEVICE_NOT_FOUND = 'HEALTH_201',
  HEALTH_DEVICE_UNSUPPORTED = 'HEALTH_202',
  HEALTH_DISCONNECTION_FAILED = 'HEALTH_203',
  
  // Goal errors
  HEALTH_GOAL_CREATION_FAILED = 'HEALTH_301',
  HEALTH_GOAL_UPDATE_FAILED = 'HEALTH_302',
  HEALTH_GOAL_NOT_FOUND = 'HEALTH_303',
  
  // General errors
  HEALTH_VALIDATION_ERROR = 'HEALTH_901',
  HEALTH_INTERNAL_ERROR = 'HEALTH_999'
}

/**
 * Retry configuration options for health-related operations.
 */
export const HealthRetryOptions = {
  DEVICE_CONNECTION: {
    MAX_RETRIES: 3,
    BACKOFF_FACTOR: 2,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
  },
  DEVICE_DISCONNECTION: {
    MAX_RETRIES: 2,
    BACKOFF_FACTOR: 2,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 5000, // 5 seconds
  },
  METRICS_RETRIEVAL: {
    MAX_RETRIES: 3,
    BACKOFF_FACTOR: 1.5,
    INITIAL_DELAY: 2000, // 2 seconds
    MAX_DELAY: 15000, // 15 seconds
  }
};

/**
 * Error messages for health-related errors.
 */
export const HealthErrorMessages = {
  [HealthErrorCodes.HEALTH_CONNECTION_FAILED]: 'Failed to connect to wearable device',
  [HealthErrorCodes.HEALTH_CONNECTION_TIMEOUT]: 'Connection to wearable device timed out',
  [HealthErrorCodes.HEALTH_SERVICE_UNAVAILABLE]: 'Wearable service is currently unavailable',
  [HealthErrorCodes.HEALTH_METRICS_RETRIEVAL_FAILED]: 'Failed to retrieve health metrics from wearable device',
  [HealthErrorCodes.HEALTH_METRICS_VALIDATION_FAILED]: 'Health metrics validation failed',
  [HealthErrorCodes.HEALTH_METRICS_PROCESSING_FAILED]: 'Failed to process health metrics',
  [HealthErrorCodes.HEALTH_DEVICE_NOT_FOUND]: 'Wearable device connection not found',
  [HealthErrorCodes.HEALTH_DEVICE_UNSUPPORTED]: 'Unsupported wearable device type',
  [HealthErrorCodes.HEALTH_DISCONNECTION_FAILED]: 'Failed to disconnect wearable device',
  [HealthErrorCodes.HEALTH_GOAL_CREATION_FAILED]: 'Failed to create health goal',
  [HealthErrorCodes.HEALTH_GOAL_UPDATE_FAILED]: 'Failed to update health goal',
  [HealthErrorCodes.HEALTH_GOAL_NOT_FOUND]: 'Health goal not found',
  [HealthErrorCodes.HEALTH_VALIDATION_ERROR]: 'Validation error in health service',
  [HealthErrorCodes.HEALTH_INTERNAL_ERROR]: 'Internal error in health service'
};