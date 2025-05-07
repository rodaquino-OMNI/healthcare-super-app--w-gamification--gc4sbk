# Health Service

## Overview

The Health Service is a core microservice within the AUSTA SuperApp's "Minha Saúde" (My Health) journey. It is responsible for managing all health-related data and functionality, providing a comprehensive platform for users to track their health metrics, set goals, connect wearable devices, and receive personalized insights.

### Core Responsibilities

- Storing and retrieving user health metrics (heart rate, blood pressure, sleep data, etc.)
- Managing medical history and health events
- Integrating with wearable devices (Apple HealthKit, Google Fit, Fitbit, etc.)
- Generating personalized health insights and trends
- Supporting health goal tracking and progress monitoring
- Publishing gamification events upon reaching health milestones
- Enforcing data privacy and security for sensitive health information

## Architecture

The Health Service is built using NestJS and follows a modular architecture with clear separation of concerns:

### Key Components

- **Health Module**: Core functionality for managing health metrics and goals
- **Devices Module**: Handles wearable device connections and data synchronization
- **Insights Module**: Generates personalized health insights and trends
- **Integrations**:
  - **FHIR Integration**: Connects to external EHR systems via HL7 FHIR standard
  - **Wearables Integration**: Interfaces with various wearable device platforms

### Database Integration

The service uses an enhanced PrismaService for database operations with the following improvements:

- **Connection Pooling**: Optimized database connections with configurable pool size and timeout settings to prevent connection exhaustion during high traffic
- **Journey-Specific Database Contexts**: Dedicated database contexts for health journey operations that isolate queries and improve performance
- **TimescaleDB Integration**: Specialized time-series storage for efficient health metrics data with automatic partitioning and aggregation
- **Transaction Management**: Robust transaction handling across related operations with proper rollback mechanisms
- **Query Optimization**: Automatic query optimization for time-series data with specialized indices

```typescript
// Example of using the enhanced PrismaService with connection pooling
const healthMetrics = await this.prismaService.withHealthContext(async (prisma) => {
  return prisma.healthMetric.findMany({
    where: { userId, timestamp: { gte: startDate, lte: endDate } },
    orderBy: { timestamp: 'desc' }
  });
});

// Example of transaction management with the enhanced PrismaService
const result = await this.prismaService.withHealthContext(async (prisma) => {
  return prisma.$transaction(async (tx) => {
    // Create health metric
    const metric = await tx.healthMetric.create({ data: metricData });
    
    // Update related health goal
    const goal = await tx.healthGoal.update({
      where: { id: goalId },
      data: { currentValue: { increment: metricValue } }
    });
    
    return { metric, goal };
  }, {
    maxWait: 5000, // Maximum time to wait for transaction to start
    timeout: 10000, // Maximum time for the transaction to complete
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted // Isolation level
  });
});
```

#### Connection Pool Configuration

The enhanced PrismaService configures connection pooling based on environment variables:

```typescript
const connectionPoolConfig = {
  min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
  max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
  idle: parseInt(process.env.DATABASE_POOL_IDLE || '10000'),
  acquire: parseInt(process.env.DATABASE_POOL_ACQUIRE || '30000'),
  evict: parseInt(process.env.DATABASE_POOL_EVICT || '1000'),
};

// PrismaService initialization with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
  __internal: {
    engine: {
      connectionPoolConfig,
    },
  },
});
```

### Error Handling

The service implements a comprehensive error handling framework:

- **Error Classification**: Structured error types specific to health domain with standardized error codes
- **Retry Mechanisms**: Configurable retry policies with exponential backoff for transient failures
- **Circuit Breaker Pattern**: Prevents cascading failures when external systems are unavailable
- **Detailed Error Logging**: Enhanced error context for troubleshooting with correlation IDs
- **Error Propagation**: Consistent error propagation across service boundaries
- **Client-Friendly Errors**: Transformation of technical errors into user-friendly messages

#### Error Types

The service uses a standardized set of error types:

```typescript
enum ErrorType {
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  
  // Health-specific errors
  HEALTH_METRIC_INVALID = 'HEALTH_METRIC_INVALID',
  HEALTH_GOAL_INVALID = 'HEALTH_GOAL_INVALID',
  DEVICE_CONNECTION_ERROR = 'DEVICE_CONNECTION_ERROR',
  DEVICE_SYNC_ERROR = 'DEVICE_SYNC_ERROR',
  FHIR_INTEGRATION_ERROR = 'FHIR_INTEGRATION_ERROR'
}
```

#### Retry Service

The service includes a configurable retry service for handling transient failures:

```typescript
// Example of error handling with retry mechanism
try {
  return await this.retryService.executeWithRetry(
    () => this.fhirAdapter.getPatientRecord(patientId),
    {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      baseDelay: 300, // ms
      maxDelay: 5000, // ms
      retryableErrors: [
        ErrorType.EXTERNAL_SERVICE_UNAVAILABLE,
        ErrorType.EXTERNAL_SERVICE_TIMEOUT
      ]
    }
  );
} catch (error) {
  this.logger.error('Failed to retrieve patient record', { 
    patientId, 
    error,
    correlationId: this.tracingService.getCurrentTraceId()
  });
  throw new AppException(
    ErrorType.EXTERNAL_SERVICE_ERROR,
    'Failed to retrieve patient record',
    error,
    { patientId }
  );
}
```

#### Circuit Breaker Implementation

The service uses a circuit breaker pattern to prevent cascading failures:

```typescript
// Circuit breaker configuration
const circuitBreakerOptions = {
  failureThreshold: 0.5, // 50% failure rate triggers open circuit
  resetTimeout: 30000, // 30 seconds before attempting to close circuit
  rollingCountTimeout: 10000, // 10-second rolling window for failure rate calculation
  rollingCountBuckets: 10 // Split the rolling window into 10 buckets
};

// Example usage with FHIR integration
const patientRecord = await this.circuitBreakerService.execute(
  'fhir-patient-record',
  () => this.fhirAdapter.getPatientRecord(patientId),
  circuitBreakerOptions
);
```

#### Error Handling Middleware

The service uses a global exception filter to standardize error responses:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const errorResponse = this.createErrorResponse(exception);
    
    this.loggerService.error('Request error', {
      path: request.url,
      method: request.method,
      error: exception,
      correlationId: this.tracingService.getCurrentTraceId()
    });
    
    response
      .status(errorResponse.statusCode)
      .json(errorResponse);
  }
  
  private createErrorResponse(exception: unknown): ErrorResponse {
    // Transform different error types into standardized response
    // ...
  }
}
```

### Integration with @austa/interfaces

The service leverages the shared `@austa/interfaces` package for type-safe data models:

- **FHIR Resources**: Type-safe interfaces for Patient, Observation, and other FHIR resources
- **Health Metrics**: Standardized data models for various health metrics
- **Device Integration**: Common interfaces for wearable device data
- **Event Schemas**: Type-safe event definitions for cross-service communication
- **API Contracts**: Shared DTOs for request/response payloads

#### FHIR Resource Interfaces

```typescript
// Example of using @austa/interfaces for type-safe FHIR resources
import { FHIRPatient, FHIRObservation } from '@austa/interfaces/health';

async getPatientData(patientId: string): Promise<{
  patient: FHIRPatient;
  observations: FHIRObservation[];
}> {
  const patient = await this.fhirService.getPatient(patientId);
  const observations = await this.fhirService.getObservations(patientId);
  return { patient, observations };
}
```

#### Health Metric Interfaces

```typescript
// Using shared interfaces for health metrics
import { HealthMetricDto, MetricType, MetricSource } from '@austa/interfaces/health';

@Post('/health/:recordId')
async createHealthMetric(
  @Param('recordId') recordId: string,
  @Body() metricDto: HealthMetricDto
): Promise<HealthMetricDto> {
  return this.healthService.createMetric(recordId, metricDto);
}
```

#### Event Schema Interfaces

```typescript
// Using shared event schemas for Kafka messages
import { HealthMetricCreatedEvent, HealthGoalAchievedEvent } from '@austa/interfaces/events';

// Publishing a strongly-typed event
async publishMetricCreatedEvent(metric: HealthMetric): Promise<void> {
  const event: HealthMetricCreatedEvent = {
    eventType: 'health.metric.created',
    payload: {
      userId: metric.userId,
      metricId: metric.id,
      metricType: metric.type,
      timestamp: metric.timestamp
    },
    metadata: {
      correlationId: this.tracingService.getCurrentTraceId(),
      timestamp: new Date().toISOString()
    }
  };
  
  await this.kafkaService.publish('austa.health.metrics', event);
}
```

#### Device Integration Interfaces

```typescript
// Using shared interfaces for device integration
import { DeviceConnectionDto, DeviceType } from '@austa/interfaces/devices';

@Post('/records/:recordId/devices')
async connectDevice(
  @Param('recordId') recordId: string,
  @Body() connectionDto: DeviceConnectionDto
): Promise<DeviceConnectionDto> {
  return this.devicesService.connectDevice(recordId, connectionDto);
}
```

## API Endpoints

All endpoints are protected by JWT authentication and include standardized error handling.

### Health Metrics

- `POST /health/:recordId` - Create a new health metric
  - Request: `CreateMetricDto` with type, value, unit, timestamp, source
  - Response: Created `HealthMetricDto` with id and metadata
  - Error Handling: Validates input, handles database errors, returns appropriate status codes

- `PUT /health/:id` - Update an existing health metric
  - Request: `UpdateMetricDto` with optional value, unit, notes
  - Response: Updated `HealthMetricDto`
  - Error Handling: Validates existence, handles concurrency issues

- `GET /health/:recordId` - Get health metrics for a record
  - Query Parameters: `FilterDto` with pagination, sorting, date range
  - Response: Paginated list of `HealthMetricDto` objects
  - Error Handling: Handles not found, permission issues

### Devices

- `POST /records/:recordId/devices` - Connect a new wearable device
  - Request: `ConnectDeviceDto` with deviceType, deviceId
  - Response: `DeviceConnectionDto` with connection status
  - Error Handling: Handles device connection failures with retry

- `GET /records/:recordId/devices` - Get connected devices for a record
  - Query Parameters: `FilterDto` with pagination, filtering by status
  - Response: List of `DeviceConnectionDto` objects
  - Error Handling: Handles not found, permission issues

- `DELETE /records/:recordId/devices/:deviceId` - Disconnect a device
  - Response: Success message
  - Error Handling: Handles device disconnection failures

### Insights

- `GET /insights` - Get personalized health insights
  - Query Parameters: Optional date range, insight types
  - Response: List of `HealthInsightDto` objects
  - Error Handling: Handles insight generation failures

### Health Goals

- `POST /goals` - Create a new health goal
  - Request: `CreateGoalDto` with type, targetValue, period, dates
  - Response: Created `HealthGoalDto` with id and metadata
  - Error Handling: Validates input, handles conflicts with existing goals

- `PUT /goals/:id` - Update a health goal
  - Request: `UpdateGoalDto` with optional targetValue, status
  - Response: Updated `HealthGoalDto`
  - Error Handling: Validates existence, handles status transitions

- `GET /goals` - Get all health goals
  - Query Parameters: `FilterDto` with pagination, filtering by status
  - Response: Paginated list of `HealthGoalDto` objects
  - Error Handling: Handles not found, permission issues

- `DELETE /goals/:id` - Delete a health goal
  - Response: Success message
  - Error Handling: Validates existence, handles deletion failures

## Environment Configuration

The service requires the following environment variables:

### Core Settings

```
NODE_ENV=development
PORT=3002
API_PREFIX=api/v1
```

### Database Configuration

```
DATABASE_URL=postgresql://user:password@localhost:5432/health_db
DATABASE_SSL=false
TIMESCALE_ENABLED=true
```

### FHIR API Integration

```
FHIR_API_ENABLED=true
FHIR_API_URL=https://fhir.example.com/api
FHIR_API_AUTH_TYPE=oauth2
FHIR_API_CLIENT_ID=client_id
FHIR_API_CLIENT_SECRET=client_secret
FHIR_API_SCOPE=patient/*.read
FHIR_API_TOKEN_URL=https://fhir.example.com/oauth/token
```

### Wearables Integration

```
WEARABLES_SYNC_ENABLED=true
WEARABLES_SUPPORTED=googlefit,healthkit,fitbit
GOOGLEFIT_CLIENT_ID=google_client_id
GOOGLEFIT_CLIENT_SECRET=google_client_secret
HEALTHKIT_TEAM_ID=apple_team_id
HEALTHKIT_KEY_ID=apple_key_id
HEALTHKIT_PRIVATE_KEY=apple_private_key
FITBIT_CLIENT_ID=fitbit_client_id
FITBIT_CLIENT_SECRET=fitbit_client_secret
```

### Event Streaming

```
EVENTS_KAFKA_ENABLED=true
EVENTS_KAFKA_BROKERS=localhost:9092
EVENTS_TOPIC_PREFIX=austa
```

### Caching

```
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
```

## Dependencies

The Health Service depends on the following external services:

- **PostgreSQL**: Primary relational database
- **TimescaleDB**: Time-series database extension for PostgreSQL
- **Kafka**: Event streaming platform for publishing health events
- **Auth Service**: User authentication and authorization
- **Redis**: Caching and pub/sub messaging
- **Gamification Engine**: Receives health milestone events
- **EHR Systems**: External medical record systems via HL7 FHIR
- **Wearable Device APIs**: Google Fit, Apple HealthKit, Fitbit
- **Notification Service**: Delivers health-related notifications

### TimescaleDB Integration

The Health Service leverages TimescaleDB for efficient storage and querying of time-series health metrics data:

- **Hypertables**: Automatic partitioning of time-series data for improved query performance
- **Continuous Aggregates**: Pre-computed aggregations for common time-based queries
- **Retention Policies**: Automated data retention and compression for historical metrics
- **Time-Based Functions**: Specialized functions for time-series analysis

```sql
-- Example of TimescaleDB hypertable creation for health metrics
CREATE TABLE health_metrics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  source VARCHAR(50) NOT NULL,
  notes TEXT,
  trend_percentage NUMERIC,
  is_abnormal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('health_metrics', 'timestamp');

-- Create index for efficient user-specific queries
CREATE INDEX idx_health_metrics_user_timestamp ON health_metrics (user_id, timestamp DESC);

-- Create continuous aggregate for daily averages
CREATE MATERIALIZED VIEW health_metrics_daily
WITH (timescaledb.continuous) AS
SELECT 
  user_id,
  type,
  time_bucket('1 day', timestamp) AS day,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  COUNT(*) AS reading_count
FROM health_metrics
GROUP BY user_id, type, day;

-- Set retention policy
SELECT add_retention_policy('health_metrics', INTERVAL '1 year');
```

### Event Architecture

The Health Service publishes and consumes events using a standardized event schema:

- **Event Publishing**: Emits events for health milestones, goal achievements, and insights
- **Event Consumption**: Listens for relevant events from other services
- **Schema Validation**: Ensures all events conform to the defined schema
- **Retry Mechanisms**: Implements reliable delivery with dead-letter queues

```typescript
// Example of event publishing with standardized schema
async publishHealthGoalAchievedEvent(goal: HealthGoal): Promise<void> {
  const event: HealthGoalAchievedEvent = {
    eventType: 'health.goal.achieved',
    version: '1.0',
    payload: {
      userId: goal.userId,
      goalId: goal.id,
      goalType: goal.type,
      achievedAt: new Date().toISOString()
    },
    metadata: {
      correlationId: this.tracingService.getCurrentTraceId(),
      timestamp: new Date().toISOString(),
      source: 'health-service',
      journeyContext: 'health'
    }
  };
  
  await this.kafkaService.publish('austa.health.goals', event);
}
```

## Setup and Usage

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

```bash
# Run database migrations
npm run migrate

# Seed the database with initial data
npm run seed
```

### Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### API Documentation

The service exposes OpenAPI documentation at `/docs` when running.

## Data Models

### Health Metric

```typescript
interface HealthMetric {
  id: string;            // UUID
  userId: string;        // User ID
  type: MetricType;      // Enum: HEART_RATE, BLOOD_PRESSURE, etc.
  value: number;         // Metric value
  unit: string;          // Measurement unit
  timestamp: Date;       // When the metric was recorded
  source: MetricSource;  // Enum: MANUAL, WEARABLE, FHIR, etc.
  notes?: string;        // Optional notes
  trendPercentage?: number; // Optional trend calculation
  isAbnormal: boolean;   // Flag for abnormal values
}
```

### Health Goal

```typescript
interface HealthGoal {
  id: string;            // UUID
  userId: string;        // User ID
  type: GoalType;        // Enum: STEPS, WEIGHT, etc.
  status: GoalStatus;    // Enum: ACTIVE, COMPLETED, etc.
  period: GoalPeriod;    // Enum: DAILY, WEEKLY, etc.
  targetValue: number;   // Target value
  currentValue: number;  // Current progress
  startDate: Date;       // Goal start date
  endDate: Date;         // Goal end date
}
```

### Device Connection

```typescript
interface DeviceConnection {
  id: string;            // UUID
  recordId: string;      // Health record ID
  deviceType: DeviceType; // Enum: APPLE_WATCH, FITBIT, etc.
  status: ConnectionStatus; // Enum: CONNECTED, DISCONNECTED, etc.
  deviceId: string;      // Device identifier
  lastSync?: Date;       // Last synchronization timestamp
}
```

## Monitoring and Observability

The Health Service implements comprehensive monitoring and observability features:

### Distributed Tracing

The service uses OpenTelemetry for distributed tracing:

```typescript
// Example of using the TracingService for distributed tracing
async getHealthMetrics(userId: string, startDate: Date, endDate: Date): Promise<HealthMetric[]> {
  const span = this.tracingService.startSpan('getHealthMetrics');
  
  try {
    span.setAttributes({
      'user.id': userId,
      'date.start': startDate.toISOString(),
      'date.end': endDate.toISOString()
    });
    
    const metrics = await this.prismaService.withHealthContext(async (prisma) => {
      return prisma.healthMetric.findMany({
        where: { userId, timestamp: { gte: startDate, lte: endDate } },
        orderBy: { timestamp: 'desc' }
      });
    });
    
    span.setAttributes({
      'metrics.count': metrics.length
    });
    
    return metrics;
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Structured Logging

The service uses structured logging with correlation IDs:

```typescript
// Example of structured logging with correlation IDs
this.logger.info('Processing health metrics', {
  userId,
  metricsCount: metrics.length,
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  correlationId: this.tracingService.getCurrentTraceId()
});
```

### Health Checks

The service exposes health check endpoints for monitoring:

```typescript
// Health check controller
@Controller('health-check')
export class HealthCheckController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly kafkaHealthIndicator: KafkaHealthIndicator,
    private readonly redisHealthIndicator: RedisHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.prismaHealthIndicator.isHealthy('database'),
      () => this.kafkaHealthIndicator.isHealthy('kafka'),
      () => this.redisHealthIndicator.isHealthy('redis')
    ]);
  }
}
```

### Metrics

The service exposes Prometheus metrics for monitoring:

```typescript
// Example of using Prometheus metrics
@Injectable()
export class MetricsService {
  private readonly healthMetricsCounter: Counter;
  private readonly healthMetricsHistogram: Histogram;
  private readonly activeConnectionsGauge: Gauge;

  constructor() {
    this.healthMetricsCounter = new Counter({
      name: 'health_metrics_total',
      help: 'Total number of health metrics processed',
      labelNames: ['type', 'source']
    });

    this.healthMetricsHistogram = new Histogram({
      name: 'health_metrics_processing_duration_seconds',
      help: 'Duration of health metrics processing in seconds',
      labelNames: ['operation']
    });

    this.activeConnectionsGauge = new Gauge({
      name: 'device_connections_active',
      help: 'Number of active device connections',
      labelNames: ['deviceType']
    });
  }

  incrementHealthMetrics(type: string, source: string): void {
    this.healthMetricsCounter.inc({ type, source });
  }

  recordProcessingTime(operation: string, durationMs: number): void {
    this.healthMetricsHistogram.observe({ operation }, durationMs / 1000);
  }

  setActiveConnections(deviceType: string, count: number): void {
    this.activeConnectionsGauge.set({ deviceType }, count);
  }
}
```

## Contributing

Please refer to the project's contribution guidelines for information on how to contribute to the Health Service.

## License

This project is proprietary and confidential. Unauthorized copying, transfer, or reproduction of the contents of this repository is prohibited.