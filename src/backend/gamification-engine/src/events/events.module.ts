import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { KafkaConsumerService } from './kafka/kafka.consumer';
import { KafkaProducer } from './kafka/kafka.producer';
import { KafkaModule } from '@austa/events/kafka';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { ErrorsModule } from '@austa/errors';
import { EventSchemaValidationService } from './validation/event-schema-validation.service';
import { EventVersioningService } from './versioning/event-versioning.service';
import { EventProcessingUtil } from '../common/utils/event-processing.util';
import { RetryService } from '@austa/events/utils/retry-utils';
import { CorrelationIdService } from '@austa/events/utils/correlation-id';
import { EventValidator } from '@austa/events/utils/event-validator';
import { EventSerializer } from '@austa/events/utils/event-serializer';
import { JourneyContext } from '@austa/events/utils/journey-context';

// Import journey handlers
import { 
  HealthJourneyHandler, 
  CareJourneyHandler, 
  PlanJourneyHandler 
} from './kafka/journey-handlers';

// Import standardized event schemas from @austa/interfaces
import { GamificationEvent } from '@austa/interfaces/gamification/events';
import { EventType } from '@austa/interfaces/gamification/events';

/**
 * Configures the Events module for the gamification engine, responsible for processing events
 * from all journeys (Health, Care, Plan) and applying gamification rules.
 * 
 * This module handles:
 * - Event reception and validation using standardized schemas from @austa/interfaces
 * - Event processing with proper error handling and retry mechanisms
 * - Event production for cross-service communication
 * - Dead-letter queue management for failed events
 * - Versioned event schema validation and compatibility
 * - Journey-specific event handling with specialized handlers
 * 
 * Key features:
 * - Standardized, versioned event schemas defined in @austa/interfaces package
 * - Enhanced error handling with centralized retry policies
 * - Dead-letter queue integration for failed event processing
 * - Distributed tracing for event flow monitoring
 * - Structured logging for event processing observability
 * - Specialized journey handlers for Health, Care, and Plan events
 * 
 * @module EventsModule
 * @category Gamification
 * @subcategory Events
 */
@Module({
  imports: [
    KafkaModule.forRoot({
      clientId: 'gamification-engine',
      consumerGroup: 'gamification-events',
      enableDLQ: true,
      dlqTopic: 'gamification-events-dlq',
      retryConfig: {
        maxRetries: 3,
        initialBackoff: 500,
        maxBackoff: 5000,
        exponentialBackoff: true,
        retryableErrors: ['CONNECTION_ERROR', 'PROCESSING_ERROR', 'TIMEOUT_ERROR']
      }
    }),
    LoggerModule.forRoot({
      service: 'gamification-engine',
      context: 'events'
    }),
    TracingModule.forRoot({
      serviceName: 'gamification-engine',
      enableTracing: true
    }),
    ErrorsModule.forRoot({
      enableGlobalFilters: true,
      journeyContext: 'gamification'
    })
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    KafkaConsumerService,
    KafkaProducer,
    // Journey-specific handlers
    HealthJourneyHandler,
    CareJourneyHandler,
    PlanJourneyHandler,
    EventSchemaValidationService,
    EventVersioningService,
    // Event processing utilities
    EventProcessingUtil,
    RetryService,
    CorrelationIdService,
    EventValidator,
    EventSerializer,
    JourneyContext,
    {
      provide: 'EVENT_SCHEMA_REGISTRY',
      useValue: {
        schemaVersion: '1.0.0',
        schemas: {
          [EventType.HEALTH_METRIC_RECORDED]: GamificationEvent,
          [EventType.HEALTH_GOAL_ACHIEVED]: GamificationEvent,
          [EventType.DEVICE_CONNECTED]: GamificationEvent,
          [EventType.DEVICE_SYNCED]: GamificationEvent,
          [EventType.MEDICAL_EVENT_RECORDED]: GamificationEvent,
          [EventType.CARE_APPOINTMENT_BOOKED]: GamificationEvent,
          [EventType.CARE_APPOINTMENT_ATTENDED]: GamificationEvent,
          [EventType.CARE_MEDICATION_TAKEN]: GamificationEvent,
          [EventType.CARE_TELEMEDICINE_COMPLETED]: GamificationEvent,
          [EventType.CARE_TREATMENT_COMPLETED]: GamificationEvent,
          [EventType.PLAN_SELECTED]: GamificationEvent,
          [EventType.PLAN_CLAIM_SUBMITTED]: GamificationEvent,
          [EventType.PLAN_CLAIM_APPROVED]: GamificationEvent,
          [EventType.PLAN_BENEFIT_USED]: GamificationEvent,
          [EventType.PLAN_DOCUMENT_UPLOADED]: GamificationEvent
        }
      }
    }
  ],
  exports: [
    EventsService, 
    KafkaProducer,
    // Export journey handlers for use in other modules
    HealthJourneyHandler,
    CareJourneyHandler,
    PlanJourneyHandler,
    EventSchemaValidationService,
    EventVersioningService,
    // Export event processing utilities
    EventProcessingUtil
  ]
})
export class EventsModule {}