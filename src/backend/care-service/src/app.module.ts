import { Module } from '@nestjs/common'; // v10.0.0+
import { ConfigModule } from '@nestjs/config'; // v10.0.0+

// Import feature modules
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicationsModule } from './medications/medications.module';
import { ProvidersModule } from './providers/providers.module';
import { SymptomCheckerModule } from './symptom-checker/symptom-checker.module';
import { TelemedicineModule } from './telemedicine/telemedicine.module';
import { TreatmentsModule } from './treatments/treatments.module';

// Import configuration
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Import shared infrastructure using standardized path aliases
import { PrismaService } from '@app/shared/database/prisma.service';
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';

// Import error handling modules for enhanced resilience
import { RetryModule } from '@austa/errors/decorators/retry';
import { CircuitBreakerModule } from '@austa/errors/decorators/circuit-breaker';

// Import interfaces for type-safe data models
import '@austa/interfaces/journey/care';

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
    // Infrastructure and configuration modules (initialized first)
    
    // ConfigModule: Provides configuration management for the Care Service.
    ConfigModule.forRoot({
      load: [configuration], // Loads the configuration settings from the configuration function.
      validationSchema: validationSchema, // Validates the configuration settings against the validation schema.
      isGlobal: true, // Makes the ConfigModule globally available throughout the application.
    }),
    
    // ExceptionsModule: Provides global exception handling.
    ExceptionsModule,
    
    // LoggerModule: Provides logging capabilities.
    LoggerModule,
    
    // KafkaModule: Provides Kafka integration for event streaming and gamification events.
    KafkaModule,
    
    // RedisModule: Provides Redis integration for caching and real-time features.
    RedisModule,
    
    // RetryModule: Provides retry with exponential backoff for transient errors.
    RetryModule.forRoot({
      maxAttempts: 3,
      baseDelay: 100, // ms
      maxDelay: 1000, // ms
      exponentialFactor: 2,
      jitter: true,
    }),
    
    // CircuitBreakerModule: Implements circuit breaker pattern for failing dependencies.
    CircuitBreakerModule.forRoot({
      failureThreshold: 0.5, // 50% failure rate triggers open circuit
      resetTimeout: 30000, // 30 seconds before attempting to close circuit
      maxFailures: 5, // Minimum number of calls before calculating failure rate
      halfOpenMaxCalls: 2, // Number of test calls in half-open state
    }),
    
    // Feature modules (initialized after infrastructure)
    
    // AppointmentsModule: Provides appointment booking and management functionality.
    AppointmentsModule,
    
    // MedicationsModule: Provides medication tracking and reminder functionality.
    MedicationsModule,
    
    // ProvidersModule: Provides healthcare provider search and management functionality.
    ProvidersModule,
    
    // SymptomCheckerModule: Provides symptom checking and preliminary guidance functionality.
    SymptomCheckerModule,
    
    // TelemedicineModule: Provides video consultation capabilities with healthcare providers.
    TelemedicineModule,
    
    // TreatmentsModule: Provides treatment plan tracking and management functionality.
    TreatmentsModule,
  ],
  // PrismaService: Provides database access through Prisma ORM.
  providers: [PrismaService],
})
export class AppModule {
  /**
   * The constructor is empty as this is a module class.
   * @constructor
   */
  constructor() {}
}