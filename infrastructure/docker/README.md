# AUSTA SuperApp Docker Development Environment

## Overview

This directory contains the Docker configuration for the AUSTA SuperApp local development environment. It provides a containerized setup that closely mirrors the production environment while optimizing for developer productivity. The environment supports all three user journeys ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios") and the cross-journey gamification engine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Structure](#environment-structure)
- [Configuration](#configuration)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

- Docker Engine (20.10.x or later)
- Docker Compose (2.x or later)
- Git
- Node.js (18.x)
- Yarn (1.22.x)

### System Requirements

- **CPU**: 4+ cores recommended
- **Memory**: Minimum 8GB RAM, 16GB recommended
- **Disk**: At least 10GB of free space
- **Operating System**: macOS, Linux, or Windows with WSL2

## Getting Started

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/austa/superapp.git
   cd superapp
   ```

2. Generate environment configuration:
   ```bash
   ./infrastructure/docker/scripts/generate-env-file.sh
   ```

3. Install dependencies:
   ```bash
   make setup
   ```

### Starting the Environment

You can start the entire development environment or specific components:

```bash
# Start everything
make dev

# Start only backend services
make dev-backend

# Start only web application
make dev-web

# Start only mobile application
make dev-mobile
```

Alternatively, you can use the Docker Compose scripts directly:

```bash
# Start all services
./infrastructure/docker/scripts/docker-compose-up.sh

# Start only infrastructure services (databases, Kafka, etc.)
docker-compose -f infrastructure/docker/docker-compose.infrastructure.yml up -d
```

### Accessing Services

Once the environment is running, you can access the services at:

- **Web Application**: http://localhost:3000
- **API Gateway**: http://localhost:4000/graphql
- **Swagger Documentation**: http://localhost:4000/api-docs
- **Kafka UI**: http://localhost:8080
- **Redis Commander**: http://localhost:8081

## Environment Structure

The Docker environment consists of several Docker Compose files that can be used independently or together:

- `docker-compose.yml` - Main configuration that includes all services
- `docker-compose.infrastructure.yml` - Infrastructure services (PostgreSQL, Redis, Kafka, etc.)
- `docker-compose.backend.yml` - Backend microservices
- `docker-compose.frontend.yml` - Frontend applications (web, mobile)

This modular approach allows developers to start only the services they need, reducing resource usage and improving startup time.

### Service Architecture

The environment includes the following service categories, aligned with the journey-centered architecture of the AUSTA SuperApp:

#### Backend Services

- **API Gateway**: Entry point for all API requests
- **Auth Service**: Authentication and authorization
- **Health Journey** ("Minha Saúde"): Health metrics, goals, and device integrations
- **Care Journey** ("Cuidar-me Agora"): Appointments, telemedicine, and provider management
- **Plan Journey** ("Meu Plano & Benefícios"): Insurance plans, benefits, and claims
- **Gamification Engine**: Cross-journey achievements, quests, and rewards
- **Notification Service**: Multi-channel notifications with retry capabilities

#### Infrastructure Services

- **PostgreSQL**: Primary database for all services with journey-specific schemas
- **TimescaleDB**: Extension for time-series health metrics data
- **Redis**: Caching and session storage
- **Kafka & Zookeeper**: Event streaming for cross-journey communication
- **Dev Proxy**: Nginx-based development proxy (v1.21.6) for routing API and WebSocket traffic

#### Frontend Applications

- **Web**: Next.js web application with journey-specific routes
- **Mobile**: React Native mobile application (v0.71.8)
- **Design System**: Shared component library for consistent UI across platforms
- **Primitives**: Foundation design elements (colors, typography, spacing)
- **Interfaces**: Shared TypeScript interfaces for cross-journey data models
- **Journey Context**: Context providers for journey-specific state management

### Network Configuration

All services are connected to a Docker network that allows them to communicate with each other. The dev-proxy service routes external requests to the appropriate internal services.

```
+----------------+     +---------------+     +----------------+
|                |     |               |     |                |
|  Web (Next.js) |     | Mobile (RN)   |     |  External Tools|
|                |     |               |     |                |
+--------+-------+     +-------+-------+     +--------+-------+
         |                     |                      |
         |                     |                      |
         v                     v                      v
+--------------------------------------------------+
|                                                  |
|                   Dev Proxy                      |
|                                                  |
+--------------------------------------------------+
         |                     |                      |
         |                     |                      |
+--------v-------+    +--------v-------+    +--------v-------+
|                |    |                |    |                |
|  API Gateway   |    |  WebSockets    |    |  Other Services|
|                |    |                |    |                |
+--------+-------+    +----------------+    +----------------+
         |
         |
+--------v-------+    +----------------+    +----------------+
|                |    |                |    |                |
| Auth Service   |    | Health Journey |    | Care Journey   |
|                |    |                |    |                |
+----------------+    +----------------+    +----------------+

                      +----------------+    +----------------+
                      |                |    |                |
                      | Plan Journey   |    | Gamification   |
                      |                |    |                |
                      +----------------+    +----------------+
```

## Configuration

### Environment Variables

The environment is configured through `.env` files. A template is provided in `.env.example` with comprehensive documentation for each variable. For local development, create a `.env.local` file based on the example template.

Key environment variables include:

| Variable | Description | Default |
|----------|-------------|--------|
| `POSTGRES_USER` | PostgreSQL admin username | postgres |
| `POSTGRES_PASSWORD` | PostgreSQL admin password | postgres |
| `POSTGRES_HOST` | PostgreSQL hostname | postgres |
| `REDIS_HOST` | Redis hostname | redis |
| `KAFKA_BROKERS` | Kafka broker addresses | kafka:9092 |
| `JWT_SECRET` | Secret for JWT token signing | dev-secret-key |
| `API_GATEWAY_PORT` | Port for API Gateway | 4000 |
| `WEB_PORT` | Port for web application | 3000 |
| `HEALTH_DB_URL` | Health journey database connection string | postgresql://postgres:postgres@postgres:5432/health_journey |
| `CARE_DB_URL` | Care journey database connection string | postgresql://postgres:postgres@postgres:5432/care_journey |
| `PLAN_DB_URL` | Plan journey database connection string | postgresql://postgres:postgres@postgres:5432/plan_journey |
| `GAMIFICATION_DB_URL` | Gamification database connection string | postgresql://postgres:postgres@postgres:5432/gamification |
| `AUTH_DB_URL` | Auth service database connection string | postgresql://postgres:postgres@postgres:5432/auth |

### Service-Specific Configuration

Each service has its own configuration requirements. These are documented in the respective service directories and are set through environment variables. The environment validation script (`validate-env.sh`) ensures all required variables are properly set before starting services.

### Database Setup

The database setup is automated through scripts in the `infrastructure/docker/db` directory:

- `init.sh` - Initializes all journey-specific databases (health_journey, care_journey, plan_journey, gamification, auth)
- `create-databases.sql` - Creates the database schemas with proper encoding and collation
- `enable-extensions.sql` - Enables required PostgreSQL extensions (including TimescaleDB for health metrics)
- `create-users.sql` - Sets up database users with appropriate permissions
- `migrations.sh` - Runs Prisma migrations for all services
- `seed-data.sh` - Seeds databases with journey-specific test data
- `wait-for-db.sh` - Ensures database is ready before running other operations

## Common Development Tasks

### Starting and Stopping Services

```bash
# Start all services
./infrastructure/docker/scripts/docker-compose-up.sh

# Stop all services
./infrastructure/docker/scripts/docker-compose-down.sh

# Restart a specific service
docker-compose restart <service-name>
```

### Viewing Logs

```bash
# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f <service-name>

# Use the logs collector script for advanced filtering
./infrastructure/docker/scripts/logs-collector.sh --service api-gateway --level error
```

### Running Migrations

```bash
# Run all migrations
make db-migrate

# Run migrations for a specific service
cd src/backend/<service-name> && yarn prisma migrate deploy
```

### Seeding Data

```bash
# Seed all databases
make db-seed

# Seed a specific database
./infrastructure/docker/db/seed-data.sh --service <service-name>
```

### Resetting the Environment

```bash
# Reset all databases
make db-reset

# Clean all Docker resources
make clean

# Reset specific journey data
./infrastructure/docker/scripts/reset-data.sh --journey health
```

## Troubleshooting

The Docker environment includes several tools to help diagnose and fix issues:

- `service-health-check.sh` - Verifies the health of all services
- `validate-env.sh` - Ensures all required environment variables are set
- `logs-collector.sh` - Collects and filters logs from all services

### Common Issues

#### Services Won't Start

**Problem**: Docker services fail to start or exit immediately.

**Solution**:
1. Check logs: `docker-compose logs <service-name>`
2. Verify environment variables: `./infrastructure/docker/scripts/validate-env.sh`
3. Ensure ports are available: `lsof -i :<port-number>`
4. Check disk space: `df -h`

#### Database Connection Issues

**Problem**: Services can't connect to the database.

**Solution**:
1. Verify database is running: `docker-compose ps postgres`
2. Check database logs: `docker-compose logs postgres`
3. Ensure correct connection parameters in `.env`
4. Run the wait script: `./infrastructure/docker/db/wait-for-db.sh`

#### Kafka Connection Issues

**Problem**: Services can't connect to Kafka.

**Solution**:
1. Verify Kafka is running: `docker-compose ps kafka zookeeper`
2. Check Kafka logs: `docker-compose logs kafka`
3. Ensure topics are created: `docker-compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092`

#### Out of Memory Errors

**Problem**: Services crash with out of memory errors.

**Solution**:
1. Increase Docker memory allocation in Docker Desktop settings
2. Reduce services running simultaneously
3. Optimize service memory settings in docker-compose files
4. Use the modular Docker Compose approach to start only needed services

#### Module Resolution Issues

**Problem**: TypeScript compilation fails with module resolution errors.

**Solution**:
1. Verify the tsconfig.json path aliases are correctly set
2. Ensure all required packages are installed (@austa/design-system, @design-system/primitives, etc.)
3. Check that the workspace configuration in package.json is correct
4. Run `yarn install` to update dependencies

#### Event Processing Issues

**Problem**: Events are not being processed by the Gamification Engine.

**Solution**:
1. Verify Kafka topics are created correctly
2. Check consumer group offsets: `docker-compose exec kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group gamification-consumers`
3. Ensure event schemas match between producers and consumers
4. Check Gamification Engine logs for processing errors

### Health Checks

Use the health check script to verify all services are functioning correctly:

```bash
./infrastructure/docker/scripts/service-health-check.sh
```

This will check:
- Container status
- Service endpoints
- Database connections
- Kafka broker availability
- API responsiveness
- Journey-specific functionality

## Advanced Usage

### Custom Configurations

You can create custom Docker Compose configurations for specific development scenarios:

```bash
# Create a custom configuration
cp infrastructure/docker/docker-compose.yml infrastructure/docker/docker-compose.custom.yml

# Edit as needed and run with
docker-compose -f infrastructure/docker/docker-compose.custom.yml up -d
```

### Performance Optimization

To improve performance of the development environment:

1. Use volume mounts selectively
2. Enable Docker BuildKit: `export DOCKER_BUILDKIT=1`
3. Increase Docker resource allocation
4. Use the development proxy for efficient routing
5. Implement layer caching for faster builds: `./infrastructure/docker/scripts/build-images.sh --cache`
6. Use Yarn workspaces for efficient dependency management
7. Enable incremental TypeScript compilation

### Integration with IDEs

#### Visual Studio Code

1. Install the Docker and Remote Containers extensions
2. Use the "Attach to Running Container" feature to debug inside containers
3. Configure launch.json for debugging Node.js services

#### JetBrains IDEs (WebStorm, IntelliJ)

1. Configure Docker integration in Settings
2. Set up Run/Debug configurations for Docker Compose
3. Use the "Attach to Node.js" feature for debugging

### Running Tests in Containers

```bash
# Run all tests
make test

# Run tests for a specific service
docker-compose exec <service-name> yarn test

# Run tests with coverage
docker-compose exec <service-name> yarn test --coverage
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Makefile Commands](../Makefile)
- [Database Scripts Documentation](./db/README.md)
- [Development Proxy Documentation](./dev-proxy/README.md)
- [Scripts Documentation](./scripts/README.md)
- [Journey Architecture Documentation](../../docs/architecture/journeys.md)
- [Gamification Engine Documentation](../../docs/architecture/gamification.md)
- [Event Schema Documentation](../../docs/architecture/events.md)