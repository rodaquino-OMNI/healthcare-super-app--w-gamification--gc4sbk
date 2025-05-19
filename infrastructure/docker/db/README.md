# AUSTA SuperApp Database Setup

## Overview

This directory contains scripts and configuration files for initializing, migrating, and seeding the databases required by the AUSTA SuperApp. These tools are primarily designed for local development environments but follow patterns similar to those used in staging and production.

## Database Architecture

The AUSTA SuperApp uses a journey-based database architecture with separate databases for each major service:

| Database | Service | Description |
|----------|---------|-------------|
| `health_journey` | Health Journey Service | Stores health metrics, goals, device connections, and medical events. Uses TimescaleDB extension for time-series data. |
| `care_journey` | Care Journey Service | Stores healthcare providers, appointments, treatments, medications, and telemedicine sessions. |
| `plan_journey` | Plan Journey Service | Stores insurance plans, benefits, coverage details, and claims. |
| `gamification` | Gamification Engine | Stores achievements, quests, rewards, rules, user profiles, and leaderboard data. |
| `auth` | Auth Service | Stores users, roles, permissions, and authentication tokens. |

### Technology Stack

- **PostgreSQL 14**: Primary relational database for all services
- **TimescaleDB**: PostgreSQL extension for time-series data (health metrics)
- **Redis 7**: Used for caching, session storage, and pub/sub messaging
- **Kafka 7.0.1**: Event streaming platform for service communication

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Access to the AUSTA SuperApp repository

### Starting the Database

The database is automatically initialized when you start the development environment:

```bash
# From the repository root
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

This will start PostgreSQL with all required databases, extensions, and seed data.

### Manual Database Initialization

If you need to manually initialize the database:

```bash
# From the repository root
cd infrastructure/docker/db
./init.sh
```

## Script Reference

### Core Scripts

| Script | Purpose |
|--------|--------|
| `init.sh` | Main initialization script that orchestrates the entire database setup process. |
| `wait-for-db.sh` | Utility script that waits for PostgreSQL to be ready before executing other scripts. |
| `migrations.sh` | Executes Prisma migrations for all services in the correct order. |
| `seed-data.sh` | Populates all databases with test data for development. |

### SQL Scripts

| Script | Purpose |
|--------|--------|
| `create-databases.sql` | Creates all required databases with appropriate settings. |
| `enable-extensions.sql` | Enables PostgreSQL extensions, including TimescaleDB for health_journey. |
| `create-users.sql` | Creates database users with appropriate permissions for each service. |
| `auth-seed.sql` | Populates the auth database with users, roles, and permissions. |
| `gamification-seed.sql` | Populates the gamification database with achievements, quests, and rewards. |
| `health-journey-seed.sql` | Populates the health_journey database with metrics, goals, and device data. |
| `care-journey-seed.sql` | Populates the care_journey database with providers, appointments, and treatments. |
| `plan-journey-seed.sql` | Populates the plan_journey database with plans, benefits, and claims. |

### Configuration Files

| File | Purpose |
|------|--------|
| `postgres-env.conf` | Environment variables and configuration parameters for PostgreSQL. |

## Detailed Usage Guide

### Database Initialization Process

The database initialization process follows these steps:

1. **Database Creation**: Creates separate databases for each service.
2. **Extension Setup**: Enables required PostgreSQL extensions, including TimescaleDB for health_journey.
3. **User Creation**: Sets up service-specific database users with appropriate permissions.
4. **Schema Migration**: Applies Prisma migrations to create tables and relationships.
5. **Data Seeding**: Populates databases with test data for development.

### Running Migrations

To run database migrations for all services:

```bash
# From the repository root
cd infrastructure/docker/db
./migrations.sh
```

To run migrations for a specific service:

```bash
# From the repository root
cd src/backend/<service-name>
npx prisma migrate dev
```

### Seeding Data

To seed all databases with test data:

```bash
# From the repository root
cd infrastructure/docker/db
./seed-data.sh
```

To seed a specific service's database:

```bash
# From the repository root
cd src/backend/<service-name>
npx prisma db seed
```

### Resetting the Database

To completely reset the database (useful during development):

```bash
# From the repository root
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

This will remove all data and recreate the databases from scratch.

## Database Access

### Connection Information

In the local development environment, you can connect to the PostgreSQL database using:

- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres
- **Database**: (service-specific database name)

### Service-Specific Users

Each service has its own database user with appropriate permissions:

| Service | Username | Default Password |
|---------|----------|------------------|
| Health Journey | health_service | health_password |
| Care Journey | care_service | care_password |
| Plan Journey | plan_service | plan_password |
| Gamification | gamification_service | gamification_password |
| Auth | auth_service | auth_password |

> **Note**: These default passwords are for local development only. Production environments use secure, randomly generated passwords stored in AWS Secrets Manager.

## Database Schema

Each service uses Prisma for database schema management. The schema definitions can be found in:

```
src/backend/<service-name>/prisma/schema.prisma
```

For example, the Health Journey service schema is located at:

```
src/backend/health-service/prisma/schema.prisma
```

## Cross-Service Data Relationships

While each service has its own database, there are logical relationships between data across services:

- **User Identity**: The Auth Service manages user identities that are referenced by all other services.
- **Gamification Events**: All journey services emit events that are processed by the Gamification Engine.
- **Journey Integration**: Data from one journey may be referenced in another (e.g., health metrics may affect care recommendations).

These relationships are maintained through:

1. **Consistent User IDs**: All services use the same user ID format from the Auth Service.
2. **Event-Based Communication**: Kafka events for cross-service data updates.
3. **API Integration**: Services can query each other for related data when needed.

## Troubleshooting

### Common Issues

#### Database Connection Failures

**Symptoms**: Services fail to start with database connection errors.

**Solutions**:
- Ensure PostgreSQL container is running: `docker ps | grep postgres`
- Check if the database was properly initialized: `docker logs postgres`
- Verify network connectivity: `docker exec -it postgres pg_isready`
- Check service connection configuration in `.env.local`

#### Migration Failures

**Symptoms**: Prisma migrations fail to apply.

**Solutions**:
- Check migration logs: `docker logs db-seed`
- Verify database user permissions: Connect to PostgreSQL and run `\du`
- Reset migrations if necessary: `npx prisma migrate reset`
- Check for conflicting migrations: Review `_prisma_migrations` table

#### Seed Data Issues

**Symptoms**: Missing or incorrect seed data.

**Solutions**:
- Check seed script logs: `docker logs db-seed`
- Verify SQL seed files for syntax errors
- Run seed scripts manually: `./seed-data.sh`
- Check for foreign key constraints that might prevent data insertion

### Logging and Debugging

To view database logs:

```bash
docker logs postgres
```

To connect to the PostgreSQL container and run queries:

```bash
docker exec -it postgres psql -U postgres
```

To check which databases exist:

```sql
\l
```

To connect to a specific database:

```sql
\c database_name
```

To list tables in the current database:

```sql
\dt
```

## Best Practices

### Working with Multiple Databases

- Use the correct database connection for each service
- Don't cross-query between databases directly; use service APIs instead
- Keep service-specific data in the appropriate database
- Use events for cross-service data synchronization

### Database Migrations

- Always create migrations using Prisma: `npx prisma migrate dev --name descriptive_name`
- Test migrations thoroughly before applying to shared environments
- Include both up and down migrations for reversibility
- Document breaking changes in migration descriptions

### Data Seeding

- Keep seed data realistic but minimal
- Ensure seed data covers all required test scenarios
- Maintain referential integrity in seed data
- Use consistent IDs for related entities across services

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/14/index.html)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)