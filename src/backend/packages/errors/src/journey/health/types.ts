/**
 * Health journey error types
 */
export enum HealthErrorType {
  METRIC = 'METRIC',
  GOAL = 'GOAL',
  DEVICE = 'DEVICE',
  SYNC = 'SYNC',
  INSIGHT = 'INSIGHT'
}

/**
 * Health metric types
 */
export enum HealthMetricType {
  BLOOD_PRESSURE = 'blood_pressure',
  HEART_RATE = 'heart_rate',
  BLOOD_GLUCOSE = 'blood_glucose',
  WEIGHT = 'weight',
  STEPS = 'steps',
  SLEEP = 'sleep',
  OXYGEN_SATURATION = 'oxygen_saturation',
  TEMPERATURE = 'temperature'
}

/**
 * Health goal status
 */
export enum HealthGoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Device connection status
 */
export enum DeviceConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PAIRING = 'pairing',
  ERROR = 'error'
}