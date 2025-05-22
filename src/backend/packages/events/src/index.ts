/**
 * @austa/events
 * 
 * This package provides a standardized event processing system for the AUSTA SuperApp,
 * enabling consistent event-driven communication across all services and journeys.
 * 
 * It includes interfaces, DTOs, Kafka utilities, error handling, and versioning support
 * for building robust event-driven architectures with proper type safety and validation.
 */

// Re-export all interfaces
export * from './interfaces/base-event.interface';
export * from './interfaces/event-handler.interface';
export * from './interfaces/event-response.interface';
export * from './interfaces/event-validation.interface';
export * from './interfaces/event-versioning.interface';
export * from './interfaces/journey-events.interface';
export * from './interfaces/kafka-event.interface';

// Re-export all DTOs
export * from './dto/base-event.dto';
export * from './dto/event-metadata.dto';
export * from './dto/event-types.enum';
export * from './dto/validation';
export * from './dto/version.dto';

// Journey-specific DTOs
export * from './dto/health-event.dto';
export * from './dto/care-event.dto';
export * from './dto/plan-event.dto';

// Specialized event DTOs
export * from './dto/health-metric-event.dto';
export * from './dto/health-goal-event.dto';
export * from './dto/appointment-event.dto';
export * from './dto/medication-event.dto';
export * from './dto/claim-event.dto';
export * from './dto/benefit-event.dto';

// Re-export Kafka module
export * from './kafka';

// Re-export error handling utilities
export * from './errors';

// Re-export versioning utilities
export * from './versioning';

// Re-export constants
export * from './constants';

// Re-export utility functions
export * from './utils/correlation-id';
export * from './utils/event-serializer';
export * from './utils/event-validator';
export * from './utils/event-tracing';
export * from './utils/journey-context';
export * from './utils/payload-transformer';
export * from './utils/retry-utils';
export * from './utils/schema-utils';
export * from './utils/secure-event';
export * from './utils/type-converters';

/**
 * Usage Examples:
 * 
 * 1. Creating and publishing an event:
 * 
 * ```typescript
 * import { BaseEventDto, EventTypes, KafkaProducer } from '@austa/events';
 * 
 * const healthMetricEvent = new BaseEventDto({
 *   type: EventTypes.HEALTH.METRIC_RECORDED,
 *   userId: '123',
 *   data: {
 *     metricType: 'WEIGHT',
 *     value: 75.5,
 *     unit: 'kg',
 *     timestamp: new Date().toISOString()
 *   }
 * });
 * 
 * await kafkaProducer.produce(healthMetricEvent);
 * ```
 * 
 * 2. Consuming and handling events:
 * 
 * ```typescript
 * import { EventHandler, BaseEventDto, EventResponse } from '@austa/events';
 * 
 * @Injectable()
 * export class HealthMetricEventHandler implements EventHandler<BaseEventDto> {
 *   public getEventType(): string {
 *     return EventTypes.HEALTH.METRIC_RECORDED;
 *   }
 * 
 *   public canHandle(event: BaseEventDto): boolean {
 *     return event.type === this.getEventType();
 *   }
 * 
 *   public async handle(event: BaseEventDto): Promise<EventResponse> {
 *     try {
 *       // Process the event
 *       return { success: true };
 *     } catch (error) {
 *       return { 
 *         success: false, 
 *         error: { 
 *           message: error.message,
 *           code: 'PROCESSING_ERROR'
 *         }
 *       };
 *     }
 *   }
 * }
 * ```
 * 
 * 3. Using the Kafka module:
 * 
 * ```typescript
 * import { KafkaModule } from '@austa/events';
 * 
 * @Module({
 *   imports: [
 *     KafkaModule.forRoot({
 *       clientId: 'health-service',
 *       brokers: ['kafka:9092'],
 *       consumerGroup: 'health-service-group'
 *     })
 *   ],
 *   providers: [HealthMetricEventHandler],
 * })
 * export class AppModule {}
 * ```
 */