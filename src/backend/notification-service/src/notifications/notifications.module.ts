import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PreferencesModule } from '@app/preferences/preferences.module';
import { TemplatesModule } from '@app/templates/templates.module';
import { WebsocketsModule } from '@app/websockets/websockets.module';
import { RetryModule } from '@app/retry/retry.module';
import { KafkaModule } from '@austa/events/kafka/kafka.module';
import { LoggerModule } from '@austa/logging/logger.module';
import { TracingModule } from '@austa/tracing/tracing.module';

/**
 * Module that configures and provides notification functionality for the AUSTA SuperApp.
 * Aggregates required components for sending notifications across all user journeys
 * and supports gamification-related notifications.
 * 
 * Features:
 * - Integration with RetryModule for reliable notification delivery with retry policies
 * - Support for multiple notification channels (email, SMS, push, in-app)
 * - Journey-specific notification templates and preferences
 * - Standardized notification schemas using @austa/interfaces
 */
@Module({
  imports: [
    // Core notification dependencies
    PreferencesModule, 
    TemplatesModule, 
    WebsocketsModule, 
    
    // Retry functionality for failed notifications
    RetryModule,
    
    // Shared infrastructure modules
    KafkaModule, 
    LoggerModule, 
    TracingModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}