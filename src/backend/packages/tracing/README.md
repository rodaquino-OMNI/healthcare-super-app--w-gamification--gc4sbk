# @austa/tracing

A comprehensive distributed tracing package for the AUSTA SuperApp ecosystem that provides OpenTelemetry integration, span management, and trace context propagation across microservices.

## Overview

The `@austa/tracing` package enables end-to-end distributed tracing across all microservices in the AUSTA SuperApp, providing visibility into request flows, performance bottlenecks, and cross-service interactions. Built on OpenTelemetry, this package offers a standardized approach to instrumenting code with traces while maintaining journey-specific context.

Key features include:

- **OpenTelemetry Integration**: Standards-based tracing with support for multiple backends
- **Automatic Context Propagation**: Maintains trace context across service boundaries
- **Journey-Specific Tracing**: Adds business context to technical traces
- **Correlation with Logs**: Connects traces with logs for unified troubleshooting
- **Performance Monitoring**: Identifies bottlenecks and slow operations
- **Declarative API**: Simple decorators and methods for instrumenting code

## Installation

```bash
# npm
npm install @austa/tracing

# yarn
yarn add @austa/tracing

# pnpm
pnpm add @austa/tracing
```

## Configuration

The tracing module can be configured using the `TracingModule.forRoot()` method in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { TracingModule } from '@austa/tracing';

@Module({
  imports: [
    TracingModule.forRoot({
      serviceName: 'health-service',
      samplingRatio: 1.0, // Sample 100% of traces in development
      exporterType: 'jaeger', // Options: 'jaeger', 'zipkin', 'otlp', 'console'
      exporterOptions: {
        endpoint: 'http://jaeger:14268/api/traces',
      },
      journeyContext: 'health', // Options: 'health', 'care', 'plan'
    }),
  ],
})
export class AppModule {}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serviceName` | string | 'austa-service' | Name of the service in traces |
| `samplingRatio` | number | 1.0 | Percentage of traces to sample (0.0-1.0) |
| `exporterType` | string | 'console' | Type of trace exporter to use |
| `exporterOptions` | object | {} | Configuration for the selected exporter |
| `journeyContext` | string | undefined | Journey context for span attributes |
| `disableAutoInstrumentation` | boolean | false | Disable automatic instrumentation |
| `logCorrelation` | boolean | true | Enable correlation with logs |

### Environment-Specific Configuration

```typescript
// Development configuration
TracingModule.forRoot({
  serviceName: 'health-service',
  samplingRatio: 1.0, // Sample all traces
  exporterType: 'console', // Output to console for local development
  logCorrelation: true,
})

// Testing configuration
TracingModule.forRoot({
  serviceName: 'health-service-test',
  samplingRatio: 0, // Disable tracing in tests
  disableAutoInstrumentation: true,
})

// Production configuration
TracingModule.forRoot({
  serviceName: 'health-service',
  samplingRatio: 0.1, // Sample 10% of traces
  exporterType: 'otlp',
  exporterOptions: {
    url: process.env.OTLP_ENDPOINT,
    headers: {
      'x-api-key': process.env.OTLP_API_KEY,
    },
  },
  journeyContext: 'health',
})
```

## Usage

### Basic Tracing

Inject the `TracingService` into your service and create spans for operations:

```typescript
import { Injectable } from '@nestjs/common';
import { TracingService } from '@austa/tracing';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly tracingService: TracingService) {}

  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Create a new span for this operation
    const span = this.tracingService.startSpan('recordHealthMetric');
    
    try {
      // Add relevant attributes to the span
      span.setAttribute('userId', userId);
      span.setAttribute('metricType', metric.type);
      span.setAttribute('metricValue', metric.value.toString());
      
      // Perform the operation
      await this.saveMetricToDatabase(metric);
      
      // Mark the span as successful
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      // Record the error in the span
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      // Always end the span
      span.end();
    }
  }
}
```

### Using the Span Decorator

For simpler instrumentation, use the `@Span()` decorator:

```typescript
import { Injectable } from '@nestjs/common';
import { Span, TracingService } from '@austa/tracing';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly tracingService: TracingService) {}

  @Span('recordHealthMetric')
  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Get the current span created by the decorator
    const span = this.tracingService.getActiveSpan();
    
    // Add attributes to the span
    span?.setAttribute('userId', userId);
    span?.setAttribute('metricType', metric.type);
    
    // The decorator automatically handles ending the span and recording errors
    await this.saveMetricToDatabase(metric);
  }
}
```

### Tracing Asynchronous Operations

Use the `withSpan` method to trace asynchronous operations:

```typescript
import { Injectable } from '@nestjs/common';
import { TracingService } from '@austa/tracing';

@Injectable()
export class AppointmentService {
  constructor(private readonly tracingService: TracingService) {}

  async bookAppointment(appointmentData: AppointmentDto): Promise<Appointment> {
    return this.tracingService.withSpan(
      'bookAppointment',
      async (span) => {
        span.setAttribute('providerId', appointmentData.providerId);
        span.setAttribute('patientId', appointmentData.patientId);
        span.setAttribute('appointmentType', appointmentData.type);
        
        // Check provider availability in a child span
        const isAvailable = await this.tracingService.withSpan(
          'checkProviderAvailability',
          async (childSpan) => {
            childSpan.setAttribute('providerId', appointmentData.providerId);
            childSpan.setAttribute('dateTime', appointmentData.dateTime.toISOString());
            
            return await this.providerService.checkAvailability(
              appointmentData.providerId,
              appointmentData.dateTime
            );
          }
        );
        
        if (!isAvailable) {
          throw new Error('Provider not available at requested time');
        }
        
        // Create the appointment
        return await this.appointmentRepository.create(appointmentData);
      }
    );
  }
}
```

### Integrating with Logging

Correlate traces with logs using the correlation utilities:

```typescript
import { Injectable } from '@nestjs/common';
import { JourneyLogger } from '@austa/logging';
import { TracingService, getTraceCorrelation } from '@austa/tracing';

@Injectable()
export class HealthMetricsService {
  constructor(
    private readonly logger: JourneyLogger,
    private readonly tracingService: TracingService,
  ) {}

  @Span('recordHealthMetric')
  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Get correlation IDs from the current trace context
    const correlation = getTraceCorrelation();
    
    // Add correlation to logs
    this.logger.info('Recording health metric', { 
      userId, 
      metricType: metric.type,
      ...correlation, // Adds traceId and spanId to the log
    });
    
    try {
      await this.saveMetricToDatabase(metric);
      
      this.logger.info('Health metric recorded successfully', {
        userId,
        metricId: metric.id,
        ...correlation,
      });
    } catch (error) {
      this.logger.error('Failed to record health metric', error, { 
        userId,
        ...correlation,
      });
      throw error;
    }
  }
}
```

### Propagating Trace Context Across Services

Propagate trace context in HTTP requests:

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TracingService, injectTraceContext, extractTraceContext } from '@austa/tracing';

@Injectable()
export class ExternalApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly tracingService: TracingService,
  ) {}

  @Span('callExternalApi')
  async fetchData(endpoint: string): Promise<any> {
    // Create headers with trace context
    const headers = {};
    injectTraceContext(headers); // Adds trace context to headers
    
    // Make the HTTP request with trace context
    const response = await this.httpService.get(endpoint, { headers }).toPromise();
    return response.data;
  }
}

// In the receiving service (e.g., a controller):
@Controller('api')
export class ApiController {
  constructor(private readonly tracingService: TracingService) {}

  @Get('data')
  async getData(@Headers() headers): Promise<any> {
    // Extract trace context from incoming request
    const parentContext = extractTraceContext(headers);
    
    // Start a new span as a child of the parent context
    return this.tracingService.withSpan(
      'processDataRequest',
      async (span) => {
        // Process the request
        return { data: 'example' };
      },
      { parentContext } // Use the extracted context as parent
    );
  }
}
```

Propagate trace context in Kafka messages:

```typescript
import { Injectable } from '@nestjs/common';
import { KafkaProducer, KafkaConsumer } from '@austa/events';
import { TracingService, injectTraceContextToKafka, extractTraceContextFromKafka } from '@austa/tracing';

@Injectable()
export class HealthEventService {
  constructor(
    private readonly kafkaProducer: KafkaProducer,
    private readonly tracingService: TracingService,
  ) {}

  @Span('publishHealthEvent')
  async publishMetricRecorded(userId: string, metricId: string): Promise<void> {
    const event = {
      userId,
      metricId,
      timestamp: new Date().toISOString(),
    };
    
    // Add trace context to Kafka message headers
    const headers = {};
    injectTraceContextToKafka(headers);
    
    await this.kafkaProducer.send('health.metrics.recorded', event, { headers });
  }
}

// In the consumer service:
@Injectable()
export class GameEventsService {
  constructor(
    private readonly kafkaConsumer: KafkaConsumer,
    private readonly tracingService: TracingService,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'health.metrics.recorded',
      'game-service-group',
      this.handleHealthMetricEvent.bind(this)
    );
  }

  private async handleHealthMetricEvent(message: any, headers: any): Promise<void> {
    // Extract trace context from Kafka message headers
    const parentContext = extractTraceContextFromKafka(headers);
    
    // Process the event in the context of the original trace
    await this.tracingService.withSpan(
      'processHealthMetricEvent',
      async (span) => {
        span.setAttribute('userId', message.userId);
        span.setAttribute('metricId', message.metricId);
        
        // Process the event
        await this.checkAchievements(message.userId, message.metricId);
      },
      { parentContext }
    );
  }
}
```

### Journey-Specific Tracing

Add journey context to traces for better business insights:

```typescript
import { Injectable } from '@nestjs/common';
import { TracingService, JourneyContext } from '@austa/tracing';

@Injectable()
export class HealthGoalService {
  constructor(private readonly tracingService: TracingService) {}

  @Span('createHealthGoal')
  async createGoal(userId: string, goalData: HealthGoalDto): Promise<HealthGoal> {
    const span = this.tracingService.getActiveSpan();
    
    // Add standard attributes
    span?.setAttribute('userId', userId);
    span?.setAttribute('goalType', goalData.type);
    
    // Add health journey context
    span?.setAttribute(JourneyContext.JOURNEY_TYPE, 'health');
    span?.setAttribute(JourneyContext.HEALTH_GOAL_TYPE, goalData.type);
    span?.setAttribute(JourneyContext.HEALTH_METRIC_TARGET, goalData.targetValue.toString());
    
    // Create the goal
    const goal = await this.goalRepository.create({
      userId,
      ...goalData,
    });
    
    // Add result context
    span?.setAttribute(JourneyContext.HEALTH_GOAL_ID, goal.id);
    
    return goal;
  }
}
```

## API Reference

### TracingService

The main service for creating and managing spans:

| Method | Description |
|--------|-------------|
| `startSpan(name: string, options?: SpanOptions)` | Creates and starts a new span |
| `getActiveSpan()` | Gets the current active span |
| `withSpan<T>(name: string, fn: (span: Span) => Promise<T>, options?: SpanOptions)` | Executes a function within a new span |
| `setGlobalAttribute(key: string, value: string)` | Sets an attribute on all future spans |
| `getTracer()` | Gets the underlying OpenTelemetry tracer |

### Decorators

| Decorator | Description |
|-----------|-------------|
| `@Span(name?: string)` | Creates a span around a method |
| `@WithSpan(options?: SpanOptions)` | Creates a customizable span around a method |

### Utility Functions

| Function | Description |
|----------|-------------|
| `getTraceCorrelation()` | Gets correlation IDs from current trace context |
| `injectTraceContext(carrier: object)` | Injects trace context into a carrier object |
| `extractTraceContext(carrier: object)` | Extracts trace context from a carrier object |
| `injectTraceContextToKafka(headers: object)` | Injects trace context into Kafka headers |
| `extractTraceContextFromKafka(headers: object)` | Extracts trace context from Kafka headers |

### Constants

| Constant | Description |
|----------|-------------|
| `JourneyContext` | Constants for journey-specific span attributes |
| `SpanAttributes` | Constants for common span attributes |
| `ErrorCodes` | Error code constants for tracing operations |

## Migration Guide

### Migrating from @austa/shared/tracing

If you're currently using the tracing functionality from the shared module, follow these steps to migrate to the new dedicated package:

1. **Update Dependencies**

   ```bash
   # Remove dependency on shared module (if no longer needed)
   npm uninstall @austa/shared
   
   # Install the new tracing package
   npm install @austa/tracing
   ```

2. **Update Imports**

   ```typescript
   // Before
   import { TracingModule } from '@austa/shared/tracing';
   import { TraceService } from '@austa/shared/tracing';
   import { Span } from '@austa/shared/tracing';
   
   // After
   import { TracingModule } from '@austa/tracing';
   import { TracingService } from '@austa/tracing'; // Note the name change
   import { Span } from '@austa/tracing';
   ```

3. **Update Module Registration**

   ```typescript
   // Before
   @Module({
     imports: [
       TracingModule.forRoot({
         serviceName: 'health-service',
       }),
     ],
   })
   
   // After - with enhanced configuration
   @Module({
     imports: [
       TracingModule.forRoot({
         serviceName: 'health-service',
         journeyContext: 'health',
         samplingRatio: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
         exporterType: process.env.NODE_ENV === 'production' ? 'otlp' : 'console',
         exporterOptions: process.env.NODE_ENV === 'production' 
           ? { url: process.env.OTLP_ENDPOINT }
           : {},
       }),
     ],
   })
   ```

4. **Update Service Injection**

   ```typescript
   // Before
   constructor(private readonly traceService: TraceService) {}
   
   // After
   constructor(private readonly tracingService: TracingService) {}
   ```

5. **Update Method Calls**

   ```typescript
   // Before
   const span = this.traceService.getActiveSpan();
   
   // After
   const span = this.tracingService.getActiveSpan();
   ```

6. **Enhance with New Features**

   Take advantage of new features like correlation with logs and journey context:

   ```typescript
   // Add correlation with logs
   const correlation = getTraceCorrelation();
   this.logger.info('Operation completed', { ...correlation });
   
   // Add journey context
   span?.setAttribute(JourneyContext.JOURNEY_TYPE, 'health');
   ```

## Best Practices

### Effective Tracing

1. **Name spans meaningfully**: Use descriptive names that indicate the operation being performed

2. **Add relevant attributes**: Include business context, user IDs, and operation-specific details

3. **Create child spans for sub-operations**: Break down complex operations into smaller spans

4. **Always end spans**: Use try/finally or the withSpan method to ensure spans are ended

5. **Record exceptions**: Capture errors in spans to correlate failures with traces

### Performance Considerations

1. **Use sampling in production**: Set an appropriate sampling ratio to control trace volume

2. **Be selective with attributes**: Only add attributes that provide meaningful context

3. **Consider span cardinality**: Avoid creating too many unique span names

4. **Use batch processing for exporters**: Configure exporters to batch spans for efficiency

### Integration with Other Systems

1. **Correlate with logs**: Always include trace and span IDs in log messages

2. **Propagate context**: Ensure trace context is propagated across service boundaries

3. **Add business context**: Include journey-specific attributes for business insights

4. **Monitor trace data**: Set up dashboards to visualize trace data and identify issues

## Technologies

- TypeScript 5.3+
- NestJS 10.0+
- OpenTelemetry SDK 1.4.1+

## Contributing

When extending the tracing package:

1. Maintain backward compatibility
2. Include comprehensive tests
3. Follow journey-centered design principles
4. Document all public APIs and interfaces
5. Consider performance implications of changes