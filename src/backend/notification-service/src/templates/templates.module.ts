import { Module } from '@nestjs/common'; // @nestjs/common@10.3.0
import { TypeOrmModule } from '@nestjs/typeorm'; // @nestjs/typeorm@10.0.0+

// Import entities
import { NotificationTemplate } from './entities/notification-template.entity';

// Import services
import { TemplatesService } from './templates.service';

// Import from shared packages using path aliases
import { LoggerModule } from '@app/shared/logging/logger.module';

// Import from retry module
import { RetryModule } from '../retry/retry.module';

/**
 * Configures the TemplatesModule, which manages notification templates within the AUSTA SuperApp.
 * Templates are used across all three journeys (Health, Care, Plan) to provide consistent
 * notification formatting with support for placeholders, localization, and channel-specific content.
 * 
 * This module integrates with @austa/interfaces for standardized notification payload schemas
 * and uses the RetryModule for resilient template operations.
 */
@Module({
  imports: [
    // Register NotificationTemplate entity with TypeORM
    TypeOrmModule.forFeature([NotificationTemplate]),
    
    // Import LoggerModule for standardized logging
    LoggerModule,
    
    // Import RetryModule for resilient operations
    RetryModule,
  ],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}