import { registerAs } from '@nestjs/config';
import { AppConfig } from '../interfaces/config.interfaces';

/**
 * Application configuration for the Gamification Engine.
 * 
 * This module provides core application settings including:
 * - Server configuration (port, environment, API prefix)
 * - Application metadata
 * - Logging configuration
 * 
 * @returns {AppConfig} The application configuration object
 */
export const appConfig = registerAs<AppConfig>('app', () => ({
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  
  // Application metadata
  name: 'Gamification Engine',
  description: 'Processes events from all journeys to drive user engagement through achievements, challenges, and rewards',
  version: process.env.APP_VERSION || '1.0.0',
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.LOG_PRETTY === 'true',
    disableConsole: process.env.DISABLE_CONSOLE_LOGGING === 'true',
  },
}));