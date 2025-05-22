# @austa/logging

A comprehensive, enterprise-grade logging package for the AUSTA SuperApp ecosystem that provides structured, context-aware logging with journey-specific integration, distributed tracing correlation, and configurable transports.

## Overview

The `@austa/logging` package is a critical component of the AUSTA SuperApp's observability infrastructure, providing standardized logging capabilities across all microservices. It extends NestJS's built-in logging system with journey-specific context, structured JSON formatting, and integration with distributed tracing to enable comprehensive monitoring and troubleshooting in a complex microservices environment.

## Features

- **Journey-Specific Context**: Automatically enriches logs with journey context (Health, Care, Plan) for better filtering and analysis
- **Structured JSON Logging**: Standardized JSON format for all logs, optimized for CloudWatch Logs and other aggregation systems
- **Distributed Tracing Integration**: Correlates logs with trace IDs for end-to-end request tracking
- **Multiple Transport Support**: Configurable transports for console, file, and CloudWatch outputs
- **Customizable Formatters**: Text formatter for development and JSON formatter for production
- **Context Enrichment**: Automatically includes request ID, user ID, and other contextual information
- **Sanitization**: Automatically redacts sensitive information from logs
- **Environment-Aware Configuration**: Different defaults for development and production environments
- **NestJS Integration**: Seamlessly integrates with NestJS's dependency injection system

## Installation

```bash
# npm
npm install @austa/logging

# yarn
yarn add @austa/logging

# pnpm
pnpm add @austa/logging
```

## Basic Usage

### Module Registration

Import and register the LoggerModule in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@austa/logging';

@Module({
  imports: [
    LoggerModule.forRoot({
      journey: 'health',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
})
export class AppModule {}
```

### Using the Logger

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@austa/logging';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: Logger) {}

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

## Configuration Options

The `LoggerModule.forRoot()` method accepts a configuration object with the following options:

```typescript
interface LoggerConfig {
  // The journey this service belongs to (health, care, plan)
  journey?: 'health' | 'care' | 'plan';
  
  // Minimum log level to output (debug, info, warn, error, fatal)
  level?: string;
  
  // Format of the logs (json, text, cloudwatch)
  format?: string;
  
  // Transport configuration
  transports?: {
    console?: boolean | ConsoleTransportOptions;
    file?: boolean | FileTransportOptions;
    cloudwatch?: boolean | CloudWatchTransportOptions;
  };
  
  // Default context to include in all logs
  defaultContext?: Partial<LoggingContext>;
  
  // Whether to sanitize sensitive data
  sanitize?: boolean;
  
  // Service name for identification
  serviceName?: string;
}
```

### Environment-Specific Configuration

#### Development Environment

```typescript
LoggerModule.forRoot({
  journey: 'health',
  level: 'debug',
  format: 'text',
  transports: {
    console: true,
    file: {
      filename: 'logs/app.log',
      maxFiles: 5,
      maxSize: '10m',
    },
  },
  sanitize: false,
})
```

#### Production Environment

```typescript
LoggerModule.forRoot({
  journey: 'health',
  level: 'info',
  format: 'json',
  transports: {
    console: false,
    cloudwatch: {
      logGroupName: '/austa/health-service',
      logStreamName: `${process.env.NODE_ENV}-${process.env.POD_NAME}`,
      region: process.env.AWS_REGION,
    },
  },
  sanitize: true,
  serviceName: 'health-service',
})
```

## Advanced Usage

### Journey-Specific Logging

The logging package is designed to work with the journey-centered architecture of the AUSTA SuperApp. You can provide journey-specific context to your logs:

```typescript
import { Injectable } from '@nestjs/common';
import { Logger, JourneyType } from '@austa/logging';

@Injectable()
export class CrossJourneyService {
  constructor(private readonly logger: Logger) {}

  async processHealthData(userId: string, data: any): Promise<void> {
    // Create a journey-specific logger
    const healthLogger = this.logger.withJourneyContext({
      journeyType: JourneyType.HEALTH,
      journeyId: 'health-journey-123',
    });
    
    healthLogger.info('Processing health data', { userId });
    
    // Implementation
  }
  
  async processCareAppointment(userId: string, appointmentId: string): Promise<void> {
    // Create a journey-specific logger
    const careLogger = this.logger.withJourneyContext({
      journeyType: JourneyType.CARE,
      journeyId: 'care-journey-456',
    });
    
    careLogger.info('Processing care appointment', { userId, appointmentId });
    
    // Implementation
  }
}
```

### Request Context Logging

You can automatically include request context in your logs by using the RequestContextMiddleware:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerModule, RequestContextMiddleware } from '@austa/logging';

@Module({
  imports: [LoggerModule.forRoot()],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
```

Then in your controllers and services:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Logger } from '@austa/logging';

@Controller('health')
export class HealthController {
  constructor(private readonly logger: Logger) {}

  @Get('metrics')
  getMetrics() {
    // Request context is automatically included
    this.logger.info('Retrieving health metrics');
    
    // Implementation
  }
}
```

### User Context Logging

You can include user context in your logs:

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@austa/logging';

@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  async getUserProfile(userId: string): Promise<UserProfile> {
    // Create a user-specific logger
    const userLogger = this.logger.withUserContext({
      userId,
      isAuthenticated: true,
      roles: ['user', 'premium'],
    });
    
    userLogger.info('Retrieving user profile');
    
    // Implementation
  }
}
```

### Tracing Integration

The logging package integrates with the `@austa/tracing` package to correlate logs with distributed traces:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';

@Module({
  imports: [
    TracingModule.forRoot({
      serviceName: 'health-service',
    }),
    LoggerModule.forRoot({
      journey: 'health',
      level: 'info',
    }),
  ],
})
export class AppModule {}
```

Then in your services:

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@austa/logging';
import { TraceService, Span } from '@austa/tracing';

@Injectable()
export class HealthMetricsService {
  constructor(
    private readonly logger: Logger,
    private readonly traceService: TraceService,
  ) {}

  @Span('recordHealthMetric')
  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Logs will automatically include the trace ID from the active span
    this.logger.info('Recording health metric', { 
      userId, 
      metricType: metric.type 
    });
    
    // Implementation
  }
}
```

## Available Transports

### Console Transport

Outputs logs to the console, with optional colorization for development environments.

```typescript
LoggerModule.forRoot({
  transports: {
    console: {
      colorize: true,
      // Only show logs at or above this level
      level: 'debug',
    },
  },
})
```

### File Transport

Writes logs to local files with rotation support.

```typescript
LoggerModule.forRoot({
  transports: {
    file: {
      filename: 'logs/app.log',
      // Maximum number of log files to keep
      maxFiles: 10,
      // Maximum size of each log file
      maxSize: '20m',
      // Whether to compress rotated logs
      compress: true,
      // Only show logs at or above this level
      level: 'info',
    },
  },
})
```

### CloudWatch Transport

Sends logs to AWS CloudWatch Logs for centralized aggregation and analysis.

```typescript
LoggerModule.forRoot({
  transports: {
    cloudwatch: {
      // CloudWatch log group name
      logGroupName: '/austa/health-service',
      // CloudWatch log stream name
      logStreamName: `${process.env.NODE_ENV}-${process.env.POD_NAME}`,
      // AWS region
      region: process.env.AWS_REGION,
      // AWS credentials (optional, defaults to environment variables)
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      // Only show logs at or above this level
      level: 'info',
      // Number of logs to batch before sending to CloudWatch
      batchSize: 20,
      // Maximum time to wait before sending a batch (in milliseconds)
      batchTimeout: 5000,
    },
  },
})
```

## Available Formatters

### Text Formatter

Human-readable text format with optional colorization, ideal for development environments.

```typescript
LoggerModule.forRoot({
  format: 'text',
})
```

Example output:

```
2023-04-15T14:30:45.123Z [INFO] [health-service] Recording health metric
  journey: health
  userId: user-123
  metricType: heart-rate
  requestId: req-456
```

### JSON Formatter

Structured JSON format for machine processing, ideal for production environments and log aggregation systems.

```typescript
LoggerModule.forRoot({
  format: 'json',
})
```

Example output:

```json
{
  "timestamp": "2023-04-15T14:30:45.123Z",
  "level": "info",
  "message": "Recording health metric",
  "service": "health-service",
  "journey": "health",
  "context": {
    "userId": "user-123",
    "metricType": "heart-rate",
    "requestId": "req-456"
  },
  "traceId": "trace-789"
}
```

### CloudWatch Formatter

Extends the JSON formatter with CloudWatch-specific optimizations for better querying and analysis in CloudWatch Logs Insights.

```typescript
LoggerModule.forRoot({
  format: 'cloudwatch',
})
```

## Migration Guide

### Migrating from Basic NestJS Logger

If you're currently using the basic NestJS logger, follow these steps to migrate to `@austa/logging`:

1. Install the package:

```bash
npm install @austa/logging
```

2. Update your module imports:

```typescript
// Before
import { Logger, Module } from '@nestjs/common';

@Module({
  providers: [Logger],
  exports: [Logger],
})
export class AppModule {}

// After
import { Module } from '@nestjs/common';
import { LoggerModule } from '@austa/logging';

@Module({
  imports: [
    LoggerModule.forRoot({
      journey: 'health',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
})
export class AppModule {}
```

3. Update your service implementations:

```typescript
// Before
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: Logger) {}

  async recordMetric(userId: string, metric: any): Promise<void> {
    this.logger.log(`Recording health metric for user ${userId}`);
    
    try {
      // Implementation
    } catch (error) {
      this.logger.error(`Failed to record health metric: ${error.message}`);
      throw error;
    }
  }
}

// After
import { Injectable } from '@nestjs/common';
import { Logger } from '@austa/logging';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: Logger) {}

  async recordMetric(userId: string, metric: any): Promise<void> {
    this.logger.info('Recording health metric', { userId, metricType: metric.type });
    
    try {
      // Implementation
    } catch (error) {
      this.logger.error('Failed to record health metric', error, { userId });
      throw error;
    }
  }
}
```

### Migrating from @austa/shared/logging

If you're currently using the logging module from `@austa/shared`, follow these steps to migrate to the standalone `@austa/logging` package:

1. Install the package:

```bash
npm install @austa/logging
```

2. Update your imports:

```typescript
// Before
import { LoggerModule, JourneyLogger } from '@austa/shared/logging';

// After
import { LoggerModule, Logger } from '@austa/logging';
```

3. Update your module registration:

```typescript
// Before
import { Module } from '@nestjs/common';
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
import { Module } from '@nestjs/common';
import { LoggerModule } from '@austa/logging';

@Module({
  imports: [
    LoggerModule.forRoot({ 
      journey: 'health', 
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' 
    }),
  ],
})
export class AppModule {}
```

4. Update your service implementations:

```typescript
// Before
import { Injectable } from '@nestjs/common';
import { JourneyLogger } from '@austa/shared/logging';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: JourneyLogger) {}

  async recordMetric(userId: string, metric: any): Promise<void> {
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

// After
import { Injectable } from '@nestjs/common';
import { Logger } from '@austa/logging';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly logger: Logger) {}

  async recordMetric(userId: string, metric: any): Promise<void> {
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

## API Reference

### LoggerModule

- `LoggerModule.forRoot(config: LoggerConfig)`: Registers the logger module with the provided configuration
- `LoggerModule.forRootAsync(options: LoggerModuleAsyncOptions)`: Registers the logger module with asynchronous configuration

### Logger

- `debug(message: string, context?: any)`: Logs a debug message
- `info(message: string, context?: any)`: Logs an info message
- `warn(message: string, context?: any)`: Logs a warning message
- `error(message: string, error?: Error, context?: any)`: Logs an error message
- `fatal(message: string, error?: Error, context?: any)`: Logs a fatal message
- `withContext(context: Partial<LoggingContext>)`: Creates a new logger with the provided context
- `withJourneyContext(context: Partial<JourneyContext>)`: Creates a new logger with the provided journey context
- `withUserContext(context: Partial<UserContext>)`: Creates a new logger with the provided user context
- `withRequestContext(context: Partial<RequestContext>)`: Creates a new logger with the provided request context

## Technologies

- TypeScript 5.3+
- NestJS 10.0+
- Winston 3.0+ (internal implementation)
- AWS SDK for JavaScript 3.0+ (for CloudWatch transport)

## Contributing

When extending the logging package:

1. Maintain backward compatibility
2. Include comprehensive tests
3. Follow journey-centered design principles
4. Document all public APIs and interfaces
5. Ensure proper error handling and fallbacks

## License

This package is part of the AUSTA SuperApp ecosystem and is subject to the same licensing terms as the main project.