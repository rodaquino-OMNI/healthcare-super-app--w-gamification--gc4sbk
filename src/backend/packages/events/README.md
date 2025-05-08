# @austa/events

A comprehensive event processing system for the AUSTA SuperApp that provides standardized event schemas, Kafka integration, versioning support, and robust error handling across all microservices.

## Overview

The `@austa/events` package serves as the foundation for event-driven communication in the AUSTA SuperApp's journey-centered architecture. It ensures consistent, reliable event processing across all services while supporting the unique requirements of each journey (Health, Care, and Plan). By standardizing event schemas, production, consumption, and error handling, this package enables seamless integration between services and powers the cross-journey gamification engine.

## Key Components

### Event Schemas (`@austa/events/interfaces`)

Provides standardized, versioned event interfaces for all journeys:

- Base event interface with common properties
- Journey-specific event interfaces for Health, Care, and Plan
- Validation interfaces for ensuring data integrity
- Versioning interfaces for backward compatibility

### Event DTOs (`@austa/events/dto`)

Implements Data Transfer Objects with validation for all event types:

- Base event DTO with core validation
- Journey-specific DTOs with specialized validation rules
- Versioned DTOs for schema evolution
- Metadata DTOs for cross-cutting concerns

### Kafka Integration (`@austa/events/kafka`)

Provides robust Kafka integration for event production and consumption:

- Producer service with guaranteed delivery
- Consumer base class with standardized processing
- Error handling with dead-letter queues
- Configuration utilities for consistent settings

### Error Handling (`@austa/events/errors`)

Implements comprehensive error handling for event processing:

- Specialized error classes for event processing
- Retry policies with exponential backoff
- Dead letter queue integration for failed events
- Error classification for appropriate handling

### Versioning (`@austa/events/versioning`)

Supports event schema evolution while maintaining backward compatibility:

- Version detection for incoming events
- Compatibility checking between versions
- Schema migration for version conversion
- Transformation utilities for payload conversion

### Utilities (`@austa/events/utils`)

Provides helper functions for common event processing tasks:

- Event validation against schemas
- Serialization and deserialization
- Correlation ID management for tracing
- Journey context handling

## Installation

```bash
# npm
npm install @austa/events

# yarn
yarn add @austa/events
```

## Usage

### Module Registration

Import and register the events module in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { EventsModule } from '@austa/events';

@Module({
  imports: [
    EventsModule.forRoot({
      kafka: {
        clientId: 'health-service',
        brokers: process.env.KAFKA_BROKERS.split(','),
        groupId: 'health-service-group'
      },
      journey: 'health',
      errorHandling: {
        maxRetries: 3,
        retryStrategy: 'exponential',
        dlqEnabled: true
      }
    })
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
```

### Publishing Events

```typescript
import { Injectable } from '@nestjs/common';
import { EventProducer } from '@austa/events/kafka';
import { HealthMetricEvent } from '@austa/events/dto';
import { EventTypes } from '@austa/events/interfaces';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly eventProducer: EventProducer) {}

  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Create a strongly-typed event with validation
    const event = new HealthMetricEvent({
      userId,
      type: EventTypes.Health.METRIC_RECORDED,
      timestamp: new Date().toISOString(),
      data: {
        metricType: metric.type,
        value: metric.value,
        unit: metric.unit,
        source: metric.source,
        recordedAt: metric.timestamp
      },
      metadata: {
        journey: 'health',
        version: '1.0.0',
        correlationId: generateCorrelationId()
      }
    });

    // Publish the event to Kafka
    await this.eventProducer.publish('health.metrics', event);
  }
}
```

### Consuming Events

```typescript
import { Injectable } from '@nestjs/common';
import { EventHandler, EventResponse } from '@austa/events/interfaces';
import { HealthMetricEvent } from '@austa/events/dto';
import { EventTypes } from '@austa/events/interfaces';
import { EventConsumer } from '@austa/events/kafka';

@Injectable()
export class MetricEventHandler implements EventHandler<HealthMetricEvent> {
  // Specify which event type this handler can process
  getEventType(): string {
    return EventTypes.Health.METRIC_RECORDED;
  }

  // Validate if this handler can process the event
  canHandle(event: HealthMetricEvent): boolean {
    return event.type === this.getEventType() && 
           event.data?.metricType !== undefined;
  }

  // Process the event
  async handle(event: HealthMetricEvent): Promise<EventResponse> {
    try {
      // Process the health metric event
      // ...

      return {
        success: true,
        eventId: event.eventId
      };
    } catch (error) {
      return {
        success: false,
        eventId: event.eventId,
        error: {
          message: error.message,
          code: 'HEALTH_METRIC_PROCESSING_ERROR',
          details: error.stack
        }
      };
    }
  }
}

@Injectable()
export class HealthEventsConsumer {
  constructor(
    private readonly eventConsumer: EventConsumer,
    private readonly metricEventHandler: MetricEventHandler
  ) {}

  async onModuleInit() {
    // Register the handler with the consumer
    this.eventConsumer.registerHandler(this.metricEventHandler);
    
    // Start consuming events from the topic
    await this.eventConsumer.subscribe('health.metrics');
  }
}
```

### Implementing Retry Strategies

```typescript
import { Injectable } from '@nestjs/common';
import { RetryPolicy, createExponentialBackoffPolicy } from '@austa/events/errors';
import { EventTypes } from '@austa/events/interfaces';

@Injectable()
export class HealthRetryPolicyService {
  getRetryPolicy(): RetryPolicy {
    return createExponentialBackoffPolicy({
      maxRetries: 5,
      initialDelayMs: 100,
      maxDelayMs: 10000,
      // Customize retry behavior based on event type
      eventTypeConfig: {
        [EventTypes.Health.METRIC_RECORDED]: {
          maxRetries: 3, // Less retries for metrics
        },
        [EventTypes.Health.GOAL_ACHIEVED]: {
          maxRetries: 10, // More retries for achievements
          initialDelayMs: 200
        }
      },
      // Customize retry behavior based on error type
      errorTypeConfig: {
        'DATABASE_ERROR': {
          maxRetries: 7,
          initialDelayMs: 500
        },
        'VALIDATION_ERROR': {
          maxRetries: 0 // Don't retry validation errors
        }
      }
    });
  }
}
```

### Handling Event Versioning

```typescript
import { Injectable } from '@nestjs/common';
import { VersionDetector, SchemaRegistry } from '@austa/events/versioning';
import { EventTypes } from '@austa/events/interfaces';
import { HealthMetricEventV1, HealthMetricEventV2 } from '@austa/events/dto';

@Injectable()
export class HealthSchemaService {
  constructor(
    private readonly schemaRegistry: SchemaRegistry,
    private readonly versionDetector: VersionDetector
  ) {
    // Register schemas for different versions
    this.registerSchemas();
  }

  private registerSchemas(): void {
    // Register v1 schema
    this.schemaRegistry.register({
      type: EventTypes.Health.METRIC_RECORDED,
      version: '1.0.0',
      schema: HealthMetricEventV1.schema,
      // Define migration to v2
      migrations: {
        '2.0.0': (v1Event) => {
          // Transform v1 to v2 format
          return {
            ...v1Event,
            data: {
              ...v1Event.data,
              // Add new required field in v2
              deviceId: v1Event.data.source === 'device' 
                ? v1Event.data.sourceId 
                : null,
              // Transform renamed field
              recordedTime: v1Event.data.recordedAt
            }
          };
        }
      }
    });

    // Register v2 schema
    this.schemaRegistry.register({
      type: EventTypes.Health.METRIC_RECORDED,
      version: '2.0.0',
      schema: HealthMetricEventV2.schema,
      // Define migration to v1 (backward compatibility)
      migrations: {
        '1.0.0': (v2Event) => {
          // Transform v2 to v1 format
          return {
            ...v2Event,
            data: {
              ...v2Event.data,
              // Transform renamed field
              recordedAt: v2Event.data.recordedTime,
              // Map new field back to old structure
              sourceId: v2Event.data.deviceId,
              source: v2Event.data.deviceId ? 'device' : 'manual'
            }
          };
        }
      }
    });
  }

  async processEvent(rawEvent: unknown): Promise<void> {
    // Detect version of incoming event
    const { type, version } = this.versionDetector.detect(rawEvent);
    
    // Get the latest schema version
    const latestVersion = this.schemaRegistry.getLatestVersion(type);
    
    // Migrate event to latest version if needed
    const event = version !== latestVersion
      ? this.schemaRegistry.migrate(rawEvent, type, version, latestVersion)
      : rawEvent;
      
    // Process the event with latest schema
    // ...
  }
}
```

### Journey-Specific Event Processing

```typescript
import { Injectable } from '@nestjs/common';
import { JourneyContext } from '@austa/events/utils';
import { EventTypes } from '@austa/events/interfaces';
import { BaseEvent } from '@austa/events/dto';

@Injectable()
export class CrossJourneyAchievementService {
  processEvent(event: BaseEvent): void {
    // Extract journey context from event
    const journeyContext = JourneyContext.fromEvent(event);
    
    // Process based on journey
    switch (journeyContext.journey) {
      case 'health':
        this.processHealthEvent(event, journeyContext);
        break;
      case 'care':
        this.processCareEvent(event, journeyContext);
        break;
      case 'plan':
        this.processPlanEvent(event, journeyContext);
        break;
      default:
        throw new Error(`Unknown journey: ${journeyContext.journey}`);
    }
  }
  
  private processHealthEvent(event: BaseEvent, context: JourneyContext): void {
    // Health-specific processing
    if (event.type === EventTypes.Health.GOAL_ACHIEVED) {
      // Award achievement for health goal
    }
  }
  
  private processCareEvent(event: BaseEvent, context: JourneyContext): void {
    // Care-specific processing
    if (event.type === EventTypes.Care.APPOINTMENT_COMPLETED) {
      // Award achievement for appointment attendance
    }
  }
  
  private processPlanEvent(event: BaseEvent, context: JourneyContext): void {
    // Plan-specific processing
    if (event.type === EventTypes.Plan.CLAIM_SUBMITTED) {
      // Track claim submission for achievements
    }
  }
}
```

## Error Handling and Troubleshooting

### Common Error Scenarios

#### Kafka Connection Issues

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '@austa/events/kafka';
import { JourneyLogger } from '@austa/shared/logging';

@Injectable()
export class KafkaHealthCheck implements OnModuleInit {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logger: JourneyLogger
  ) {}

  async onModuleInit() {
    try {
      // Verify Kafka connection on startup
      await this.kafkaService.verifyConnection();
      this.logger.info('Kafka connection successful');
    } catch (error) {
      this.logger.error('Kafka connection failed', error, {
        brokers: this.kafkaService.getBrokers(),
        clientId: this.kafkaService.getClientId()
      });
      
      // Implement recovery strategy
      this.setupConnectionRetry();
    }
  }

  private setupConnectionRetry(): void {
    // Implement exponential backoff for reconnection
    // ...
  }
}
```

#### Handling Dead Letter Queues

```typescript
import { Injectable } from '@nestjs/common';
import { DLQService } from '@austa/events/errors';
import { JourneyLogger } from '@austa/shared/logging';

@Injectable()
export class DLQMonitoringService {
  constructor(
    private readonly dlqService: DLQService,
    private readonly logger: JourneyLogger
  ) {}

  async processDLQ(topic: string): Promise<void> {
    // Get failed events from DLQ
    const failedEvents = await this.dlqService.getFailedEvents(topic);
    
    this.logger.info(`Processing ${failedEvents.length} failed events from DLQ`, {
      topic,
      count: failedEvents.length
    });
    
    for (const event of failedEvents) {
      try {
        // Analyze failure reason
        const failureReason = event.metadata.error;
        
        // Log detailed information
        this.logger.debug('Processing failed event', {
          eventId: event.eventId,
          type: event.type,
          failureReason,
          retryCount: event.metadata.retryCount
        });
        
        // Attempt reprocessing or manual correction
        if (this.isRecoverable(failureReason)) {
          await this.dlqService.reprocess(event);
        } else {
          await this.dlqService.markAsProcessed(event);
        }
      } catch (error) {
        this.logger.error('Error processing DLQ event', error, {
          eventId: event.eventId
        });
      }
    }
  }
  
  private isRecoverable(failureReason: any): boolean {
    // Determine if the failure is recoverable
    // ...
    return true;
  }
}
```

### Troubleshooting Guide

#### Event Validation Failures

If events are failing validation:

1. Check that the event structure matches the expected schema
2. Verify that required fields are present and have correct types
3. Ensure that the event version is compatible with the consumer
4. Check for any custom validation rules that might be failing

#### Event Processing Timeouts

If event processing is timing out:

1. Check Kafka broker health and connectivity
2. Verify that consumer group offsets are being committed properly
3. Look for long-running operations in event handlers
4. Check for resource constraints (CPU, memory) on consumer services

#### Missing Events

If events are not being received by consumers:

1. Verify that the producer is successfully publishing events
2. Check that consumers are subscribed to the correct topics
3. Ensure that consumer group IDs are configured correctly
4. Verify that there are no authorization issues with Kafka

#### Version Compatibility Issues

If event version compatibility is causing problems:

1. Check that all services are using compatible versions of the events package
2. Verify that schema migrations are properly registered for all event types
3. Ensure that version detection is working correctly for incoming events
4. Check for any breaking changes in event schemas that might not have migrations

## Technologies

- TypeScript 5.3+
- NestJS 10.3+
- Kafka.js 2.0+
- Zod 3.22+
- class-validator 0.14+
- OpenTelemetry for distributed tracing

## Migration Guide

### Migrating from @austa/shared/kafka

If you're currently using `@austa/shared/kafka`, follow these steps to migrate to `@austa/events`:

1. Update your imports:
   ```typescript
   // Before
   import { KafkaModule, KafkaProducer } from '@austa/shared/kafka';
   
   // After
   import { EventsModule, EventProducer } from '@austa/events';
   ```

2. Update module registration:
   ```typescript
   // Before
   KafkaModule.forRoot({
     clientId: 'service-name',
     brokers: ['kafka:9092']
   })
   
   // After
   EventsModule.forRoot({
     kafka: {
       clientId: 'service-name',
       brokers: ['kafka:9092']
     },
     journey: 'journey-name'
   })
   ```

3. Replace event production code:
   ```typescript
   // Before
   await kafkaProducer.send('topic', { /* event data */ });
   
   // After
   const event = new JourneyEvent({ /* event data */ });
   await eventProducer.publish('topic', event);
   ```

4. Update consumer implementation:
   ```typescript
   // Before
   await kafkaConsumer.subscribe('topic', 'group', async (message) => {
     // Handle message
   });
   
   // After
   // Create a handler class implementing EventHandler
   // Register the handler with the consumer
   await eventConsumer.registerHandler(myEventHandler);
   await eventConsumer.subscribe('topic');
   ```

### Version Compatibility

| @austa/events | NestJS | TypeScript | Node.js |
|--------------|--------|------------|--------|
| 1.0.x        | ≥ 10.0.0 | ≥ 5.0.0    | ≥ 18.0.0 |
| 1.1.x        | ≥ 10.0.0 | ≥ 5.0.0    | ≥ 18.0.0 |

## Contributing

When extending the events package:

1. Maintain backward compatibility for event schemas
2. Add proper migrations for any schema changes
3. Include comprehensive tests for new functionality
4. Document all public APIs and interfaces
5. Follow journey-centered design principles