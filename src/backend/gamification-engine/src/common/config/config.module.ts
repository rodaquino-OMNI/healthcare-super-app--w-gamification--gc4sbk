import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { 
  appConfig, 
  databaseConfig, 
  eventProcessingConfig, 
  featuresConfig, 
  kafkaConfig, 
  pointsConfig, 
  redisConfig 
} from '.';

/**
 * Configuration validation schema using Joi.
 */
const validationSchema = Joi.object({
  // App configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  APP_VERSION: Joi.string().default('1.0.0'),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  LOG_PRETTY: Joi.boolean().default(true),
  DISABLE_CONSOLE_LOGGING: Joi.boolean().default(false),
  
  // Kafka configuration
  KAFKA_CLIENT_ID: Joi.string().default('gamification-engine'),
  KAFKA_BROKERS: Joi.string().default('localhost:9092'),
  KAFKA_GROUP_ID: Joi.string().default('gamification-consumer-group'),
  KAFKA_TOPIC_HEALTH_EVENTS: Joi.string().default('health.events'),
  KAFKA_TOPIC_CARE_EVENTS: Joi.string().default('care.events'),
  KAFKA_TOPIC_PLAN_EVENTS: Joi.string().default('plan.events'),
  KAFKA_TOPIC_USER_EVENTS: Joi.string().default('user.events'),
  KAFKA_TOPIC_GAME_EVENTS: Joi.string().default('game.events'),
  KAFKA_MAX_RETRIES: Joi.number().default(3),
  KAFKA_RETRY_INTERVAL: Joi.number().default(1000),
  
  // Event processing configuration
  EVENT_PROCESSING_RATE: Joi.number().default(1000),
  EVENT_BATCH_SIZE: Joi.number().default(100),
  RULES_REFRESH_INTERVAL: Joi.number().default(60000),
  
  // Points configuration
  DEFAULT_POINT_HEALTH_METRIC_RECORDED: Joi.number().default(10),
  DEFAULT_POINT_APPOINTMENT_BOOKED: Joi.number().default(20),
  DEFAULT_POINT_APPOINTMENT_ATTENDED: Joi.number().default(50),
  DEFAULT_POINT_CLAIM_SUBMITTED: Joi.number().default(15),
  DEFAULT_POINT_GOAL_COMPLETED: Joi.number().default(100),
  MAX_POINTS_PER_DAY: Joi.number().default(1000),
  MAX_POINTS_PER_ACTION: Joi.number().default(500),
  
  // Redis configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),
  REDIS_KEY_PREFIX: Joi.string().default('game:'),
  ACHIEVEMENTS_TTL: Joi.number().default(3600),
  USER_PROFILE_TTL: Joi.number().default(300),
  LEADERBOARD_TTL: Joi.number().default(900),
  RULES_TTL: Joi.number().default(600),
  
  // Database configuration
  DATABASE_URL: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_LOGGING: Joi.boolean().default(false),
  
  // Features configuration
  CACHE_ENABLED: Joi.boolean().default(true),
  LEADERBOARD_UPDATE_INTERVAL: Joi.number().default(900000),
  LEADERBOARD_MAX_ENTRIES: Joi.number().default(100),
  ACHIEVEMENTS_NOTIFICATIONS_ENABLED: Joi.boolean().default(true),
  ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED: Joi.boolean().default(true),
  ACHIEVEMENTS_MAX_CONCURRENT_QUESTS: Joi.number().default(5),
  REWARDS_EXPIRATION_DAYS: Joi.number().default(30),
  REWARDS_REDEMPTION_ENABLED: Joi.boolean().default(true),
});

/**
 * AppConfigModule provides configuration for the entire application.
 * 
 * It registers all configuration providers and validates environment variables.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        eventProcessingConfig,
        featuresConfig,
        kafkaConfig,
        pointsConfig,
        redisConfig,
      ],
      validationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
      expandVariables: true,
      cache: true,
    }),
  ],
})
export class AppConfigModule {}