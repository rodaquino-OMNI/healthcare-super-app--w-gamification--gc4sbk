import { registerAs } from '@nestjs/config';
import { KafkaConfig } from '../interfaces/config.interfaces';

/**
 * Kafka configuration for the Gamification Engine.
 * 
 * This module provides settings for Kafka event processing including:
 * - Client identification
 * - Broker connection details
 * - Topic configuration for different event types
 * - Retry policies
 * 
 * @returns {KafkaConfig} The Kafka configuration object
 */
export const kafkaConfig = registerAs<KafkaConfig>('kafka', () => ({
  clientId: process.env.KAFKA_CLIENT_ID || 'gamification-engine',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  groupId: process.env.KAFKA_GROUP_ID || 'gamification-consumer-group',
  topics: {
    healthEvents: process.env.KAFKA_TOPIC_HEALTH_EVENTS || 'health.events',
    careEvents: process.env.KAFKA_TOPIC_CARE_EVENTS || 'care.events',
    planEvents: process.env.KAFKA_TOPIC_PLAN_EVENTS || 'plan.events',
    userEvents: process.env.KAFKA_TOPIC_USER_EVENTS || 'user.events',
    gameEvents: process.env.KAFKA_TOPIC_GAME_EVENTS || 'game.events',
  },
  maxRetries: parseInt(process.env.KAFKA_MAX_RETRIES, 10) || 3,
  retryInterval: parseInt(process.env.KAFKA_RETRY_INTERVAL, 10) || 1000,
}));