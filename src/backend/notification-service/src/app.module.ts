import { Module } from '@nestjs/common'; // @nestjs/common v10.3.0+
import { ConfigModule } from '@nestjs/config'; // @nestjs/config v10.3.0+
import { TypeOrmModule } from '@nestjs/typeorm'; // @nestjs/typeorm v10.3.0+

import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { TemplatesModule } from './templates/templates.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { RetryModule } from './retry/retry.module';
import { EventsModule } from './events/events.module';
import { notification } from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { InterfacesModule } from '@austa/interfaces';
import { Notification } from './notifications/entities/notification.entity';
import { DlqEntry } from './retry/dlq/dlq-entry.entity';

/**
 * Main module for the Notification Service that configures all required components.
 * Orchestrates global configuration, database connectivity, feature modules,
 * and shared infrastructure integrations.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [notification],
      validationSchema,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Notification, DlqEntry],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
      // Enhanced connection pooling configuration
      extra: {
        max: 20, // Maximum number of connections in the pool
        min: 5,  // Minimum number of connections in the pool
        idleTimeoutMillis: 30000, // How long a connection can be idle before being removed
        connectionTimeoutMillis: 2000, // How long to wait for a connection
      },
      // Retry connection on failure
      retryAttempts: 5,
      retryDelay: 3000,
      // Automatically reconnect
      keepConnectionAlive: true,
    }),
    // Feature modules
    NotificationsModule,
    PreferencesModule,
    TemplatesModule,
    WebsocketsModule,
    // New modules for enhanced functionality
    RetryModule, // Asynchronous retry policies with dead-letter queues
    EventsModule, // Kafka event topics for reliable notification routing
    // Infrastructure modules
    KafkaModule,
    LoggerModule,
    RedisModule,
    TracingModule,
    // Import InterfacesModule from @austa/interfaces for standardized schemas
    // This provides shared TypeScript interfaces for cross-journey data models
    // ensuring consistent notification payload schemas
    InterfacesModule.forRoot(),
  ],
})
export class AppModule {}