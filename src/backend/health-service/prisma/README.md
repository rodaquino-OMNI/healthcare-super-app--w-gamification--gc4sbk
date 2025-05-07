# Health Service Prisma Implementation

This document provides comprehensive guidance on the Prisma ORM implementation for the Health Service microservice within the AUSTA SuperApp. It covers schema structure, model definitions, migration workflows, connection pooling configuration, and TimescaleDB integration for time-series health data.

## Table of Contents

1. [Overview](#overview)
2. [Schema Structure](#schema-structure)
3. [Model Definitions](#model-definitions)
4. [TimescaleDB Integration](#timescaledb-integration)
5. [Connection Pooling](#connection-pooling)
6. [Migration Workflows](#migration-workflows)
7. [Environment-Specific Configuration](#environment-specific-configuration)
8. [Journey-Specific Database Context](#journey-specific-database-context)
9. [Best Practices](#best-practices)

## Overview

The Health Service uses Prisma ORM to interact with a PostgreSQL database enhanced with TimescaleDB for time-series data. This implementation provides:

- Type-safe database access with auto-generated TypeScript types
- Efficient time-series data storage and querying for health metrics
- Connection pooling for optimal performance
- Structured migration workflows
- Journey-specific database contexts for clean separation of concerns

## Schema Structure

The Prisma schema for the Health Service is organized into several core models that support the "Minha Saúde" journey:

```prisma
// Main models in schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

extension timescaledb on schema public {}

model HealthMetric {
  id          String   @id @default(uuid())
  userId      String
  metricType  String   // e.g., "HEART_RATE", "STEPS", "BLOOD_PRESSURE"
  value       Float
  unit        String
  timestamp   DateTime @db.Timestamptz(6)
  source      String?  // e.g., "MANUAL", "FITBIT", "APPLE_HEALTH"
  deviceId    String?
  metadata    Json?    // Additional metric-specific data
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  device      DeviceConnection? @relation(fields: [deviceId], references: [id])

  @@index([userId])
  @@index([metricType])
  @@index([timestamp])
}

model HealthGoal {
  id          String   @id @default(uuid())
  userId      String
  metricType  String
  targetValue Float
  unit        String
  startDate   DateTime @db.Timestamptz(6)
  endDate     DateTime? @db.Timestamptz(6)
  status      String   // "ACTIVE", "COMPLETED", "FAILED", "ABANDONED"
  progress    Float    @default(0)
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  @@index([userId])
  @@index([status])
}

model DeviceConnection {
  id          String   @id @default(uuid())
  userId      String
  deviceType  String   // e.g., "FITBIT", "APPLE_WATCH", "GOOGLE_FIT"
  deviceId    String?  // Device-specific identifier
  accessToken String?  // Encrypted access token
  refreshToken String? // Encrypted refresh token
  expiresAt   DateTime? @db.Timestamptz(6)
  metadata    Json?    // Additional device-specific data
  lastSyncAt  DateTime? @db.Timestamptz(6)
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)
  
  metrics     HealthMetric[]

  @@unique([userId, deviceType])
  @@index([userId])
  @@index([deviceType])
}

model MedicalEvent {
  id          String   @id @default(uuid())
  userId      String
  eventType   String   // e.g., "DIAGNOSIS", "PROCEDURE", "MEDICATION", "ALLERGY"
  title       String
  description String?
  date        DateTime @db.Timestamptz(6)
  provider    String?
  location    String?
  fhirResource Json?   // FHIR resource data if available
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  @@index([userId])
  @@index([eventType])
  @@index([date])
}
```

## Model Definitions

### HealthMetric

Stores time-series health data points such as heart rate, steps, blood pressure, etc. This model is optimized for TimescaleDB to efficiently handle large volumes of time-series data.

### HealthGoal

Represents user-defined health goals with targets, progress tracking, and status. Goals are linked to specific metric types and can be used to track progress over time.

### DeviceConnection

Manages connections to external health data sources like wearable devices (Fitbit, Apple Watch) and health platforms (Google Fit, Apple HealthKit). Stores authentication tokens and sync information.

### MedicalEvent

Captures significant medical events in a user's health history, including diagnoses, procedures, medications, and allergies. Can store FHIR-formatted data for interoperability.

## TimescaleDB Integration

The Health Service leverages TimescaleDB, a PostgreSQL extension optimized for time-series data, to efficiently store and query health metrics. This integration is critical for handling the high volume of time-series health data from wearable devices and manual entries.

### Benefits of TimescaleDB for Health Data

- **Efficient storage of high-volume time-series data** - Optimized for the millions of data points collected from wearable devices
- **Automatic partitioning by time (hypertables)** - Data is automatically partitioned into chunks based on time ranges
- **Advanced time-based queries and aggregations** - Specialized functions for time-series analysis
- **Retention policies for historical data management** - Automatically manage data lifecycle
- **Continuous aggregates for performance** - Pre-compute common aggregations for faster queries
- **Compression for older data** - Reduce storage requirements while maintaining query capability

### Configuration

TimescaleDB is enabled through the Prisma schema and configured via environment variables:

```env
TIMESCALE_ENABLED=true
METRICS_RETENTION_DAYS=730  # 2 years retention by default
METRICS_AGGREGATION_ENABLED=true
METRICS_AGGREGATION_INTERVALS=hour,day,week,month
```

These settings are validated in the `validation.schema.ts` file:

```typescript
// From validation.schema.ts
TIMESCALE_ENABLED: Joi.string().valid('true', 'false').default('true'),
METRICS_RETENTION_DAYS: Joi.number().integer().min(1).max(3650).default(730), // Default 2 years
METRICS_AGGREGATION_ENABLED: Joi.string().valid('true', 'false').default('true'),
METRICS_AGGREGATION_INTERVALS: Joi.string().default('hour,day,week,month'),
```

### Prisma Schema Configuration

TimescaleDB is enabled in the Prisma schema through the PostgreSQL extensions preview feature:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

extension timescaledb on schema public {}
```

### Hypertable Setup

After applying migrations, hypertables are created for time-series data. This is handled by the migration scripts:

```sql
-- Example from migration script
-- Create the TimescaleDB extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert regular table to hypertable
SELECT create_hypertable('"HealthMetric"', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Set retention policy (if configured)
SELECT add_retention_policy('"HealthMetric"', INTERVAL '730 days');

-- Enable compression for older chunks
ALTER TABLE "HealthMetric" SET (timescaledb.compress = true);
SELECT add_compression_policy('"HealthMetric"', INTERVAL '7 days');
```

### Continuous Aggregates

Continuous aggregates are created for common time intervals to improve query performance:

```sql
-- Hourly aggregates
CREATE MATERIALIZED VIEW health_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS bucket,
  userId,
  metricType,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  COUNT(*) AS sample_count
FROM "HealthMetric"
GROUP BY bucket, userId, metricType;

-- Daily aggregates
CREATE MATERIALIZED VIEW health_metrics_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS bucket,
  userId,
  metricType,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  COUNT(*) AS sample_count
FROM "HealthMetric"
GROUP BY bucket, userId, metricType;

-- Set refresh policies
SELECT add_continuous_aggregate_policy('health_metrics_hourly',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('health_metrics_daily',
  start_offset => INTERVAL '30 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');
```

### Query Optimization with TimescaleDB

The HealthContext provides optimized methods for querying time-series data using TimescaleDB features:

```typescript
// Example from HealthContext
async getUserHealthMetricsByTimeRange(
  userId: string,
  metricType: string,
  startTime: Date,
  endTime: Date,
  interval?: string
): Promise<AggregatedMetric[]> {
  // For raw data (no aggregation)
  if (!interval) {
    return this.prisma.$queryRaw`
      SELECT 
        timestamp, 
        value,
        unit,
        source
      FROM "HealthMetric"
      WHERE 
        "userId" = ${userId} AND
        "metricType" = ${metricType} AND
        timestamp >= ${startTime} AND
        timestamp <= ${endTime}
      ORDER BY timestamp ASC
    `;
  }
  
  // For aggregated data using continuous aggregates
  const bucketInterval = this.getBucketInterval(interval);
  const viewName = this.getAggregateViewName(interval);
  
  return this.prisma.$queryRaw`
    SELECT 
      bucket as timestamp, 
      avg_value as value,
      min_value,
      max_value,
      sample_count
    FROM ${viewName}
    WHERE 
      "userId" = ${userId} AND
      "metricType" = ${metricType} AND
      bucket >= ${startTime} AND
      bucket <= ${endTime}
    ORDER BY bucket ASC
  `;
}
```

## Connection Pooling

The Health Service implements connection pooling to optimize database performance and resource utilization. This is managed through the enhanced PrismaService from the shared database package.

### Configuration

Connection pooling is configured via environment variables:

```env
DATABASE_CONNECTION_LIMIT=10  # Maximum number of connections in the pool
DATABASE_CONNECTION_TIMEOUT=30000  # Connection timeout in milliseconds
DATABASE_POOL_TIMEOUT=10000  # Pool timeout in milliseconds
```

### Implementation

The PrismaService extends the base PrismaClient with connection pooling capabilities:

```typescript
// Simplified example from PrismaService
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('health.databaseUrl'),
        },
      },
      log: configService.get('health.nodeEnv') === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      // Connection pooling configuration
      connection: {
        pool: {
          max: configService.get('DATABASE_CONNECTION_LIMIT') || 10,
          timeout: configService.get('DATABASE_POOL_TIMEOUT') || 10000,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## Migration Workflows

The Health Service follows a structured approach to database migrations using Prisma Migrate, with special considerations for TimescaleDB integration.

### Creating Migrations

To create a new migration:

1. Update the `schema.prisma` file with your changes
2. Generate a migration with a descriptive name:

```bash
npx prisma migrate dev --name add_new_field_to_health_metrics
```

3. Review the generated SQL in the migration file
4. For TimescaleDB-specific features, manually add the required SQL to the migration file:
   ```sql
   -- Example: Creating a hypertable for a new time-series model
   SELECT create_hypertable('NewTimeSeriesModel', 'timestamp');
   ```
5. Apply the migration to your development database:

```bash
npx prisma migrate dev
```

### Migration Naming Convention

Migrations follow a standardized naming convention:

```
YYYYMMDD000000_descriptive_name
```

For example:
- `20230101000000_initial_schema` - Base schema setup with TimescaleDB extension
- `20230102000000_create_health_metrics` - Health metrics model with hypertable configuration
- `20230103000000_create_health_goals` - Health goals tracking model
- `20230104000000_create_device_connections` - Device connection management
- `20230105000000_create_medical_events` - Medical history events
- `20230301000000_add_indices_and_relations` - Performance optimization with additional indices

### Migration History

The Health Service database has evolved through the following migrations:

1. **Initial Schema** (20230101000000)
   - Setup TimescaleDB extension
   - Configure UUID generation
   - Set timezone handling

2. **Health Metrics** (20230102000000)
   - Create HealthMetric model
   - Configure as TimescaleDB hypertable
   - Set up continuous aggregates for common time intervals

3. **Health Goals** (20230103000000)
   - Create HealthGoal model
   - Add indices for efficient querying

4. **Device Connections** (20230104000000)
   - Create DeviceConnection model
   - Set up relations to HealthMetric
   - Configure secure token storage

5. **Medical Events** (20230105000000)
   - Create MedicalEvent model
   - Configure JSONB storage for FHIR resources

6. **Indices and Relations** (20230301000000)
   - Add performance-optimizing indices
   - Enhance foreign key relationships
   - Optimize TimescaleDB chunk intervals

### Applying Migrations in Production

For production environments, use the `prisma migrate deploy` command:

```bash
npx prisma migrate deploy
```

This command applies all pending migrations without generating new ones, making it safe for production use.

### TimescaleDB-Specific Migration Considerations

When working with TimescaleDB in migrations:

1. **Hypertable Creation**: Must be done after the table is created
   ```sql
   -- First, Prisma creates the table
   CREATE TABLE "HealthMetric" (...)
   
   -- Then, manually add in migration
   SELECT create_hypertable('"HealthMetric"', 'timestamp');
   ```

2. **Compression Policy**: Configure compression for older chunks
   ```sql
   ALTER TABLE "HealthMetric" SET (timescaledb.compress = true);
   SELECT add_compression_policy('"HealthMetric"', INTERVAL '7 days');
   ```

3. **Continuous Aggregates**: Create for common query patterns
   ```sql
   CREATE MATERIALIZED VIEW health_metrics_daily
   WITH (timescaledb.continuous) AS
   SELECT
     time_bucket('1 day', timestamp) AS day,
     userId,
     metricType,
     AVG(value) AS avg_value,
     MIN(value) AS min_value,
     MAX(value) AS max_value,
     COUNT(*) AS sample_count
   FROM "HealthMetric"
   GROUP BY day, userId, metricType;
   ```

4. **Retention Policy**: Manage data lifecycle
   ```sql
   SELECT add_retention_policy('"HealthMetric"', INTERVAL '2 years');
   ```

### Migration Best Practices

1. **Keep migrations small and focused** - Each migration should address a specific change
2. **Test migrations thoroughly** - Verify that migrations work correctly before deploying
3. **Include rollback procedures** - Document how to revert changes if needed
4. **Coordinate with other services** - Ensure compatibility with dependent services
5. **Handle TimescaleDB features explicitly** - Add TimescaleDB-specific SQL manually
6. **Version control all migrations** - Never modify existing migration files
7. **Document migration dependencies** - Note when migrations depend on each other

## Environment-Specific Configuration

The Health Service supports different database configurations based on the environment, allowing for optimal settings in each context.

### Configuration Loading

Database configuration is loaded through the NestJS ConfigModule in `app.module.ts`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [health],
      validationSchema,
      isGlobal: true,
    }),
    // Other imports...
  ],
  providers: [PrismaService],
})
export class AppModule {}
```

The configuration is defined in `configuration.ts` and validated using the schema in `validation.schema.ts`.

### Environment Variables

#### Development

```env
# Core settings
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Database configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/health_dev
DATABASE_SSL=false
DATABASE_CONNECTION_LIMIT=5
DATABASE_CONNECTION_TIMEOUT=5000
DATABASE_POOL_TIMEOUT=8000

# TimescaleDB configuration
TIMESCALE_ENABLED=true
METRICS_RETENTION_DAYS=730
METRICS_AGGREGATION_ENABLED=true
METRICS_AGGREGATION_INTERVALS=hour,day,week,month

# Redis for caching
REDIS_URL=redis://localhost:6379/0
REDIS_TTL=3600
```

#### Testing

```env
# Core settings
NODE_ENV=test
PORT=3001
API_PREFIX=api/v1

# Database configuration - use separate test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/health_test
DATABASE_SSL=false
DATABASE_CONNECTION_LIMIT=2
DATABASE_CONNECTION_TIMEOUT=3000
DATABASE_POOL_TIMEOUT=5000

# TimescaleDB configuration - enabled but with shorter retention
TIMESCALE_ENABLED=true
METRICS_RETENTION_DAYS=30
METRICS_AGGREGATION_ENABLED=true
METRICS_AGGREGATION_INTERVALS=hour,day

# Redis for caching - use separate database
REDIS_URL=redis://localhost:6379/1
REDIS_TTL=60
```

#### Production

```env
# Core settings
NODE_ENV=production
PORT=3001
API_PREFIX=api/v1

# Database configuration - use managed PostgreSQL with TimescaleDB
DATABASE_URL=postgresql://user:password@production-db-host:5432/health_prod
DATABASE_SSL=true
DATABASE_CONNECTION_LIMIT=20
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_POOL_TIMEOUT=15000

# TimescaleDB configuration - full features enabled
TIMESCALE_ENABLED=true
METRICS_RETENTION_DAYS=730
METRICS_AGGREGATION_ENABLED=true
METRICS_AGGREGATION_INTERVALS=hour,day,week,month

# Redis for caching - use managed Redis
REDIS_URL=redis://redis-production:6379/0
REDIS_TTL=3600
```

### Environment-Specific Optimizations

#### Development

- **Logging**: Verbose query logging enabled
- **Connection Pool**: Smaller connection pool (5 connections)
- **Migrations**: Development migrations with automatic application
- **Schema Validation**: Strict schema validation

#### Testing

- **Database**: Separate test database with isolated data
- **Connection Pool**: Minimal connection pool (2 connections)
- **Retention**: Shorter retention periods for test data
- **Caching**: Minimal TTL for faster test execution

#### Production

- **Logging**: Error-only logging for performance
- **Connection Pool**: Larger connection pool (20 connections)
- **SSL**: Enforced SSL connections for security
- **Migrations**: Controlled migration application
- **Monitoring**: Enhanced query performance monitoring
- **Backups**: Automated database backups

### Configuration Implementation

The configuration is implemented in the `health` configuration function:

```typescript
// From configuration.ts
export const health = registerAs('health', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  databaseUrl: process.env.DATABASE_URL,
  databaseSSL: process.env.DATABASE_SSL === 'true',
  timescaleEnabled: process.env.TIMESCALE_ENABLED === 'true',
  metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS, 10) || 730,
  metricsAggregationEnabled: process.env.METRICS_AGGREGATION_ENABLED === 'true',
  metricsAggregationIntervals: process.env.METRICS_AGGREGATION_INTERVALS || 'hour,day,week,month',
  // Additional configuration...
}));
```

## Journey-Specific Database Context

The Health Service uses a specialized database context from the shared database package to provide health-specific database operations and optimizations. This approach ensures clean separation of concerns, optimized queries for health data, and consistent database access patterns.

### HealthContext Architecture

The `HealthContext` is part of a broader journey-specific database context architecture:

```
BaseJourneyContext (abstract)
  ├── HealthContext ("Minha Saúde" journey)
  ├── CareContext ("Cuidar-me Agora" journey)
  └── PlanContext ("Meu Plano & Benefícios" journey)
```

Each context provides specialized methods for its respective journey while inheriting common functionality from the base context.

### HealthContext Implementation

The `HealthContext` extends the base journey context with health-specific functionality:

```typescript
// From @austa/database package
export class HealthContext extends BaseJourneyContext {
  /**
   * Retrieves health metrics for a user with TimescaleDB optimizations
   */
  async getUserHealthMetrics(
    userId: string, 
    options: HealthMetricsOptions
  ): Promise<HealthMetric[]> {
    const { type, startDate, endDate, limit, offset } = options;
    
    return this.prisma.healthMetric.findMany({
      where: {
        userId,
        ...(type && { metricType: type }),
        ...(startDate && endDate && {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit || 100,
      skip: offset || 0
    });
  }

  /**
   * Retrieves aggregated health metrics using TimescaleDB continuous aggregates
   */
  async getAggregatedMetrics(
    userId: string, 
    options: AggregationOptions
  ): Promise<AggregatedMetric[]> {
    const { type, interval, startDate, endDate } = options;
    
    // Use TimescaleDB time_bucket for aggregation
    return this.prisma.$queryRaw`
      SELECT 
        time_bucket(${interval}::interval, timestamp) as bucket,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as sample_count
      FROM "HealthMetric"
      WHERE 
        "userId" = ${userId} AND
        "metricType" = ${type} AND
        timestamp >= ${startDate} AND
        timestamp <= ${endDate}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
  }

  /**
   * Manages health goals with progress tracking
   */
  async updateGoalProgress(
    goalId: string, 
    progress: number
  ): Promise<HealthGoal> {
    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      const goal = await tx.healthGoal.findUnique({
        where: { id: goalId }
      });
      
      if (!goal) {
        throw new NotFoundException(`Health goal with ID ${goalId} not found`);
      }
      
      // Update progress and status if needed
      let status = goal.status;
      if (progress >= 100) {
        status = 'COMPLETED';
      }
      
      return tx.healthGoal.update({
        where: { id: goalId },
        data: {
          progress,
          status
        }
      });
    });
  }

  /**
   * Handles device connection management with token encryption
   */
  async connectDevice(
    userId: string, 
    deviceData: DeviceConnectionData
  ): Promise<DeviceConnection> {
    const { deviceType, accessToken, refreshToken, deviceId, metadata } = deviceData;
    
    // Encrypt sensitive tokens before storing
    const encryptedAccessToken = accessToken ? this.encryptToken(accessToken) : null;
    const encryptedRefreshToken = refreshToken ? this.encryptToken(refreshToken) : null;
    
    // Use upsert to handle both creation and updates
    return this.prisma.deviceConnection.upsert({
      where: {
        userId_deviceType: {
          userId,
          deviceType
        }
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        deviceId,
        metadata,
        lastSyncAt: new Date(),
        expiresAt: this.calculateExpiryDate(deviceType)
      },
      create: {
        userId,
        deviceType,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        deviceId,
        metadata,
        lastSyncAt: new Date(),
        expiresAt: this.calculateExpiryDate(deviceType)
      }
    });
  }
  
  /**
   * Stores health metrics in bulk with TimescaleDB optimizations
   */
  async storeHealthMetricsBatch(
    metrics: HealthMetricCreateInput[]
  ): Promise<number> {
    // Use raw query for optimal bulk insert performance with TimescaleDB
    const values = metrics.map(m => `(
      '${uuidv4()}', 
      '${m.userId}', 
      '${m.metricType}', 
      ${m.value}, 
      '${m.unit}', 
      '${m.timestamp.toISOString()}', 
      ${m.source ? `'${m.source}'` : 'NULL'}, 
      ${m.deviceId ? `'${m.deviceId}'` : 'NULL'}, 
      ${m.metadata ? `'${JSON.stringify(m.metadata)}'` : 'NULL'}, 
      NOW(), 
      NOW()
    )`).join(',');
    
    const result = await this.prisma.$executeRaw`
      INSERT INTO "HealthMetric" (
        id, "userId", "metricType", value, unit, timestamp, 
        source, "deviceId", metadata, "createdAt", "updatedAt"
      ) VALUES ${Prisma.raw(values)}
    `;
    
    return result;
  }
  
  /**
   * Records a medical event with FHIR resource support
   */
  async recordMedicalEvent(
    userId: string,
    eventData: MedicalEventCreateInput
  ): Promise<MedicalEvent> {
    return this.prisma.medicalEvent.create({
      data: {
        userId,
        eventType: eventData.eventType,
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        provider: eventData.provider,
        location: eventData.location,
        fhirResource: eventData.fhirResource
      }
    });
  }
  
  // Helper methods
  private encryptToken(token: string): string {
    // Implementation of token encryption
    return token; // Simplified for example
  }
  
  private calculateExpiryDate(deviceType: string): Date {
    // Calculate token expiry based on device type
    const expiryMap = {
      'FITBIT': 30, // days
      'APPLE_WATCH': 180,
      'GOOGLE_FIT': 60
    };
    
    const days = expiryMap[deviceType] || 30;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
```

### Usage in Health Service

To use the HealthContext in your service:

```typescript
import { HealthContext } from '@austa/database';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly healthContext: HealthContext) {}

  async getUserMetrics(userId: string, type: string, options?: MetricQueryOptions) {
    return this.healthContext.getUserHealthMetrics(userId, { 
      type,
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      offset: options?.offset
    });
  }
  
  async getMetricTrends(userId: string, type: string, period: string) {
    const now = new Date();
    let startDate: Date;
    let interval: string;
    
    switch (period) {
      case 'day':
        startDate = subDays(now, 1);
        interval = '1 hour';
        break;
      case 'week':
        startDate = subDays(now, 7);
        interval = '1 day';
        break;
      case 'month':
        startDate = subDays(now, 30);
        interval = '1 day';
        break;
      case 'year':
        startDate = subDays(now, 365);
        interval = '1 month';
        break;
      default:
        startDate = subDays(now, 7);
        interval = '1 day';
    }
    
    return this.healthContext.getAggregatedMetrics(userId, {
      type,
      interval,
      startDate,
      endDate: now
    });
  }
  
  async syncDeviceData(userId: string, deviceType: string, metrics: HealthMetricInput[]) {
    return this.healthContext.storeHealthMetricsBatch(
      metrics.map(m => ({
        userId,
        metricType: m.type,
        value: m.value,
        unit: m.unit,
        timestamp: m.timestamp,
        source: deviceType,
        deviceId: m.deviceId
      }))
    );
  }
}
```

### Benefits of Journey-Specific Database Contexts

1. **Separation of Concerns**: Each journey has its own database context with specialized methods
2. **Optimized Queries**: Journey-specific optimizations for common database operations
3. **Type Safety**: Strongly typed methods and return values
4. **Consistent Patterns**: Standardized approach to database access across services
5. **Encapsulation**: Database implementation details are hidden from service code
6. **Reusability**: Common database operations are implemented once and reused
7. **Transaction Management**: Consistent transaction handling across the journey

## Best Practices

### Schema Management

1. **Follow naming conventions**
   - Use PascalCase for model names (e.g., `HealthMetric`)
   - Use camelCase for field names (e.g., `metricType`)
   - Use snake_case for database names (e.g., `health_service_db`)
   - Prefix indexes with `idx_` followed by table and column names

2. **Document model relationships**
   - Use explicit relation fields in Prisma schema
   - Document cardinality (one-to-one, one-to-many, many-to-many)
   - Specify onDelete and onUpdate behaviors for referential integrity
   - Use descriptive names for relation fields

3. **Use appropriate field types**
   - Use `String @id @default(uuid())` for IDs
   - Use `DateTime @db.Timestamptz(6)` for timestamps with timezone
   - Use `Json` for structured data like metadata
   - Use appropriate numeric types (`Int`, `Float`, `Decimal`) based on precision needs

4. **Create indexes for common queries**
   - Add indexes to fields frequently used in WHERE clauses
   - Create composite indexes for fields often queried together
   - Add indexes to foreign key fields
   - Consider index impact on write performance

5. **Standardize common patterns**
   - Include `createdAt` and `updatedAt` fields on all models
   - Use consistent status field values across models
   - Implement soft delete with `deletedAt` where appropriate
   - Use consistent metadata handling

### Query Optimization

1. **Use the HealthContext for complex queries**
   - Leverage optimized methods for common operations
   - Use the context's transaction management
   - Benefit from built-in error handling
   - Take advantage of TimescaleDB-specific optimizations

2. **Limit result sets**
   - Always paginate large result sets
   - Use cursor-based pagination for large datasets
   - Implement reasonable defaults (e.g., 100 items per page)
   - Return total counts for proper pagination UI

3. **Select only needed fields**
   - Use `select` to retrieve only required fields
   - Create specialized query methods for common field subsets
   - Avoid selecting large JSON or text fields when not needed
   - Use projection to minimize data transfer

4. **Use transactions for related operations**
   - Wrap related operations in transactions
   - Implement proper error handling and rollback
   - Consider transaction isolation levels
   - Document transaction boundaries

5. **Optimize bulk operations**
   - Use `createMany` for inserting multiple records
   - Consider raw SQL for very large batch operations
   - Implement chunking for extremely large datasets
   - Monitor performance of bulk operations

### TimescaleDB Optimization

1. **Use time buckets for aggregation**
   - Leverage TimescaleDB's `time_bucket` function
   - Choose appropriate bucket sizes based on query patterns
   - Create helper methods for common time bucket operations
   - Document time bucket usage patterns

2. **Configure appropriate chunk intervals**
   - Default: 1 day for high-frequency metrics (e.g., heart rate)
   - 7 days for medium-frequency metrics (e.g., daily step counts)
   - Adjust based on data volume and query patterns
   - Monitor chunk size and adjust as needed

3. **Use continuous aggregates for common queries**
   - Pre-aggregate data for frequent time-based queries
   - Create hourly, daily, weekly, and monthly aggregates
   - Set appropriate refresh policies
   - Document available aggregates and their refresh schedules

4. **Set appropriate retention policies**
   - Balance data retention needs with storage constraints
   - Consider regulatory requirements for health data
   - Implement different policies for different metric types
   - Document retention policies and their rationale

5. **Implement compression for older data**
   - Enable compression for hypertables
   - Set compression policy to compress data older than 7 days
   - Monitor compression ratios
   - Test query performance on compressed data

### Security Considerations

1. **Never expose database credentials**
   - Use environment variables for sensitive configuration
   - Rotate credentials regularly
   - Use different credentials for different environments
   - Implement least privilege principle for database users

2. **Encrypt sensitive data**
   - Use encryption for tokens and personal health information
   - Store encryption keys securely
   - Document encryption and decryption processes
   - Consider field-level encryption for highly sensitive data

3. **Implement row-level security**
   - Ensure users can only access their own data
   - Always filter queries by userId
   - Use database policies where appropriate
   - Audit access control implementation

4. **Audit database access**
   - Log and monitor database operations
   - Implement query logging for sensitive operations
   - Set up alerts for suspicious activity
   - Regularly review access logs

5. **Sanitize user inputs**
   - Validate all user inputs before database operations
   - Use parameterized queries to prevent SQL injection
   - Implement input validation at the API level
   - Document validation rules

### Development Workflow

1. **Local Development Setup**
   - Use Docker Compose for local database with TimescaleDB
   - Create seed data for development
   - Document setup process for new developers
   - Provide sample environment configuration

2. **Testing Strategy**
   - Create database mocks for unit tests
   - Use test transactions for integration tests
   - Implement test factories for model creation
   - Reset database between test suites

3. **Migration Management**
   - Review migrations before applying
   - Test migrations on a copy of production data
   - Document migration dependencies
   - Create rollback procedures for complex migrations

4. **Performance Monitoring**
   - Set up query performance monitoring
   - Establish performance baselines
   - Monitor database size and growth
   - Implement alerting for slow queries