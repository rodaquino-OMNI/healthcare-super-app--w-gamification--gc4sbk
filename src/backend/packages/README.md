# AUSTA SuperApp Backend Packages

## Overview

The `src/backend/packages` directory contains a collection of modular, reusable packages that form the foundation of the AUSTA SuperApp backend architecture. These packages implement cross-cutting concerns, shared functionality, and standardized patterns used across all microservices in the journey-centered architecture.

This modular approach addresses critical architectural issues by:

- Providing clear package boundaries with well-defined public APIs
- Standardizing module resolution across the monorepo
- Resolving dependency conflicts through consistent versioning
- Enabling granular imports to reduce bundle sizes
- Supporting both backend services and mobile/web applications

## Package Organization

The backend packages are organized by domain and responsibility:

| Package | Purpose | Primary Consumers |
|---------|---------|-------------------|
| [@austa/auth](#austauth) | Authentication and authorization | API Gateway, Auth Service, Journey Services |
| [@austa/database](#austadatabase) | Database access and Prisma integration | All backend services with database access |
| [@austa/errors](#austaerrors) | Error handling framework | All backend services |
| [@austa/events](#austaevents) | Event processing and Kafka integration | Gamification Engine, Journey Services |
| [@austa/interfaces](#austainterfaces) | Shared TypeScript interfaces | All backend and frontend services |
| [@austa/logging](#austalogging) | Structured logging | All backend services |
| [@austa/tracing](#austatracing) | Distributed tracing | All backend services |
| [@austa/utils](#austautils) | Utility functions | All backend and frontend services |

Each package follows a consistent structure:

```
/package-name
  ├── index.ts         # Main entry point with exports
  ├── README.md        # Package documentation
  ├── package.json     # Package definition and dependencies
  ├── tsconfig.json    # TypeScript configuration
  ├── src/             # Source code
  └── test/            # Test files
```

## Installation and Usage

All packages are managed through the monorepo's Yarn Workspaces configuration. To use a package in a service:

```typescript
// Import the entire package
import { LoggerService } from '@austa/logging';

// Or import specific modules
import { ValidationError } from '@austa/errors';
```

Dependencies are automatically resolved through the workspace configuration, so no additional installation steps are required.

## Package Details

### @austa/auth

Provides authentication and authorization capabilities for the AUSTA SuperApp ecosystem:

- JWT token validation and generation
- Role-based access control
- OAuth integration
- User authentication flows
- Permission management

**Key Components:**
- `JwtStrategy`: Implements JWT validation for NestJS
- `AuthGuard`: Protects routes based on authentication status
- `RolesGuard`: Enforces role-based access control
- `PermissionsService`: Manages user permissions

**Example Usage:**

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@austa/auth';

@Module({
  imports: [
    AuthModule.forRoot({
      jwtSecret: process.env.JWT_SECRET,
      expiresIn: '1h'
    })
  ]
})
export class AppModule {}
```

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles, RolesGuard } from '@austa/auth';

@Controller('health-metrics')
@UseGuards(AuthGuard, RolesGuard)
export class HealthMetricsController {
  @Get()
  @Roles(['user'])
  findAll() {
    // Implementation
  }
}
```

### @austa/database

Provides standardized database access through Prisma ORM with journey-specific optimizations:

- Connection pooling and optimization
- Transaction management
- Journey-specific database contexts
- Error handling and retry mechanisms

**Key Components:**
- `PrismaService`: Enhanced Prisma client with connection management
- `TransactionManager`: Handles database transactions across repositories
- `JourneyContext`: Provides journey-specific database access
- `DatabaseModule`: NestJS module for database integration

**Example Usage:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@austa/database';

@Injectable()
export class HealthMetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data) {
    return this.prisma.healthMetric.create({ data });
  }
}
```

### @austa/errors

Standardized exception handling framework with journey-specific error types:

- Journey-specific error classes and codes
- Consistent error response format
- Integration with logging and monitoring
- Automatic HTTP status code mapping

**Key Components:**
- `BusinessError`: Base class for domain-specific errors
- `ValidationError`: For input validation failures
- `ExternalServiceError`: For integration failures
- `ErrorFilter`: NestJS filter for consistent error responses

**Example Usage:**

```typescript
import { Injectable } from '@nestjs/common';
import { BusinessError, ValidationError } from '@austa/errors';

@Injectable()
export class AppointmentService {
  async bookAppointment(data) {
    if (!data.providerId) {
      throw new ValidationError('Provider ID is required', 'CARE_001', {
        field: 'providerId'
      });
    }
    
    const isAvailable = await this.checkProviderAvailability(
      data.providerId,
      data.dateTime
    );
    
    if (!isAvailable) {
      throw new BusinessError(
        'Provider is not available at the requested time',
        'CARE_002'
      );
    }
    
    // Continue with booking logic
  }
}
```

### @austa/events

Facilitates event-driven communication between services with standardized schemas:

- Type-safe event definitions
- Kafka integration with producers and consumers
- Retry mechanisms and dead-letter queues
- Event validation and versioning

**Key Components:**
- `KafkaProducer`: Sends events to Kafka topics
- `KafkaConsumer`: Consumes events from Kafka topics
- `EventSchemaValidator`: Validates event payloads
- `RetryPolicy`: Configures retry behavior for failed events

**Example Usage:**

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaProducer, KafkaConsumer } from '@austa/events';
import { HealthMetricRecorded } from '@austa/interfaces/events';

@Injectable()
export class HealthEventsService implements OnModuleInit {
  constructor(
    private readonly kafkaProducer: KafkaProducer,
    private readonly kafkaConsumer: KafkaConsumer
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'health.metrics',
      'gamification-consumer-group',
      this.handleHealthMetricEvent.bind(this)
    );
  }

  private async handleHealthMetricEvent(event: HealthMetricRecorded) {
    // Process health metric event
  }

  async publishMetricRecorded(metric) {
    const event: HealthMetricRecorded = {
      userId: metric.userId,
      metricType: metric.type,
      value: metric.value,
      timestamp: new Date().toISOString()
    };
    
    await this.kafkaProducer.send('health.metrics', event);
  }
}
```

### @austa/interfaces

Centralizes TypeScript interfaces for shared data models across the AUSTA SuperApp:

- Entity interfaces for all domains
- DTO definitions for API requests and responses
- Event schema interfaces
- Common utility types

**Key Components:**
- `auth/`: Authentication-related interfaces
- `journey/`: Journey-specific interfaces (health, care, plan)
- `gamification/`: Gamification-related interfaces
- `common/`: Shared utility interfaces

**Example Usage:**

```typescript
import { HealthMetric } from '@austa/interfaces/journey/health';
import { User } from '@austa/interfaces/auth';
import { AchievementEvent } from '@austa/interfaces/gamification';

@Injectable()
export class HealthService {
  async recordMetric(userId: string, data: Partial<HealthMetric>): Promise<HealthMetric> {
    // Implementation
  }
}
```

### @austa/logging

Provides structured, journey-aware logging with correlation IDs:

- Journey-specific context for all log entries
- Standardized log levels and formats
- Request correlation for tracing across services
- Integration with centralized log management

**Key Components:**
- `LoggerService`: Main logging service with context support
- `LoggerModule`: NestJS module for logger configuration
- `RequestLogger`: Middleware for HTTP request logging
- `LogContext`: Utility for managing logging context

**Example Usage:**

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: LoggerService) {}

  async recordMetric(userId: string, metric) {
    this.logger.info('Recording health metric', { 
      userId, 
      metricType: metric.type 
    });
    
    try {
      // Implementation
      this.logger.debug('Metric recorded successfully', { metricId: metric.id });
    } catch (error) {
      this.logger.error('Failed to record health metric', error, { userId });
      throw error;
    }
  }
}
```

### @austa/tracing

Implements distributed tracing with OpenTelemetry:

- Cross-service request tracking
- Performance monitoring
- Journey-specific span attributes
- Integration with logging for correlation IDs

**Key Components:**
- `TracingService`: Main service for span creation and management
- `TracingModule`: NestJS module for tracer configuration
- `Span`: Decorator for automatic method tracing
- `SpanContext`: Utility for managing active spans

**Example Usage:**

```typescript
import { Injectable } from '@nestjs/common';
import { Span, TracingService } from '@austa/tracing';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly tracingService: TracingService) {}

  @Span('recordHealthMetric')
  async recordMetric(userId: string, metric) {
    const span = this.tracingService.getActiveSpan();
    span?.setAttribute('userId', userId);
    span?.setAttribute('metricType', metric.type);
    
    // Implementation
  }
}
```

### @austa/utils

Provides common utility functions used across all services:

- HTTP utilities for API requests
- Date/time manipulation functions
- String formatting and validation
- Object transformation utilities
- Type validation helpers

**Key Components:**
- `http/`: HTTP request utilities
- `date/`: Date manipulation functions
- `string/`: String formatting and validation
- `validation/`: Input validation utilities
- `object/`: Object transformation utilities

**Example Usage:**

```typescript
import { formatDate } from '@austa/utils/date';
import { isValidEmail } from '@austa/utils/validation';
import { createHttpClient } from '@austa/utils/http';

// Format a date
const formattedDate = formatDate(new Date(), 'yyyy-MM-dd');

// Validate an email
const isValid = isValidEmail('user@example.com');

// Create an HTTP client
const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000
});
```

## Migration from @austa/shared

The packages in this directory replace the previous monolithic `@austa/shared` library. To migrate from the old structure:

1. Replace imports from `@austa/shared/*` with the appropriate package:

```typescript
// Before
import { LoggerService } from '@austa/shared/logging';
import { BusinessError } from '@austa/shared/exceptions';

// After
import { LoggerService } from '@austa/logging';
import { BusinessError } from '@austa/errors';
```

2. Update module registration in NestJS applications:

```typescript
// Before
import { LoggerModule } from '@austa/shared/logging';
import { ExceptionsModule } from '@austa/shared/exceptions';

// After
import { LoggerModule } from '@austa/logging';
import { ErrorsModule } from '@austa/errors';
```

3. Review package-specific documentation for any API changes or new features.

## Contributing

When extending or modifying these packages:

1. Maintain backward compatibility whenever possible
2. Add comprehensive tests for all new functionality
3. Update documentation to reflect changes
4. Follow the established package structure and patterns
5. Ensure proper TypeScript typing for all exports

## Package Versioning

All packages follow semantic versioning (SemVer):

- **Major version**: Breaking changes to the public API
- **Minor version**: New features in a backward-compatible manner
- **Patch version**: Backward-compatible bug fixes

Version constraints in package.json files should be as specific as possible to prevent dependency conflicts.

## Further Reading

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Kafka.js Documentation](https://kafka.js.org/docs/introduction)