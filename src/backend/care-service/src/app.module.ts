import { Module } from '@nestjs/common'; // v10.3.0+
import { ConfigModule } from '@nestjs/config'; // v10.3.0+

import { AppointmentsModule } from './appointments/appointments.module';
import { MedicationsModule } from './medications/medications.module';
import { ProvidersModule } from './providers/providers.module';
import { SymptomCheckerModule } from './symptom-checker/symptom-checker.module';
import { TelemedicineModule } from './telemedicine/telemedicine.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { configuration } from './config';
import { validationSchema } from './config';
import { PrismaService } from '@app/database';
import { ExceptionsModule } from '@app/errors';
import { KafkaModule } from '@app/events/kafka';
import { LoggerModule } from '@app/logging';
import { RedisModule } from '@app/shared/redis';

/**
 * Root module for the Care Service that configures and organizes all the necessary modules, controllers,
 * and providers for the Care Now journey of the AUSTA SuperApp. It integrates various feature modules
 * including appointments, medications, providers, symptom checker, telemedicine, and treatments,
 * along with shared infrastructure modules.
 *
 * This module addresses the following requirements:
 * - F-102: Care Now Journey - Provides immediate healthcare access through various features.
 * - F-102-RQ-002: Appointment Booking - Enables users to schedule appointments with healthcare providers.
 * - F-102-RQ-003: Telemedicine Access - Provides video consultation capabilities with healthcare providers.
 * - F-102-RQ-004: Medication Tracking - Tracks medication schedules with reminders and adherence monitoring.
 * - F-102-RQ-005: Treatment Plan Execution - Displays and tracks progress of prescribed treatment plans.
 */
@Module({
  imports: [
    // ConfigModule: Provides configuration management for the Care Service.
    ConfigModule.forRoot({
      load: [configuration], // Loads the configuration settings from the configuration function.
      validationSchema: validationSchema, // Validates the configuration settings against the validation schema.
      isGlobal: true, // Makes the ConfigModule globally available throughout the application.
    }),
    // AppointmentsModule: Provides appointment booking and management functionality.
    // Integrates with @austa/interfaces for type-safe appointment data contracts.
    AppointmentsModule,
    // MedicationsModule: Provides medication tracking and reminder functionality.
    // Uses standardized error handling with retry mechanisms and circuit breakers.
    MedicationsModule,
    // ProvidersModule: Provides healthcare provider search and management functionality.
    // Implements journey-specific error handling and validation.
    ProvidersModule,
    // SymptomCheckerModule: Provides symptom checking and preliminary guidance functionality.
    // Utilizes @austa/interfaces for consistent data models across journeys.
    SymptomCheckerModule,
    // TelemedicineModule: Provides video consultation capabilities with healthcare providers.
    // Integrates with @austa/interfaces for type-safe telemedicine session data contracts.
    TelemedicineModule,
    // TreatmentsModule: Provides treatment plan tracking and management functionality.
    // Implements standardized error handling with retry mechanisms.
    TreatmentsModule,
    // ExceptionsModule: Provides global exception handling with journey-specific error classification.
    // Implements retry with exponential backoff for transient errors and circuit breaker pattern.
    ExceptionsModule,
    // LoggerModule: Provides structured logging with correlation IDs and journey context.
    LoggerModule,
    // KafkaModule: Provides Kafka integration for event streaming and gamification events.
    // Uses @austa/interfaces for type-safe event schemas and versioning.
    KafkaModule,
    // RedisModule: Provides Redis integration for caching and real-time features.
    // Implements connection pooling and proper error handling.
    RedisModule,
  ],
  // PrismaService: Provides database access through Prisma ORM with connection pooling and error handling.
  providers: [PrismaService],
})
export class AppModule {
  /**
   * The constructor is empty as this is a module class.
   * @constructor
   */
  constructor() {}
}