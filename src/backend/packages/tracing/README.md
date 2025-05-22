# @austa/tracing

A comprehensive distributed tracing package for the AUSTA SuperApp ecosystem that provides standardized OpenTelemetry integration, trace context propagation, and correlation with logs across all microservices.

## Overview

The `@austa/tracing` package implements distributed tracing capabilities for the journey-centered architecture of the AUSTA SuperApp. It enables end-to-end visibility into request flows across microservices, helping developers identify performance bottlenecks, troubleshoot errors, and understand system behavior in production.

This package is part of the AUSTA SuperApp refactoring effort to address critical architectural issues while preserving the platform's key technical capabilities.

## Features

- **OpenTelemetry Integration**: Standards-based distributed tracing implementation
- **Cross-Service Request Tracking**: Follow requests as they traverse multiple services
- **Journey-Specific Span Attributes**: Enrich traces with journey context
- **Performance Monitoring**: Identify bottlenecks and optimize critical paths
- **Error Tracing**: Capture and correlate errors across service boundaries
- **Log Correlation**: Connect traces with logs using correlation IDs
- **Automatic Instrumentation**: Minimal code changes required for basic tracing

## Installation

```bash
# npm
npm install @austa/tracing

# yarn
yarn add @austa/tracing
```

## Usage

### Module Registration

Import and register the TracingModule in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { TracingModule } from '@austa/tracing';

@Module({
  imports: [
    TracingModule.forRoot({
      serviceName: 'health-service',
      environment: process.env.NODE_ENV || 'development',
    }),
  ],
})
export class AppModule {}
```

### Basic Tracing Example

Use the TracingService to create spans around operations:

```typescript
import { Injectable } from '@nestjs/common';
import { TracingService } from '@austa/tracing';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly tracingService: TracingService) {}

  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    return this.tracingService.createSpan('recordHealthMetric', async () => {
      // The operation is automatically traced with start/end times
      // Any errors will be recorded in the span
      
      // Add custom attributes to the span
      const span = this.tracingService.getActiveSpan();
      span?.setAttribute('userId', userId);
      span?.setAttribute('metricType', metric.type);
      span?.setAttribute('journey', 'health');
      
      // Implement the operation
      await this.healthMetricsRepository.save(metric);
    });
  }
}
```

### Using the Span Decorator

For simpler use cases, you can use the `@Span` decorator:

```typescript
import { Injectable } from '@nestjs/common';
import { Span } from '@austa/tracing';

@Injectable()
export class AppointmentService {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  @Span('bookAppointment')
  async bookAppointment(data: AppointmentDto): Promise<Appointment> {
    // This method is automatically traced
    return this.appointmentRepository.create(data);
  }
}
```

### Manual Span Creation

For more complex scenarios, you can manually create and manage spans:

```typescript
import { Injectable } from '@nestjs/common';
import { TracingService } from '@austa/tracing';

@Injectable()
export class PaymentService {
  constructor(private readonly tracingService: TracingService) {}

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Create a parent span for the entire operation
    return this.tracingService.createSpan('processPayment', async () => {
      const parentSpan = this.tracingService.getActiveSpan();
      parentSpan?.setAttribute('paymentId', paymentData.id);
      parentSpan?.setAttribute('amount', paymentData.amount);
      
      // Validate the payment data
      await this.tracingService.createSpan('validatePayment', async () => {
        await this.validatePayment(paymentData);
      });
      
      // Process the payment with the payment gateway
      const result = await this.tracingService.createSpan('paymentGatewayRequest', async () => {
        const gatewaySpan = this.tracingService.getActiveSpan();
        gatewaySpan?.setAttribute('gateway', paymentData.gateway);
        
        return await this.paymentGateway.process(paymentData);
      });
      
      // Record the payment result
      await this.tracingService.createSpan('recordPaymentResult', async () => {
        await this.paymentRepository.saveResult(result);
      });
      
      return result;
    });
  }
}
```

### Integrating with HTTP Requests

Trace HTTP requests between services:

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TracingService } from '@austa/tracing';

@Injectable()
export class ExternalApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly tracingService: TracingService,
  ) {}

  async fetchUserData(userId: string): Promise<UserData> {
    return this.tracingService.createSpan('fetchUserData', async () => {
      const span = this.tracingService.getActiveSpan();
      span?.setAttribute('userId', userId);
      
      // The tracing headers are automatically added to the request
      // This allows the trace to continue in the external service if it supports OpenTelemetry
      const response = await this.httpService.get(`/api/users/${userId}`, {
        headers: this.tracingService.getPropagationHeaders(),
      }).toPromise();
      
      return response.data;
    });
  }
}
```

### Integrating with Kafka Events

Trace Kafka events between services:

```typescript
import { Injectable } from '@nestjs/common';
import { KafkaProducer } from '@austa/events';
import { TracingService } from '@austa/tracing';

@Injectable()
export class GameEventsService {
  constructor(
    private readonly kafkaProducer: KafkaProducer,
    private readonly tracingService: TracingService,
  ) {}

  async publishAchievementEvent(achievementEvent: AchievementEvent): Promise<void> {
    return this.tracingService.createSpan('publishAchievementEvent', async () => {
      const span = this.tracingService.getActiveSpan();
      span?.setAttribute('achievementId', achievementEvent.achievementId);
      span?.setAttribute('userId', achievementEvent.userId);
      
      // Add trace context to the Kafka message headers
      const headers = this.tracingService.getPropagationHeaders();
      
      await this.kafkaProducer.send('game.achievements', achievementEvent, { headers });
    });
  }
}
```

### Integrating with Logging

Correlate traces with logs:

```typescript
import { Injectable } from '@nestjs/common';
import { JourneyLogger } from '@austa/logging';
import { TracingService } from '@austa/tracing';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: JourneyLogger,
    private readonly tracingService: TracingService,
  ) {}

  async createUser(userData: UserData): Promise<User> {
    return this.tracingService.createSpan('createUser', async () => {
      // Get the current trace ID and span ID for correlation
      const traceId = this.tracingService.getTraceId();
      const spanId = this.tracingService.getSpanId();
      
      // Add the trace and span IDs to the log context
      this.logger.info('Creating new user', { 
        userData,
        traceId,
        spanId,
      });
      
      try {
        // Implement user creation
        const user = await this.userRepository.create(userData);
        
        this.logger.info('User created successfully', { 
          userId: user.id,
          traceId,
          spanId,
        });
        
        return user;
      } catch (error) {
        // Log errors with trace correlation
        this.logger.error('Failed to create user', error, { 
          userData,
          traceId,
          spanId,
        });
        throw error;
      }
    });
  }
}
```

## Configuration

The TracingModule can be configured with various options:

```typescript
TracingModule.forRoot({
  // Required: Name of the service for identification in traces
  serviceName: 'health-service',
  
  // Optional: Environment (development, staging, production)
  environment: process.env.NODE_ENV || 'development',
  
  // Optional: Whether to enable tracing (default: true)
  enabled: process.env.ENABLE_TRACING !== 'false',
  
  // Optional: Sampling rate (0.0 - 1.0, default: 1.0 in development, 0.1 in production)
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Optional: OpenTelemetry exporter configuration
  exporter: {
    // OTLP exporter endpoint (default: http://localhost:4317)
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    
    // Headers for authentication with the collector
    headers: {
      'x-api-key': process.env.OTEL_API_KEY,
    },
  },
  
  // Optional: Additional resource attributes
  resourceAttributes: {
    'service.version': process.env.npm_package_version,
    'deployment.environment': process.env.DEPLOYMENT_ENV,
  },
});
```

## Environment-Specific Configuration

### Development Environment

For local development, you can use Jaeger as a simple tracing backend:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TracingModule } from '@austa/tracing';

@Module({
  imports: [
    TracingModule.forRoot({
      serviceName: 'health-service',
      environment: 'development',
      samplingRate: 1.0, // Sample all traces in development
      exporter: {
        endpoint: 'http://localhost:4317', // Default Jaeger OTLP endpoint
      },
    }),
  ],
})
export class AppModule {}
```

Start Jaeger using Docker:

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4317:4317 \
  jaegertracing/all-in-one:latest
```

Access the Jaeger UI at http://localhost:16686 to view traces.

### Production Environment

For production, you can use a managed OpenTelemetry service like Datadog, New Relic, or AWS X-Ray:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TracingModule } from '@austa/tracing';

@Module({
  imports: [
    TracingModule.forRoot({
      serviceName: 'health-service',
      environment: 'production',
      samplingRate: 0.1, // Sample 10% of traces in production to reduce volume
      exporter: {
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers: {
          'x-api-key': process.env.OTEL_API_KEY,
        },
      },
      resourceAttributes: {
        'service.version': process.env.SERVICE_VERSION,
        'deployment.region': process.env.AWS_REGION,
      },
    }),
  ],
})
export class AppModule {}
```

## Best Practices

### 1. Use Descriptive Span Names

Choose span names that clearly describe the operation being performed:

```typescript
// Good
await tracingService.createSpan('health.metrics.record', async () => { ... });

// Avoid
await tracingService.createSpan('recordMetric', async () => { ... });
```

### 2. Add Relevant Attributes

Enrich spans with attributes that provide context for analysis:

```typescript
const span = tracingService.getActiveSpan();
span?.setAttribute('userId', userId);
span?.setAttribute('metricType', metric.type);
span?.setAttribute('journey', 'health');
span?.setAttribute('source', 'wearable');
```

### 3. Structure Span Names Hierarchically

Use a consistent naming convention for spans to make them easier to filter and analyze:

```typescript
// Format: journey.entity.operation
await tracingService.createSpan('health.metrics.record', async () => { ... });
await tracingService.createSpan('care.appointment.book', async () => { ... });
await tracingService.createSpan('plan.claim.submit', async () => { ... });
```

### 4. Propagate Context Across Boundaries

Ensure trace context is propagated across service boundaries:

```typescript
// HTTP requests
const headers = tracingService.getPropagationHeaders();
const response = await httpService.get(url, { headers }).toPromise();

// Kafka messages
const headers = tracingService.getPropagationHeaders();
await kafkaProducer.send(topic, message, { headers });
```

### 5. Correlate Traces with Logs

Include trace and span IDs in log entries for correlation:

```typescript
const traceId = tracingService.getTraceId();
const spanId = tracingService.getSpanId();

logger.info('Processing payment', { 
  paymentId, 
  amount, 
  traceId, 
  spanId 
});
```

### 6. Use Span Events for Significant Occurrences

Record important events within a span's lifecycle:

```typescript
const span = tracingService.getActiveSpan();
span?.addEvent('payment_authorized', {
  paymentId,
  amount,
  provider: 'stripe',
});
```

### 7. Set Appropriate Sampling Rates

Adjust sampling rates based on environment and traffic volume:

```typescript
TracingModule.forRoot({
  serviceName: 'api-gateway',
  // Development: sample all traces
  // Production: sample 10% of traces
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

### 8. Handle Errors Properly

Ensure errors are properly recorded in spans:

```typescript
try {
  // Operation that might fail
} catch (error) {
  const span = tracingService.getActiveSpan();
  span?.recordException(error);
  span?.setStatus({ code: SpanStatusCode.ERROR });
  throw error;
}
```

## Migration Guide

If you're migrating from the shared module (`@austa/shared/tracing`), follow these steps:

### 1. Update Dependencies

Update your package.json to use the new package:

```diff
{
  "dependencies": {
-   "@austa/shared": "^1.0.0"
+   "@austa/tracing": "^1.0.0"
  }
}
```

### 2. Update Imports

Update import statements throughout your codebase:

```diff
- import { TracingModule } from '@austa/shared/tracing';
- import { TracingService } from '@austa/shared/tracing';
- import { Span } from '@austa/shared/tracing';
+ import { TracingModule, TracingService, Span } from '@austa/tracing';
```

### 3. Update Module Registration

Update the module registration in your application:

```diff
@Module({
  imports: [
-   TracingModule,
+   TracingModule.forRoot({
+     serviceName: 'health-service',
+     environment: process.env.NODE_ENV || 'development',
+   }),
  ],
})
export class AppModule {}
```

### 4. Update Method Calls

The new package includes enhanced methods with additional features:

```diff
- await tracingService.createSpan('recordMetric', async () => {
+ await tracingService.createSpan('health.metrics.record', async () => {
    const span = tracingService.getActiveSpan();
    span?.setAttribute('userId', userId);
+   span?.setAttribute('journey', 'health');
    
    // Implementation
  });
```

## Technologies

- TypeScript 5.3+
- NestJS 10.3+
- OpenTelemetry SDK 1.4+
- Node.js 18+

## Contributing

When extending the tracing package:

1. Maintain backward compatibility
2. Include comprehensive tests
3. Follow journey-centered design principles
4. Document all public APIs and interfaces
5. Ensure proper context propagation across service boundaries