# @austa/logging

A comprehensive, journey-aware logging package for the AUSTA SuperApp ecosystem that provides structured logging with context enrichment, distributed tracing correlation, and configurable transports.

## Overview

The `@austa/logging` package is a core component of the AUSTA SuperApp's observability stack, designed to support the journey-centered architecture with context-rich structured logging. It provides a consistent logging interface across all microservices while enabling journey-specific context that enhances log analysis and troubleshooting.

This package replaces and enhances the previous logging implementation from `@austa/shared/logging`, offering improved integration with distributed tracing, better performance, and more flexible configuration options.

## Key Features

- **Journey-Aware Logging**: Automatically enriches logs with journey context (Health, Care, Plan)
- **Structured JSON Format**: Consistent, machine-readable logs for better analysis
- **Distributed Tracing Integration**: Correlates logs with traces via correlation IDs
- **Multiple Transport Support**: Console, File, and CloudWatch transports with easy configuration
- **Context Enrichment**: Automatically includes request, user, and journey context
- **Configurable Log Levels**: Granular control over logging verbosity
- **Sanitization**: Automatic PII and sensitive data redaction
- **NestJS Integration**: Implements NestJS LoggerService interface for seamless integration

## Installation

```bash
# npm
npm install @austa/logging

# yarn
yarn add @austa/logging

# pnpm
pnpm add @austa/logging
```

## Configuration

The `LoggerModule` can be configured using the `forRoot()` method:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@austa/logging';

@Module({
  imports: [
    LoggerModule.forRoot({
      // Required: Specify the journey this service belongs to
      journey: 'health', // 'health', 'care', or 'plan'
      
      // Optional: Set the log level (defaults to 'info' in production, 'debug' in development)
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      
      // Optional: Configure transports (defaults to console in development, console+cloudwatch in production)
      transports: {
        console: true,
        file: process.env.NODE_ENV !== 'production' ? {
          path: './logs',
          maxFiles: 5,
          maxSize: '10m'
        } : false,
        cloudwatch: process.env.NODE_ENV === 'production' ? {
          logGroupName: '/austa/health-service',
          region: 'us-east-1',
          logStreamName: `${process.env.POD_NAME || 'local'}`
        } : false
      },
      
      // Optional: Configure formatters
      formatters: {
        // Use text formatter for console in development, JSON in production
        console: process.env.NODE_ENV === 'production' ? 'json' : 'text',
        file: 'json',
        cloudwatch: 'cloudwatch' // CloudWatch-optimized JSON format
      },
      
      // Optional: Default context to include in all logs
      defaultContext: {
        service: 'health-service',
        version: process.env.APP_VERSION || '1.0.0'
      }
    })
  ],
  // ...
})
export class AppModule {}
```

## Basic Usage

### Service Injection

Inject the `LoggerService` into your NestJS services:

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: LoggerService) {}

  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    this.logger.info('Recording health metric', { 
      userId, 
      metricType: metric.type 
    });
    
    try {
      // Implementation
    } catch (error) {
      this.logger.error('Failed to record health metric', error, { userId });
      throw error;
    }
  }
}
```

### Available Log Methods

The `LoggerService` provides methods for all standard log levels:

```typescript
// Basic logging
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.fatal('Fatal message');

// With metadata
logger.info('User registered', { userId: '123', email: 'user@example.com' });

// With error object
logger.error('Operation failed', new Error('Database connection error'), { operation: 'saveUser' });
```

## Journey-Specific Logging

The `LoggerService` provides methods for journey-specific context logging:

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService, JourneyType } from '@austa/logging';

@Injectable()
export class CrossJourneyService {
  constructor(private readonly logger: LoggerService) {}

  async processHealthData(userId: string, data: any): Promise<void> {
    // Use journey-specific context for Health journey
    this.logger.withJourneyContext(JourneyType.HEALTH, { userId }).info(
      'Processing health data',
      { dataSize: data.length }
    );
    
    // Process health data...
  }

  async processCareAppointment(userId: string, appointmentId: string): Promise<void> {
    // Use journey-specific context for Care journey
    this.logger.withJourneyContext(JourneyType.CARE, { userId }).info(
      'Processing care appointment',
      { appointmentId }
    );
    
    // Process care appointment...
  }

  async processPlanClaim(userId: string, claimId: string): Promise<void> {
    // Use journey-specific context for Plan journey
    this.logger.withJourneyContext(JourneyType.PLAN, { userId }).info(
      'Processing plan claim',
      { claimId }
    );
    
    // Process plan claim...
  }
}
```

## Request Context Integration

Integrate with HTTP requests to automatically include request context:

```typescript
import { Controller, Get, Req } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { Request } from 'express';

@Controller('health')
export class HealthController {
  constructor(private readonly logger: LoggerService) {}

  @Get('metrics')
  async getMetrics(@Req() request: Request) {
    // Create a logger with request context
    const requestLogger = this.logger.withRequestContext(request);
    
    requestLogger.info('Retrieving health metrics');
    
    // Implementation...
    
    requestLogger.info('Health metrics retrieved successfully');
    return { /* metrics data */ };
  }
}
```

## User Context Integration

Enrich logs with user context:

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async getUserProfile(userId: string, roles: string[]): Promise<UserProfile> {
    // Create a logger with user context
    const userLogger = this.logger.withUserContext({
      userId,
      roles,
      isAuthenticated: true
    });
    
    userLogger.info('Retrieving user profile');
    
    // Implementation...
    
    userLogger.info('User profile retrieved successfully');
    return userProfile;
  }
}
```

## Tracing Integration

Integrate with the distributed tracing system:

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TraceService, Span } from '@austa/tracing';

@Injectable()
export class HealthMetricsService {
  constructor(
    private readonly logger: LoggerService,
    private readonly traceService: TraceService
  ) {}

  @Span('recordHealthMetric')
  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Get the current active span
    const span = this.traceService.getActiveSpan();
    
    // Add attributes to the span
    span?.setAttribute('userId', userId);
    span?.setAttribute('metricType', metric.type);
    
    // Create a logger with trace context from the current span
    const tracedLogger = this.logger.withTraceContext(span);
    
    tracedLogger.info('Recording health metric', { 
      userId, 
      metricType: metric.type 
    });
    
    try {
      // Implementation
    } catch (error) {
      // Log with the same trace context
      tracedLogger.error('Failed to record health metric', error, { userId });
      throw error;
    }
  }
}
```

## Available Transports

The package includes several transport options:

### Console Transport

Outputs logs to the console, with optional colorization:

```typescript
LoggerModule.forRoot({
  journey: 'health',
  transports: {
    console: {
      colorize: true, // Enable colorization (default: true in development)
      level: 'debug' // Override the global log level for console
    }
  },
  formatters: {
    console: 'text' // Use text formatter for better readability in development
  }
})
```

### File Transport

Writes logs to local files with rotation support:

```typescript
LoggerModule.forRoot({
  journey: 'health',
  transports: {
    file: {
      path: './logs', // Directory to store log files
      filename: 'health-service-%DATE%.log', // Filename pattern
      datePattern: 'YYYY-MM-DD', // Date pattern for rotation
      maxFiles: '14d', // Keep logs for 14 days
      maxSize: '100m', // Rotate when file reaches 100MB
      zippedArchive: true // Compress rotated logs
    }
  },
  formatters: {
    file: 'json' // Use JSON formatter for machine readability
  }
})
```

### CloudWatch Transport

Sends logs to AWS CloudWatch Logs:

```typescript
LoggerModule.forRoot({
  journey: 'health',
  transports: {
    cloudwatch: {
      logGroupName: '/austa/health-service',
      region: 'us-east-1',
      logStreamName: `${process.env.POD_NAME || 'local'}`,
      createLogGroup: true,
      createLogStream: true,
      batchSize: 20, // Number of logs to batch before sending
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID, // Optional: use AWS SDK default credentials provider chain if not specified
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      retentionInDays: 30 // Set log retention policy
    }
  },
  formatters: {
    cloudwatch: 'cloudwatch' // Use CloudWatch-optimized formatter
  }
})
```

## Available Formatters

The package includes several formatters for different use cases:

### Text Formatter

Human-readable format with optional colorization, ideal for development:

```typescript
LoggerModule.forRoot({
  journey: 'health',
  formatters: {
    console: 'text'
  }
})
```

Example output:
```
2023-04-15T14:32:45.123Z [INFO] [health-service] Recording health metric
  journey: health
  userId: 123456
  metricType: heart_rate
  requestId: req-abc-123
  traceId: trace-xyz-789
```

### JSON Formatter

Structured JSON format for machine processing, ideal for log aggregation:

```typescript
LoggerModule.forRoot({
  journey: 'health',
  formatters: {
    console: 'json',
    file: 'json'
  }
})
```

Example output:
```json
{
  "timestamp": "2023-04-15T14:32:45.123Z",
  "level": "info",
  "message": "Recording health metric",
  "service": "health-service",
  "journey": "health",
  "context": {
    "userId": "123456",
    "metricType": "heart_rate"
  },
  "requestId": "req-abc-123",
  "traceId": "trace-xyz-789"
}
```

### CloudWatch Formatter

Optimized JSON format for AWS CloudWatch Logs with additional AWS-specific fields:

```typescript
LoggerModule.forRoot({
  journey: 'health',
  formatters: {
    cloudwatch: 'cloudwatch'
  }
})
```

## Migration Guide

### Migrating from @austa/shared/logging

If you're migrating from the previous `@austa/shared/logging` package, follow these steps:

1. **Update Dependencies**

```bash
# Remove old dependency
npm uninstall @austa/shared

# Install new packages
npm install @austa/logging @austa/tracing
```

2. **Update Imports**

```typescript
// Before
import { JourneyLogger } from '@austa/shared/logging';

// After
import { LoggerService } from '@austa/logging';
```

3. **Update Module Registration**

```typescript
// Before
import { LoggerModule } from '@austa/shared/logging';

@Module({
  imports: [
    LoggerModule.forRoot({ 
      journey: 'health', 
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' 
    }),
  ],
})
export class AppModule {}

// After
import { LoggerModule } from '@austa/logging';

@Module({
  imports: [
    LoggerModule.forRoot({ 
      journey: 'health', 
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transports: {
        console: true,
        cloudwatch: process.env.NODE_ENV === 'production' ? {
          logGroupName: '/austa/health-service',
          region: 'us-east-1',
          logStreamName: `${process.env.POD_NAME || 'local'}`
        } : false
      }
    }),
  ],
})
export class AppModule {}
```

4. **Update Method Calls**

```typescript
// Before
this.logger.info('Message', { context: 'value' });

// After - similar API, but with enhanced context support
this.logger.info('Message', { context: 'value' });

// Before - adding user context
this.logger.setContext({ userId: '123' });
this.logger.info('User action');

// After - using context builders
this.logger.withUserContext({ userId: '123' }).info('User action');
```

5. **Update Tracing Integration**

```typescript
// Before
import { TraceService } from '@austa/shared/tracing';

@Injectable()
export class Service {
  constructor(
    private readonly logger: JourneyLogger,
    private readonly traceService: TraceService
  ) {}

  @Span('operation')
  async method() {
    const span = this.traceService.getActiveSpan();
    this.logger.setTraceId(span.context().traceId);
    this.logger.info('Operation started');
  }
}

// After
import { TraceService, Span } from '@austa/tracing';

@Injectable()
export class Service {
  constructor(
    private readonly logger: LoggerService,
    private readonly traceService: TraceService
  ) {}

  @Span('operation')
  async method() {
    const span = this.traceService.getActiveSpan();
    const tracedLogger = this.logger.withTraceContext(span);
    tracedLogger.info('Operation started');
  }
}
```

## Best Practices

### Log Levels

Use appropriate log levels for different types of information:

- **DEBUG**: Detailed information for debugging purposes
- **INFO**: General information about application progress
- **WARN**: Potential issues that don't prevent the application from working
- **ERROR**: Errors that prevent a function from working
- **FATAL**: Critical errors that prevent the application from working

### Structured Metadata

Always include relevant metadata as a structured object:

```typescript
// Good - structured metadata
logger.info('User registered', { userId: '123', email: 'user@example.com', plan: 'premium' });

// Avoid - unstructured string concatenation
logger.info(`User registered: ${userId}, email: ${email}, plan: ${plan}`);
```

### Context Enrichment

Use context builders to enrich logs with relevant context:

```typescript
// Create a logger with request and user context
const contextLogger = this.logger
  .withRequestContext(request)
  .withUserContext({ userId, roles });

// All logs will include both request and user context
contextLogger.info('Processing request');
```

### Error Logging

Always include the error object when logging errors:

```typescript
try {
  // Implementation
} catch (error) {
  // Pass the error object as the second parameter
  this.logger.error('Operation failed', error, { operationId: '123' });
  throw error;
}
```

### Sensitive Data

Avoid logging sensitive information. The logger automatically redacts common sensitive fields, but be careful with custom data:

```typescript
// Avoid - contains sensitive data
logger.info('User authenticated', { 
  userId: '123', 
  password: 'secret', // Will be redacted, but better to exclude entirely
  creditCard: '1234-5678-9012-3456' // Will be redacted, but better to exclude entirely
});

// Better - exclude sensitive data
logger.info('User authenticated', { userId: '123' });
```

## API Reference

### LoggerService

The main service for logging throughout the application.

#### Basic Logging Methods

- `debug(message: string, metadata?: Record<string, any>): void`
- `info(message: string, metadata?: Record<string, any>): void`
- `warn(message: string, metadata?: Record<string, any>): void`
- `error(message: string, error?: Error, metadata?: Record<string, any>): void`
- `fatal(message: string, error?: Error, metadata?: Record<string, any>): void`

#### Context Builders

- `withRequestContext(request: Request): LoggerService`
- `withUserContext(userContext: UserContext): LoggerService`
- `withJourneyContext(journeyType: JourneyType, context?: Record<string, any>): LoggerService`
- `withTraceContext(span: Span): LoggerService`
- `withContext(context: Record<string, any>): LoggerService`

### LoggerModule

The NestJS module for configuring and providing the LoggerService.

- `forRoot(config: LoggerConfig): DynamicModule`
- `forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule`

### LoggerConfig

Configuration options for the LoggerModule.

```typescript
interface LoggerConfig {
  journey: 'health' | 'care' | 'plan';
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  transports?: {
    console?: boolean | ConsoleTransportConfig;
    file?: boolean | FileTransportConfig;
    cloudwatch?: boolean | CloudWatchTransportConfig;
  };
  formatters?: {
    console?: 'json' | 'text';
    file?: 'json' | 'text';
    cloudwatch?: 'json' | 'cloudwatch';
  };
  defaultContext?: Record<string, any>;
}
```

## License

This package is part of the AUSTA SuperApp ecosystem and is covered by the company's proprietary license.