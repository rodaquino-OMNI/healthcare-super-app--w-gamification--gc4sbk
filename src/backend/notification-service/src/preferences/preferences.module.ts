import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

// Import controllers and services
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

// Import entities
import { NotificationPreference } from './entities/notification-preference.entity';

// Import shared modules
import { LoggerModule } from '@app/logging/logger.module';
import { TracingModule } from '@app/tracing/tracing.module';
import { RetryModule } from '../retry/retry.module';

// Import interfaces
import { Repository } from '@app/shared/interfaces/repository.interface';

/**
 * Module that encapsulates the functionality for managing user notification preferences.
 * 
 * This module provides:
 * - Repository for storing and retrieving notification preferences
 * - Service for business logic related to notification preferences
 * - Controller for handling HTTP requests related to notification preferences
 * - Integration with retry mechanisms for reliable operations
 * 
 * The preferences system allows users to customize how they receive notifications
 * across different channels (push, email, SMS) and is a critical component of the
 * notification delivery system.
 */
@Module({
  imports: [
    // Register TypeORM for the NotificationPreference entity
    TypeOrmModule.forFeature([NotificationPreference]),
    
    // Import required infrastructure modules
    LoggerModule,
    TracingModule,
    RetryModule,
  ],
  controllers: [PreferencesController],
  providers: [
    // Main service for notification preferences
    PreferencesService,
    
    // Repository provider for NotificationPreference entity
    {
      provide: 'NOTIFICATION_PREFERENCE_REPOSITORY',
      useFactory: (repository: Repository<NotificationPreference>) => repository,
      inject: [getRepositoryToken(NotificationPreference)],
    },
  ],
  exports: [PreferencesService],
})
export class PreferencesModule {}