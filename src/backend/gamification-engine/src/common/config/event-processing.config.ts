import { registerAs } from '@nestjs/config';
import { EventProcessingConfig } from '../interfaces/config.interfaces';

/**
 * Event processing configuration for the Gamification Engine.
 * 
 * This module provides settings for event processing including:
 * - Processing rate and batch size
 * - Rules refresh interval
 * 
 * @returns {EventProcessingConfig} The event processing configuration object
 */
export const eventProcessingConfig = registerAs<EventProcessingConfig>('eventProcessing', () => ({
  rate: parseInt(process.env.EVENT_PROCESSING_RATE, 10) || 1000,
  batchSize: parseInt(process.env.EVENT_BATCH_SIZE, 10) || 100,
  rulesRefreshInterval: parseInt(process.env.RULES_REFRESH_INTERVAL, 10) || 60000, // 1 minute
}));