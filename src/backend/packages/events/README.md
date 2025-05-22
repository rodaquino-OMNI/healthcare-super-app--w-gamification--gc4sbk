# @austa/events

A standardized event processing system for the AUSTA SuperApp ecosystem that provides type-safe event schemas, reliable Kafka integration, and consistent event handling across all microservices.

## Overview

The `@austa/events` package serves as the foundation for the event-driven architecture of the AUSTA SuperApp. It enables reliable communication between services through a standardized event system, ensuring consistent event schemas, proper versioning, and robust error handling. This package is critical for the cross-journey gamification system, which processes events from all journeys to drive user engagement.

## Key Components

### Event Schemas (`@austa/events/interfaces`)

Provides standardized, versioned event schemas with TypeScript interfaces:

- Journey-specific event types (Health, Care, Plan)
- Gamification event schemas
- Notification event schemas
- Shared event metadata structure
- Versioning support for backward compatibility

### Kafka Integration (`@austa/events/kafka`)

Facilitates reliable event publishing and consumption:

- Type-safe producers with schema validation
- Consumers with automatic deserialization
- Topic management utilities
- Connection pooling and optimization
- Health check mechanisms

### Error Handling (`@austa/events/errors`)

Comprehensive error handling framework:

- Event-specific error types
- Serializable error formats
- Error classification system
- Logging integration

### Retry Strategies (`@austa/events/retry`)

Robust retry mechanisms for failed event processing:

- Exponential backoff implementation
- Dead letter queue integration
- Retry policy configuration
- Maximum retry limits

### Versioning (`@austa/events/versioning`)

Supports event schema evolution:

- Schema version management
- Backward compatibility utilities
- Migration helpers
- Version detection

### Utilities (`@austa/events/utils`)

Helper functions for common event operations:

- Event serialization/deserialization
- Validation utilities
- Correlation ID management
- Timestamp handling

## Installation

```bash
# npm
npm install @austa/events

# yarn
yarn add @austa/events

# pnpm
pnpm add @austa/events
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
      clientId: 'health-service',
      brokers: process.env.KAFKA_BROKERS.split(','),
      groupId: 'health-service-group',
      retry: {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        factor: 2,
      },
    }),
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
import { HealthMetricRecordedEvent } from '@austa/interfaces/journey/health';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly eventProducer: EventProducer) {}

  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Business logic to record the metric
    
    // Publish event for other services (like gamification) to consume
    const event: HealthMetricRecordedEvent = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      metricType: metric.type,
      value: metric.value,
      unit: metric.unit,
      metadata: {
        correlationId: metric.correlationId,
        source: 'health-service',
      },
    };
    
    await this.eventProducer.publish('health.metrics.recorded', event);
  }
}
```

### Consuming Events

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventConsumer, EventHandler } from '@austa/events/kafka';
import { HealthMetricRecordedEvent } from '@austa/interfaces/journey/health';

@Injectable()
export class GamificationService implements OnModuleInit {
  constructor(private readonly eventConsumer: EventConsumer) {}

  async onModuleInit() {
    // Register event handler for health metrics
    await this.eventConsumer.subscribe<HealthMetricRecordedEvent>(
      'health.metrics.recorded',
      'gamification-service-group',
      this.handleHealthMetricRecorded.bind(this)
    );
  }

  @EventHandler({
    topic: 'health.metrics.recorded',
    retry: {
      maxRetries: 5,
      backoffStrategy: 'exponential',
    },
    dlq: 'health.metrics.recorded.dlq',
  })
  private async handleHealthMetricRecorded(event: HealthMetricRecordedEvent): Promise<void> {
    try {
      // Process the health metric event
      // Award points, trigger achievements, etc.
    } catch (error) {
      // Error will be automatically handled by the EventHandler decorator
      // It will retry according to the configuration and send to DLQ if all retries fail
      throw error;
    }
  }
}
```

### Error Handling

```typescript
import { Injectable } from '@nestjs/common';
import { EventError, EventProcessingError } from '@austa/events/errors';
import { EventProducer } from '@austa/events/kafka';

@Injectable()
export class ErrorHandlingService {
  constructor(private readonly eventProducer: EventProducer) {}

  async processEvent(event: any): Promise<void> {
    try {
      // Process event
    } catch (error) {
      if (error instanceof EventError) {
        // Handle known event errors
        console.error(`Event error: ${error.message}`, {
          code: error.code,
          eventId: error.eventId,
        });
      } else {
        // Convert unknown errors to EventProcessingError
        const eventError = new EventProcessingError(
          'Failed to process event',
          'EVENT_PROCESSING_FAILED',
          { originalError: error, eventId: event.id }
        );
        
        // Log the error
        console.error(eventError.message, eventError.getMetadata());
        
        // Optionally publish error event
        await this.eventProducer.publish('events.processing.failed', {
          version: '1.0',
          timestamp: new Date().toISOString(),
          eventId: event.id,
          error: eventError.serialize(),
          metadata: {
            correlationId: event.metadata?.correlationId,
            source: 'error-handler',
          },
        });
        
        throw eventError;
      }
    }
  }
}
```

### Retry Strategies

```typescript
import { Injectable } from '@nestjs/common';
import { RetryPolicy, ExponentialBackoff } from '@austa/events/retry';
import { EventConsumer } from '@austa/events/kafka';

@Injectable()
export class RetryService {
  constructor(private readonly eventConsumer: EventConsumer) {}

  configureRetryPolicy(): void {
    // Create a custom retry policy
    const retryPolicy = new RetryPolicy({
      maxRetries: 5,
      strategy: new ExponentialBackoff({
        initialDelay: 100, // ms
        maxDelay: 30000, // 30 seconds
        factor: 2, // double the delay each time
      }),
      shouldRetry: (error, attempt) => {
        // Custom logic to determine if retry should happen
        return error.isRetryable && attempt < 5;
      },
      onRetry: (error, attempt) => {
        // Log retry attempts
        console.log(`Retrying event processing (attempt ${attempt})`, error);
      },
    });

    // Apply the retry policy to a consumer
    this.eventConsumer.setRetryPolicy('health.metrics.recorded', retryPolicy);
  }
}
```

### Dead Letter Queue (DLQ) Processing

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventConsumer, EventProducer } from '@austa/events/kafka';
import { DLQProcessor } from '@austa/events/retry';

@Injectable()
export class DLQService implements OnModuleInit {
  constructor(
    private readonly eventConsumer: EventConsumer,
    private readonly eventProducer: EventProducer,
  ) {}

  async onModuleInit() {
    // Create a DLQ processor
    const dlqProcessor = new DLQProcessor({
      consumer: this.eventConsumer,
      producer: this.eventProducer,
      dlqTopic: 'health.metrics.recorded.dlq',
      originalTopic: 'health.metrics.recorded',
      processingInterval: 60000, // Process DLQ every minute
      maxAttempts: 3, // Maximum number of reprocessing attempts
    });

    // Start processing the DLQ
    await dlqProcessor.start();
  }

  // Method to manually reprocess DLQ messages
  async reprocessDLQMessages(): Promise<void> {
    const dlqProcessor = new DLQProcessor({
      consumer: this.eventConsumer,
      producer: this.eventProducer,
      dlqTopic: 'health.metrics.recorded.dlq',
      originalTopic: 'health.metrics.recorded',
    });

    await dlqProcessor.processAllMessages();
  }
}
```

### Journey-Specific Event Processing

#### Health Journey Events

```typescript
import { Injectable } from '@nestjs/common';
import { EventProducer } from '@austa/events/kafka';
import {
  HealthGoalCreatedEvent,
  HealthGoalCompletedEvent,
  HealthMetricRecordedEvent,
} from '@austa/interfaces/journey/health';

@Injectable()
export class HealthEventsService {
  constructor(private readonly eventProducer: EventProducer) {}

  async publishGoalCreated(userId: string, goal: HealthGoal): Promise<void> {
    const event: HealthGoalCreatedEvent = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      goalId: goal.id,
      goalType: goal.type,
      targetValue: goal.targetValue,
      startDate: goal.startDate,
      endDate: goal.endDate,
      metadata: {
        correlationId: goal.correlationId,
        source: 'health-service',
      },
    };
    
    await this.eventProducer.publish('health.goals.created', event);
  }

  async publishGoalCompleted(userId: string, goal: HealthGoal): Promise<void> {
    const event: HealthGoalCompletedEvent = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      goalId: goal.id,
      completedAt: new Date().toISOString(),
      achievedValue: goal.currentValue,
      metadata: {
        correlationId: goal.correlationId,
        source: 'health-service',
      },
    };
    
    await this.eventProducer.publish('health.goals.completed', event);
  }
}
```

#### Care Journey Events

```typescript
import { Injectable } from '@nestjs/common';
import { EventProducer } from '@austa/events/kafka';
import {
  AppointmentBookedEvent,
  AppointmentCompletedEvent,
} from '@austa/interfaces/journey/care';

@Injectable()
export class CareEventsService {
  constructor(private readonly eventProducer: EventProducer) {}

  async publishAppointmentBooked(userId: string, appointment: Appointment): Promise<void> {
    const event: AppointmentBookedEvent = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      appointmentId: appointment.id,
      providerId: appointment.providerId,
      specialtyId: appointment.specialtyId,
      scheduledAt: appointment.scheduledAt,
      metadata: {
        correlationId: appointment.correlationId,
        source: 'care-service',
      },
    };
    
    await this.eventProducer.publish('care.appointments.booked', event);
  }

  async publishAppointmentCompleted(userId: string, appointment: Appointment): Promise<void> {
    const event: AppointmentCompletedEvent = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      appointmentId: appointment.id,
      completedAt: new Date().toISOString(),
      duration: appointment.duration,
      metadata: {
        correlationId: appointment.correlationId,
        source: 'care-service',
      },
    };
    
    await this.eventProducer.publish('care.appointments.completed', event);
  }
}
```

#### Plan Journey Events

```typescript
import { Injectable } from '@nestjs/common';
import { EventProducer } from '@austa/events/kafka';
import {
  ClaimSubmittedEvent,
  ClaimApprovedEvent,
} from '@austa/interfaces/journey/plan';

@Injectable()
export class PlanEventsService {
  constructor(private readonly eventProducer: EventProducer) {}

  async publishClaimSubmitted(userId: string, claim: Claim): Promise<void> {
    const event: ClaimSubmittedEvent = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      claimId: claim.id,
      planId: claim.planId,
      amount: claim.amount,
      category: claim.category,
      submittedAt: new Date().toISOString(),
      metadata: {
        correlationId: claim.correlationId,
        source: 'plan-service',
      },
    };
    
    await this.eventProducer.publish('plan.claims.submitted', event);
  }

  async publishClaimApproved(userId: string, claim: Claim): Promise<void> {
    const event: ClaimApprovedEvent = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      claimId: claim.id,
      approvedAmount: claim.approvedAmount,
      approvedAt: new Date().toISOString(),
      metadata: {
        correlationId: claim.correlationId,
        source: 'plan-service',
      },
    };
    
    await this.eventProducer.publish('plan.claims.approved', event);
  }
}
```

### Gamification Event Processing

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventConsumer, EventHandler } from '@austa/events/kafka';
import { HealthGoalCompletedEvent } from '@austa/interfaces/journey/health';
import { AppointmentCompletedEvent } from '@austa/interfaces/journey/care';
import { ClaimApprovedEvent } from '@austa/interfaces/journey/plan';

@Injectable()
export class GamificationEventsService implements OnModuleInit {
  constructor(private readonly eventConsumer: EventConsumer) {}

  async onModuleInit() {
    // Subscribe to events from all journeys
    await Promise.all([
      this.eventConsumer.subscribe<HealthGoalCompletedEvent>(
        'health.goals.completed',
        'gamification-service-group',
        this.handleHealthGoalCompleted.bind(this)
      ),
      this.eventConsumer.subscribe<AppointmentCompletedEvent>(
        'care.appointments.completed',
        'gamification-service-group',
        this.handleAppointmentCompleted.bind(this)
      ),
      this.eventConsumer.subscribe<ClaimApprovedEvent>(
        'plan.claims.approved',
        'gamification-service-group',
        this.handleClaimApproved.bind(this)
      ),
    ]);
  }

  @EventHandler({
    topic: 'health.goals.completed',
    retry: { maxRetries: 3 },
    dlq: 'health.goals.completed.dlq',
  })
  private async handleHealthGoalCompleted(event: HealthGoalCompletedEvent): Promise<void> {
    // Award points for completing health goals
    // Trigger achievements related to health goals
  }

  @EventHandler({
    topic: 'care.appointments.completed',
    retry: { maxRetries: 3 },
    dlq: 'care.appointments.completed.dlq',
  })
  private async handleAppointmentCompleted(event: AppointmentCompletedEvent): Promise<void> {
    // Award points for completing appointments
    // Trigger achievements related to care journey
  }

  @EventHandler({
    topic: 'plan.claims.approved',
    retry: { maxRetries: 3 },
    dlq: 'plan.claims.approved.dlq',
  })
  private async handleClaimApproved(event: ClaimApprovedEvent): Promise<void> {
    // Award points for approved claims
    // Trigger achievements related to plan journey
  }
}
```

## Versioning and Compatibility

The `@austa/events` package follows semantic versioning (SemVer) to ensure proper dependency management:

- **Major version** changes indicate breaking changes to the API or event schemas
- **Minor version** changes add new features in a backward-compatible manner
- **Patch version** changes include backward-compatible bug fixes

### Event Schema Versioning

All events include a `version` field that follows the format `MAJOR.MINOR`. When consuming events, always check the version to ensure compatibility:

```typescript
import { EventHandler } from '@austa/events/kafka';
import { HealthMetricRecordedEvent } from '@austa/interfaces/journey/health';

@EventHandler({
  topic: 'health.metrics.recorded',
})
private async handleHealthMetricRecorded(event: HealthMetricRecordedEvent): Promise<void> {
  // Check event version for compatibility
  if (event.version === '1.0') {
    // Handle v1.0 event format
  } else if (event.version === '1.1') {
    // Handle v1.1 event format with new fields
  } else {
    // Handle unknown version
    console.warn(`Unknown event version: ${event.version}`);
    // Use default handling or fallback strategy
  }
}
```

### Migration Paths

When upgrading to a new version of the `@austa/events` package, follow these migration paths:

#### From v0.x to v1.0

1. Update all event schemas to include the `version` field
2. Implement proper error handling with the new `EventError` classes
3. Replace direct Kafka client usage with the `EventProducer` and `EventConsumer` classes
4. Update event handlers to use the `@EventHandler` decorator for automatic retry and DLQ support

#### From v1.x to v2.0 (Future)

1. Update event schemas to match the new v2.0 format
2. Implement version checking in event handlers
3. Update retry configuration to use the new retry policy format
4. Migrate to the new DLQ processing mechanism

## Troubleshooting

### Common Issues

#### Events Not Being Published

- Verify Kafka broker configuration and connectivity
- Check for serialization errors in event objects
- Ensure the topic exists and has proper permissions
- Verify that the producer is properly initialized

#### Events Not Being Consumed

- Check consumer group configuration
- Verify topic subscription
- Ensure the consumer is properly initialized
- Check for deserialization errors

#### Retry Mechanism Not Working

- Verify retry policy configuration
- Ensure errors are properly thrown from event handlers
- Check that the `@EventHandler` decorator is properly applied
- Verify DLQ topic exists if using DLQ

#### Event Schema Validation Errors

- Ensure event objects match the defined interfaces
- Check for missing required fields
- Verify event version is correct
- Check for type mismatches in event properties

### Debugging

Enable debug logging for detailed information:

```typescript
import { EventsModule } from '@austa/events';

@Module({
  imports: [
    EventsModule.forRoot({
      clientId: 'service-name',
      brokers: process.env.KAFKA_BROKERS.split(','),
      debug: true, // Enable debug logging
    }),
  ],
})
export class AppModule {}
```

## Technologies

- TypeScript 5.3.3+
- NestJS 10.3.0+
- Kafka.js 2.0+
- Zod 3.22.4+ (for schema validation)
- @austa/interfaces (for shared event schemas)

## Contributing

When extending the events package:

1. Maintain backward compatibility for event schemas
2. Include comprehensive tests for all new features
3. Document all public APIs and interfaces
4. Follow the established error handling patterns
5. Ensure proper event versioning