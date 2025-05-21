import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { TemplatesModule } from './templates/templates.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { RetryModule } from './retry/retry.module';
import { EventsModule } from './events/events.module';

import { notification } from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Import shared modules using path aliases
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';

// Import interfaces module for standardized notification schemas
import { InterfacesModule } from '@austa/interfaces';

// Import entities
import { Notification } from './notifications/entities/notification.entity';

/**
 * Main module for the Notification Service that configures all required components.
 * 
 * Features:
 * - Asynchronous retry policies with dead-letter queues for failed notifications
 * - Kafka event topics for reliable notification routing and delivery tracking
 * - Integration with @austa/interfaces for standardized notification payload schemas
 * - Enhanced delivery channel fallback logic for improved reliability
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      load: [notification],
      validationSchema,
      isGlobal: true,
    }),
    
    // Database with enhanced connection pooling
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Notification],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
      // Enhanced connection pooling configuration
      extra: {
        max: 20, // Maximum number of connections in pool
        min: 5, // Minimum number of connections in pool
        idleTimeoutMillis: 30000, // How long a connection can be idle before being removed
        connectionTimeoutMillis: 2000, // How long to wait for a connection
      },
      // Retry connection on failure
      retryAttempts: 5,
      retryDelay: 3000, // 3 seconds
      autoLoadEntities: true,
    }),
    
    // Feature modules
    NotificationsModule,
    PreferencesModule,
    TemplatesModule,
    WebsocketsModule,
    
    // New modules for enhanced reliability
    RetryModule, // Asynchronous retry policies with dead-letter queues
    EventsModule, // Kafka event topics for notification routing and tracking
    
    // Shared infrastructure modules with path aliases
    KafkaModule,
    LoggerModule,
    RedisModule,
    TracingModule,
    
    // Standardized notification schemas
    InterfacesModule,
  ],
})
export class AppModule {}