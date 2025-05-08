# Circuit Breaker Middleware Usage Guide

## Overview

The Circuit Breaker middleware implements the circuit breaker pattern for database operations to prevent cascading failures during database outages. This middleware tracks operation failures and automatically opens the circuit when failure thresholds are exceeded, preventing further operations until the database recovers.

## Features

- Configurable failure thresholds for different operation types
- Automatic recovery testing with exponential backoff
- Half-open circuit state management
- Integration with application monitoring for circuit state alerting
- Journey-specific circuit configuration

## Basic Usage

```typescript
import { CircuitBreakerMiddleware, OperationType } from '@austa/database';
import { LoggerService } from '@austa/logging';

// Create an instance of the circuit breaker middleware
const circuitBreaker = new CircuitBreakerMiddleware(loggerService);

// Execute a database operation with circuit breaker protection
async function fetchUserData(userId: string) {
  try {
    return await circuitBreaker.executeWithCircuitBreaker(
      async () => {
        // Your database operation here
        return await prisma.user.findUnique({ where: { id: userId } });
      },
      OperationType.READ,
      'health' // Optional journey context
    );
  } catch (error) {
    // Handle error (circuit might be open)
    if (error.message.includes('Circuit breaker is open')) {
      // Return cached data or fallback response
      return getFallbackUserData(userId);
    }
    throw error;
  }
}
```

## Advanced Configuration

```typescript
import { CircuitBreakerMiddleware, OperationType } from '@austa/database';
import { LoggerService } from '@austa/logging';

// Create an instance with custom configuration
const circuitBreaker = new CircuitBreakerMiddleware(loggerService, {
  // Number of failures required to open the circuit for each operation type
  failureThreshold: {
    [OperationType.READ]: 5,
    [OperationType.WRITE]: 3,
    [OperationType.TRANSACTION]: 2,
    [OperationType.MIGRATION]: 1,
  },
  
  // Time in milliseconds to wait before attempting to close the circuit
  // This will be multiplied by 2^recoveryAttempt for exponential backoff
  resetTimeout: 30000, // 30 seconds
  
  // Maximum number of operations allowed in half-open state
  halfOpenMaxOperations: 3,
  
  // Whether to emit monitoring events for circuit state changes
  monitoringEnabled: true,
  
  // Journey-specific failure thresholds that override the default thresholds
  journeySpecificThresholds: {
    'health': {
      [OperationType.READ]: 10, // Higher threshold for health journey reads
      [OperationType.WRITE]: 5,  // Higher threshold for health journey writes
    },
    'care': {
      [OperationType.TRANSACTION]: 1, // Lower threshold for care journey transactions
    },
  },
});
```

## Integration with NestJS

```typescript
import { Module } from '@nestjs/common';
import { CircuitBreakerMiddleware, OperationType } from '@austa/database';
import { LoggerService } from '@austa/logging';

@Module({
  providers: [
    {
      provide: CircuitBreakerMiddleware,
      useFactory: (loggerService: LoggerService) => {
        return new CircuitBreakerMiddleware(loggerService, {
          failureThreshold: {
            [OperationType.READ]: 5,
            [OperationType.WRITE]: 3,
            [OperationType.TRANSACTION]: 2,
            [OperationType.MIGRATION]: 1,
          },
          resetTimeout: 30000,
          halfOpenMaxOperations: 3,
          monitoringEnabled: true,
          journeySpecificThresholds: {},
        });
      },
      inject: [LoggerService],
    },
    // Other providers
  ],
  exports: [CircuitBreakerMiddleware],
})
export class DatabaseModule {}
```

## Using with PrismaService

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CircuitBreakerMiddleware, OperationType } from '@austa/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly circuitBreaker: CircuitBreakerMiddleware) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async findUserById(id: string) {
    return this.circuitBreaker.executeWithCircuitBreaker(
      () => this.user.findUnique({ where: { id } }),
      OperationType.READ,
      'health'
    );
  }

  async createUser(data: any) {
    return this.circuitBreaker.executeWithCircuitBreaker(
      () => this.user.create({ data }),
      OperationType.WRITE,
      'health'
    );
  }

  async updateUserWithTransaction(id: string, data: any) {
    return this.circuitBreaker.executeWithCircuitBreaker(
      () => this.$transaction(async (tx) => {
        const user = await tx.user.update({ where: { id }, data });
        await tx.userActivity.create({
          data: {
            userId: id,
            action: 'UPDATE',
            timestamp: new Date(),
          },
        });
        return user;
      }),
      OperationType.TRANSACTION,
      'health'
    );
  }
}
```

## Monitoring Circuit State

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CircuitBreakerMiddleware, CircuitState, OperationType } from '@austa/database';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CircuitBreakerMonitoringService implements OnModuleInit {
  constructor(
    private readonly circuitBreaker: CircuitBreakerMiddleware,
    private readonly metricsService: MetricsService,
  ) {}

  onModuleInit() {
    // Register metrics
    this.metricsService.registerGauge('database_circuit_state', 'Database circuit breaker state');
    this.metricsService.registerCounter('database_circuit_open_count', 'Number of times circuit breaker opened');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  monitorCircuitState() {
    const state = this.circuitBreaker.getState();
    
    // Update metrics
    this.metricsService.setGauge('database_circuit_state', state === CircuitState.OPEN ? 1 : 0);
    
    // Log current state
    if (state === CircuitState.OPEN) {
      this.metricsService.incrementCounter('database_circuit_open_count');
    }
  }
}
```

## Best Practices

1. **Configure appropriate thresholds**: Set failure thresholds based on the criticality of the operation. Critical operations should have lower thresholds to fail fast.

2. **Use journey-specific thresholds**: Different journeys may have different reliability requirements. Configure journey-specific thresholds accordingly.

3. **Implement fallback mechanisms**: Always have fallback mechanisms when the circuit is open, such as returning cached data or degraded functionality.

4. **Monitor circuit state**: Integrate with your monitoring system to track circuit state changes and alert on prolonged open circuits.

5. **Test circuit breaker behavior**: Include tests that verify the circuit breaker opens and closes as expected under different failure scenarios.

6. **Consider operation types**: Use the appropriate operation type (READ, WRITE, TRANSACTION, MIGRATION) to ensure proper threshold application.

7. **Combine with retry strategies**: For transient errors, combine circuit breaker with retry strategies to handle temporary failures before opening the circuit.