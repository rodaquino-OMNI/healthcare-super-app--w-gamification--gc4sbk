# AUSTA SuperApp Shared Prisma Configuration

## Overview

This directory contains the shared Prisma configuration, migration workflows, and seeding procedures for the AUSTA SuperApp's journey-centered microservices architecture. It provides standardized database management practices to ensure consistency across all journey services (Health, Care, and Plan) while maintaining proper separation of concerns.

## Table of Contents

- [Architecture](#architecture)
- [Schema Management](#schema-management)
- [Migration Workflows](#migration-workflows)
- [Transaction Management](#transaction-management)
- [Environment Configuration](#environment-configuration)
- [Database Separation](#database-separation)
- [Seeding Procedures](#seeding-procedures)
- [Best Practices](#best-practices)

## Architecture

The AUSTA SuperApp uses a PostgreSQL database (version 14) as its primary relational database with TimescaleDB extension for time-series data in the Health journey. The database architecture follows these principles:

- **Journey-Centered Design**: Each journey (Health, Care, Plan) has its own logical data model
- **Shared Authentication**: User accounts and permissions are shared across all journeys
- **Gamification Integration**: Events from all journeys feed into the centralized gamification engine
- **Optimized Access Patterns**: Each journey has specialized database contexts with optimized queries

## Schema Management

### Standardized Schema Practices

1. **Schema Organization**
   - Each journey service maintains its own `schema.prisma` file
   - Common models (users, permissions, roles) are defined in the auth service schema
   - Journey-specific models are defined in their respective service schemas

2. **Model Naming Conventions**
   - PascalCase for model names (e.g., `HealthMetric`, `AppointmentBooking`)
   - camelCase for field names (e.g., `createdAt`, `userId`)
   - Prefix journey-specific enums with journey name (e.g., `HealthMetricType`, `CareProviderSpecialty`)

3. **Relation Management**
   - Use explicit relation fields with `@relation` attribute
   - Always define both sides of relations for clarity
   - Use descriptive names for relations (e.g., `provider` instead of generic `user`)

4. **Index Strategy**
   - Add indexes on all foreign keys automatically with `@index`
   - Create composite indexes for frequently queried field combinations
   - Use unique constraints for business-level uniqueness requirements

### Schema Validation

Before applying migrations, validate your schema changes:

```bash
# Generate a migration without applying it
npx prisma migrate dev --create-only --name descriptive_name

# Review the generated SQL in prisma/migrations/[timestamp]_descriptive_name/migration.sql

# Apply the migration if it looks correct
npx prisma migrate dev
```

## Migration Workflows

### Journey-Specific Migration Strategy

Each journey service follows these migration workflows:

1. **Development Migrations**
   ```bash
   # Create and apply a new migration
   cd src/backend/[journey-service]
   npx prisma migrate dev --name descriptive_name
   ```

2. **Production Migrations**
   ```bash
   # Deploy migrations to production
   cd src/backend/[journey-service]
   npx prisma migrate deploy
   ```

3. **Migration Naming Conventions**
   - Use descriptive names that explain the purpose (e.g., `add_health_goals_table`)
   - For journey-specific migrations, prefix with journey name (e.g., `health_add_device_connections`)
   - For multi-journey migrations, use a common prefix (e.g., `common_add_notification_preferences`)

### Migration Coordination

For changes affecting multiple journeys:

1. Create migrations in each affected service
2. Ensure proper ordering of migrations (dependencies first)
3. Test the complete migration sequence in staging environment
4. Deploy migrations in the correct order during the deployment window

## Transaction Management

The AUSTA SuperApp implements robust transaction management across services using the `@austa/database` package:

### Transaction Patterns

1. **Service-Level Transactions**
   ```typescript
   // Using the TransactionService
   async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
     return this.transactionService.executeInTransaction(async (tx) => {
       const appointment = await tx.appointment.create({ data });
       await tx.notification.create({ 
         data: { type: 'APPOINTMENT_CREATED', userId: data.userId }
       });
       return appointment;
     });
   }
   ```

2. **Declarative Transactions with Decorators**
   ```typescript
   // Using the @Transactional decorator
   @Transactional({ isolationLevel: 'ReadCommitted' })
   async submitClaim(data: SubmitClaimDto): Promise<Claim> {
     const claim = await this.claimRepository.create(data);
     await this.documentService.attachDocuments(claim.id, data.documents);
     await this.eventService.publishClaimSubmitted(claim);
     return claim;
   }
   ```

3. **Cross-Journey Transactions**
   - Use two-phase commit for distributed transactions across services
   - Implement compensating transactions for rollback scenarios
   - Consider eventual consistency for non-critical cross-journey operations

### Error Handling in Transactions

- All transactions automatically roll back on uncaught exceptions
- Use specialized error types from `@austa/database/transactions/errors`
- Implement retry mechanisms with exponential backoff for transient failures

## Environment Configuration

### Database Connection Configuration

Each environment (development, staging, production) has specific database configuration:

1. **Environment Variables**
   - `DATABASE_URL`: Main connection string for the service's database
   - `DATABASE_POOL_SIZE`: Maximum number of connections in the pool
   - `DATABASE_TIMEOUT`: Query timeout in milliseconds
   - `DATABASE_DEBUG`: Enable/disable query logging

2. **Configuration by Environment**

   | Environment | Pool Size | Timeout | Debug | SSL |
   |-------------|-----------|---------|-------|-----|
   | Development | 5         | 30000   | true  | false |
   | Staging     | 10        | 30000   | false | true |
   | Production  | 20        | 15000   | false | true |

3. **Configuration Files**
   - Use `.env` files for local development
   - Use environment variables in Kubernetes for staging/production
   - Use secrets management for sensitive connection information

## Database Separation

### Journey Data Separation

The AUSTA SuperApp implements logical separation of journey data:

1. **Schema-Based Separation**
   - Each journey uses a dedicated PostgreSQL schema
   - Auth service uses the `public` schema
   - Health journey uses the `health` schema
   - Care journey uses the `care` schema
   - Plan journey uses the `plan` schema
   - Gamification engine uses the `gamification` schema

2. **Connection Management**
   - Each journey service connects to its own schema
   - The API Gateway coordinates cross-journey queries when necessary
   - Shared data (users, permissions) is accessed through the auth service

3. **Access Control**
   - Database users have restricted access to specific schemas
   - Service accounts have minimal required permissions
   - Read-only replicas are used for reporting and analytics

## Seeding Procedures

The `seed.ts` script in this directory provides a standardized way to seed the database with initial data for all journeys:

### Running Seeds

```bash
# Run the seed script
npx prisma db seed
```

The seed script performs the following operations:

1. Cleans the database to ensure a consistent state
2. Creates permissions for all journeys
3. Creates roles and assigns permissions
4. Creates default users (admin and test user)
5. Seeds journey-specific data:
   - Health journey: metric types, device types
   - Care journey: provider specialties
   - Plan journey: plan types, claim types
   - Gamification: achievement types

### Custom Seeding

For journey-specific seeding, create a seed script in the journey service directory and import the shared seed utilities:

```typescript
// src/backend/health-service/prisma/seed.ts
import { seedHealthData } from '@austa/database/seed';

async function seed() {
  await seedHealthData();
  // Add health-specific seed data
}

seed();
```

## Best Practices

### Performance Optimization

1. **Query Optimization**
   - Use `select` to retrieve only needed fields
   - Create appropriate indexes for frequent queries
   - Use pagination for large result sets
   - Implement caching for frequently accessed data

2. **Connection Pooling**
   - Configure appropriate pool size based on workload
   - Monitor connection usage and adjust as needed
   - Implement connection timeout handling
   - Use the enhanced PrismaService for optimal connection management

### Data Integrity

1. **Validation**
   - Implement validation at the API level using DTOs
   - Use Prisma's validation capabilities for data integrity
   - Add database-level constraints for critical business rules

2. **Auditing**
   - Implement created/updated timestamps on all models
   - Consider using Prisma middleware for audit logging
   - Track user actions for compliance and debugging

### Security

1. **Data Protection**
   - Never store sensitive data in plaintext
   - Use environment variables for connection strings
   - Implement proper access controls at the database level

2. **Query Safety**
   - Use parameterized queries to prevent SQL injection
   - Validate and sanitize all user inputs
   - Limit query results to prevent DoS attacks

---

For more information on database architecture and implementation details, refer to the `@austa/database` package documentation.