import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from '../interfaces/config.interfaces';

/**
 * Database configuration for the Gamification Engine.
 * 
 * This module provides settings for database connections including:
 * - Connection URL
 * - SSL settings
 * - Logging configuration
 * 
 * @returns {DatabaseConfig} The database configuration object
 */
export const databaseConfig = registerAs<DatabaseConfig>('database', () => ({
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
}));