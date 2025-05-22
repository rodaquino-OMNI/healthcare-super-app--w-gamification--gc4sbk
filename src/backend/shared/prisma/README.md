# AUSTA SuperApp Shared Prisma Configuration

## Overview

This directory contains the shared Prisma configuration, migration workflows, and seeding procedures for the AUSTA SuperApp's journey-centered microservices architecture. It provides standardized practices for database management across all journey services.

## Table of Contents

- [Database Architecture](#database-architecture)
- [Schema Management](#schema-management)
- [Migration Workflows](#migration-workflows)
- [Transaction Management](#transaction-management)
- [Environment Configuration](#environment-configuration)
- [Database Seeding](#database-seeding)
- [Best Practices](#best-practices)

## Database Architecture

The AUSTA SuperApp uses a journey-centered database architecture that aligns with our microservices approach:

- **PostgreSQL 14** as the primary relational database
- **TimescaleDB** extension for time-series data (health metrics)
- Journey-specific schemas for data isolation
- Shared reference data for cross-journey functionality

### Journey Database Separation

Each journey service maintains its own database schema while sharing common reference data:

```
postgresql://
├── health_journey      # Health journey schema
├── care_journey        # Care journey schema
├── plan_journey        # Plan journey schema
├── gamification        # Gamification schema
└── shared              # Shared reference data
```

## Schema Management

### Standardized Schema Practices

1. **Schema Naming Convention**
   - Use snake_case for all database objects
   - Prefix tables with journey name (e.g., `health_metrics`, `care_appointments`)
   - Use singular form for table names

2. **Required Fields**
   - All tables must include:
     - `id`: UUID primary key
     - `created_at`: Timestamp with default NOW()
     - `updated_at`: Timestamp updated on change
     - `deleted_at`: Nullable timestamp for soft deletes

3. **Relationship Management**
   - Use descriptive foreign key names: `<table>_<referenced_table>_fk`
   - Always define cascading behavior explicitly
   - Use junction tables for many-to-many relationships

4. **Indexing Strategy**
   - Index all foreign keys automatically
   - Create composite indexes for frequently queried field combinations
   - Use partial indexes for filtered queries
   - Add GIN indexes for JSON/JSONB fields that are queried

### Prisma Schema Organization

Organize Prisma schema files as follows:

```
prisma/
├── schema.prisma           # Main schema file
├── migrations/             # Generated migrations
│   └── ...                 # Migration files
├── seeds/                  # Seed data scripts
│   ├── permissions.ts      # Permission seed data
│   ├── roles.ts            # Role seed data
│   └── journey/            # Journey-specific seeds
│       ├── health.ts       # Health journey seed data
│       ├── care.ts         # Care journey seed data
│       ├── plan.ts         # Plan journey seed data
│       └── gamification.ts # Gamification seed data
└── README.md              # This documentation
```

## Migration Workflows

### Migration Strategy

The AUSTA SuperApp follows a controlled migration strategy:

1. **Development Migrations**
   - Created during feature development
   - Named with descriptive prefixes: `add_`, `update_`, `remove_`
   - Include timestamp prefix: `YYYYMMDD000000_`

2. **Production Migrations**
   - Reviewed and approved by database administrator
   - Applied during scheduled maintenance windows
   - Always include rollback procedures

### Migration Workflow

Follow these steps for creating and applying migrations:

1. **Create Migration**

   ```bash
   # Generate migration based on schema changes
   npx prisma migrate dev --name descriptive_name --create-only
   ```

2. **Review Migration**

   - Verify SQL operations are correct
   - Ensure indexes are properly created
   - Check for potential performance impacts

3. **Apply Migration in Development**

   ```bash
   # Apply pending migrations
   npx prisma migrate dev
   ```

4. **Deploy to Production**

   ```bash
   # Apply migrations in production
   npx prisma migrate deploy
   ```

### Journey-Specific Migration Guidelines

#### Health Journey

- Include data validation for health metrics
- Consider TimescaleDB hypertables for time-series data
- Add appropriate indexes for time-range queries

#### Care Journey

- Ensure referential integrity for provider relationships
- Include constraints for appointment scheduling
- Add indexes for appointment date ranges

#### Plan Journey

- Maintain audit trails for all insurance-related changes
- Include validation for claim submissions
- Add indexes for policy lookup and claim status

#### Gamification

- Optimize for high-volume event processing
- Include indexes for leaderboard queries
- Consider partitioning for historical achievement data

## Transaction Management

### Transaction Patterns

The AUSTA SuperApp uses the following transaction patterns:

1. **Service-Level Transactions**

   ```typescript
   // Using PrismaService for transaction management
   await prismaService.$transaction(async (tx) => {
     // Operations within transaction
     const user = await tx.user.findUnique({ where: { id } });
     await tx.profile.update({ where: { userId: id }, data });
   });
   ```

2. **Cross-Service Transactions**

   For operations spanning multiple services, use the Saga pattern:

   ```typescript
   // Start transaction in originating service
   const result = await firstService.startOperation(data);
   
   try {
     // Call second service
     await secondService.continueOperation(result.id);
     
     // Confirm transaction
     await firstService.confirmOperation(result.id);
   } catch (error) {
     // Compensating action on failure
     await firstService.cancelOperation(result.id);
     throw error;
   }
   ```

3. **Read-Only Transactions**

   For consistent reads across multiple tables:

   ```typescript
   await prismaService.$transaction(
     [
       prisma.user.findUnique({ where: { id } }),
       prisma.profile.findUnique({ where: { userId: id } }),
     ],
     { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
   );
   ```

### Transaction Best Practices

1. **Keep Transactions Short**
   - Minimize the duration of database transactions
   - Avoid external API calls within transactions

2. **Use Appropriate Isolation Levels**
   - Default: `ReadCommitted`
   - For reporting: `RepeatableRead`
   - For critical financial operations: `Serializable`

3. **Handle Deadlocks**
   - Implement retry logic with exponential backoff
   - Order operations consistently to prevent deadlocks
   - Monitor and alert on frequent deadlocks

4. **Implement Compensating Actions**
   - Design reversible operations where possible
   - Log all transaction steps for recovery
   - Implement cleanup jobs for orphaned records

## Environment Configuration

### Environment-Specific Database Settings

The AUSTA SuperApp uses environment-specific database configurations:

1. **Development Environment**

   ```env
   # .env.development
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/austa_dev"
   DATABASE_POOL_SIZE=5
   DATABASE_CONNECTION_TIMEOUT=5000
   ```

2. **Testing Environment**

   ```env
   # .env.test
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/austa_test"
   DATABASE_POOL_SIZE=2
   DATABASE_CONNECTION_TIMEOUT=1000
   ```

3. **Production Environment**

   ```env
   # .env.production
   DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
   DATABASE_POOL_SIZE=20
   DATABASE_CONNECTION_TIMEOUT=10000
   DATABASE_IDLE_TIMEOUT=60000
   ```

### Connection Pool Configuration

Prisma connection pools should be configured based on environment:

```typescript
// src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: configService.get('NODE_ENV') === 'development' ? ['query', 'error', 'warn'] : ['error'],
      // Configure connection pool
      connection: {
        pool: {
          min: 1,
          max: configService.get('DATABASE_POOL_SIZE', 10),
        },
        connectTimeout: configService.get('DATABASE_CONNECTION_TIMEOUT', 5000),
        idleTimeout: configService.get('DATABASE_IDLE_TIMEOUT', 30000),
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method for cleaning database (useful for testing)
  async cleanDatabase() {
    // Implementation depends on your schema
  }
}
```

## Database Seeding

### Seeding Process

The AUSTA SuperApp uses a structured seeding process:

1. **Core Reference Data**
   - Permissions and roles
   - Journey-specific reference data
   - System configuration

2. **Development Test Data**
   - Sample users with different roles
   - Journey-specific sample data
   - Realistic but anonymized data

### Running Seeds

```bash
# Run all seeds
npx prisma db seed

# Run specific seed
TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' ts-node prisma/seeds/specific-seed.ts
```

### Seed Data Organization

Seed data is organized by domain and purpose:

```typescript
// Example from seed.ts
async function seed(): Promise<void> {
  // Create an instance of PrismaService for database operations
  const prismaService = new PrismaService();
  
  try {
    // Core reference data
    await seedPermissions(prismaService);
    await seedRoles(prismaService);
    
    // Journey-specific data
    await seedHealthJourneyData(prismaService);
    await seedCareJourneyData(prismaService);
    await seedPlanJourneyData(prismaService);
    await seedGamificationData(prismaService);
    
    // Development test data
    if (process.env.NODE_ENV === 'development') {
      await seedTestUsers(prismaService);
      await seedSampleData(prismaService);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prismaService.$disconnect();
  }
}
```

## Best Practices

### Journey-Specific Database Practices

1. **Health Journey**
   - Use TimescaleDB for time-series health metrics
   - Implement data retention policies for historical data
   - Consider data partitioning for large metric datasets

2. **Care Journey**
   - Optimize for appointment scheduling queries
   - Implement proper indexing for provider searches
   - Use transaction isolation for concurrent appointment booking

3. **Plan Journey**
   - Maintain audit logs for all financial transactions
   - Implement row-level security for sensitive insurance data
   - Use database constraints to enforce business rules

4. **Gamification**
   - Optimize for high-volume event processing
   - Consider materialized views for leaderboards
   - Implement efficient batch processing for achievements

### Performance Optimization

1. **Query Optimization**
   - Use Prisma's `select` to retrieve only needed fields
   - Leverage `include` for efficient relation loading
   - Create indexes for frequently filtered fields

2. **Batch Operations**
   - Use `createMany` for bulk inserts
   - Implement pagination for large result sets
   - Process large updates in smaller batches

3. **Connection Management**
   - Properly configure connection pools
   - Monitor connection usage
   - Implement connection timeout handling

### Monitoring and Maintenance

1. **Database Monitoring**
   - Track query performance with Prisma's query events
   - Monitor connection pool utilization
   - Set up alerts for slow queries

2. **Regular Maintenance**
   - Schedule regular VACUUM operations
   - Monitor and manage index bloat
   - Implement data archiving strategies

3. **Backup Strategy**
   - Daily full backups
   - Point-in-time recovery configuration
   - Regular backup restoration testing

---

## Contributing

When contributing to the database schema:

1. Follow the naming conventions and schema standards
2. Include appropriate indexes for new tables
3. Write clear migration descriptions
4. Update this documentation for significant changes
5. Add appropriate seed data for new entities

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Database Schema Diagrams](../../docs/database/schema-diagrams.md)