import { Module } from '@nestjs/common'; // v10.3.0
import { TelemedicineController } from './telemedicine.controller';
import { TelemedicineService } from './telemedicine.service';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { ProvidersModule } from '../providers/providers.module';

/**
 * Configures the Telemedicine module, importing the necessary controllers and providers.
 * 
 * This module is a core component of the Care Journey, enabling real-time video consultations 
 * between patients and healthcare providers. It integrates with the appointment system to 
 * facilitate scheduled telemedicine sessions and publishes events to the gamification engine 
 * for tracking user engagement.
 * 
 * Key features:
 * - Session creation and management for video consultations
 * - Integration with healthcare provider availability
 * - Event publishing for cross-journey gamification
 * - Appointment status synchronization
 */
@Module({
  imports: [
    KafkaModule,
    LoggerModule, 
    ExceptionsModule,
    ProvidersModule, // Required for provider validation during session creation
  ],
  controllers: [TelemedicineController],
  providers: [TelemedicineService],
  exports: [TelemedicineService], // Export service for use in other modules
})
export class TelemedicineModule {}