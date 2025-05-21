import { Module } from '@nestjs/common';
import { TelemedicineController } from './telemedicine.controller';
import { TelemedicineService } from './telemedicine.service';
import { KafkaModule } from '@app/shared/kafka';
import { LoggerModule } from '@austa/logging';
import { ExceptionsModule } from '@app/shared/exceptions';
import { DatabaseModule } from '@austa/database';
import { ProvidersModule } from '../providers/providers.module';

/**
 * Telemedicine Module for the Care Journey
 * 
 * This module is responsible for managing telemedicine sessions within the Care Journey,
 * enabling real-time video consultations between patients and healthcare providers.
 * It handles session creation, validation, and coordination between participants.
 * 
 * The module integrates with:
 * - Kafka for event streaming (session started, ended events)
 * - Logging for structured, journey-specific logging
 * - Database for session persistence
 * - Providers module for healthcare provider validation
 * 
 * @module TelemedicineModule
 */
@Module({
  imports: [
    // Core infrastructure modules
    KafkaModule,
    LoggerModule,
    ExceptionsModule,
    DatabaseModule,
    
    // Feature modules
    ProvidersModule,
  ],
  controllers: [TelemedicineController],
  providers: [TelemedicineService],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}