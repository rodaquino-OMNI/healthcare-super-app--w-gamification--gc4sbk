# Plan Service Prisma Implementation

## Overview

This document provides comprehensive guidance for working with the Prisma ORM in the Plan Service, which is part of the "Meu Plano & Benefícios" journey in the AUSTA SuperApp. The Plan Service manages insurance-related features including coverage information, digital insurance cards, claims submission and tracking, cost simulation, and benefits showcase.

## Table of Contents

1. [Schema Structure](#schema-structure)
2. [Model Definitions](#model-definitions)
3. [Migration Workflows](#migration-workflows)
4. [Connection Pooling](#connection-pooling)
5. [Journey-Specific Database Context](#journey-specific-database-context)
6. [Testing and Seeding](#testing-and-seeding)
7. [Schema Management Best Practices](#schema-management-best-practices)
8. [Claim Lifecycle and Status Transitions](#claim-lifecycle-and-status-transitions)
9. [Environment-Specific Configurations](#environment-specific-configurations)
10. [Troubleshooting](#troubleshooting)

## Schema Structure

The Plan Service Prisma schema is organized into several core models that represent the key entities in the insurance domain. The schema is defined in `schema.prisma` and follows a journey-centered approach, with all models prefixed with `Plan` to avoid conflicts with other journeys.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["plan"]
}
```

The schema uses PostgreSQL 14 as the database provider and is configured to use the "plan" schema to isolate its tables from other services in the shared database.

## Model Definitions

The Plan Service schema includes the following core models:

### Plans

Represents insurance plans available to users:

```prisma
model PlanInsurancePlan {
  id                String              @id @default(uuid())
  userId            String
  planCode          String
  name              String
  type              PlanInsuranceType
  status            PlanStatus
  startDate         DateTime
  endDate           DateTime?
  monthlyPremium    Decimal
  coverageDetails   Json
  benefits          PlanBenefit[]
  claims            PlanClaim[]
  documents         PlanDocument[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([userId])
  @@schema("plan")
}
```

### Benefits

Represents benefits associated with insurance plans:

```prisma
model PlanBenefit {
  id                String              @id @default(uuid())
  planId            String
  plan              PlanInsurancePlan   @relation(fields: [planId], references: [id])
  name              String
  description       String
  type              PlanBenefitType
  value             Decimal?
  usageLimit        Int?
  usageCount        Int                 @default(0)
  expirationDate    DateTime?
  status            PlanBenefitStatus   @default(ACTIVE)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([planId])
  @@schema("plan")
}
```

### Claims

Represents insurance claims submitted by users:

```prisma
model PlanClaim {
  id                String              @id @default(uuid())
  planId            String
  plan              PlanInsurancePlan   @relation(fields: [planId], references: [id])
  userId            String
  claimNumber       String              @unique
  type              PlanClaimType
  status            PlanClaimStatus     @default(SUBMITTED)
  submissionDate    DateTime            @default(now())
  incidentDate      DateTime
  description       String
  amount            Decimal
  approvedAmount    Decimal?
  rejectionReason   String?
  documents         PlanDocument[]
  statusHistory     PlanClaimStatusHistory[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([userId])
  @@index([planId])
  @@index([status])
  @@schema("plan")
}
```

### Documents

Represents documents associated with plans and claims:

```prisma
model PlanDocument {
  id                String              @id @default(uuid())
  planId            String?
  plan              PlanInsurancePlan?  @relation(fields: [planId], references: [id])
  claimId           String?
  claim             PlanClaim?          @relation(fields: [claimId], references: [id])
  name              String
  type              PlanDocumentType
  mimeType          String
  size              Int
  storageKey        String
  uploadedBy        String
  verificationStatus PlanDocumentVerificationStatus @default(PENDING)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([planId])
  @@index([claimId])
  @@schema("plan")
}
```

### Enums

The schema defines several enums to ensure data consistency:

```prisma
enum PlanInsuranceType {
  HEALTH
  DENTAL
  VISION
  LIFE
  TRAVEL
}

enum PlanStatus {
  ACTIVE
  INACTIVE
  PENDING
  EXPIRED
  CANCELLED
}

enum PlanBenefitType {
  DISCOUNT
  CASHBACK
  SERVICE
  COVERAGE_EXTENSION
  WELLNESS_PROGRAM
}

enum PlanBenefitStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  USED
}

enum PlanClaimType {
  MEDICAL
  DENTAL
  PHARMACY
  VISION
  EMERGENCY
  OTHER
}

enum PlanClaimStatus {
  SUBMITTED
  UNDER_REVIEW
  ADDITIONAL_INFO_REQUIRED
  APPROVED
  PARTIALLY_APPROVED
  REJECTED
  CANCELLED
  PAID
}

enum PlanDocumentType {
  INSURANCE_CARD
  MEDICAL_REPORT
  RECEIPT
  PRESCRIPTION
  EXAM_RESULT
  AUTHORIZATION
  OTHER
}

enum PlanDocumentVerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

## Migration Workflows

The Plan Service uses Prisma Migrate to manage database schema changes. Follow these steps to create and apply migrations:

### Creating a New Migration

1. Make changes to the `schema.prisma` file
2. Generate a new migration:

```bash
npx prisma migrate dev --name descriptive_migration_name
```

This command will:
- Generate a new migration based on the changes to your schema
- Apply the migration to your development database
- Generate the Prisma Client

### Migration Naming Conventions

Use descriptive names for migrations that clearly indicate the purpose of the change:

- `create_[model]` - When creating a new model
- `add_[field]_to_[model]` - When adding a field to an existing model
- `update_[model]_[field]` - When modifying a field
- `remove_[field]_from_[model]` - When removing a field
- `rename_[old]_to_[new]` - When renaming a field or model

Example: `add_verification_status_to_documents`

### Applying Migrations in Different Environments

- **Development**: Use `prisma migrate dev` to create and apply migrations
- **Testing**: Use `prisma migrate deploy` to apply existing migrations
- **Production**: Use `prisma migrate deploy` to apply existing migrations

```bash
# For testing and production environments
npx prisma migrate deploy
```

### Migration Safety

Before applying migrations to production:

1. Always test migrations in a staging environment first
2. Create a database backup before applying migrations
3. Schedule migrations during low-traffic periods
4. Have a rollback plan in case of issues

## Connection Pooling

The Plan Service uses connection pooling to optimize database performance and resource utilization. Connection pooling maintains a set of database connections that can be reused, reducing the overhead of establishing new connections for each request.

### Configuration

Connection pooling is configured in the `configuration.ts` file:

```typescript
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
}
```

### PrismaService Implementation

The PrismaService is implemented in the shared module and extends the PrismaClient with connection pooling capabilities:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('database.url'),
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Benefits of Connection Pooling

- **Improved Performance**: Eliminates the overhead of establishing new database connections for each request
- **Resource Efficiency**: Reduces the number of open connections to the database
- **Better Scalability**: Handles more concurrent requests with fewer resources
- **Connection Management**: Automatically handles connection timeouts and reconnections
- **Load Balancing**: Distributes database queries across multiple connections

### Optimal Pool Size

The optimal connection pool size depends on several factors:

- Number of concurrent users
- Query complexity and duration
- Database server capacity
- Application instance count

As a general guideline:

```
Pool Size = (Number of concurrent users * Average query duration) / Target request time
```

For the Plan Service, the default pool size is 20, which is suitable for most deployment scenarios. Adjust this value based on performance monitoring and load testing results.

## Journey-Specific Database Context

The Plan Service uses a journey-specific database context to isolate its data and operations from other journeys. This approach provides several benefits:

### Schema Isolation

The Plan Service uses the "plan" schema in the PostgreSQL database to isolate its tables from other services:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["plan"]
}
```

All models in the schema include the `@@schema("plan")` directive to ensure they are created in the correct schema.

### Database Context Implementation

The journey-specific database context is implemented in the shared database package and provides a consistent interface for database operations across all journeys:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PlanDatabaseContext {
  constructor(private prisma: PrismaService) {}

  // Plan-specific database operations
  plans = this.prisma.planInsurancePlan;
  benefits = this.prisma.planBenefit;
  claims = this.prisma.planClaim;
  documents = this.prisma.planDocument;
  claimStatusHistory = this.prisma.planClaimStatusHistory;

  // Transaction support
  async transaction<T>(fn: (tx: Omit<PlanDatabaseContext, 'transaction' | 'prisma'>) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (prisma) => {
      const txContext = {
        plans: prisma.planInsurancePlan,
        benefits: prisma.planBenefit,
        claims: prisma.planClaim,
        documents: prisma.planDocument,
        claimStatusHistory: prisma.planClaimStatusHistory,
      };
      return fn(txContext);
    });
  }
}
```

### Using the Database Context

Services should use the journey-specific database context instead of directly accessing the PrismaService:

```typescript
import { Injectable } from '@nestjs/common';
import { PlanDatabaseContext } from '../database/plan-database.context';

@Injectable()
export class ClaimsService {
  constructor(private db: PlanDatabaseContext) {}

  async findClaimById(id: string) {
    return this.db.claims.findUnique({
      where: { id },
      include: {
        documents: true,
        statusHistory: true,
      },
    });
  }

  async submitClaim(data) {
    return this.db.transaction(async (tx) => {
      const claim = await tx.claims.create({
        data: {
          // Claim data
        },
      });

      await tx.claimStatusHistory.create({
        data: {
          claimId: claim.id,
          status: 'SUBMITTED',
          notes: 'Claim submitted by user',
        },
      });

      return claim;
    });
  }
}
```

### Benefits of Journey-Specific Database Context

- **Isolation**: Prevents accidental cross-journey data access
- **Type Safety**: Provides type-safe access to journey-specific models
- **Consistency**: Ensures consistent database access patterns
- **Transactions**: Simplifies transaction management
- **Testability**: Makes it easier to mock database operations in tests

## Testing and Seeding

The Plan Service includes tools and utilities for testing and seeding the database with sample data.

### Test Database Setup

For testing, the Plan Service uses a separate test database configuration:

```typescript
// test/database.ts
import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

export async function setupTestDatabase() {
  // Clear existing data
  await testPrisma.planClaimStatusHistory.deleteMany();
  await testPrisma.planDocument.deleteMany();
  await testPrisma.planClaim.deleteMany();
  await testPrisma.planBenefit.deleteMany();
  await testPrisma.planInsurancePlan.deleteMany();

  // Seed with test data
  // ...
}
```

### Seeding the Database

The Plan Service includes seed scripts to populate the database with sample data for development and testing:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample plans
  const plan = await prisma.planInsurancePlan.create({
    data: {
      userId: 'user-1',
      planCode: 'HEALTH-PREMIUM',
      name: 'Premium Health Plan',
      type: 'HEALTH',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyPremium: 299.99,
      coverageDetails: {
        consultations: 90,
        examinations: 80,
        procedures: 70,
        emergencies: 100,
      },
      benefits: {
        create: [
          {
            name: 'Annual Checkup',
            description: 'Free annual health checkup',
            type: 'SERVICE',
            usageLimit: 1,
            status: 'ACTIVE',
          },
          {
            name: 'Pharmacy Discount',
            description: '20% discount on prescription medications',
            type: 'DISCOUNT',
            value: 20.0,
            status: 'ACTIVE',
          },
        ],
      },
    },
  });

  // Create sample claims
  await prisma.planClaim.create({
    data: {
      planId: plan.id,
      userId: 'user-1',
      claimNumber: 'CLM-2023-001',
      type: 'MEDICAL',
      status: 'APPROVED',
      incidentDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      description: 'Annual checkup with Dr. Smith',
      amount: 150.0,
      approvedAmount: 150.0,
      documents: {
        create: [
          {
            name: 'Medical Receipt',
            type: 'RECEIPT',
            mimeType: 'application/pdf',
            size: 1024 * 100, // 100KB
            storageKey: 'claims/CLM-2023-001/receipt.pdf',
            uploadedBy: 'user-1',
            verificationStatus: 'VERIFIED',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'SUBMITTED',
            notes: 'Claim submitted by user',
          },
          {
            status: 'UNDER_REVIEW',
            notes: 'Claim under review by claims processor',
          },
          {
            status: 'APPROVED',
            notes: 'Claim approved for full amount',
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

To run the seed script:

```bash
npx prisma db seed
```

### Test Factories

The Plan Service includes test factories to generate test data with realistic values:

```typescript
// test/factories/plan.factory.ts
import { PlanInsurancePlan, PlanInsuranceType, PlanStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

export function createPlanFactory(overrides: Partial<PlanInsurancePlan> = {}): Omit<PlanInsurancePlan, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId: overrides.userId || `user-${faker.string.uuid()}`,
    planCode: overrides.planCode || `PLAN-${faker.string.alphanumeric(6)}`,
    name: overrides.name || faker.commerce.productName(),
    type: overrides.type || faker.helpers.arrayElement(Object.values(PlanInsuranceType)),
    status: overrides.status || faker.helpers.arrayElement(Object.values(PlanStatus)),
    startDate: overrides.startDate || faker.date.recent(),
    endDate: overrides.endDate || faker.date.future(),
    monthlyPremium: overrides.monthlyPremium || parseFloat(faker.commerce.price({ min: 100, max: 500 })),
    coverageDetails: overrides.coverageDetails || {
      consultations: faker.number.int({ min: 60, max: 100 }),
      examinations: faker.number.int({ min: 60, max: 100 }),
      procedures: faker.number.int({ min: 60, max: 100 }),
      emergencies: faker.number.int({ min: 60, max: 100 }),
    },
  };
}
```

## Schema Management Best Practices

Follow these best practices to ensure consistent and maintainable schema management:

### Naming Conventions

- **Models**: Use PascalCase with journey prefix (e.g., `PlanInsurancePlan`)
- **Fields**: Use camelCase (e.g., `monthlyPremium`)
- **Enums**: Use PascalCase with journey prefix (e.g., `PlanClaimStatus`)
- **Enum Values**: Use SCREAMING_SNAKE_CASE (e.g., `UNDER_REVIEW`)

### Schema Organization

- Group related models together in the schema file
- Add comments to explain complex relationships or business rules
- Use explicit relation fields with references
- Add appropriate indexes for frequently queried fields

### Version Control

- Never modify existing migrations
- Create new migrations for schema changes
- Include migration descriptions in commit messages
- Review migrations carefully before applying to production

### Schema Evolution

When evolving the schema, follow these guidelines:

1. **Adding Fields**: Always provide default values or make them optional
2. **Removing Fields**: First mark as deprecated, then remove in a later migration
3. **Changing Types**: Use intermediate migrations for type conversions
4. **Renaming**: Create a new field, migrate data, then remove the old field

### Documentation

- Document all models and their relationships
- Explain the purpose of each field
- Document business rules enforced by the schema
- Keep documentation up-to-date with schema changes

## Claim Lifecycle and Status Transitions

The Plan Service implements a well-defined lifecycle for insurance claims, with specific status transitions and validation rules.

### Claim Status Flow

```
SUBMITTED → UNDER_REVIEW → [ADDITIONAL_INFO_REQUIRED] → APPROVED/PARTIALLY_APPROVED/REJECTED → PAID
```

At any point, a claim can be CANCELLED by the user or an administrator.

### Status Descriptions

- **SUBMITTED**: Initial status when a claim is first submitted by a user
- **UNDER_REVIEW**: Claim is being reviewed by a claims processor
- **ADDITIONAL_INFO_REQUIRED**: Additional information or documentation is needed from the user
- **APPROVED**: Claim has been approved for the full requested amount
- **PARTIALLY_APPROVED**: Claim has been approved for a partial amount
- **REJECTED**: Claim has been rejected
- **CANCELLED**: Claim has been cancelled by the user or an administrator
- **PAID**: Payment for the approved claim has been processed

### Status Transition Rules

```typescript
const VALID_CLAIM_STATUS_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['ADDITIONAL_INFO_REQUIRED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'CANCELLED'],
  ADDITIONAL_INFO_REQUIRED: ['UNDER_REVIEW', 'CANCELLED'],
  APPROVED: ['PAID', 'CANCELLED'],
  PARTIALLY_APPROVED: ['PAID', 'CANCELLED'],
  REJECTED: [],
  CANCELLED: [],
  PAID: [],
};
```

### Status History Tracking

The Plan Service tracks the history of status changes for each claim:

```prisma
model PlanClaimStatusHistory {
  id                String              @id @default(uuid())
  claimId           String
  claim             PlanClaim          @relation(fields: [claimId], references: [id])
  status            PlanClaimStatus
  notes             String?
  changedBy         String?
  timestamp         DateTime            @default(now())

  @@index([claimId])
  @@schema("plan")
}
```

### Implementing Status Transitions

Use the journey-specific database context to implement status transitions with proper validation and history tracking:

```typescript
async updateClaimStatus(claimId: string, newStatus: PlanClaimStatus, notes: string, userId: string) {
  return this.db.transaction(async (tx) => {
    const claim = await tx.claims.findUnique({ where: { id: claimId } });
    
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }
    
    const validTransitions = VALID_CLAIM_STATUS_TRANSITIONS[claim.status];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${claim.status} to ${newStatus}`);
    }
    
    // Update claim status
    const updatedClaim = await tx.claims.update({
      where: { id: claimId },
      data: { status: newStatus },
    });
    
    // Record status history
    await tx.claimStatusHistory.create({
      data: {
        claimId,
        status: newStatus,
        notes,
        changedBy: userId,
      },
    });
    
    return updatedClaim;
  });
}
```

## Environment-Specific Configurations

The Plan Service supports different database configurations for various environments.

### Environment Variables

The following environment variables control the database configuration:

```
DATABASE_URL=postgresql://username:password@localhost:5432/austa?schema=plan
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=austa
DATABASE_SCHEMA=plan
DATABASE_SSL=true
DATABASE_POOL_SIZE=20
```

### Environment-Specific .env Files

Use different .env files for each environment:

- `.env.development` - Development environment
- `.env.test` - Testing environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Database URL Format

The DATABASE_URL environment variable should follow this format:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA&connection_limit=POOL_SIZE&sslmode=SSLMODE
```

Example:

```
postgresql://postgres:password@localhost:5432/austa?schema=plan&connection_limit=20&sslmode=require
```

### Environment-Specific Prisma Configuration

You can use environment-specific Prisma configuration files:

```bash
# For development
npx prisma migrate dev --schema=./prisma/schema.dev.prisma

# For testing
npx prisma migrate dev --schema=./prisma/schema.test.prisma
```

## Troubleshooting

### Common Issues and Solutions

#### Connection Issues

**Issue**: Unable to connect to the database

**Solutions**:
- Verify that the database server is running
- Check the DATABASE_URL environment variable
- Ensure that the database user has the necessary permissions
- Verify network connectivity to the database server
- Check if SSL is required and properly configured

#### Migration Issues

**Issue**: Migration fails to apply

**Solutions**:
- Check for syntax errors in the schema
- Verify that the database user has migration permissions
- Look for conflicting migrations
- Check if the database schema exists
- Ensure that the migration history table is not corrupted

#### Performance Issues

**Issue**: Slow query performance

**Solutions**:
- Check for missing indexes on frequently queried fields
- Optimize complex queries
- Adjust the connection pool size
- Monitor database load and resource utilization
- Consider query caching for frequently accessed data

### Debugging Prisma

Enable Prisma debug logs to troubleshoot issues:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

You can also use the Prisma CLI to validate your schema:

```bash
npx prisma validate
```

### Getting Help

If you encounter issues with the Plan Service Prisma implementation:

1. Check the Prisma documentation: https://www.prisma.io/docs/
2. Review the Plan Service documentation
3. Consult the database team for assistance
4. Check the project's issue tracker for known issues
5. Reach out to the Plan Journey team for journey-specific questions