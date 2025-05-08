import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PreferencesModule } from '../preferences/preferences.module';
import { TemplatesModule } from '../templates/templates.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { RetryModule } from '../retry/retry.module';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';

/**
 * Module that configures and provides notification functionality for the AUSTA SuperApp.
 * Aggregates required components for sending notifications across all user journeys
 * and supports gamification-related notifications.
 * 
 * This module integrates with the RetryModule to provide robust retry mechanisms for
 * failed notifications, ensuring reliable delivery across all channels. It also uses
 * standardized interfaces from @austa/interfaces for consistent notification payloads.
 */
@Module({
  imports: [
    PreferencesModule, 
    TemplatesModule, 
    WebsocketsModule, 
    RetryModule,
    KafkaModule, 
    LoggerModule, 
    TracingModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}