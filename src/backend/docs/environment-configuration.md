# AUSTA SuperApp Environment Configuration Guide

## Overview

This document outlines the standardized environment configuration approach used throughout the AUSTA SuperApp. It provides guidelines for managing environment variables, configuration validation, secrets management, and environment-specific overrides.

## Table of Contents

1. [Environment Variable Naming Conventions](#environment-variable-naming-conventions)
2. [Layered Configuration Approach](#layered-configuration-approach)
3. [Environment Validation Mechanisms](#environment-validation-mechanisms)
4. [Secrets Management](#secrets-management)
5. [Local Development Environment](#local-development-environment)
6. [Deployment Environment Configuration](#deployment-environment-configuration)
7. [Environment Configuration Best Practices](#environment-configuration-best-practices)
8. [Troubleshooting Common Environment Issues](#troubleshooting-common-environment-issues)

## Environment Variable Naming Conventions

To ensure consistency across all services and environments, the AUSTA SuperApp follows these naming conventions for environment variables:

### Prefix Structure

All environment variables should follow this pattern:

```
AUSTA_[SERVICE]_[CATEGORY]_[NAME]
```

Where:
- `AUSTA` - Common prefix for all variables
- `SERVICE` - Service identifier (API, AUTH, HEALTH, CARE, PLAN, GAMIFICATION, NOTIFICATION)
- `CATEGORY` - Functional category (DB, API, CACHE, KAFKA, AWS, etc.)
- `NAME` - Specific variable name

### Examples

```
AUSTA_API_PORT=3000
AUSTA_AUTH_JWT_SECRET=secret
AUSTA_AUTH_JWT_EXPIRATION=3600
AUSTA_DB_HOST=localhost
AUSTA_DB_PORT=5432
AUSTA_DB_USERNAME=postgres
AUSTA_DB_PASSWORD=password
AUSTA_KAFKA_BROKERS=localhost:9092
AUSTA_REDIS_HOST=localhost
AUSTA_REDIS_PORT=6379
```

### Journey-Specific Variables

For journey-specific services, include the journey identifier in the service prefix:

```
AUSTA_HEALTH_DB_HOST=localhost
AUSTA_CARE_DB_HOST=localhost
AUSTA_PLAN_DB_HOST=localhost
```

### Boolean Values

Boolean values should be represented as `true` or `false` (lowercase):

```
AUSTA_API_CORS_ENABLED=true
AUSTA_AUTH_CACHE_ENABLED=false
```

## Layered Configuration Approach

The AUSTA SuperApp uses a layered approach to configuration management, allowing for base settings with environment-specific overrides.

### Configuration Layers

1. **Default Configuration**: Hardcoded defaults in the application code
2. **Base Configuration**: Common settings defined in `.env` files
3. **Environment-Specific Configuration**: Overrides in environment-specific files (`.env.local`, `.env.staging`, `.env.production`)
4. **Runtime Configuration**: Values provided at runtime through environment variables

### Configuration Files

| File | Purpose | Included in Version Control |
|------|---------|-----------------------------|
| `.env` | Base configuration with default values | Yes |
| `.env.local.example` | Example local configuration with documentation | Yes |
| `.env.local` | Local development configuration | No |
| `.env.staging` | Staging environment configuration | No |
| `.env.production` | Production environment configuration | No |

### Configuration Loading Order

The configuration is loaded in the following order, with later sources overriding earlier ones:

1. Default values in code
2. `.env` file
3. Environment-specific file (`.env.local`, `.env.staging`, or `.env.production`)
4. Runtime environment variables

### Configuration Validation

All services should validate their configuration at startup using the shared validation utilities:

```typescript
// Example configuration validation
import { validateConfig } from '@austa/utils/validation';

const configSchema = {
  AUSTA_SERVICE_PORT: { type: 'number', required: true },
  AUSTA_SERVICE_HOST: { type: 'string', required: true },
  AUSTA_SERVICE_LOG_LEVEL: { type: 'string', default: 'info' },
};

const config = validateConfig(process.env, configSchema);
```

## Environment Validation Mechanisms

The AUSTA SuperApp includes several mechanisms to validate environment configuration:

### Startup Validation

All services perform configuration validation during startup:

1. **Schema Validation**: Validates environment variables against defined schemas
2. **Dependency Checks**: Verifies connectivity to required services (databases, Kafka, Redis)
3. **Permission Checks**: Confirms necessary permissions for external services

#### Implementation Example

```typescript
// src/backend/shared/utils/config-validator.ts
import { z } from 'zod';
import { logger } from '@austa/logging';

export function validateEnvironment<T extends z.ZodType>(schema: T): z.infer<T> {
  try {
    return schema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed', {
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
      
      throw new Error(`Environment validation failed: ${error.issues.map(i => 
        `${i.path.join('.')}: ${i.message}`).join(', ')}`);
    }
    throw error;
  }
}

// Example usage in a service
// src/backend/auth-service/src/config/environment.ts
import { z } from 'zod';
import { validateEnvironment } from '@austa/shared/utils/config-validator';

const envSchema = z.object({
  AUSTA_AUTH_PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  AUSTA_AUTH_JWT_SECRET: z.string().min(32),
  AUSTA_AUTH_JWT_EXPIRATION: z.string().transform(Number).pipe(z.number().int().positive()),
  AUSTA_AUTH_DB_HOST: z.string(),
  AUSTA_AUTH_DB_PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  AUSTA_AUTH_DB_USERNAME: z.string(),
  AUSTA_AUTH_DB_PASSWORD: z.string(),
  AUSTA_AUTH_DB_NAME: z.string(),
  AUSTA_AUTH_REDIS_HOST: z.string(),
  AUSTA_AUTH_REDIS_PORT: z.string().transform(Number).pipe(z.number().int().positive()),
});

export type Environment = z.infer<typeof envSchema>;

export const env = validateEnvironment(envSchema);
```

### Validation Scripts

The repository includes validation scripts for checking environment configuration:

```bash
# Validate environment configuration
./scripts/validate-env.sh [service-name]
```

This script performs the following checks:

1. Verifies all required environment variables are present
2. Checks for deprecated or invalid variables
3. Validates connectivity to dependent services
4. Confirms service port availability

#### Script Implementation

```bash
#!/bin/bash
# scripts/validate-env.sh

set -e

SERVICE_NAME=${1:-"all"}
ENV_FILE=".env.local"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Please create it from .env.local.example"
  exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Validate common variables
validate_common_vars() {
  local missing_vars=0
  
  # Check required common variables
  for var in AUSTA_API_PORT AUSTA_AUTH_JWT_SECRET; do
    if [ -z "${!var}" ]; then
      echo "Error: $var is required but not set"
      missing_vars=$((missing_vars+1))
    fi
  done
  
  return $missing_vars
}

# Validate service-specific variables
validate_service_vars() {
  local service=$1
  local missing_vars=0
  
  case "$service" in
    "auth-service")
      for var in AUSTA_AUTH_DB_HOST AUSTA_AUTH_DB_PORT AUSTA_AUTH_DB_USERNAME AUSTA_AUTH_DB_PASSWORD AUSTA_AUTH_DB_NAME AUSTA_AUTH_REDIS_HOST AUSTA_AUTH_REDIS_PORT; do
        if [ -z "${!var}" ]; then
          echo "Error: $var is required for auth-service but not set"
          missing_vars=$((missing_vars+1))
        fi
      done
      ;;
    "health-service")
      for var in AUSTA_HEALTH_DB_HOST AUSTA_HEALTH_DB_PORT AUSTA_HEALTH_DB_USERNAME AUSTA_HEALTH_DB_PASSWORD AUSTA_HEALTH_DB_NAME; do
        if [ -z "${!var}" ]; then
          echo "Error: $var is required for health-service but not set"
          missing_vars=$((missing_vars+1))
        fi
      done
      ;;
    # Add other services as needed
  esac
  
  return $missing_vars
}

# Check database connectivity
check_db_connectivity() {
  local service=$1
  local db_host db_port db_user db_pass db_name
  
  case "$service" in
    "auth-service")
      db_host=$AUSTA_AUTH_DB_HOST
      db_port=$AUSTA_AUTH_DB_PORT
      db_user=$AUSTA_AUTH_DB_USERNAME
      db_pass=$AUSTA_AUTH_DB_PASSWORD
      db_name=$AUSTA_AUTH_DB_NAME
      ;;
    "health-service")
      db_host=$AUSTA_HEALTH_DB_HOST
      db_port=$AUSTA_HEALTH_DB_PORT
      db_user=$AUSTA_HEALTH_DB_USERNAME
      db_pass=$AUSTA_HEALTH_DB_PASSWORD
      db_name=$AUSTA_HEALTH_DB_NAME
      ;;
    # Add other services as needed
  esac
  
  echo "Checking database connectivity for $service..."
  if command -v pg_isready > /dev/null; then
    if pg_isready -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t 5; then
      echo "Database connection successful for $service"
      return 0
    else
      echo "Error: Could not connect to database for $service"
      return 1
    fi
  else
    echo "Warning: pg_isready not found, skipping database connectivity check"
    return 0
  fi
}

# Check port availability
check_port_availability() {
  local service=$1
  local port
  
  case "$service" in
    "api-gateway")
      port=$AUSTA_API_PORT
      ;;
    "auth-service")
      port=$AUSTA_AUTH_PORT
      ;;
    # Add other services as needed
  esac
  
  echo "Checking port availability for $service on port $port..."
  if command -v nc > /dev/null; then
    if nc -z localhost "$port" > /dev/null 2>&1; then
      echo "Warning: Port $port is already in use"
      return 1
    else
      echo "Port $port is available for $service"
      return 0
    fi
  else
    echo "Warning: nc not found, skipping port availability check"
    return 0
  fi
}

# Main validation logic
if [ "$SERVICE_NAME" = "all" ]; then
  # Validate all services
  validate_common_vars
  for service in api-gateway auth-service health-service care-service plan-service gamification-engine notification-service; do
    echo "\nValidating $service..."
    validate_service_vars "$service"
    check_db_connectivity "$service"
    check_port_availability "$service"
  done
else
  # Validate specific service
  echo "Validating $SERVICE_NAME..."
  validate_common_vars
  validate_service_vars "$SERVICE_NAME"
  check_db_connectivity "$SERVICE_NAME"
  check_port_availability "$SERVICE_NAME"
fi

echo "\nEnvironment validation completed"
```

### CI/CD Integration

Environment validation is integrated into the CI/CD pipeline:

1. **Pull Request Checks**: Validates configuration changes against schemas
2. **Deployment Checks**: Verifies environment configuration before deployment
3. **Post-Deployment Validation**: Confirms correct configuration after deployment

#### GitHub Actions Workflow Example

```yaml
# .github/workflows/validate-env.yml
name: Validate Environment Configuration

on:
  pull_request:
    paths:
      - '**/.env.example'
      - '**/.env.local.example'
      - '**/environment.ts'
      - '**/config/**'
      - 'scripts/validate-env.sh'

jobs:
  validate-env:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Create test environment file
        run: cp .env.local.example .env.local

      - name: Validate environment schemas
        run: yarn validate:env

      - name: Validate TypeScript config files
        run: yarn tsc --noEmit --project tsconfig.json
```

### Journey-Specific Validation

Each journey has specific validation requirements:

#### Health Journey

- Validates FHIR API connectivity
- Checks wearable device API credentials
- Verifies health metrics database schema

#### Care Journey

- Validates telemedicine service connectivity
- Checks appointment scheduling system integration
- Verifies provider directory access

#### Plan Journey

- Validates insurance API connectivity
- Checks claims processing system integration
- Verifies benefits calculation engine access

## Secrets Management

The AUSTA SuperApp follows these principles for managing secrets across environments:

### Local Development

For local development, secrets are stored in `.env.local` files (not committed to version control):

```
AUSTA_AUTH_JWT_SECRET=local-development-secret
AUSTA_DB_PASSWORD=local-password
```

### Staging and Production

For staging and production environments, secrets are managed through AWS Secrets Manager:

1. **Secret Storage**: All secrets are stored in AWS Secrets Manager with appropriate encryption
2. **Secret Rotation**: Critical secrets (database credentials, API keys) are automatically rotated
3. **Access Control**: IAM policies restrict access to secrets based on service requirements

### Secret Injection

Secrets are injected into services through:

1. **Kubernetes Secrets**: Mapped to environment variables in pod specifications
2. **AWS SDK**: Direct retrieval from Secrets Manager for specific use cases

### Secret Naming Convention

Secrets in AWS Secrets Manager follow this naming convention:

```
/austa/[environment]/[service]/[secret-name]
```

Examples:
```
/austa/staging/auth/jwt-secret
/austa/production/db/master-credentials
```

## Local Development Environment

The AUSTA SuperApp provides a comprehensive local development environment using Docker Compose.

### Docker Compose Setup

The local development environment is defined in `docker-compose.dev.yml` and includes:

1. **Core Services**:
   - Frontend (Next.js web app)
   - Backend microservices
   - PostgreSQL databases
   - Redis cache
   - Kafka and Zookeeper

2. **Development Tools**:
   - Development proxy (nginx) for routing
   - Database seeding service
   - Mailhog for email testing

#### Docker Compose Configuration Example

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build:
      context: ./src/backend/api-gateway
      dockerfile: Dockerfile.dev
    ports:
      - "${AUSTA_API_PORT:-3000}:3000"
    volumes:
      - ./src/backend/api-gateway:/app
      - /app/node_modules
    env_file:
      - .env.local
    depends_on:
      - auth-service
      - health-service
      - care-service
      - plan-service
      - gamification-engine
    networks:
      - austa-network

  # Auth Service
  auth-service:
    build:
      context: ./src/backend/auth-service
      dockerfile: Dockerfile.dev
    volumes:
      - ./src/backend/auth-service:/app
      - /app/node_modules
    env_file:
      - .env.local
    depends_on:
      - postgres-auth
      - redis
    networks:
      - austa-network

  # Health Journey Service
  health-service:
    build:
      context: ./src/backend/health-service
      dockerfile: Dockerfile.dev
    volumes:
      - ./src/backend/health-service:/app
      - /app/node_modules
    env_file:
      - .env.local
    depends_on:
      - postgres-health
      - kafka
    networks:
      - austa-network

  # Care Journey Service
  care-service:
    build:
      context: ./src/backend/care-service
      dockerfile: Dockerfile.dev
    volumes:
      - ./src/backend/care-service:/app
      - /app/node_modules
    env_file:
      - .env.local
    depends_on:
      - postgres-care
      - kafka
    networks:
      - austa-network

  # Plan Journey Service
  plan-service:
    build:
      context: ./src/backend/plan-service
      dockerfile: Dockerfile.dev
    volumes:
      - ./src/backend/plan-service:/app
      - /app/node_modules
    env_file:
      - .env.local
    depends_on:
      - postgres-plan
      - kafka
    networks:
      - austa-network

  # Gamification Engine
  gamification-engine:
    build:
      context: ./src/backend/gamification-engine
      dockerfile: Dockerfile.dev
    volumes:
      - ./src/backend/gamification-engine:/app
      - /app/node_modules
    env_file:
      - .env.local
    depends_on:
      - postgres-gamification
      - kafka
      - redis
    networks:
      - austa-network

  # Notification Service
  notification-service:
    build:
      context: ./src/backend/notification-service
      dockerfile: Dockerfile.dev
    volumes:
      - ./src/backend/notification-service:/app
      - /app/node_modules
    env_file:
      - .env.local
    depends_on:
      - kafka
      - mailhog
    networks:
      - austa-network

  # Web Frontend
  web-frontend:
    build:
      context: ./src/web/web
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3000"
    volumes:
      - ./src/web/web:/app
      - /app/node_modules
    env_file:
      - .env.local
    networks:
      - austa-network

  # Databases
  postgres-auth:
    image: postgres:14
    environment:
      POSTGRES_USER: ${AUSTA_AUTH_DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${AUSTA_AUTH_DB_PASSWORD:-postgres}
      POSTGRES_DB: ${AUSTA_AUTH_DB_NAME:-auth}
    ports:
      - "5432:5432"
    volumes:
      - postgres-auth-data:/var/lib/postgresql/data
    networks:
      - austa-network

  postgres-health:
    image: postgres:14
    environment:
      POSTGRES_USER: ${AUSTA_HEALTH_DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${AUSTA_HEALTH_DB_PASSWORD:-postgres}
      POSTGRES_DB: ${AUSTA_HEALTH_DB_NAME:-health}
    ports:
      - "5433:5432"
    volumes:
      - postgres-health-data:/var/lib/postgresql/data
    networks:
      - austa-network

  postgres-care:
    image: postgres:14
    environment:
      POSTGRES_USER: ${AUSTA_CARE_DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${AUSTA_CARE_DB_PASSWORD:-postgres}
      POSTGRES_DB: ${AUSTA_CARE_DB_NAME:-care}
    ports:
      - "5434:5432"
    volumes:
      - postgres-care-data:/var/lib/postgresql/data
    networks:
      - austa-network

  postgres-plan:
    image: postgres:14
    environment:
      POSTGRES_USER: ${AUSTA_PLAN_DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${AUSTA_PLAN_DB_PASSWORD:-postgres}
      POSTGRES_DB: ${AUSTA_PLAN_DB_NAME:-plan}
    ports:
      - "5435:5432"
    volumes:
      - postgres-plan-data:/var/lib/postgresql/data
    networks:
      - austa-network

  postgres-gamification:
    image: postgres:14
    environment:
      POSTGRES_USER: ${AUSTA_GAMIFICATION_DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${AUSTA_GAMIFICATION_DB_PASSWORD:-postgres}
      POSTGRES_DB: ${AUSTA_GAMIFICATION_DB_NAME:-gamification}
    ports:
      - "5436:5432"
    volumes:
      - postgres-gamification-data:/var/lib/postgresql/data
    networks:
      - austa-network

  # Redis
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    networks:
      - austa-network

  # Kafka
  zookeeper:
    image: confluentinc/cp-zookeeper:7.2.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - austa-network

  kafka:
    image: confluentinc/cp-kafka:7.2.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    networks:
      - austa-network

  # Development Proxy
  dev-proxy:
    image: nginx:1.21.6
    ports:
      - "8080:80"
    volumes:
      - ./infrastructure/docker/dev-proxy/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - api-gateway
      - web-frontend
    networks:
      - austa-network

  # Database Seeding
  db-seed:
    build:
      context: ./src/backend/tools/scripts
      dockerfile: Dockerfile.seed
    volumes:
      - ./src/backend:/app/src/backend
    env_file:
      - .env.local
    depends_on:
      - postgres-auth
      - postgres-health
      - postgres-care
      - postgres-plan
      - postgres-gamification
    networks:
      - austa-network

  # Email Testing
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025" # SMTP port
      - "8025:8025" # Web UI port
    networks:
      - austa-network

networks:
  austa-network:
    driver: bridge

volumes:
  postgres-auth-data:
  postgres-health-data:
  postgres-care-data:
  postgres-plan-data:
  postgres-gamification-data:
```

### Starting the Local Environment

```bash
# Start all services
yarn dev:up

# Start specific services
yarn dev:up api-gateway auth-service

# Stop all services
yarn dev:down
```

### Environment Configuration

Local development uses `.env.local` files for each service. A template is provided in `.env.local.example`:

```bash
# Copy example configuration
cp .env.local.example .env.local

# Edit configuration as needed
nano .env.local
```

#### Example .env.local.example File

```
# API Gateway Configuration
AUSTA_API_PORT=3000
AUSTA_API_HOST=0.0.0.0
AUSTA_API_CORS_ENABLED=true
AUSTA_API_CORS_ORIGIN=*
AUSTA_API_LOG_LEVEL=debug

# Auth Service Configuration
AUSTA_AUTH_PORT=3010
AUSTA_AUTH_HOST=0.0.0.0
AUSTA_AUTH_JWT_SECRET=local-development-secret-at-least-32-chars
AUSTA_AUTH_JWT_EXPIRATION=3600
AUSTA_AUTH_DB_HOST=postgres-auth
AUSTA_AUTH_DB_PORT=5432
AUSTA_AUTH_DB_USERNAME=postgres
AUSTA_AUTH_DB_PASSWORD=postgres
AUSTA_AUTH_DB_NAME=auth
AUSTA_AUTH_REDIS_HOST=redis
AUSTA_AUTH_REDIS_PORT=6379
AUSTA_AUTH_LOG_LEVEL=debug

# Health Journey Configuration
AUSTA_HEALTH_PORT=3020
AUSTA_HEALTH_HOST=0.0.0.0
AUSTA_HEALTH_DB_HOST=postgres-health
AUSTA_HEALTH_DB_PORT=5432
AUSTA_HEALTH_DB_USERNAME=postgres
AUSTA_HEALTH_DB_PASSWORD=postgres
AUSTA_HEALTH_DB_NAME=health
AUSTA_HEALTH_KAFKA_BROKERS=kafka:29092
AUSTA_HEALTH_LOG_LEVEL=debug

# Care Journey Configuration
AUSTA_CARE_PORT=3030
AUSTA_CARE_HOST=0.0.0.0
AUSTA_CARE_DB_HOST=postgres-care
AUSTA_CARE_DB_PORT=5432
AUSTA_CARE_DB_USERNAME=postgres
AUSTA_CARE_DB_PASSWORD=postgres
AUSTA_CARE_DB_NAME=care
AUSTA_CARE_KAFKA_BROKERS=kafka:29092
AUSTA_CARE_LOG_LEVEL=debug

# Plan Journey Configuration
AUSTA_PLAN_PORT=3040
AUSTA_PLAN_HOST=0.0.0.0
AUSTA_PLAN_DB_HOST=postgres-plan
AUSTA_PLAN_DB_PORT=5432
AUSTA_PLAN_DB_USERNAME=postgres
AUSTA_PLAN_DB_PASSWORD=postgres
AUSTA_PLAN_DB_NAME=plan
AUSTA_PLAN_KAFKA_BROKERS=kafka:29092
AUSTA_PLAN_LOG_LEVEL=debug

# Gamification Engine Configuration
AUSTA_GAMIFICATION_PORT=3050
AUSTA_GAMIFICATION_HOST=0.0.0.0
AUSTA_GAMIFICATION_DB_HOST=postgres-gamification
AUSTA_GAMIFICATION_DB_PORT=5432
AUSTA_GAMIFICATION_DB_USERNAME=postgres
AUSTA_GAMIFICATION_DB_PASSWORD=postgres
AUSTA_GAMIFICATION_DB_NAME=gamification
AUSTA_GAMIFICATION_KAFKA_BROKERS=kafka:29092
AUSTA_GAMIFICATION_REDIS_HOST=redis
AUSTA_GAMIFICATION_REDIS_PORT=6379
AUSTA_GAMIFICATION_LOG_LEVEL=debug

# Notification Service Configuration
AUSTA_NOTIFICATION_PORT=3060
AUSTA_NOTIFICATION_HOST=0.0.0.0
AUSTA_NOTIFICATION_KAFKA_BROKERS=kafka:29092
AUSTA_NOTIFICATION_EMAIL_HOST=mailhog
AUSTA_NOTIFICATION_EMAIL_PORT=1025
AUSTA_NOTIFICATION_EMAIL_SECURE=false
AUSTA_NOTIFICATION_EMAIL_FROM=noreply@austa.local
AUSTA_NOTIFICATION_LOG_LEVEL=debug

# Web Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### Database Initialization

The local environment includes automatic database initialization:

1. **Schema Migration**: Prisma migrations are applied automatically
2. **Seed Data**: Test data is seeded for development

```bash
# Manually run database migrations
yarn prisma:migrate

# Manually seed database
yarn prisma:seed
```

#### Database Seeding Script Example

```typescript
// src/backend/tools/scripts/seed.ts
import { PrismaClient as AuthPrisma } from '@austa/auth-service/prisma/client';
import { PrismaClient as HealthPrisma } from '@austa/health-service/prisma/client';
import { PrismaClient as CarePrisma } from '@austa/care-service/prisma/client';
import { PrismaClient as PlanPrisma } from '@austa/plan-service/prisma/client';
import { PrismaClient as GamificationPrisma } from '@austa/gamification-engine/prisma/client';

async function main() {
  console.log('Starting database seeding...');
  
  // Initialize Prisma clients
  const authPrisma = new AuthPrisma();
  const healthPrisma = new HealthPrisma();
  const carePrisma = new CarePrisma();
  const planPrisma = new PlanPrisma();
  const gamificationPrisma = new GamificationPrisma();
  
  try {
    // Seed Auth Service
    console.log('Seeding Auth Service...');
    await seedAuthService(authPrisma);
    
    // Seed Health Journey
    console.log('Seeding Health Journey...');
    await seedHealthJourney(healthPrisma);
    
    // Seed Care Journey
    console.log('Seeding Care Journey...');
    await seedCareJourney(carePrisma);
    
    // Seed Plan Journey
    console.log('Seeding Plan Journey...');
    await seedPlanJourney(planPrisma);
    
    // Seed Gamification Engine
    console.log('Seeding Gamification Engine...');
    await seedGamificationEngine(gamificationPrisma);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    // Disconnect Prisma clients
    await authPrisma.$disconnect();
    await healthPrisma.$disconnect();
    await carePrisma.$disconnect();
    await planPrisma.$disconnect();
    await gamificationPrisma.$disconnect();
  }
}

async function seedAuthService(prisma: AuthPrisma) {
  // Create test users
  await prisma.user.createMany({
    data: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@example.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Password: secret
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'user@example.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Password: secret
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });
}

// Implement other seeding functions for each journey

main();
```

### Journey-Specific Configuration

Each journey service has its own configuration requirements. Refer to the journey-specific documentation for details:

- Health Journey: `src/backend/health-service/README.md`
- Care Journey: `src/backend/care-service/README.md`
- Plan Journey: `src/backend/plan-service/README.md`

## Environment Configuration Best Practices

Follow these best practices to ensure reliable and secure environment configuration in the AUSTA SuperApp:

### General Best Practices

1. **Default Values**
   - Always provide sensible default values for non-critical configuration
   - Document the implications of each default value
   - Make defaults appropriate for local development

2. **Validation**
   - Validate all configuration at application startup
   - Fail fast if critical configuration is missing or invalid
   - Provide clear error messages for configuration issues

3. **Documentation**
   - Document all environment variables in `.env.*.example` files
   - Include type information, valid values, and purpose
   - Keep documentation updated when adding new variables

4. **Naming**
   - Follow the established naming convention consistently
   - Use descriptive names that indicate purpose
   - Group related variables with consistent prefixes

### Security Best Practices

1. **Sensitive Information**
   - Never commit secrets to version control
   - Use AWS Secrets Manager for all sensitive values
   - Rotate secrets regularly according to security policy

2. **Access Control**
   - Limit access to production configuration
   - Use IAM roles with least privilege
   - Audit configuration access regularly

3. **Encryption**
   - Encrypt all sensitive configuration at rest
   - Use TLS for all service communication
   - Implement proper key management

### Journey-Specific Best Practices

1. **Health Journey**
   - Validate FHIR API endpoints before startup
   - Use secure storage for health data configuration
   - Implement strict validation for health metrics

2. **Care Journey**
   - Validate provider API connectivity
   - Secure telemedicine configuration
   - Test appointment scheduling configuration

3. **Plan Journey**
   - Validate insurance API endpoints
   - Secure payment processing configuration
   - Test claims processing configuration

### Development Workflow

1. **Local Testing**
   - Test configuration changes locally before committing
   - Use the validation script to verify changes
   - Document configuration changes in pull requests

2. **CI/CD Integration**
   - Include configuration validation in CI/CD pipelines
   - Test with different environment configurations
   - Prevent deployment with invalid configuration

3. **Monitoring**
   - Log configuration at startup for debugging
   - Monitor configuration-related errors
   - Alert on critical configuration issues

## Deployment Environment Configuration

The AUSTA SuperApp uses environment-specific configuration for different deployment environments (development, staging, production).

### Environment Types

| Environment | Purpose | Configuration Approach |
|-------------|---------|------------------------|
| **Development** | Local developer testing, feature development | `.env.local` files, Docker Compose |
| **Staging** | Integration testing, pre-release validation | Kubernetes ConfigMaps, AWS Secrets Manager |
| **Production** | Live environment for end users | Kubernetes ConfigMaps, AWS Secrets Manager, with stricter security |

### Environment-Specific Configuration Files

Each environment has its own configuration files:

- **Development**: `.env.local`
- **Staging**: `.env.staging` (template only, actual values in AWS)
- **Production**: `.env.production` (template only, actual values in AWS)

### Kubernetes ConfigMap Structure

Environment variables are stored in Kubernetes ConfigMaps for staging and production:

```yaml
# Example ConfigMap for auth-service in staging
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth-service-config
  namespace: austa-staging
data:
  AUSTA_AUTH_PORT: "3010"
  AUSTA_AUTH_HOST: "0.0.0.0"
  AUSTA_AUTH_DB_HOST: "postgres-auth.austa-staging.svc.cluster.local"
  AUSTA_AUTH_DB_PORT: "5432"
  AUSTA_AUTH_DB_NAME: "auth"
  AUSTA_AUTH_REDIS_HOST: "redis.austa-staging.svc.cluster.local"
  AUSTA_AUTH_REDIS_PORT: "6379"
  AUSTA_AUTH_LOG_LEVEL: "info"
```

### Environment-Specific Overrides

Certain configuration values change between environments:

| Configuration | Development | Staging | Production |
|---------------|-------------|---------|------------|
| Log Level | `debug` | `info` | `warn` |
| Database Hosts | Local containers | RDS endpoints | RDS endpoints with read replicas |
| Kafka Brokers | Local container | MSK endpoints | MSK endpoints with multi-AZ |
| CORS Settings | Permissive | Restricted | Strictly limited |
| Rate Limiting | Disabled | Moderate | Strict |

### Deployment Process

Environment configuration is applied during the deployment process:

1. **CI/CD Pipeline**:
   - Reads environment-specific configuration templates
   - Substitutes sensitive values from AWS Secrets Manager
   - Applies ConfigMaps and Secrets to Kubernetes

2. **Kubernetes Deployment**:
   - Mounts ConfigMaps and Secrets as environment variables
   - Validates configuration before starting containers
   - Reports configuration issues to monitoring systems

### Environment Promotion

When promoting changes between environments:

1. **Development to Staging**:
   - Configuration values are reviewed and adjusted
   - Sensitive values are updated in AWS Secrets Manager
   - ConfigMaps are updated in the staging namespace

2. **Staging to Production**:
   - Configuration undergoes security review
   - Production-specific values are applied
   - Changes are applied with canary deployment

### Environment-Specific Feature Flags

Feature flags can be configured differently per environment:

```yaml
# Example feature flags ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: feature-flags-config
  namespace: austa-staging
data:
  AUSTA_FEATURE_NEW_GAMIFICATION: "true"
  AUSTA_FEATURE_ENHANCED_HEALTH_METRICS: "true"
  AUSTA_FEATURE_TELEMEDICINE_V2: "false"
```

## Troubleshooting Common Environment Issues

This section provides solutions for common environment configuration issues encountered in the AUSTA SuperApp.

### Database Connection Issues

#### Symptoms
- Service fails to start with database connection errors
- Prisma client throws connection errors
- Migrations fail to apply

#### Solutions

1. **Check Database Credentials**
   ```bash
   # Verify environment variables
   echo $AUSTA_SERVICE_DB_HOST $AUSTA_SERVICE_DB_PORT $AUSTA_SERVICE_DB_USERNAME
   
   # Test connection directly
   psql -h $AUSTA_SERVICE_DB_HOST -p $AUSTA_SERVICE_DB_PORT -U $AUSTA_SERVICE_DB_USERNAME -d $AUSTA_SERVICE_DB_NAME
   ```

2. **Check Database Service**
   ```bash
   # Check if database container is running
   docker ps | grep postgres
   
   # Check database logs
   docker logs postgres-service
   ```

3. **Reset Database Container**
   ```bash
   # Stop and remove container
   docker-compose stop postgres-service
   docker-compose rm -f postgres-service
   
   # Start fresh container
   docker-compose up -d postgres-service
   ```

### Kafka Connection Issues

#### Symptoms
- Services fail to connect to Kafka
- Events are not being processed
- Kafka consumer errors in logs

#### Solutions

1. **Check Kafka Broker Configuration**
   ```bash
   # Verify environment variables
   echo $AUSTA_SERVICE_KAFKA_BROKERS
   
   # Test connection to Kafka
   kafkacat -b $AUSTA_SERVICE_KAFKA_BROKERS -L
   ```

2. **Check Kafka Service**
   ```bash
   # Check if Kafka container is running
   docker ps | grep kafka
   
   # Check Kafka logs
   docker logs kafka
   ```

3. **Reset Kafka and Zookeeper**
   ```bash
   # Stop and remove containers
   docker-compose stop zookeeper kafka
   docker-compose rm -f zookeeper kafka
   
   # Start fresh containers
   docker-compose up -d zookeeper kafka
   ```

### Authentication Issues

#### Symptoms
- JWT validation errors
- Unauthorized access errors
- Token expiration issues

#### Solutions

1. **Check JWT Configuration**
   ```bash
   # Verify JWT environment variables
   echo $AUSTA_AUTH_JWT_SECRET $AUSTA_AUTH_JWT_EXPIRATION
   ```

2. **Verify Auth Service**
   ```bash
   # Check if auth service is running
   docker ps | grep auth-service
   
   # Check auth service logs
   docker logs auth-service
   ```

3. **Reset Auth Service**
   ```bash
   # Restart auth service
   docker-compose restart auth-service
   ```

### Port Conflicts

#### Symptoms
- Service fails to start with port binding errors
- "Address already in use" errors

#### Solutions

1. **Check Port Usage**
   ```bash
   # Check if port is in use
   lsof -i :$AUSTA_SERVICE_PORT
   
   # Find process using the port
   netstat -tulpn | grep $AUSTA_SERVICE_PORT
   ```

2. **Change Port Configuration**
   ```bash
   # Edit .env.local file to use a different port
   nano .env.local
   ```

3. **Kill Process Using Port**
   ```bash
   # Find and kill process
   kill $(lsof -t -i:$AUSTA_SERVICE_PORT)
   ```

### Environment Variable Issues

#### Symptoms
- Service fails to start with configuration errors
- Missing or invalid environment variables

#### Solutions

1. **Check Environment Variables**
   ```bash
   # List all environment variables
   env | grep AUSTA
   
   # Check specific variable
   echo $AUSTA_SERVICE_SPECIFIC_VAR
   ```

2. **Verify .env.local File**
   ```bash
   # Check if .env.local exists
   ls -la .env.local
   
   # Compare with example file
   diff .env.local.example .env.local
   ```

3. **Recreate .env.local File**
   ```bash
   # Create fresh .env.local from example
   cp .env.local.example .env.local
   ```

## Conclusion

Following these environment configuration guidelines ensures consistency across all services and environments in the AUSTA SuperApp. The standardized approach to environment variables, configuration validation, and local development setup helps maintain a reliable and efficient development workflow.

For specific questions or issues not covered in this guide, contact the DevOps team at devops@austa.com.