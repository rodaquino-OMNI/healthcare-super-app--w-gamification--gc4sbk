import { registerAs } from '@nestjs/config';
import { DEFAULT_API_PREFIX, DEFAULT_PORT, Environment, LogLevel } from './constants';

/**
 * Interface for application configuration
 */
export interface AppConfig {
  /**
   * Current node environment (development, production, test, staging)
   */
  nodeEnv: Environment;
  
  /**
   * Server port number
   */
  port: number;
  
  /**
   * API prefix for all routes
   */
  apiPrefix: string;
  
  /**
   * Application name
   */
  appName: string;
  
  /**
   * Application version
   */
  appVersion: string;
  
  /**
   * Logging configuration
   */
  logging: {
    /**
     * Log level (debug, info, warn, error)
     */
    level: LogLevel;
    
    /**
     * Whether to pretty print logs
     */
    prettyPrint: boolean;
    
    /**
     * Whether to include timestamps in logs
     */
    timestamp: boolean;
  };
  
  /**
   * CORS configuration
   */
  cors: {
    /**
     * Whether CORS is enabled
     */
    enabled: boolean;
    
    /**
     * Allowed origins
     */
    origin: string | string[];
  };
  
  /**
   * Rate limiting configuration
   */
  rateLimit: {
    /**
     * Whether rate limiting is enabled
     */
    enabled: boolean;
    
    /**
     * Maximum number of requests per window
     */
    max: number;
    
    /**
     * Time window in milliseconds
     */
    windowMs: number;
  };
}

/**
 * Application configuration for the Gamification Engine.
 * Contains server settings, API prefixes, environment details, and logging configuration.
 * 
 * @returns AppConfig object with application-level settings
 */
export const appConfig = registerAs('app', (): AppConfig => ({
  // Server configuration
  nodeEnv: (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT,
  port: parseInt(process.env.PORT, 10) || DEFAULT_PORT,
  apiPrefix: process.env.API_PREFIX || DEFAULT_API_PREFIX,
  
  // Application metadata
  appName: process.env.APP_NAME || 'gamification-engine',
  appVersion: process.env.APP_VERSION || '1.0.0',
  
  // Logging configuration
  logging: {
    level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    prettyPrint: process.env.LOG_PRETTY_PRINT === 'true',
    timestamp: process.env.LOG_TIMESTAMP !== 'false', // Enabled by default
  },
  
  // CORS configuration
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false', // Enabled by default
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  },
  
  // Rate limiting configuration
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false', // Enabled by default
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
  },
}));