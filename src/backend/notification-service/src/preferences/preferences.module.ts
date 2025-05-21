import { Module } from '@nestjs/common';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';
import { NotificationPreference } from '@austa/interfaces/notification';
import { DatabaseModule } from '@austa/database';

/**
 * Module that encapsulates the functionality for managing user notification preferences.
 * Imports and registers the controller and service for notification preferences,
 * and exports the service to make it available to other modules.
 *
 * This module provides:
 * - Controller for handling HTTP requests related to notification preferences
 * - Service for managing notification preference business logic
 * - Repository for database operations on notification preferences
 */
@Module({
  imports: [DatabaseModule],
  controllers: [PreferencesController],
  providers: [
    PreferencesService,
    {
      provide: 'NOTIFICATION_PREFERENCE_REPOSITORY',
      useFactory: (connection) => connection.getRepository(NotificationPreference),
      inject: ['DATABASE_CONNECTION'],
    },
  ],
  exports: [PreferencesService],
})
export class PreferencesModule {}