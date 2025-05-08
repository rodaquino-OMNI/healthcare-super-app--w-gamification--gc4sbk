# @austa/database

A comprehensive database access package for the AUSTA SuperApp ecosystem that provides enhanced database connectivity, transaction management, error handling, and journey-specific optimizations across all microservices.

## Overview

The `@austa/database` package serves as the foundation for all database operations in the AUSTA SuperApp. It extends Prisma ORM with enterprise-grade features including connection pooling, comprehensive error handling, transaction management, and journey-specific database contexts. This package ensures consistent, reliable, and optimized database access across all journey services.

## Key Features

### Enhanced PrismaService

An extended PrismaClient implementation with advanced features:

- **Connection Pooling**: Configurable connection pool with dynamic scaling based on load
- **Lifecycle Management**: Proper integration with NestJS lifecycle for clean connection handling
- **Query Logging**: Comprehensive logging with privacy-aware data redaction
- **Performance Tracking**: Automatic detection and reporting of slow queries

### Journey-Specific Database Contexts

Specialized database contexts for each journey with optimized queries and domain-specific operations:

- **Health Context**: Optimized for time-series health metrics with TimescaleDB integration
- **Care Context**: Specialized for appointment booking, provider management, and telemedicine
- **Plan Context**: Optimized for insurance plans, benefits, and claims processing

### Comprehensive Transaction Management

Robust transaction handling with advanced features:

- **Isolation Levels**: Support for all PostgreSQL isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE)
- **Savepoints**: Partial transaction rollback capabilities
- **Distributed Transactions**: Two-phase commit protocol for cross-service operations
- **Declarative Transactions**: `@Transactional()` decorator for clean, declarative transaction management

### Robust Error Handling

Comprehensive error management system:

- **Error Classification**: Categorization of database errors by type, severity, and recoverability
- **Error Transformation**: Conversion of low-level database errors to domain-specific exceptions
- **Retry Strategies**: Configurable retry policies with exponential backoff and circuit breaker
- **Journey-Specific Errors**: Domain-specific error codes and messages for each journey

### Database Middleware

Extensible middleware system for cross-cutting database concerns:

- **Circuit Breaker**: Prevents cascading failures during database outages
- **Query Transformation**: Optimizes queries and implements cross-cutting concerns
- **Performance Monitoring**: Tracks query execution times and identifies bottlenecks
- **Query Logging**: Captures database operations with configurable detail levels

### Connection Management

Comprehensive connection handling:

- **Connection Pooling**: Efficient reuse of database connections
- **Health Monitoring**: Continuous validation of connection health
- **Retry Mechanisms**: Automatic recovery from transient connection failures
- **Resource Optimization**: Idle connection cleanup and dynamic pool sizing

## Installation

```bash
# npm
npm install @austa/database

# yarn
yarn add @austa/database
```

## Usage

### Basic Setup

Import and register the DatabaseModule in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@austa/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      // Optional configuration overrides
      connectionPool: {
        min: 5,
        max: 20,
        idle: 10000
      },
      logging: {
        slowQueryThreshold: 1000, // ms
        logQueries: process.env.NODE_ENV !== 'production'
      }
    })
  ],
})
export class AppModule {}
```

### Using PrismaService

Inject and use the enhanced PrismaService in your repositories or services:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@austa/database';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

### Using Journey-Specific Contexts

Inject and use journey-specific database contexts for optimized operations:

```typescript
import { Injectable } from '@nestjs/common';
import { HealthContext } from '@austa/database/contexts';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly healthContext: HealthContext) {}

  async getMetricsByDateRange(userId: string, startDate: Date, endDate: Date) {
    // Uses TimescaleDB optimizations for time-series data
    return this.healthContext.getMetricsTimeSeries(userId, startDate, endDate);
  }

  async recordMetric(userId: string, metricType: string, value: number) {
    return this.healthContext.createHealthMetric({
      userId,
      type: metricType,
      value,
      recordedAt: new Date()
    });
  }
}
```

### Transaction Management

Use the declarative `@Transactional()` decorator for clean transaction handling:

```typescript
import { Injectable } from '@nestjs/common';
import { Transactional, TransactionIsolationLevel } from '@austa/database/transactions';
import { PlanContext } from '@austa/database/contexts';

@Injectable()
export class ClaimService {
  constructor(private readonly planContext: PlanContext) {}

  @Transactional({
    isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
    maxRetries: 3
  })
  async submitClaim(userId: string, claimData: ClaimSubmissionDto) {
    // All database operations in this method will be executed in a transaction
    // If any operation fails, the entire transaction will be rolled back
    // The method will automatically retry up to 3 times on transient errors
    
    const claim = await this.planContext.createClaim({
      userId,
      ...claimData,
      status: 'SUBMITTED',
      submittedAt: new Date()
    });
    
    await this.planContext.updateUserClaimHistory(userId, {
      lastClaimId: claim.id,
      lastClaimDate: claim.submittedAt
    });
    
    return claim;
  }
}
```

For more complex scenarios, use the TransactionService directly:

```typescript
import { Injectable } from '@nestjs/common';
import { TransactionService, TransactionIsolationLevel } from '@austa/database/transactions';
import { PrismaService } from '@austa/database';

@Injectable()
export class ComplexOperationService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly prisma: PrismaService
  ) {}

  async executeComplexOperation() {
    return this.transactionService.executeInTransaction(
      async (tx) => {
        // Use the transaction client for all operations
        const result1 = await tx.user.findMany({
          where: { active: true }
        });
        
        const result2 = await tx.profile.create({
          data: { /* ... */ }
        });
        
        // Create a savepoint
        const savepoint = await tx.savepoint('after-profile-creation');
        
        try {
          await tx.settings.create({
            data: { /* ... */ }
          });
        } catch (error) {
          // Rollback to savepoint if settings creation fails
          await savepoint.rollback();
          // Continue with the transaction
        }
        
        return { result1, result2 };
      },
      {
        isolationLevel: TransactionIsolationLevel.REPEATABLE_READ,
        timeout: 5000 // 5 seconds
      }
    );
  }
}
```

### Error Handling

Use specialized database exceptions for better error handling:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@austa/database';
import { 
  DatabaseException, 
  QueryException,
  IntegrityException 
} from '@austa/database/errors';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          profile: {
            create: {
              bio: data.bio
            }
          }
        }
      });
    } catch (error) {
      // The original Prisma error is automatically transformed
      // into a more specific DatabaseException
      if (error instanceof IntegrityException) {
        // Handle unique constraint violations (e.g., duplicate email)
        throw new UserAlreadyExistsException(data.email);
      } else if (error instanceof QueryException) {
        // Handle query execution errors
        throw new UserCreationFailedException(error.message);
      } else if (error instanceof DatabaseException) {
        // Handle other database-related errors
        throw new DatabaseOperationFailedException(error.message);
      }
      throw error;
    }
  }
}
```

### Retry Strategies

Configure custom retry strategies for specific operations:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@austa/database';
import { RetryStrategyFactory, ExponentialBackoffStrategy } from '@austa/database/errors';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retryStrategyFactory: RetryStrategyFactory
  ) {}

  async processPayment(paymentData: PaymentDto) {
    const retryStrategy = this.retryStrategyFactory.create({
      type: 'exponential',
      maxAttempts: 5,
      initialDelay: 100,
      maxDelay: 5000,
      jitter: true
    });

    return retryStrategy.execute(async () => {
      // This operation will be retried up to 5 times with exponential backoff
      return this.prisma.payment.create({
        data: {
          amount: paymentData.amount,
          userId: paymentData.userId,
          status: 'PROCESSING'
        }
      });
    });
  }
}
```

## Migration Guide

### Migrating from Direct Prisma Usage

If you're currently using Prisma directly in your services, follow these steps to migrate to @austa/database:

1. **Replace PrismaClient with PrismaService**:

   Before:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   
   const prisma = new PrismaClient();
   ```

   After:
   ```typescript
   import { PrismaService } from '@austa/database';
   
   @Injectable()
   export class YourService {
     constructor(private readonly prisma: PrismaService) {}
   }
   ```

2. **Update Error Handling**:

   Before:
   ```typescript
   try {
     return await prisma.user.findUnique({ where: { id } });
   } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
       // Handle Prisma errors
     }
     throw error;
   }
   ```

   After:
   ```typescript
   try {
     return await this.prisma.user.findUnique({ where: { id } });
   } catch (error) {
     if (error instanceof DatabaseException) {
       // More specific error handling with DatabaseException hierarchy
     }
     throw error;
   }
   ```

3. **Migrate Transaction Handling**:

   Before:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // Transaction operations
   });
   ```

   After:
   ```typescript
   // Option 1: Use @Transactional decorator
   @Transactional()
   async yourMethod() {
     // All database operations are automatically wrapped in a transaction
   }
   
   // Option 2: Use TransactionService
   await this.transactionService.executeInTransaction(async (tx) => {
     // Transaction operations with more control
   }, { isolationLevel: TransactionIsolationLevel.SERIALIZABLE });
   ```

4. **Adopt Journey-Specific Contexts** (where applicable):

   Before:
   ```typescript
   const healthMetrics = await prisma.healthMetric.findMany({
     where: { userId, recordedAt: { gte: startDate, lte: endDate } }
   });
   ```

   After:
   ```typescript
   // Use specialized context with optimized queries
   const healthMetrics = await this.healthContext.getMetricsTimeSeries(
     userId, startDate, endDate
   );
   ```

## API Reference

### PrismaService

Extends the standard PrismaClient with enhanced features:

```typescript
class PrismaService extends PrismaClient {
  // Creates a new PrismaService with optional configuration
  constructor(options?: PrismaServiceOptions);
  
  // Connects to the database with connection pooling
  async onModuleInit(): Promise<void>;
  
  // Gracefully closes all connections
  async onModuleDestroy(): Promise<void>;
  
  // Gets the current connection status
  getConnectionStatus(): ConnectionStatus;
  
  // Executes a callback with a fresh connection
  withConnection<T>(callback: (client: PrismaClient) => Promise<T>): Promise<T>;
}
```

### Journey Contexts

Specialized database contexts for each journey:

```typescript
// Base context with shared functionality
abstract class BaseJourneyContext {
  // Executes a callback within a transaction
  executeInTransaction<T>(
    callback: (tx: TransactionClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  
  // Creates a new transaction client
  createTransaction(options?: TransactionOptions): Promise<TransactionClient>;
}

// Health journey context
class HealthContext extends BaseJourneyContext {
  // Gets time-series health metrics with TimescaleDB optimizations
  getMetricsTimeSeries(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    options?: TimeSeriesOptions
  ): Promise<HealthMetric[]>;
  
  // Creates a new health metric
  createHealthMetric(data: CreateHealthMetricDto): Promise<HealthMetric>;
  
  // Additional health-specific methods...
}

// Care journey context
class CareContext extends BaseJourneyContext {
  // Finds available appointment slots
  findAvailableAppointments(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentSlot[]>;
  
  // Books an appointment with a provider
  bookAppointment(data: BookAppointmentDto): Promise<Appointment>;
  
  // Additional care-specific methods...
}

// Plan journey context
class PlanContext extends BaseJourneyContext {
  // Gets user's insurance plan with benefits
  getUserPlanWithBenefits(userId: string): Promise<Plan>;
  
  // Submits an insurance claim
  createClaim(data: CreateClaimDto): Promise<Claim>;
  
  // Additional plan-specific methods...
}
```

### Transaction Management

Comprehensive transaction handling:

```typescript
// Transaction isolation levels
enum TransactionIsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE'
}

// Transaction options
interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeout?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

// Transaction client interface
interface TransactionClient extends PrismaClient {
  // Creates a savepoint within the transaction
  savepoint(name: string): Promise<Savepoint>;
  
  // Commits the transaction
  commit(): Promise<void>;
  
  // Rolls back the transaction
  rollback(): Promise<void>;
}

// Savepoint interface
interface Savepoint {
  // Rolls back to this savepoint
  rollback(): Promise<void>;
  
  // Releases this savepoint
  release(): Promise<void>;
}

// Transaction service
class TransactionService {
  // Executes a callback within a transaction
  executeInTransaction<T>(
    callback: (tx: TransactionClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  
  // Creates a new transaction
  createTransaction(options?: TransactionOptions): Promise<TransactionClient>;
}

// Transactional decorator
function Transactional(options?: TransactionOptions): MethodDecorator;
```

### Error Handling

Comprehensive error handling system:

```typescript
// Base database exception
class DatabaseException extends Error {
  readonly code: string;
  readonly type: DatabaseErrorType;
  readonly severity: DatabaseErrorSeverity;
  readonly recoverable: boolean;
  readonly context: Record<string, any>;
}

// Specialized exceptions
class ConnectionException extends DatabaseException {}
class QueryException extends DatabaseException {}
class TransactionException extends DatabaseException {}
class IntegrityException extends DatabaseException {}
class ConfigurationException extends DatabaseException {}

// Error types
enum DatabaseErrorType {
  CONNECTION = 'connection',
  QUERY = 'query',
  TRANSACTION = 'transaction',
  INTEGRITY = 'integrity',
  CONFIGURATION = 'configuration'
}

// Error severity
enum DatabaseErrorSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor'
}

// Retry strategy factory
class RetryStrategyFactory {
  create(options: RetryStrategyOptions): RetryStrategy;
}

// Retry strategy interface
interface RetryStrategy {
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

// Exponential backoff strategy
class ExponentialBackoffStrategy implements RetryStrategy {
  constructor(options: ExponentialBackoffOptions);
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

// Circuit breaker strategy
class CircuitBreakerStrategy implements RetryStrategy {
  constructor(options: CircuitBreakerOptions);
  execute<T>(operation: () => Promise<T>): Promise<T>;
}
```

## Technologies

- TypeScript 5.3+
- NestJS 10.0+
- Prisma ORM 4.0+
- PostgreSQL 14+
- TimescaleDB (for time-series data)

## Contributing

When extending the database package:

1. Maintain backward compatibility with existing database operations
2. Add comprehensive tests for all new functionality
3. Follow journey-centered design principles
4. Document all public APIs and interfaces
5. Ensure proper error handling and transaction management