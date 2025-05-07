# AUSTA SuperApp Gamification Event Schema

## Table of Contents

1. [Overview](#1-overview)
2. [Event Schema](#2-event-schema)
3. [Event Types](#3-event-types)
4. [Validation Mechanisms](#4-validation-mechanisms)
5. [Event Versioning](#5-event-versioning)
6. [Journey-Specific Events](#6-journey-specific-events)
7. [Event Processing Pipeline](#7-event-processing-pipeline)
8. [Retry and Error Handling](#8-retry-and-error-handling)
9. [Monitoring and Observability](#9-monitoring-and-observability)
10. [Integration Guide](#10-integration-guide)

## 1. Overview

The AUSTA SuperApp gamification event architecture provides a standardized approach for processing user actions across all journeys (Health, Care, Plan) into achievements, rewards, and points. This document outlines the technical implementation of the event schema, validation mechanisms, processing pipeline, and error handling strategies.

The gamification event system is designed to:

- Capture user actions from all journeys in a consistent format
- Process events through a rule-based evaluation engine
- Award points, unlock achievements, and track quest progress
- Provide real-time feedback to users on their gamification progress
- Ensure reliable event processing with robust error handling

### 1.1 Architecture Principles

- **Type Safety**: All events use TypeScript interfaces to ensure type safety across the application
- **Versioning**: Event schemas support versioning for backward compatibility
- **Validation**: Comprehensive validation ensures data integrity
- **Reliability**: Robust retry mechanisms and dead letter queues handle failures
- **Observability**: Monitoring and logging provide visibility into event processing

## 2. Event Schema

All gamification events follow a standardized schema defined in the `@austa/interfaces` package. This ensures consistency across all services that produce or consume events.

### 2.1 Base Event Interface

The core event interface is defined as follows:

```typescript
/**
 * Base interface for all gamification events
 */
export interface IBaseEvent {
  /**
   * Unique identifier for the event
   */
  id?: string;

  /**
   * The type of event
   * @example "HEALTH_METRIC_RECORDED", "APPOINTMENT_BOOKED", "CLAIM_SUBMITTED"
   */
  type: string;

  /**
   * User ID associated with the event
   */
  userId: string;

  /**
   * Timestamp when the event occurred
   */
  timestamp: Date | string;

  /**
   * The journey that generated the event
   * @example "health", "care", "plan"
   */
  journey?: string;

  /**
   * Event payload containing journey-specific data
   */
  data: IEventPayload;

  /**
   * Optional version information for schema evolution
   */
  version?: IEventVersion;
}

/**
 * Interface for event payload data
 */
export interface IEventPayload {
  [key: string]: any;
}

/**
 * Interface for event version information
 */
export interface IEventVersion {
  /**
   * Schema version number
   */
  schemaVersion: string;
  
  /**
   * Optional compatibility information
   */
  compatibility?: {
    minVersion: string;
    maxVersion: string;
  };
}
```

### 2.2 Event DTO

Events are validated using the `ProcessEventDto` class, which uses class-validator decorators to enforce the schema:

```typescript
export class ProcessEventDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsObject()
  data: object;

  @IsOptional()
  @IsString()
  journey: string;
}
```

## 3. Event Types

Event types are standardized across the application to ensure consistent processing. They are organized by journey and defined as string literals or enums.

### 3.1 Event Type Definitions

```typescript
/**
 * Health journey event types
 */
export enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
  HEALTH_INSIGHT_VIEWED = 'HEALTH_INSIGHT_VIEWED',
  MEDICAL_RECORD_ADDED = 'MEDICAL_RECORD_ADDED'
}

/**
 * Care journey event types
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_ATTENDED = 'APPOINTMENT_ATTENDED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  TELEMEDICINE_SESSION_STARTED = 'TELEMEDICINE_SESSION_STARTED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  SYMPTOM_CHECKED = 'SYMPTOM_CHECKED',
  PROVIDER_RATED = 'PROVIDER_RATED',
  TREATMENT_PLAN_CREATED = 'TREATMENT_PLAN_CREATED',
  TREATMENT_PLAN_COMPLETED = 'TREATMENT_PLAN_COMPLETED'
}

/**
 * Plan journey event types
 */
export enum PlanEventType {
  PLAN_SELECTED = 'PLAN_SELECTED',
  PLAN_PURCHASED = 'PLAN_PURCHASED',
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  BENEFIT_USED = 'BENEFIT_USED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  COVERAGE_CHECKED = 'COVERAGE_CHECKED',
  PLAN_RENEWED = 'PLAN_RENEWED',
  PLAN_COMPARED = 'PLAN_COMPARED'
}

/**
 * User-related event types
 */
export enum UserEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  DAILY_LOGIN = 'DAILY_LOGIN',
  WEEKLY_ACTIVE = 'WEEKLY_ACTIVE',
  FEEDBACK_PROVIDED = 'FEEDBACK_PROVIDED',
  FEATURE_USED = 'FEATURE_USED',
  JOURNEY_SWITCHED = 'JOURNEY_SWITCHED',
  REWARD_REDEEMED = 'REWARD_REDEEMED'
}
```

### 3.2 Combined Event Types

A union type combines all event types for type-safe usage throughout the application:

```typescript
/**
 * Union of all event types
 */
export type EventType = 
  | HealthEventType
  | CareEventType
  | PlanEventType
  | UserEventType;
```

## 4. Validation Mechanisms

Event validation occurs at multiple levels to ensure data integrity and prevent invalid events from entering the processing pipeline.

### 4.1 Schema Validation

Events are validated using NestJS's ValidationPipe with class-validator decorators:

1. **HTTP Controller Validation**: The `EventsController` uses ValidationPipe to validate incoming HTTP requests against the `ProcessEventDto`
2. **Kafka Consumer Validation**: The `EventsConsumer` validates Kafka messages against the same DTO
3. **Service-Level Validation**: Additional validation occurs in the `EventsService` before processing

### 4.2 Type Guards

TypeScript type guards provide runtime type checking for event payloads:

```typescript
/**
 * Type guard for health events
 */
export function isHealthEvent(event: IBaseEvent): event is IHealthEvent {
  return event.journey === 'health';
}

/**
 * Type guard for care events
 */
export function isCareEvent(event: IBaseEvent): event is ICareEvent {
  return event.journey === 'care';
}

/**
 * Type guard for plan events
 */
export function isPlanEvent(event: IBaseEvent): event is IPlanEvent {
  return event.journey === 'plan';
}
```

### 4.3 Payload Validation

Journey-specific payload validation ensures that event data contains all required fields:

```typescript
/**
 * Validates health metric event payload
 */
export function validateHealthMetricPayload(data: any): data is IHealthMetricPayload {
  return (
    data &&
    typeof data.metricType === 'string' &&
    typeof data.value === 'number' &&
    typeof data.unit === 'string'
  );
}
```

## 5. Event Versioning

Event schemas evolve over time, requiring a versioning strategy to maintain backward compatibility.

### 5.1 Version Information

Events can include version information to indicate schema compatibility:

```typescript
export interface IEventVersion {
  schemaVersion: string;
  compatibility?: {
    minVersion: string;
    maxVersion: string;
  };
}
```

### 5.2 Schema Evolution

The versioning strategy follows these principles:

1. **Backward Compatibility**: New versions must support processing of older event formats
2. **Version Detection**: The system detects event versions and applies appropriate transformations
3. **Gradual Migration**: Services can be updated independently without breaking event processing
4. **Documentation**: All schema changes are documented with migration paths

### 5.3 Schema Transformation

Transformation functions convert between schema versions:

```typescript
/**
 * Transforms an event from an older schema version to the current version
 */
export function transformEventSchema<T extends IBaseEvent>(event: T, targetVersion: string): T {
  // Implementation depends on specific schema changes
  if (!event.version || semver.lt(event.version.schemaVersion, targetVersion)) {
    // Apply transformations based on version differences
    return transformToCurrentVersion(event, targetVersion);
  }
  return event;
}
```

## 6. Journey-Specific Events

Each journey (Health, Care, Plan) has specialized event types and payloads that reflect the domain-specific actions users can take.

### 6.1 Health Journey Events

Health journey events track user health metrics, goals, and device interactions:

```typescript
/**
 * Health journey event interface
 */
export interface IHealthEvent extends IBaseEvent {
  journey: 'health';
  type: HealthEventType;
  data: IHealthEventPayload;
}

/**
 * Union type for all health event payloads
 */
export type IHealthEventPayload =
  | IHealthMetricPayload
  | IGoalPayload
  | IDevicePayload
  | IMedicalRecordPayload;

/**
 * Health metric event payload
 */
export interface IHealthMetricPayload {
  metricType: MetricType;
  value: number;
  unit: string;
  source?: MetricSource;
  timestamp?: Date | string;
}
```

### 6.2 Care Journey Events

Care journey events track appointments, medications, and telemedicine sessions:

```typescript
/**
 * Care journey event interface
 */
export interface ICareEvent extends IBaseEvent {
  journey: 'care';
  type: CareEventType;
  data: ICareEventPayload;
}

/**
 * Union type for all care event payloads
 */
export type ICareEventPayload =
  | IAppointmentPayload
  | IMedicationPayload
  | ITelemedicinePayload
  | ITreatmentPayload;

/**
 * Appointment event payload
 */
export interface IAppointmentPayload {
  appointmentId: string;
  appointmentType: AppointmentType;
  providerId: string;
  scheduledDate: Date | string;
  status: AppointmentStatus;
}
```

### 6.3 Plan Journey Events

Plan journey events track insurance plans, claims, and benefits:

```typescript
/**
 * Plan journey event interface
 */
export interface IPlanEvent extends IBaseEvent {
  journey: 'plan';
  type: PlanEventType;
  data: IPlanEventPayload;
}

/**
 * Union type for all plan event payloads
 */
export type IPlanEventPayload =
  | IPlanPayload
  | IClaimPayload
  | IBenefitPayload
  | IDocumentPayload;

/**
 * Claim event payload
 */
export interface IClaimPayload {
  claimId: string;
  planId: string;
  amount: number;
  status: ClaimStatus;
  submissionDate: Date | string;
  serviceDate: Date | string;
  serviceType: string;
}
```

## 7. Event Processing Pipeline

The event processing pipeline handles the flow of events from ingestion to rule evaluation and achievement updates.

### 7.1 Event Ingestion

Events enter the system through two primary channels:

1. **HTTP API**: The `EventsController` exposes a REST endpoint for direct event submission
2. **Kafka Topics**: The `EventsConsumer` subscribes to journey-specific Kafka topics:
   - `health.events`
   - `care.events`
   - `plan.events`
   - `user.events`

### 7.2 Processing Flow

The event processing flow follows these steps:

1. **Validation**: Events are validated against the schema
2. **User Profile**: The user's gamification profile is retrieved or created
3. **Rule Evaluation**: Business rules are evaluated against the event
4. **Point Awarding**: Points are awarded based on rule evaluation
5. **Achievement Updates**: Achievements are unlocked if conditions are met
6. **Quest Progress**: Quest progress is updated based on the event
7. **Reward Distribution**: Rewards are distributed for completed achievements and quests
8. **Notification**: Users are notified of new achievements and rewards

### 7.3 Service Orchestration

The `EventsService` orchestrates the processing pipeline:

```typescript
@Injectable()
export class EventsService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly rulesService: RulesService,
    private readonly achievementsService: AchievementsService,
    private readonly rewardsService: RewardsService,
    private readonly questsService: QuestsService,
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
  ) {}

  async processEvent(event: ProcessEventDto): Promise<any> {
    try {
      // Log event processing start
      this.loggerService.log(`Processing event: ${event.type} for user: ${event.userId}`);

      // Get or create user profile
      const profile = await this.profilesService.getOrCreateProfile(event.userId);

      // Process event through rules engine
      const ruleResults = await this.rulesService.processEvent(event, profile);

      // Update achievements based on rule results
      const achievementResults = await this.achievementsService.processAchievements(
        event.userId,
        ruleResults,
      );

      // Distribute rewards for unlocked achievements
      if (achievementResults.unlockedAchievements.length > 0) {
        await this.rewardsService.distributeRewards(
          event.userId,
          achievementResults.unlockedAchievements,
        );
      }

      // Update quest progress
      const questResults = await this.questsService.updateQuestProgress(
        event.userId,
        event,
      );

      // Log successful processing
      this.loggerService.log(
        `Successfully processed event: ${event.type} for user: ${event.userId}`,
        {
          points: ruleResults.pointsAwarded,
          achievements: achievementResults.unlockedAchievements.length,
          quests: questResults.completedQuests.length,
        },
      );

      return {
        success: true,
        pointsAwarded: ruleResults.pointsAwarded,
        unlockedAchievements: achievementResults.unlockedAchievements,
        completedQuests: questResults.completedQuests,
      };
    } catch (error) {
      // Log error and rethrow
      this.loggerService.error(
        `Error processing event: ${event.type} for user: ${event.userId}`,
        error,
      );
      throw error;
    }
  }
}
```

## 8. Retry and Error Handling

Robust error handling ensures reliable event processing even in the face of failures.

### 8.1 Retry Mechanisms

The system implements several retry mechanisms:

1. **Exponential Backoff**: Failed operations are retried with increasing delays
2. **Circuit Breakers**: Prevent cascading failures by temporarily disabling failing operations
3. **Retry Policies**: Different retry strategies for different types of failures

```typescript
/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

/**
 * Default retry policies
 */
export const DEFAULT_RETRY_POLICIES: Record<string, RetryPolicy> = {
  database: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2,
    retryableErrors: ['PrismaClientKnownRequestError', 'PrismaClientRustPanicError'],
  },
  kafka: {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: ['KafkaJSConnectionError', 'KafkaJSRequestTimeoutError'],
  },
  http: {
    maxRetries: 3,
    initialDelay: 200,
    maxDelay: 2000,
    backoffFactor: 2,
    retryableErrors: ['AxiosError', 'FetchError'],
  },
};
```

### 8.2 Dead Letter Queues

Events that cannot be processed after multiple retries are sent to dead letter queues for later analysis and reprocessing:

```typescript
/**
 * Dead letter queue service for handling failed events
 */
@Injectable()
export class DeadLetterQueueService {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Send an event to the dead letter queue
   */
  async sendToDeadLetterQueue(event: IBaseEvent, error: Error): Promise<void> {
    try {
      const dlqTopic = `${event.journey || 'unknown'}.events.dlq`;
      const dlqMessage = {
        originalEvent: event,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        timestamp: new Date().toISOString(),
        retryCount: event['retryCount'] || 0,
      };

      await this.kafkaService.produce(dlqTopic, dlqMessage);
      this.loggerService.log(`Event sent to DLQ: ${dlqTopic}`, {
        eventType: event.type,
        userId: event.userId,
        error: error.message,
      });
    } catch (dlqError) {
      this.loggerService.error(
        `Failed to send event to DLQ: ${dlqError.message}`,
        {
          originalError: error.message,
          eventType: event.type,
          userId: event.userId,
        },
      );
    }
  }

  /**
   * Reprocess events from the dead letter queue
   */
  async reprocessDeadLetterQueue(
    dlqTopic: string,
    processingFunction: (event: IBaseEvent) => Promise<any>,
    batchSize: number = 100,
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    // Implementation details for reprocessing events from DLQ
    // ...
  }
}
```

### 8.3 Error Classification

Errors are classified to determine appropriate handling strategies:

```typescript
/**
 * Error categories for gamification events
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  BUSINESS_RULE = 'BUSINESS_RULE',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  AUTHORIZATION = 'AUTHORIZATION',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classify an error into a category
 */
export function classifyError(error: Error): ErrorCategory {
  if (error instanceof ValidationError) {
    return ErrorCategory.VALIDATION;
  }
  if (error instanceof BusinessRuleError) {
    return ErrorCategory.BUSINESS_RULE;
  }
  if (error instanceof PrismaClientError) {
    return ErrorCategory.DATABASE;
  }
  if (error instanceof KafkaJSError || error instanceof AxiosError) {
    return ErrorCategory.NETWORK;
  }
  if (error instanceof UnauthorizedException) {
    return ErrorCategory.AUTHORIZATION;
  }
  if (error instanceof InternalServerErrorException) {
    return ErrorCategory.INTERNAL;
  }
  return ErrorCategory.UNKNOWN;
}
```

## 9. Monitoring and Observability

Comprehensive monitoring ensures visibility into the event processing pipeline.

### 9.1 Metrics

Key metrics are collected to monitor system health and performance:

- **Event Volume**: Number of events processed per journey
- **Processing Time**: Time taken to process events
- **Error Rate**: Percentage of events that fail processing
- **Retry Count**: Number of retries per event
- **DLQ Size**: Number of events in dead letter queues

### 9.2 Logging

Structured logging provides detailed information about event processing:

```typescript
/**
 * Log event processing
 */
logEventProcessing(event: IBaseEvent, result: any): void {
  this.loggerService.log('Event processed', {
    eventId: event.id,
    eventType: event.type,
    userId: event.userId,
    journey: event.journey,
    processingTime: result.processingTime,
    pointsAwarded: result.pointsAwarded,
    achievementsUnlocked: result.unlockedAchievements?.length || 0,
    questsCompleted: result.completedQuests?.length || 0,
  });
}

/**
 * Log event processing error
 */
logEventError(event: IBaseEvent, error: Error): void {
  this.loggerService.error('Event processing failed', {
    eventId: event.id,
    eventType: event.type,
    userId: event.userId,
    journey: event.journey,
    errorMessage: error.message,
    errorStack: error.stack,
    errorCategory: classifyError(error),
  });
}
```

### 9.3 Alerting

Alerts are configured for critical issues:

- **High Error Rate**: Alert when error rate exceeds threshold
- **DLQ Growth**: Alert when dead letter queues grow rapidly
- **Processing Delays**: Alert when event processing time exceeds threshold
- **Service Degradation**: Alert when event processing capacity decreases

### 9.4 Dashboards

Dashboards provide real-time visibility into the event processing pipeline:

- **Event Flow**: Visualization of event flow through the system
- **Journey Metrics**: Event volume and success rate by journey
- **Error Analysis**: Breakdown of errors by category and type
- **User Impact**: Number of users affected by processing issues

---

## 10. Integration Guide

This section provides guidance for developers integrating with the gamification event system.

### 10.1 Producing Events

Services that need to emit gamification events should follow these steps:

1. **Import Required Interfaces**:

```typescript
import { 
  IBaseEvent, 
  HealthEventType, // or CareEventType, PlanEventType
  IHealthEventPayload // or ICareEventPayload, IPlanEventPayload
} from '@austa/interfaces/gamification';
```

2. **Create Event Object**:

```typescript
const event: IBaseEvent = {
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: user.id,
  timestamp: new Date(),
  journey: 'health',
  data: {
    metricType: MetricType.HEART_RATE,
    value: 75,
    unit: 'bpm',
    source: MetricSource.WEARABLE
  }
};
```

3. **Send Event**:

Using HTTP:

```typescript
await axios.post('https://api.austa.health/gamification/events', event, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

Using Kafka:

```typescript
await kafkaService.produce('health.events', event);
```

### 10.2 Consuming Achievement Notifications

Frontend applications can subscribe to achievement notifications:

```typescript
// React hook example
function useAchievementNotifications(userId: string) {
  const [achievements, setAchievements] = useState<IAchievement[]>([]);

  useEffect(() => {
    const socket = io('https://api.austa.health/notifications');
    
    socket.on('connect', () => {
      socket.emit('subscribe', { userId, channel: 'achievements' });
    });
    
    socket.on('achievement', (achievement: IAchievement) => {
      setAchievements(prev => [...prev, achievement]);
      // Show notification to user
      showAchievementNotification(achievement);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [userId]);
  
  return achievements;
}
```

### 10.3 Testing Event Integration

Use the provided test utilities to verify event integration:

```typescript
import { createTestEvent, mockGamificationResponse } from '@austa/testing/gamification';

describe('Gamification Integration', () => {
  it('should emit event when health metric is recorded', async () => {
    // Arrange
    const mockKafkaService = {
      produce: jest.fn().mockResolvedValue(undefined)
    };
    const service = new HealthMetricService(mockKafkaService);
    const metric = { type: MetricType.WEIGHT, value: 70, unit: 'kg' };
    
    // Act
    await service.recordMetric('user-123', metric);
    
    // Assert
    expect(mockKafkaService.produce).toHaveBeenCalledWith(
      'health.events',
      expect.objectContaining({
        type: HealthEventType.HEALTH_METRIC_RECORDED,
        userId: 'user-123',
        journey: 'health',
        data: expect.objectContaining(metric)
      })
    );
  });
});
```

### 10.4 Troubleshooting

Common issues and their solutions:

1. **Events Not Processing**:
   - Verify event schema matches expected format
   - Check Kafka topic configuration
   - Ensure user ID exists in the system

2. **No Points Awarded**:
   - Verify rules are configured for the event type
   - Check rule conditions match event data
   - Ensure user has not already received points for this action

3. **Missing Achievements**:
   - Verify achievement criteria are correctly configured
   - Check achievement is active and not expired
   - Ensure prerequisites are met

## Conclusion

The AUSTA SuperApp gamification event schema provides a robust foundation for the cross-journey achievement system. By standardizing event formats, implementing comprehensive validation, and ensuring reliable processing, the system delivers a consistent and engaging gamification experience to users across all journeys.

Developers should follow these guidelines when producing or consuming gamification events to ensure compatibility with the event processing pipeline and maintain the integrity of the gamification system.