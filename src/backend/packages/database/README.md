# @austa/database

A comprehensive database access package for the AUSTA SuperApp ecosystem that provides enhanced Prisma integration, connection pooling, transaction management, and journey-specific database contexts.

## Overview

The `@austa/database` package serves as the foundation for database interactions across all microservices in the AUSTA SuperApp. It provides a standardized approach to database access with optimized connection management, robust error handling, and journey-specific contexts. This package implements best practices for healthcare applications while supporting the unique requirements of each journey.

## Features

### Enhanced PrismaService

- **Connection Pooling**: Optimized database connections with automatic management
- **Middleware Integration**: Pre-configured middleware for logging, metrics, and error handling
- **Type Safety**: Full TypeScript support with Prisma-generated types
- **Query Optimization**: Built-in query optimization and monitoring

### Transaction Management

- **Atomic Operations**: Support for ACID-compliant transactions
- **Nested Transactions**: Proper handling of nested transaction scopes
- **Retry Strategies**: Configurable retry policies for transient failures
- **Distributed Transactions**: Support for transactions across service boundaries

### Journey-Specific Contexts

- **Health Journey Context**: Specialized context for health metrics and goals
- **Care Journey Context**: Optimized for appointment and provider data
- **Plan Journey Context**: Tailored for insurance plans and claims
- **Cross-Journey Access**: Controlled access to data across journey boundaries

### Error Handling

- **Standardized Errors**: Consistent error classification and handling
- **Detailed Diagnostics**: Rich error information for troubleshooting
- **Retry Mechanisms**: Automatic retry for transient database errors
- **Error Translation**: Conversion of database errors to domain-specific exceptions

## Installation

```bash
# npm
npm install @austa/database

# yarn
yarn add @austa/database

# pnpm
pnpm add @austa/database
```

## Usage

### Basic Setup

Register the database module in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@austa/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      journey: 'health',
      connectionString: process.env.DATABASE_URL,
      poolSize: 10,
      logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'query',
    }),
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
```

### Using PrismaService

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@austa/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class HealthMetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMetricsByUserId(userId: string) {
    return this.prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      include: { device: true },
    });
  }

  async createMetric(data: Prisma.HealthMetricCreateInput) {
    return this.prisma.healthMetric.create({ data });
  }
}
```

### Transaction Management

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService, TransactionManager } from '@austa/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txManager: TransactionManager,
  ) {}

  async bookAppointment(appointmentData: AppointmentDto) {
    // Using the transaction manager for atomic operations
    return this.txManager.execute(async (tx) => {
      // Check provider availability within the transaction
      const isAvailable = await this.checkAvailability(tx, appointmentData);
      
      if (!isAvailable) {
        throw new Error('Provider is not available at this time');
      }
      
      // Create appointment within the transaction
      const appointment = await tx.appointment.create({
        data: {
          userId: appointmentData.userId,
          providerId: appointmentData.providerId,
          scheduledAt: appointmentData.dateTime,
          status: 'SCHEDULED',
          notes: appointmentData.notes,
        },
      });
      
      // Update provider's schedule within the same transaction
      await tx.providerSchedule.update({
        where: {
          providerId_date: {
            providerId: appointmentData.providerId,
            date: appointmentData.dateTime.toISOString().split('T')[0],
          },
        },
        data: {
          availableSlots: {
            decrement: 1,
          },
        },
      });
      
      return appointment;
    }, {
      // Configure retry strategy for this transaction
      maxRetries: 3,
      retryDelay: 100, // ms
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }
  
  private async checkAvailability(tx: Prisma.TransactionClient, data: AppointmentDto) {
    // Implementation of availability check using the transaction client
    const schedule = await tx.providerSchedule.findUnique({
      where: {
        providerId_date: {
          providerId: data.providerId,
          date: data.dateTime.toISOString().split('T')[0],
        },
      },
    });
    
    return schedule && schedule.availableSlots > 0;
  }
}
```

### Journey-Specific Database Contexts

```typescript
import { Injectable } from '@nestjs/common';
import { HealthJourneyContext, PlanJourneyContext } from '@austa/database';

@Injectable()
export class UserHealthService {
  constructor(
    private readonly healthContext: HealthJourneyContext,
    private readonly planContext: PlanJourneyContext,
  ) {}

  async getUserHealthDashboard(userId: string) {
    // Access health journey data using the specialized context
    const healthMetrics = await this.healthContext.metrics.findLatestForUser(userId);
    const healthGoals = await this.healthContext.goals.findActiveForUser(userId);
    
    // Access plan journey data for coverage information
    const coverageInfo = await this.planContext.coverage.findForUser(userId);
    
    return {
      metrics: healthMetrics,
      goals: healthGoals,
      coverage: coverageInfo,
    };
  }
}
```

### Error Handling

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService, DatabaseError, TransientError } from '@austa/database';

@Injectable()
export class MedicationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserMedications(userId: string) {
    try {
      return await this.prisma.medication.findMany({
        where: { userId },
        include: { schedule: true, reminders: true },
      });
    } catch (error) {
      // Handle specific database errors
      if (error instanceof TransientError) {
        // Retry logic for transient errors
        return this.retryGetUserMedications(userId, 3);
      }
      
      if (error instanceof DatabaseError) {
        // Log detailed database error information
        console.error('Database error:', error.code, error.message, error.details);
        
        // Translate to domain-specific error
        throw new MedicationAccessError(
          'Unable to retrieve medications',
          error.code,
          { userId }
        );
      }
      
      // Re-throw unknown errors
      throw error;
    }
  }
  
  private async retryGetUserMedications(userId: string, attempts: number) {
    // Implementation of retry logic
  }
}
```

## Migrating from Direct Prisma Usage

If you're currently using Prisma directly in your services, follow these steps to migrate to the enhanced `@austa/database` package:

### 1. Update Dependencies

Add the `@austa/database` package to your service:

```bash
yarn add @austa/database
```

### 2. Replace PrismaClient Instantiation

**Before:**

```typescript
import { PrismaClient } from '@prisma/client';

// Direct instantiation of PrismaClient
const prisma = new PrismaClient();

// Or in a NestJS service
@Injectable()
export class MyService {
  private prisma = new PrismaClient();
  
  // Service methods...
}
```

**After:**

```typescript
import { Module, Injectable } from '@nestjs/common';
import { DatabaseModule, PrismaService } from '@austa/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      journey: 'health', // Specify your journey
      connectionString: process.env.DATABASE_URL,
    }),
  ],
})
export class AppModule {}

@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}
  
  // Service methods...
}
```

### 3. Update Transaction Usage

**Before:**

```typescript
// Direct transaction with PrismaClient
const result = await prisma.$transaction(async (tx) => {
  // Transaction operations
  const user = await tx.user.findUnique({ where: { id: userId } });
  await tx.profile.update({ where: { userId }, data: { lastActive: new Date() } });
  return user;
});
```

**After:**

```typescript
import { TransactionManager } from '@austa/database';

@Injectable()
export class UserService {
  constructor(private readonly txManager: TransactionManager) {}
  
  async updateUserActivity(userId: string) {
    return this.txManager.execute(async (tx) => {
      // Transaction operations with enhanced features
      const user = await tx.user.findUnique({ where: { id: userId } });
      await tx.profile.update({ where: { userId }, data: { lastActive: new Date() } });
      return user;
    }, {
      // Optional configuration
      maxRetries: 3,
      retryDelay: 100,
    });
  }
}
```

### 4. Implement Error Handling

**Before:**

```typescript
try {
  return await prisma.user.findUnique({ where: { id: userId } });
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch user');
}
```

**After:**

```typescript
import { DatabaseError, TransientError, NotFoundError } from '@austa/database';

try {
  return await this.prisma.user.findUnique({ where: { id: userId } });
} catch (error) {
  if (error instanceof NotFoundError) {
    throw new UserNotFoundError(userId);
  }
  
  if (error instanceof TransientError) {
    // Implement retry logic or use TransactionManager with retries
    return this.retryOperation(() => this.prisma.user.findUnique({ where: { id: userId } }));
  }
  
  if (error instanceof DatabaseError) {
    // Log detailed information and translate to domain error
    this.logger.error('Database error', { code: error.code, details: error.details });
    throw new DatabaseAccessError('Failed to fetch user', error.code);
  }
  
  throw error;
}
```

## Journey-Specific Database Contexts

The package provides specialized contexts for each journey in the AUSTA SuperApp:

### Health Journey Context

```typescript
import { HealthJourneyContext } from '@austa/database';

@Injectable()
export class HealthService {
  constructor(private readonly healthContext: HealthJourneyContext) {}
  
  async getUserHealthSummary(userId: string) {
    const metrics = await this.healthContext.metrics.findLatestByType(userId, ['HEART_RATE', 'BLOOD_PRESSURE', 'WEIGHT']);
    const goals = await this.healthContext.goals.findActive(userId);
    const devices = await this.healthContext.devices.findConnected(userId);
    
    return { metrics, goals, devices };
  }
}
```

### Care Journey Context

```typescript
import { CareJourneyContext } from '@austa/database';

@Injectable()
export class CareService {
  constructor(private readonly careContext: CareJourneyContext) {}
  
  async getUserCareOverview(userId: string) {
    const appointments = await this.careContext.appointments.findUpcoming(userId);
    const medications = await this.careContext.medications.findActive(userId);
    const providers = await this.careContext.providers.findPreferred(userId);
    
    return { appointments, medications, providers };
  }
}
```

### Plan Journey Context

```typescript
import { PlanJourneyContext } from '@austa/database';

@Injectable()
export class PlanService {
  constructor(private readonly planContext: PlanJourneyContext) {}
  
  async getUserPlanDetails(userId: string) {
    const plan = await this.planContext.plans.findActive(userId);
    const benefits = await this.planContext.benefits.findByPlan(plan.id);
    const claims = await this.planContext.claims.findRecent(userId, 5);
    
    return { plan, benefits, claims };
  }
}
```

## Advanced Configuration

### Custom Middleware

```typescript
import { DatabaseModule } from '@austa/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      journey: 'health',
      connectionString: process.env.DATABASE_URL,
      middleware: {
        query: [
          async (params, next) => {
            const start = Date.now();
            const result = await next(params);
            const duration = Date.now() - start;
            console.log(`Query ${params.model}.${params.action} took ${duration}ms`);
            return result;
          },
        ],
      },
    }),
  ],
})
export class AppModule {}
```

### Connection Pooling Configuration

```typescript
import { DatabaseModule } from '@austa/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      journey: 'health',
      connectionString: process.env.DATABASE_URL,
      pooling: {
        min: 5,
        max: 20,
        idleTimeoutMs: 30000,
        acquireTimeoutMs: 60000,
      },
    }),
  ],
})
export class AppModule {}
```

### Custom Error Handlers

```typescript
import { DatabaseModule, DatabaseErrorHandler } from '@austa/database';

@Injectable()
class CustomErrorHandler implements DatabaseErrorHandler {
  handleError(error: Error, context: any) {
    // Custom error handling logic
    console.error('Database error:', error, context);
    
    // Translate to domain-specific error
    if (error.message.includes('duplicate key')) {
      return new DuplicateResourceError(context.model, context.data);
    }
    
    return error;
  }
}

@Module({
  imports: [
    DatabaseModule.forRoot({
      journey: 'health',
      connectionString: process.env.DATABASE_URL,
      errorHandler: CustomErrorHandler,
    }),
  ],
})
export class AppModule {}
```

## Technologies

- TypeScript 5.3+
- NestJS 10.0+
- Prisma ORM 5.10+
- PostgreSQL 14+
- TimescaleDB (for time-series data)

## Contributing

When extending the database package:

1. Maintain backward compatibility
2. Add comprehensive tests for all new features
3. Document all public APIs and interfaces
4. Follow journey-centered design principles
5. Ensure proper error handling and transaction management