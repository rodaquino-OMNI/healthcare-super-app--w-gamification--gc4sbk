# Docker Scripts Documentation

## Introduction

This directory contains utility scripts for managing the Docker environment for the AUSTA SuperApp development workflow. These scripts streamline common tasks, ensure consistent environment setup, and help troubleshoot issues that may arise during local development.

## Prerequisites

Before using these scripts, ensure you have the following installed:

- Docker (version 20.10.0 or higher)
- Docker Compose (version 2.0.0 or higher)
- Bash shell (version 4.0 or higher)
- Git (for accessing repository information)

## Script Documentation

### generate-env-file.sh

**Purpose**: Generates properly configured `.env` files for local development with appropriate defaults for the AUSTA SuperApp environment.

**Usage**:
```bash
./generate-env-file.sh [OPTIONS]
```

**Parameters**:
- `-e, --environment <env>`: Target environment (default: local)
- `-o, --output <file>`: Output file path (default: .env.local)
- `-f, --force`: Overwrite existing file without prompting
- `-h, --help`: Display help information

**Examples**:
```bash
# Generate default .env.local file
./generate-env-file.sh

# Generate environment-specific configuration
./generate-env-file.sh --environment staging

# Generate with custom output path
./generate-env-file.sh --output ./config/.env.local
```

**Common Issues**:
- **Permission denied**: Ensure the script has execute permissions (`chmod +x generate-env-file.sh`)
- **Missing template files**: Verify that template files exist in the expected location
- **Invalid environment**: Check that the specified environment is supported

### build-images.sh

**Purpose**: Builds Docker images with optimized settings for all AUSTA SuperApp services, implementing multi-stage builds, layer caching, and proper tagging.

**Usage**:
```bash
./build-images.sh [OPTIONS] [SERVICES...]
```

**Parameters**:
- `-t, --tag <tag>`: Custom tag for images (default: latest)
- `-p, --push`: Push images to registry after building
- `-c, --cache`: Use build cache (default: true)
- `-n, --no-cache`: Disable build cache
- `-h, --help`: Display help information
- `SERVICES...`: Specific services to build (default: all services)

**Examples**:
```bash
# Build all services with default settings
./build-images.sh

# Build specific services
./build-images.sh api-gateway auth-service

# Build with custom tag and push to registry
./build-images.sh --tag v1.2.3 --push

# Build without using cache
./build-images.sh --no-cache
```

**Common Issues**:
- **Docker daemon not running**: Ensure Docker service is started
- **Insufficient disk space**: Free up disk space or prune unused Docker resources
- **Authentication failure**: Check Docker registry credentials if pushing images
- **Build failures**: Check service Dockerfile for errors or missing dependencies

### reset-data.sh

**Purpose**: Resets databases and Docker volumes to a clean state for development, with options for selective resets and automatic reseeding.

**Usage**:
```bash
./reset-data.sh [OPTIONS] [SERVICES...]
```

**Parameters**:
- `-a, --all`: Reset all data (volumes, databases, caches)
- `-d, --database`: Reset only database data
- `-v, --volumes`: Reset only Docker volumes
- `-j, --journey <journey>`: Reset data for specific journey (health, care, plan)
- `-s, --seed`: Automatically seed data after reset
- `-y, --yes`: Skip confirmation prompts
- `-h, --help`: Display help information
- `SERVICES...`: Specific services to reset (default: all services)

**Examples**:
```bash
# Reset all data with confirmation prompt
./reset-data.sh --all

# Reset only database data for health journey
./reset-data.sh --database --journey health

# Reset volumes for specific services with auto-seeding
./reset-data.sh --volumes --seed api-gateway auth-service

# Reset all data without confirmation
./reset-data.sh --all --yes
```

**Common Issues**:
- **Permission denied**: Ensure the script has execute permissions
- **Services still running**: Stop related services before resetting data
- **Seeding failures**: Check database connection settings and seed scripts
- **Volume not found**: Verify volume names and Docker Compose configuration

### service-health-check.sh

**Purpose**: Monitors the health of all Docker services by checking container status, service endpoints, database connections, and API responsiveness.

**Usage**:
```bash
./service-health-check.sh [OPTIONS] [SERVICES...]
```

**Parameters**:
- `-a, --all`: Check all services (default)
- `-j, --journey <journey>`: Check services for specific journey
- `-e, --endpoints`: Check HTTP endpoints
- `-d, --databases`: Check database connections
- `-k, --kafka`: Check Kafka broker availability
- `-r, --redis`: Check Redis connection
- `-v, --verbose`: Show detailed output
- `-w, --watch`: Continuously monitor health (updates every 5s)
- `-h, --help`: Display help information
- `SERVICES...`: Specific services to check

**Examples**:
```bash
# Check health of all services
./service-health-check.sh

# Check only database connections
./service-health-check.sh --databases

# Check health of specific journey with detailed output
./service-health-check.sh --journey health --verbose

# Continuously monitor specific services
./service-health-check.sh --watch api-gateway auth-service
```

**Common Issues**:
- **Service unreachable**: Check if the service container is running
- **Database connection failure**: Verify database credentials and network connectivity
- **Kafka broker unavailable**: Ensure Kafka service is running and properly configured
- **Endpoint returning errors**: Check service logs for error details

### logs-collector.sh

**Purpose**: Collects, filters, and manages logs from Docker containers with options for following specific service logs, filtering, and saving to files.

**Usage**:
```bash
./logs-collector.sh [OPTIONS] [SERVICES...]
```

**Parameters**:
- `-f, --follow`: Follow log output (stream logs)
- `-j, --journey <journey>`: Show logs for specific journey
- `-l, --level <level>`: Filter by log level (info, warn, error, debug)
- `-p, --pattern <pattern>`: Filter logs by pattern
- `-o, --output <file>`: Save logs to file
- `-t, --tail <lines>`: Number of lines to show from the end
- `-h, --help`: Display help information
- `SERVICES...`: Specific services to show logs for

**Examples**:
```bash
# Show logs for all services
./logs-collector.sh

# Follow logs for specific services
./logs-collector.sh --follow api-gateway auth-service

# Show only error logs for health journey
./logs-collector.sh --journey health --level error

# Save filtered logs to file
./logs-collector.sh --pattern "user authentication" --output auth-logs.txt
```

**Common Issues**:
- **No logs available**: Check if services are running and generating logs
- **Permission denied**: Ensure the script has execute permissions
- **File write error**: Check permissions for output directory
- **Pattern not matching**: Verify log format and adjust pattern

### docker-compose-down.sh

**Purpose**: Safely stops and cleans up Docker Compose services with options for removing containers, networks, volumes, and cached data.

**Usage**:
```bash
./docker-compose-down.sh [OPTIONS]
```

**Parameters**:
- `-v, --volumes`: Remove named volumes
- `-i, --images`: Remove images
- `-a, --all`: Remove containers, networks, volumes, and images
- `-f, --force`: Skip confirmation prompts
- `-h, --help`: Display help information

**Examples**:
```bash
# Stop services without removing data
./docker-compose-down.sh

# Stop services and remove volumes
./docker-compose-down.sh --volumes

# Complete cleanup without confirmation
./docker-compose-down.sh --all --force
```

**Common Issues**:
- **Permission denied**: Ensure the script has execute permissions
- **Resource in use**: Check for processes using Docker resources
- **Volume not removed**: Verify volume names and permissions
- **Containers still running**: Check for containers outside Docker Compose

### docker-compose-up.sh

**Purpose**: Intelligently starts Docker Compose services in the correct dependency order, ensuring databases are initialized before services connect to them.

**Usage**:
```bash
./docker-compose-up.sh [OPTIONS] [SERVICES...]
```

**Parameters**:
- `-d, --detached`: Run containers in the background
- `-b, --build`: Build images before starting containers
- `-j, --journey <journey>`: Start only services for specific journey
- `-e, --env <file>`: Specify environment file (default: .env.local)
- `-w, --wait`: Wait for all services to be healthy
- `-h, --help`: Display help information
- `SERVICES...`: Specific services to start

**Examples**:
```bash
# Start all services in foreground
./docker-compose-up.sh

# Start services in background with build
./docker-compose-up.sh --detached --build

# Start only health journey services
./docker-compose-up.sh --journey health

# Start with custom environment file
./docker-compose-up.sh --env .env.staging.local
```

**Common Issues**:
- **Port conflicts**: Check for other services using the same ports
- **Missing environment variables**: Verify .env file exists and contains required variables
- **Database initialization failure**: Check database logs for errors
- **Service dependency issues**: Ensure dependent services are properly configured

### validate-env.sh

**Purpose**: Verifies all required environment variables are properly set before starting Docker services, with detailed error messages for missing or invalid configurations.

**Usage**:
```bash
./validate-env.sh [OPTIONS] [ENV_FILE]
```

**Parameters**:
- `-s, --service <service>`: Validate variables for specific service
- `-j, --journey <journey>`: Validate variables for specific journey
- `-v, --verbose`: Show detailed output
- `-f, --fix`: Attempt to fix common issues
- `-h, --help`: Display help information
- `ENV_FILE`: Path to environment file (default: .env.local)

**Examples**:
```bash
# Validate all environment variables
./validate-env.sh

# Validate variables for specific service
./validate-env.sh --service api-gateway

# Validate with custom environment file
./validate-env.sh .env.staging.local

# Validate and attempt to fix issues
./validate-env.sh --fix
```

**Common Issues**:
- **Missing required variables**: Add missing variables to .env file
- **Invalid variable format**: Check variable format against requirements
- **Inconsistent naming**: Ensure consistent variable naming across services
- **File not found**: Verify environment file path

## Best Practices

### Docker Environment Management

1. **Always use scripts for environment operations**
   - Prefer using the provided scripts over direct Docker commands to ensure consistency
   - Scripts handle dependencies and proper ordering that may be missed with manual commands

2. **Keep environment files secure**
   - Never commit .env files to version control
   - Use generate-env-file.sh to create environment files from templates
   - Store sensitive credentials in a secure location

3. **Regular cleanup**
   - Periodically run `docker-compose-down.sh --all` to clean up unused resources
   - Use `docker system prune` to remove unused images, containers, and networks

4. **Optimize for disk space**
   - Build images with proper layer caching
   - Remove unused volumes and images regularly
   - Consider using volume mounts for development to avoid rebuilding

5. **Troubleshooting workflow**
   - Always check service health with `service-health-check.sh` first
   - Use `logs-collector.sh` to gather relevant logs
   - Validate environment with `validate-env.sh` before starting services

## Common Workflows

### Initial Setup

```bash
# Generate environment file
./generate-env-file.sh

# Validate environment
./validate-env.sh

# Build and start all services
./docker-compose-up.sh --build
```

### Daily Development

```bash
# Start services in background
./docker-compose-up.sh --detached

# Check service health
./service-health-check.sh

# View logs for specific journey
./logs-collector.sh --journey health --follow

# Stop services at end of day
./docker-compose-down.sh
```

### Troubleshooting Issues

```bash
# Check service health
./service-health-check.sh --verbose

# Collect logs for problematic service
./logs-collector.sh --service auth-service --level error

# Reset and reseed database
./reset-data.sh --database --seed

# Restart services
./docker-compose-down.sh
./docker-compose-up.sh
```

### Complete Environment Reset

```bash
# Stop all services and remove resources
./docker-compose-down.sh --all

# Regenerate environment file
./generate-env-file.sh --force

# Rebuild and start services
./docker-compose-up.sh --build
```

### Journey-Specific Development

```bash
# Start only services for specific journey
./docker-compose-up.sh --journey health

# Check health of journey services
./service-health-check.sh --journey health

# View logs for journey
./logs-collector.sh --journey health --follow
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AUSTA SuperApp Architecture Documentation](../../docs/architecture.md)
- [Local Development Guide](../../docs/local-development.md)