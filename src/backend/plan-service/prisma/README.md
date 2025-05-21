# Plan Service Prisma Implementation

This document provides comprehensive guidance for working with the Prisma ORM in the Plan Service. It covers schema structure, model definitions, migration workflows, connection pooling configuration, and integration strategies.

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Model Definitions](#model-definitions)
3. [Database Connection](#database-connection)
4. [Migration Workflows](#migration-workflows)
5. [Connection Pooling](#connection-pooling)
6. [Journey-Specific Database Contexts](#journey-specific-database-contexts)
7. [Testing and Seeding](#testing-and-seeding)
8. [Best Practices](#best-practices)
9. [Claim Lifecycle](#claim-lifecycle)

## Schema Overview

The Plan Service Prisma schema defines the data models for the "My Plan & Benefits" journey, including insurance plans, coverage details, claims, benefits, and related documents. The schema is organized in the `schema.prisma` file with the following structure:

```prisma
// Database connection configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["plan"]
}

// Client generator configuration
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

// Model definitions...
```

The schema uses PostgreSQL's schema feature to isolate Plan Service data in the `plan` schema, preventing table name collisions with other services in the same database instance.

## Model Definitions

The Plan Service schema includes the following core models:

### Plans

Represents insurance plans available to users, including details about coverage, costs, and eligibility.

### Coverage

Defines specific coverage details for procedures, consultations, and other medical services under a plan.

### Benefits

Represents additional benefits available to plan members, such as discounts, wellness programs, and special services.

### Claims

Tracks insurance claims submitted by users, including their status, associated documents, and processing details.

### Documents

Stores metadata about documents uploaded for claims, such as medical receipts, prescriptions, and other supporting materials.

## Database Connection

The Plan Service connects to the database using the enhanced `PrismaService` from the shared database package. This service extends the standard Prisma Client with additional features:

```typescript
// In app.module.ts
import { PrismaService } from '../../shared/src/database/prisma.service';

@Module({
  // ...
  providers: [PrismaService],
})
export class AppModule {}
```

The database connection is configured through environment variables defined in the service's configuration:

```typescript
// In configuration.ts
database: {
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  schema: process.env.DATABASE_SCHEMA || 'plan',
  ssl: process.env.DATABASE_SSL !== 'false',
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
},
```

## Migration Workflows

The Plan Service uses Prisma Migrate to manage database schema changes. Migrations are stored in the `prisma/migrations` directory and tracked in version control.

### Creating a New Migration

To create a new migration:

1. Update the `schema.prisma` file with your model changes
2. Generate a migration with a descriptive name:

```bash
npx prisma migrate dev --name add_claim_status_history
```

3. Review the generated migration in `prisma/migrations/[timestamp]_add_claim_status_history`
4. Commit both the schema changes and the migration files

### Applying Migrations

Migrations are applied automatically during development with `prisma migrate dev` and in production environments with `prisma migrate deploy`.

For local development:

```bash
npx prisma migrate dev
```

For production deployment:

```bash
npx prisma migrate deploy
```

### Migration Best Practices

1. **Create focused migrations**: Each migration should address a single concern
2. **Use descriptive names**: Migration names should clearly describe the changes
3. **Test migrations**: Verify migrations work correctly before committing
4. **Include rollback plans**: Document how to revert migrations if needed
5. **Coordinate with other services**: Ensure migrations don't break cross-service functionality

## Connection Pooling

The Plan Service implements connection pooling to optimize database performance and resource utilization. Connection pooling is configured through the `DATABASE_POOL_SIZE` environment variable (default: 20).

### Benefits of Connection Pooling

1. **Reduced connection overhead**: Reusing connections eliminates the cost of establishing new connections
2. **Improved performance**: Faster query execution by eliminating connection setup time
3. **Resource management**: Prevents database resource exhaustion by limiting the number of connections
4. **Connection stability**: Handles connection failures and reconnections automatically

### Configuration

Connection pooling is configured in the `PrismaService` with the following parameters:

- **Pool size**: Maximum number of connections in the pool (default: 20)
- **Connection timeout**: Maximum time to wait for a connection (default: 30 seconds)
- **Idle timeout**: Time after which idle connections are released (default: 10 minutes)

These settings can be adjusted based on the specific load patterns of the Plan Service.

## Journey-Specific Database Contexts

The Plan Service uses journey-specific database contexts to isolate data access patterns and optimize query performance for the "My Plan & Benefits" journey.

### Context Usage

Journey contexts are implemented as specialized repositories that encapsulate data access logic for specific use cases:

```typescript
// Example of using a journey-specific context
import { PlanJourneyContext } from '@austa/database';

@Injectable()
export class ClaimsService {
  constructor(private readonly planContext: PlanJourneyContext) {}

  async submitClaim(claimData: CreateClaimDto): Promise<Claim> {
    return this.planContext.claims.create({
      data: {
        // Claim data...
      },
      include: {
        documents: true,
      },
    });
  }
}
```

### Benefits of Journey Contexts

1. **Domain-specific queries**: Optimized queries for journey-specific access patterns
2. **Encapsulated business logic**: Database operations include journey-specific validation and processing
3. **Improved testability**: Easier to mock and test database operations
4. **Consistent error handling**: Standardized error handling for database operations

## Testing and Seeding

The Plan Service includes tools for testing database operations and seeding test data.

### Database Seeding

The `prisma/seed.ts` script populates the database with initial data for development and testing:

```bash
npx prisma db seed
```

This script creates:
- Basic plan types and tiers
- Common benefit categories
- Sample claims for testing
- Test user associations

### Testing Database Operations

The Plan Service uses a test database for integration and end-to-end tests. Test utilities are provided to:

1. Create an isolated test database environment
2. Apply migrations to the test database
3. Seed test-specific data
4. Clean up after tests complete

Example test setup:

```typescript
import { PrismaService } from '@austa/database';
import { TestDatabaseHelper } from '../../test/helpers/database.helper';

describe('ClaimsService', () => {
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;

  beforeAll(async () => {
    dbHelper = new TestDatabaseHelper();
    prisma = await dbHelper.createTestPrismaService();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
  });

  // Tests...
});
```

## Best Practices

### Schema Management

1. **Use explicit types**: Always specify column types explicitly
2. **Add constraints**: Use appropriate constraints for data integrity
3. **Include documentation**: Document models and fields with comments
4. **Use relations**: Define proper relations between models
5. **Consider indexes**: Add indexes for frequently queried fields

### Query Optimization

1. **Use select**: Only retrieve needed fields to reduce data transfer
2. **Batch operations**: Use `createMany`, `updateMany` for bulk operations
3. **Optimize includes**: Only include related data when necessary
4. **Use transactions**: Wrap related operations in transactions
5. **Consider pagination**: Use `skip` and `take` for large result sets

### Version Control

1. **Commit schema and migrations together**: Keep schema and migrations in sync
2. **Review migrations carefully**: Ensure migrations are safe and reversible
3. **Test migrations**: Verify migrations work correctly before committing
4. **Document breaking changes**: Clearly document any breaking schema changes

## Claim Lifecycle

The Plan Service implements a state machine for claim processing with the following status transitions:

```
DRAFT → SUBMITTED → UNDER_REVIEW → [APPROVED | REJECTED | ADDITIONAL_INFO_REQUIRED]
                                      ↑                   ↓
                                      └───────────────────┘
```

### Claim Status Definitions

- **DRAFT**: Claim is being prepared by the user but not yet submitted
- **SUBMITTED**: Claim has been submitted and is awaiting initial review
- **UNDER_REVIEW**: Claim is being reviewed by insurance personnel
- **ADDITIONAL_INFO_REQUIRED**: Claim requires additional information from the user
- **APPROVED**: Claim has been approved for payment
- **REJECTED**: Claim has been rejected

### Status Transition Rules

1. New claims start in **DRAFT** status
2. User submission changes status to **SUBMITTED**
3. Initial processing changes status to **UNDER_REVIEW**
4. From **UNDER_REVIEW**, claims can transition to:
   - **APPROVED**: If all requirements are met
   - **REJECTED**: If claim does not meet criteria
   - **ADDITIONAL_INFO_REQUIRED**: If more information is needed
5. From **ADDITIONAL_INFO_REQUIRED**, claims return to **UNDER_REVIEW** when information is provided

The claim status history is tracked to provide a complete audit trail of the claim's lifecycle.