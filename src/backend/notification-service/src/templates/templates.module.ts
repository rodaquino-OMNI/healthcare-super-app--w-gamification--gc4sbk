import { Module } from '@nestjs/common'; // @nestjs/common@10.0.0+
import { TypeOrmModule } from '@nestjs/typeorm'; // @nestjs/typeorm@10.0.0+
import { TemplatesService } from './templates.service';
import { NotificationTemplate } from './entities/notification-template.entity';
import { LoggerModule } from '@app/shared/logging/logger.module';
// Import standardized interfaces from @austa/interfaces
import { NotificationTemplateInterface } from '@austa/interfaces/notification/templates';

/**
 * Configures the TemplatesModule, which manages notification templates within the AUSTA SuperApp.
 * 
 * This module is responsible for:
 * - Registering the NotificationTemplate entity with TypeORM
 * - Providing the TemplatesService for template management operations
 * - Integrating with the shared LoggerModule for structured logging
 * - Using standardized interfaces from @austa/interfaces for consistent type safety
 * 
 * Templates are used across all three journeys (Health, Care, Plan) to standardize
 * notification content and support localization. The module implements the standardized
 * notification template interfaces defined in @austa/interfaces to ensure consistent
 * data structures across the platform.
 *
 * @see NotificationTemplateInterface - The standardized interface for notification templates
 */
@Module({
  imports: [
    // Register the NotificationTemplate entity with TypeORM
    TypeOrmModule.forFeature([NotificationTemplate]),
    // Import the shared LoggerModule for structured logging
    LoggerModule
  ],
  providers: [
    // Service for managing notification templates
    TemplatesService
  ],
  exports: [
    // Export TemplatesService for use in other modules
    TemplatesService
  ],
})
export class TemplatesModule {}