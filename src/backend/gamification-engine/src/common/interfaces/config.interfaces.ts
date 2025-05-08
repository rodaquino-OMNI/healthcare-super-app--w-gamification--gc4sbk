import { LogLevel } from '@austa/interfaces/common';

/**
 * Interface for application-level configuration settings.
 */
export interface AppConfig {
  /**
   * The current Node.js environment (development, test, production).
   */
  nodeEnv: string;
  
  /**
   * The port number the application will listen on.
   */
  port: number;
  
  /**
   * The API prefix for all routes (e.g., 'api').
   */
  apiPrefix: string;
  
  /**
   * Application metadata.
   */
  name: string;
  description: string;
  version: string;
  
  /**
   * Logging configuration.
   */
  logging: {
    /**
     * The log level (debug, info, warn, error).
     */
    level: LogLevel | string;
    
    /**
     * Whether to use pretty-printed logs in development.
     */
    pretty: boolean;
    
    /**
     * Whether to disable console logging (useful in production with external log aggregation).
     */
    disableConsole: boolean;
  };
}

/**
 * Interface for Kafka configuration settings.
 */
export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  groupId: string;
  topics: {
    healthEvents: string;
    careEvents: string;
    planEvents: string;
    userEvents: string;
    gameEvents: string;
  };
  maxRetries: number;
  retryInterval: number;
}

/**
 * Interface for event processing configuration settings.
 */
export interface EventProcessingConfig {
  rate: number;
  batchSize: number;
  rulesRefreshInterval: number;
}

/**
 * Interface for points configuration settings.
 */
export interface PointsConfig {
  defaultValues: {
    healthMetricRecorded: number;
    appointmentBooked: number;
    appointmentAttended: number;
    claimSubmitted: number;
    goalCompleted: number;
  };
  limits: {
    maxPointsPerDay: number;
    maxPointsPerAction: number;
  };
}

/**
 * Interface for Redis configuration settings.
 */
export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  keyPrefix: string;
  ttl: {
    achievements: number;
    userProfile: number;
    leaderboard: number;
    rules: number;
  };
}

/**
 * Interface for database configuration settings.
 */
export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  logging: boolean;
}

/**
 * Interface for feature flag configuration settings.
 */
export interface FeaturesConfig {
  cache: {
    enabled: boolean;
  };
  leaderboard: {
    updateInterval: number;
    maxEntries: number;
  };
  achievements: {
    notificationsEnabled: boolean;
    progressTrackingEnabled: boolean;
    maxConcurrentQuests: number;
  };
  rewards: {
    expirationDays: number;
    redemptionEnabled: boolean;
  };
}