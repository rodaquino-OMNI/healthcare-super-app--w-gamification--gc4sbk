import { BusinessError } from '../../categories/business.errors';
import { ErrorType } from '../../types';

/**
 * Error thrown when there's an issue with health metrics
 */
export class HealthMetricError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'HEALTH_METRIC_ERROR',
      details
    );
    this.name = 'HealthMetricError';
  }
}

/**
 * Error thrown when there's an issue with health goals
 */
export class HealthGoalError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'HEALTH_GOAL_ERROR',
      details
    );
    this.name = 'HealthGoalError';
  }
}

/**
 * Error thrown when there's an issue with device connections
 */
export class DeviceConnectionError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'DEVICE_CONNECTION_ERROR',
      details
    );
    this.name = 'DeviceConnectionError';
  }
}

/**
 * Error thrown when there's an issue with health data synchronization
 */
export class HealthSyncError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'HEALTH_SYNC_ERROR',
      details
    );
    this.name = 'HealthSyncError';
  }
}

/**
 * Error thrown when there's an issue with health insights
 */
export class HealthInsightError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'HEALTH_INSIGHT_ERROR',
      details
    );
    this.name = 'HealthInsightError';
  }
}

export * from './types';