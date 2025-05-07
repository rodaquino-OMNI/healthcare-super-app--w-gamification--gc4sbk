# Gamification Engine Service

## Overview

The Gamification Engine is a core service in the AUSTA SuperApp that processes user events from all journeys, tracks achievements, and manages rewards to drive user engagement. It serves as a cross-cutting engagement layer that enhances the user experience across the Health, Care, and Plan journeys.

## Table of Contents

- [Architecture](#architecture)
- [Key Components](#key-components)
- [Event Processing Pipeline](#event-processing-pipeline)
- [Standardized Event Schema](#standardized-event-schema)
- [Journey-Specific Event Handling](#journey-specific-event-handling)
- [Redis Integration](#redis-integration)
- [Kafka Consumer Configuration](#kafka-consumer-configuration)
- [Local Development Setup](#local-development-setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment Guidelines](#deployment-guidelines)
- [Contribution Guidelines](#contribution-guidelines)

## Architecture

The Gamification Engine follows an event-driven architecture that processes events from all journeys in the AUSTA SuperApp. It is built using NestJS and integrates with Kafka for event processing and Redis for real-time leaderboards.

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Health Journey  │     │   Care Journey   │     │   Plan Journey   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                        │                        │
         │                        │                        │
         │                        ▼                        │
         │               ┌─────────────────┐               │
         └──────────────►│      Kafka      │◄──────────────┘
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Event Consumers │
                         └────────┬────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Gamification Engine                    │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Achievement │  │    Rules    │  │     Rewards     │  │
│  │  Processor  │  │   Engine    │  │    Manager      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Quests    │  │   Profile   │  │   Leaderboard   │  │
│  │   Manager   │  │   Manager   │  │     Service     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                                                         │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      Redis      │
                    └─────────────────┘
```

## Key Components

The Gamification Engine consists of several key components:

### 1. Event Consumers

Kafka consumers that process events from all journeys. These consumers are configured with dead-letter queues and exponential backoff retry strategies for reliable event processing.

### 2. Achievement Processor

Processes events against achievement criteria and awards achievements to users when conditions are met.

### 3. Rules Engine

Defines and evaluates rules for achievements, quests, and rewards based on user actions and events.

### 4. Rewards Manager

Manages the rewards system, including reward definitions, issuance, and redemption.

### 5. Quests Manager

Handles quest definitions, progress tracking, and completion.

### 6. Profile Manager

Manages user gamification profiles, including points, levels, and achievement history.

### 7. Leaderboard Service

Implements leaderboards using Redis Sorted Sets for efficient real-time ranking.

## Event Processing Pipeline

The event processing pipeline follows these steps:

1. **Event Publication**: Journey services publish events to Kafka topics when users complete actions.
2. **Event Consumption**: Kafka consumers in the Gamification Engine consume events from topics.
3. **Event Validation**: Events are validated against the standardized event schema.
4. **Rule Evaluation**: The Rules Engine evaluates events against achievement and quest rules.
5. **Achievement Processing**: If rules are satisfied, achievements are awarded to users.
6. **Profile Update**: User profiles are updated with new achievements, points, and levels.
7. **Notification**: Achievement notifications are sent to users via the Notification Service.

## Standardized Event Schema

All events processed by the Gamification Engine follow a standardized schema defined in the `@austa/interfaces` package. This ensures type safety and consistency across all journeys.

### Event Structure

```typescript
interface GamificationEvent<T extends EventPayload = any> {
  id: string;                 // Unique event ID
  type: EventType;            // Event type (enum)
  journey: JourneyType;       // Source journey (health, care, plan)
  userId: string;             // User who triggered the event
  timestamp: string;          // ISO timestamp when event occurred
  version: string;            // Schema version for backward compatibility
  payload: T;                 // Journey-specific event payload
  metadata?: Record<string, any>; // Optional additional context
}

enum EventType {
  // Health Journey Events
  HEALTH_METRIC_RECORDED = 'health.metric.recorded',
  HEALTH_GOAL_ACHIEVED = 'health.goal.achieved',
  DEVICE_CONNECTED = 'health.device.connected',
  
  // Care Journey Events
  APPOINTMENT_SCHEDULED = 'care.appointment.scheduled',
  MEDICATION_TRACKED = 'care.medication.tracked',
  TELEMEDICINE_COMPLETED = 'care.telemedicine.completed',
  
  // Plan Journey Events
  CLAIM_SUBMITTED = 'plan.claim.submitted',
  BENEFIT_USED = 'plan.benefit.used',
  PLAN_SELECTED = 'plan.plan.selected'
}

enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}
```

### Event Versioning

The event schema includes a `version` field to support backward compatibility as the schema evolves. The versioning follows semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking changes that require consumer updates
- MINOR: New fields or event types (backward compatible)
- PATCH: Bug fixes or documentation updates

### Event Validation

All events are validated using Zod schemas to ensure they conform to the expected structure:

```typescript
const EventSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(EventType),
  journey: z.nativeEnum(JourneyType),
  userId: z.string().uuid(),
  timestamp: z.string().datetime(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  payload: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
});
```

Events that fail validation are rejected and sent to a dead-letter queue for analysis.

## Journey-Specific Event Handling

The Gamification Engine processes events from all three journeys, each with its own specific event types and payloads. The implementation uses a factory pattern to route events to journey-specific handlers.

### Health Journey Events

Health journey events track user health activities and achievements:

- **Health Metric Recorded**: When users record health metrics like steps, weight, or blood pressure
  ```typescript
  interface HealthMetricRecordedPayload {
    metricType: 'steps' | 'weight' | 'bloodPressure' | 'heartRate' | 'sleep' | 'calories';
    value: number;
    unit: string;
    timestamp: string;
    source?: 'manual' | 'device' | 'integration';
    deviceId?: string;
  }
  ```

- **Health Goal Achieved**: When users reach health goals like step count or weight targets
  ```typescript
  interface HealthGoalAchievedPayload {
    goalId: string;
    goalType: 'steps' | 'weight' | 'activity' | 'nutrition' | 'sleep';
    targetValue: number;
    actualValue: number;
    completedAt: string;
  }
  ```

- **Device Connected**: When users connect wearable devices to the platform
  ```typescript
  interface DeviceConnectedPayload {
    deviceId: string;
    deviceType: 'fitbit' | 'apple_health' | 'google_fit' | 'samsung_health' | 'garmin';
    connectionTime: string;
    metadata?: Record<string, any>;
  }
  ```

### Care Journey Events

Care journey events track user interactions with healthcare providers and treatment plans:

- **Appointment Scheduled**: When users schedule medical appointments
  ```typescript
  interface AppointmentScheduledPayload {
    appointmentId: string;
    providerId: string;
    specialtyType: string;
    scheduledTime: string;
    isFirstVisit: boolean;
    isTelemedicine: boolean;
  }
  ```

- **Medication Tracked**: When users track medication adherence
  ```typescript
  interface MedicationTrackedPayload {
    medicationId: string;
    medicationName: string;
    dosage: string;
    adherenceType: 'taken' | 'skipped' | 'delayed';
    scheduledTime: string;
    actualTime: string;
    streak: number;
  }
  ```

- **Telemedicine Completed**: When users complete telemedicine sessions
  ```typescript
  interface TelemedicineCompletedPayload {
    sessionId: string;
    providerId: string;
    duration: number; // in minutes
    scheduledTime: string;
    completedTime: string;
    rating?: number; // 1-5 rating if provided
  }
  ```

### Plan Journey Events

Plan journey events track user interactions with insurance plans and benefits:

- **Claim Submitted**: When users submit insurance claims
  ```typescript
  interface ClaimSubmittedPayload {
    claimId: string;
    planId: string;
    serviceType: string;
    providerName: string;
    serviceDate: string;
    amount: number;
    hasDocumentation: boolean;
    isFirstClaim: boolean;
  }
  ```

- **Benefit Used**: When users utilize insurance benefits
  ```typescript
  interface BenefitUsedPayload {
    benefitId: string;
    benefitType: string;
    usageDate: string;
    provider?: string;
    savingsAmount?: number;
    isPreventiveCare?: boolean;
  }
  ```

- **Plan Selected**: When users select or change insurance plans
  ```typescript
  interface PlanSelectedPayload {
    planId: string;
    planType: 'individual' | 'family';
    coverageLevel: 'basic' | 'standard' | 'premium';
    annualCost: number;
    isNewEnrollment: boolean;
    previousPlanId?: string;
    effectiveDate: string;
  }
  ```

### Event Routing and Processing

Events are routed to journey-specific processors using a factory pattern:

```typescript
@Injectable()
export class EventProcessorFactory {
  constructor(
    private readonly healthEventProcessor: HealthEventProcessor,
    private readonly careEventProcessor: CareEventProcessor,
    private readonly planEventProcessor: PlanEventProcessor,
  ) {}

  getProcessorForEvent(event: GamificationEvent): EventProcessor {
    switch (event.journey) {
      case JourneyType.HEALTH:
        return this.healthEventProcessor;
      case JourneyType.CARE:
        return this.careEventProcessor;
      case JourneyType.PLAN:
        return this.planEventProcessor;
      default:
        throw new Error(`Unknown journey type: ${event.journey}`);
    }
  }
}
```

Each journey-specific processor implements custom logic for handling events from that journey, while sharing common achievement processing infrastructure.

## Redis Integration

The Gamification Engine uses Redis for several key functions:

### Leaderboard Implementation with Sorted Sets

Redis Sorted Sets are used to implement efficient leaderboards with the following features:

- Real-time ranking updates with O(log(N)) complexity
- Journey-specific leaderboards (separate sorted sets for each journey)
- Time-based leaderboards (daily, weekly, monthly) with automatic expiration
- Efficient range queries for pagination with ZRANGE commands
- Atomic score updates to prevent race conditions

Example implementation:

```typescript
// Add or update user score in leaderboard
async updateLeaderboard(userId: string, score: number, journeyType: JourneyType): Promise<void> {
  const key = `leaderboard:${journeyType}:${this.getCurrentPeriod()}`;
  await this.redisClient.zadd(key, score, userId);
  
  // Set expiration for time-based leaderboards
  if (this.isPeriodic(journeyType)) {
    await this.redisClient.expire(key, this.getExpirationSeconds(journeyType));
  }
}

// Get top N users from leaderboard
async getTopUsers(journeyType: JourneyType, limit: number = 10): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${journeyType}:${this.getCurrentPeriod()}`;
  const results = await this.redisClient.zrevrange(key, 0, limit - 1, 'WITHSCORES');
  
  // Process and return formatted leaderboard entries
  return this.formatLeaderboardResults(results);
}
```

### Caching with Resilience Patterns

Redis is also used for caching frequently accessed data with improved resilience:

- User achievement status with TTL-based cache invalidation
- Current point totals with write-through caching to ensure consistency
- Active quests with cache-aside pattern for efficient lookups
- Recently earned rewards with automatic expiration

The caching implementation includes:

- Circuit breaker pattern for Redis connection failures
- Fallback to database when Redis is unavailable
- Bulk operations for improved performance
- Pipelining for reduced network overhead

## Kafka Consumer Configuration

The Gamification Engine uses Kafka.js for event consumption with an enhanced configuration for reliability and performance:

### Consumer Groups

Consumers are organized into groups based on event types to enable parallel processing:

- `gamification-achievements-group`: Processes achievement-related events
- `gamification-quests-group`: Processes quest-related events
- `gamification-rewards-group`: Processes reward-related events

Each consumer group is configured with:

```typescript
const consumerConfig: ConsumerConfig = {
  groupId: 'gamification-achievements-group',
  clientId: `gamification-achievements-${hostname()}`,
  partitionAssigners: [Assigners.roundRobin],
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576, // 1MB
  maxWaitTimeInMs: 500,
  retry: {
    initialRetryTime: 1000,
    retries: 5
  }
};
```

### Enhanced Retry Strategy

Kafka consumers are configured with an exponential backoff retry strategy with improved error classification:

- Initial retry after 1 second
- Exponential increase in retry intervals (1s, 2s, 4s, 8s, 16s)
- Maximum of 5 retries before sending to dead-letter queue
- Error classification to determine if retry is appropriate:
  - Transient errors (network, timeout): Retry with backoff
  - Permanent errors (validation, business logic): Send directly to DLQ
  - Infrastructure errors (database): Pause consumer and alert

Implementation example:

```typescript
async processEvent(event: GamificationEvent): Promise<void> {
  try {
    await this.validateEvent(event);
    await this.processEventByType(event);
    await this.markEventProcessed(event.id);
  } catch (error) {
    const errorType = this.classifyError(error);
    
    if (errorType === ErrorType.TRANSIENT) {
      throw new RetriableError(error.message);
    } else if (errorType === ErrorType.PERMANENT) {
      await this.sendToDLQ(event, error);
    } else if (errorType === ErrorType.INFRASTRUCTURE) {
      await this.pauseConsumerAndAlert(error);
      throw error;
    }
  }
}
```

### Dead-Letter Queue with Enhanced Monitoring

Events that fail processing after all retries are sent to a dead-letter queue with additional context:

- Original event data
- Error details and stack trace
- Processing history (timestamps of each attempt)
- Metadata for debugging (consumer ID, partition, offset)

The DLQ implementation includes:

- Monitoring and alerting for DLQ message volume
- Admin UI for viewing and reprocessing DLQ messages
- Automatic retry scheduling for specific error types
- Batch reprocessing capabilities for related failures

### Partition Assignment Strategy

The consumer uses a round-robin partition assignment strategy to ensure even distribution of processing load across consumer instances, with sticky partition assignment for related events to maintain processing order when needed.

## Local Development Setup

Follow these steps to set up the Gamification Engine for local development:

### Prerequisites

- Node.js (v18.0.0 or higher)
- Docker and Docker Compose
- PostgreSQL (v14 or higher)
- Redis (v7 or higher)
- Kafka (v7.0.1 or higher)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/austa/superapp.git
cd superapp/src/backend/gamification-engine
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. Start required services using Docker Compose:

```bash
docker-compose up -d
```

5. Run database migrations:

```bash
npm run prisma:migrate
```

6. Seed the database with initial data:

```bash
npm run seed
```

7. Start the development server:

```bash
npm run start:dev
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

The Gamification Engine exposes the following APIs:

### REST Endpoints

- `GET /achievements`: Get all available achievements
- `GET /achievements/:id`: Get achievement details
- `GET /users/:userId/achievements`: Get user achievements
- `GET /leaderboard`: Get global leaderboard
- `GET /leaderboard/:journeyType`: Get journey-specific leaderboard
- `GET /users/:userId/profile`: Get user gamification profile
- `GET /quests`: Get all available quests
- `GET /users/:userId/quests`: Get user quests
- `GET /rewards`: Get all available rewards
- `GET /users/:userId/rewards`: Get user rewards

### GraphQL API

The Gamification Engine also exposes a GraphQL API at `/graphql` with the following queries and mutations:

```graphql
type Query {
  achievements: [Achievement!]!
  achievement(id: ID!): Achievement
  userAchievements(userId: ID!): [UserAchievement!]!
  leaderboard(journeyType: JourneyType, limit: Int, offset: Int): [LeaderboardEntry!]!
  userProfile(userId: ID!): UserProfile
  quests: [Quest!]!
  userQuests(userId: ID!): [UserQuest!]!
  rewards: [Reward!]!
  userRewards(userId: ID!): [UserReward!]!
}

type Mutation {
  redeemReward(userId: ID!, rewardId: ID!): UserReward
  startQuest(userId: ID!, questId: ID!): UserQuest
  processEvent(event: EventInput!): Boolean
}
```

## Database Schema

The Gamification Engine uses PostgreSQL with Prisma ORM. The main entities in the database schema are:

### Achievements

Stores achievement definitions and criteria:

- `id`: Unique identifier
- `name`: Achievement name
- `description`: Achievement description
- `journeyType`: Associated journey (health, care, plan, or cross-journey)
- `points`: Points awarded for earning the achievement
- `criteria`: JSON object defining the conditions for earning the achievement
- `icon`: Icon URL
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### UserAchievements

Tracks achievements earned by users:

- `id`: Unique identifier
- `userId`: User ID
- `achievementId`: Achievement ID
- `earnedAt`: Timestamp when the achievement was earned
- `metadata`: Additional context about how the achievement was earned

### Quests

Defines quests (series of tasks) for users to complete:

- `id`: Unique identifier
- `name`: Quest name
- `description`: Quest description
- `journeyType`: Associated journey
- `tasks`: JSON array of tasks to complete
- `rewards`: Rewards for completing the quest
- `startDate`: Quest availability start date
- `endDate`: Quest availability end date
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### UserQuests

Tracks user progress on quests:

- `id`: Unique identifier
- `userId`: User ID
- `questId`: Quest ID
- `progress`: JSON object tracking progress on each task
- `startedAt`: When the user started the quest
- `completedAt`: When the user completed the quest (null if incomplete)

### Rewards

Defines available rewards:

- `id`: Unique identifier
- `name`: Reward name
- `description`: Reward description
- `type`: Reward type (discount, badge, feature unlock, etc.)
- `value`: Reward value or details
- `cost`: Point cost to redeem
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### UserRewards

Tracks rewards earned or redeemed by users:

- `id`: Unique identifier
- `userId`: User ID
- `rewardId`: Reward ID
- `earnedAt`: When the reward was earned
- `redeemedAt`: When the reward was redeemed (null if not redeemed)
- `expiresAt`: When the reward expires (null if no expiration)

### UserProfiles

Stores user gamification profiles:

- `id`: Unique identifier (same as user ID)
- `points`: Total points earned
- `level`: Current user level
- `healthPoints`: Points earned in health journey
- `carePoints`: Points earned in care journey
- `planPoints`: Points earned in plan journey
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Events

Logs processed events for auditing and debugging:

- `id`: Unique identifier
- `type`: Event type
- `journey`: Source journey
- `userId`: User ID
- `timestamp`: When the event occurred
- `payload`: Event payload (JSON)
- `processedAt`: When the event was processed
- `status`: Processing status (success, failure, retry)

## Deployment Guidelines

The Gamification Engine is deployed as a containerized microservice in Kubernetes.

### Container Configuration

The service is containerized using Docker with the following configuration:

- Base image: Node.js 18 Alpine
- Exposed port: 3000
- Health check endpoint: `/health`
- Readiness probe: `/ready`

### Resource Requirements

- CPU: 1 core (minimum), 2 cores (recommended)
- Memory: 1GB (minimum), 2GB (recommended)
- Storage: 1GB for application, plus database storage

### Environment Variables

The following environment variables must be configured:

```
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Redis
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-password

# Kafka
KAFKA_BROKERS=kafka-broker:9092
KAFKA_CLIENT_ID=gamification-engine
KAFKA_GROUP_ID=gamification-group

# Service
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=3600
```

### Scaling Considerations

The Gamification Engine is designed to scale horizontally. Consider the following scaling parameters:

- Kafka consumer instances should scale based on event volume
- Database connection pooling should be configured appropriately
- Redis connection limits should be set based on instance size

## Contribution Guidelines

### Code Style and Standards

This project follows the AUSTA SuperApp coding standards:

- Use TypeScript for all new code
- Follow the NestJS module structure
- Use Prisma for database access
- Write unit tests for all new functionality
- Document all public APIs and interfaces

### Development Workflow

1. Create a feature branch from `develop`
2. Implement your changes with appropriate tests
3. Ensure all tests pass locally
4. Submit a pull request to `develop`
5. Address any code review feedback

### Journey-Specific Development

When implementing features related to specific journeys, follow these guidelines:

#### Health Journey

- Use the `health` namespace for event types
- Implement health-specific achievement criteria
- Consider integration with health metrics and goals

#### Care Journey

- Use the `care` namespace for event types
- Implement care-specific achievement criteria
- Consider integration with appointments and medication tracking

#### Plan Journey

- Use the `plan` namespace for event types
- Implement plan-specific achievement criteria
- Consider integration with claims and benefits

### Testing Requirements

- Unit tests for all services and controllers
- Integration tests for database and Redis interactions
- E2E tests for API endpoints
- Event processing tests with mock Kafka events

### Documentation Requirements

- Update this README.md with any new features or changes
- Document all new APIs in the API documentation section
- Update database schema documentation for any schema changes
- Add inline code documentation for complex logic