import { Module } from '@nestjs/common'; // v10.3.0

// Import controllers and services
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';

// Import shared services and utilities
import { PrismaService } from '@austa/database'; // Enhanced PrismaService with connection pooling
import { LoggerModule } from '@app/shared/logging/logger.module';
import { KafkaModule } from '@app/shared/kafka/kafka.module';

/**
 * Configures the MedicationsModule for managing medication-related features.
 * This module is responsible for medication tracking within the Care Now journey,
 * allowing users to manage their medications, set reminders, and monitor adherence.
 *
 * Uses the enhanced PrismaService for database operations with journey-specific optimizations.
 */
@Module({
  imports: [
    // Import required modules
    LoggerModule,
    KafkaModule,
  ],
  controllers: [MedicationsController],
  providers: [
    // Register the MedicationsService
    MedicationsService,
    // Provide the PrismaService for database operations
    PrismaService,
  ],
  exports: [MedicationsService],
})
export class MedicationsModule {}