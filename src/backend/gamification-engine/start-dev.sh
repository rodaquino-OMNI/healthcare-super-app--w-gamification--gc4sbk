#!/bin/bash
# Make this script executable with: chmod +x start-dev.sh

# =========================================================
# Gamification Engine Development Environment Startup Script
# =========================================================
#
# This script automates the initialization of the local development
# environment for the gamification-engine backend service.
#
# Features:
# - Loads environment variables from .env.local for local development
# - Validates required environment variables
# - Starts required Docker services (PostgreSQL, Kafka, Redis)
# - Generates Prisma client
# - Applies database migrations
# - Seeds the database with initial data
# - Starts the application in development mode
# - Implements exponential backoff retry for service startup
# - Performs health checks for all required services
#
# Usage: ./start-dev.sh

# Exit on error
set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR" && pwd)"

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Log functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
check_requirements() {
  log_info "Checking requirements..."
  
  local missing_requirements=false
  
  if ! command_exists docker; then
    log_error "Docker is not installed. Please install Docker."
    missing_requirements=true
  fi
  
  if ! command_exists docker-compose; then
    log_error "Docker Compose is not installed. Please install Docker Compose."
    missing_requirements=true
  fi
  
  if ! command_exists node; then
    log_error "Node.js is not installed. Please install Node.js."
    missing_requirements=true
  fi
  
  if ! command_exists npm; then
    log_error "npm is not installed. Please install npm."
    missing_requirements=true
  fi
  
  if ! command_exists npx; then
    log_error "npx is not installed. Please install npx."
    missing_requirements=true
  fi
  
  if [ "$missing_requirements" = true ]; then
    log_error "Please install the missing requirements and try again."
    exit 1
  fi
  
  log_success "All requirements are met."
}

# Load environment variables
load_env_vars() {
  log_info "Loading environment variables..."
  
  # Load from .env if it exists
  if [ -f "$ROOT_DIR/.env" ]; then
    log_info "Loading variables from .env"
    set -a
    source "$ROOT_DIR/.env"
    set +a
  fi
  
  # Load from .env.local if it exists (overrides .env)
  if [ -f "$ROOT_DIR/.env.local" ]; then
    log_info "Loading variables from .env.local"
    set -a
    source "$ROOT_DIR/.env.local"
    set +a
  else
    log_warning ".env.local file not found. Using default environment variables."
  fi
  
  # Set default environment to development if not specified
  export NODE_ENV=${NODE_ENV:-development}
  
  log_success "Environment variables loaded."
}

# Validate environment variables
validate_env_vars() {
  log_info "Validating environment variables..."
  
  if [ -f "$ROOT_DIR/scripts/validate-env.sh" ]; then
    bash "$ROOT_DIR/scripts/validate-env.sh"
    if [ $? -ne 0 ]; then
      log_error "Environment validation failed. Please check the error messages above."
      exit 1
    fi
  else
    log_warning "validate-env.sh script not found. Skipping environment validation."
  fi
  
  log_success "Environment variables validated."
}

# Start Docker services with retry mechanism
start_docker_services() {
  log_info "Starting Docker services..."
  
  local max_attempts=5
  local attempt=1
  local delay=5
  
  while [ $attempt -le $max_attempts ]; do
    log_info "Attempt $attempt of $max_attempts to start Docker services..."
    
    if docker-compose -f "$ROOT_DIR/../../infrastructure/docker/docker-compose.yml" up -d postgres kafka redis zookeeper; then
      log_success "Docker services started successfully."
      return 0
    else
      log_warning "Failed to start Docker services (attempt $attempt of $max_attempts)."
      
      if [ $attempt -lt $max_attempts ]; then
        local backoff=$((delay * 2 ** (attempt - 1)))
        log_info "Retrying in $backoff seconds..."
        sleep $backoff
      else
        log_error "Failed to start Docker services after $max_attempts attempts."
        exit 1
      fi
    fi
    
    attempt=$((attempt + 1))
  done
}

# Health check for required services
health_check() {
  log_info "Performing health checks for required services..."
  
  # Check PostgreSQL
  check_postgres() {
    log_info "Checking PostgreSQL connection..."
    local max_attempts=10
    local attempt=1
    local delay=3
    
    while [ $attempt -le $max_attempts ]; do
      if docker exec -it $(docker ps -q -f name=postgres) pg_isready -h localhost -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL is ready."
        return 0
      else
        log_warning "PostgreSQL is not ready (attempt $attempt of $max_attempts)."
        
        if [ $attempt -lt $max_attempts ]; then
          local backoff=$((delay * 2 ** (attempt - 1)))
          log_info "Retrying in $backoff seconds..."
          sleep $backoff
        else
          log_error "PostgreSQL health check failed after $max_attempts attempts."
          return 1
        fi
      fi
      
      attempt=$((attempt + 1))
    done
  }
  
  # Check Kafka
  check_kafka() {
    log_info "Checking Kafka connection..."
    local max_attempts=10
    local attempt=1
    local delay=3
    
    while [ $attempt -le $max_attempts ]; do
      if docker exec -it $(docker ps -q -f name=kafka) kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
        log_success "Kafka is ready."
        return 0
      else
        log_warning "Kafka is not ready (attempt $attempt of $max_attempts)."
        
        if [ $attempt -lt $max_attempts ]; then
          local backoff=$((delay * 2 ** (attempt - 1)))
          log_info "Retrying in $backoff seconds..."
          sleep $backoff
        else
          log_error "Kafka health check failed after $max_attempts attempts."
          return 1
        fi
      fi
      
      attempt=$((attempt + 1))
    done
  }
  
  # Check Redis
  check_redis() {
    log_info "Checking Redis connection..."
    local max_attempts=10
    local attempt=1
    local delay=3
    
    while [ $attempt -le $max_attempts ]; do
      if docker exec -it $(docker ps -q -f name=redis) redis-cli ping > /dev/null 2>&1; then
        log_success "Redis is ready."
        return 0
      else
        log_warning "Redis is not ready (attempt $attempt of $max_attempts)."
        
        if [ $attempt -lt $max_attempts ]; then
          local backoff=$((delay * 2 ** (attempt - 1)))
          log_info "Retrying in $backoff seconds..."
          sleep $backoff
        else
          log_error "Redis health check failed after $max_attempts attempts."
          return 1
        fi
      fi
      
      attempt=$((attempt + 1))
    done
  }
  
  # Run all health checks
  check_postgres || exit 1
  check_kafka || exit 1
  check_redis || exit 1
  
  log_success "All services are healthy."
}

# Generate Prisma client
generate_prisma_client() {
  log_info "Generating Prisma client..."
  
  local max_attempts=3
  local attempt=1
  local delay=2
  
  while [ $attempt -le $max_attempts ]; do
    log_info "Attempt $attempt of $max_attempts to generate Prisma client..."
    
    if npx prisma generate --schema="$ROOT_DIR/prisma/schema.prisma"; then
      log_success "Prisma client generated successfully."
      return 0
    else
      log_warning "Failed to generate Prisma client (attempt $attempt of $max_attempts)."
      
      if [ $attempt -lt $max_attempts ]; then
        local backoff=$((delay * 2 ** (attempt - 1)))
        log_info "Retrying in $backoff seconds..."
        sleep $backoff
      else
        log_error "Failed to generate Prisma client after $max_attempts attempts."
        exit 1
      fi
    fi
    
    attempt=$((attempt + 1))
  done
}

# Run database migrations
run_migrations() {
  log_info "Running database migrations..."
  
  if [ -f "$ROOT_DIR/scripts/db-migrate.sh" ]; then
    bash "$ROOT_DIR/scripts/db-migrate.sh"
    if [ $? -ne 0 ]; then
      log_error "Database migration failed. Please check the error messages above."
      exit 1
    fi
  else
    log_warning "db-migrate.sh script not found. Falling back to direct Prisma migration."
    
    local max_attempts=3
    local attempt=1
    local delay=2
    
    while [ $attempt -le $max_attempts ]; do
      log_info "Attempt $attempt of $max_attempts to run migrations..."
      
      if npx prisma migrate dev --schema="$ROOT_DIR/prisma/schema.prisma" --name="development"; then
        log_success "Database migrations applied successfully."
        return 0
      else
        log_warning "Failed to apply database migrations (attempt $attempt of $max_attempts)."
        
        if [ $attempt -lt $max_attempts ]; then
          local backoff=$((delay * 2 ** (attempt - 1)))
          log_info "Retrying in $backoff seconds..."
          sleep $backoff
        else
          log_error "Failed to apply database migrations after $max_attempts attempts."
          exit 1
        fi
      fi
      
      attempt=$((attempt + 1))
    done
  fi
  
  log_success "Database migrations completed."
}

# Setup Kafka topics
setup_kafka_topics() {
  log_info "Setting up Kafka topics..."
  
  if [ -f "$ROOT_DIR/scripts/kafka-setup.sh" ]; then
    bash "$ROOT_DIR/scripts/kafka-setup.sh"
    if [ $? -ne 0 ]; then
      log_error "Kafka topic setup failed. Please check the error messages above."
      exit 1
    fi
  else
    log_warning "kafka-setup.sh script not found. Skipping Kafka topic setup."
    log_warning "You may need to create Kafka topics manually."
  fi
  
  log_success "Kafka topics setup completed."
}

# Seed the database
seed_database() {
  log_info "Seeding the database..."
  
  local max_attempts=3
  local attempt=1
  local delay=2
  
  while [ $attempt -le $max_attempts ]; do
    log_info "Attempt $attempt of $max_attempts to seed the database..."
    
    if npx prisma db seed; then
      log_success "Database seeded successfully."
      return 0
    else
      log_warning "Failed to seed the database (attempt $attempt of $max_attempts)."
      
      if [ $attempt -lt $max_attempts ]; then
        local backoff=$((delay * 2 ** (attempt - 1)))
        log_info "Retrying in $backoff seconds..."
        sleep $backoff
      else
        log_error "Failed to seed the database after $max_attempts attempts."
        exit 1
      fi
    fi
    
    attempt=$((attempt + 1))
  done
}

# Start the application in development mode
start_application() {
  log_info "Starting the application in development mode..."
  
  # Check if the application is already running
  if [ -f "$ROOT_DIR/.pid" ]; then
    local pid=$(cat "$ROOT_DIR/.pid")
    if ps -p $pid > /dev/null; then
      log_warning "Application is already running with PID $pid."
      log_warning "To restart, kill the process first: kill $pid"
      exit 0
    else
      log_warning "Found stale PID file. Removing it."
      rm -f "$ROOT_DIR/.pid"
    fi
  fi
  
  # Start the application with standardized event schema support
  log_info "Starting the gamification engine with @austa/interfaces integration..."
  npm run start:dev &
  
  # Save the PID for later use
  echo $! > "$ROOT_DIR/.pid"
  
  log_success "Application started successfully with PID $(cat "$ROOT_DIR/.pid")."
  log_info "You can stop the application by running: kill $(cat "$ROOT_DIR/.pid")"
}

# Main execution
main() {
  log_info "Starting gamification-engine development environment..."
  
  check_requirements
  load_env_vars
  validate_env_vars
  start_docker_services
  health_check
  generate_prisma_client
  run_migrations
  setup_kafka_topics
  seed_database
  start_application
  
  log_success "Gamification engine development environment is ready!"
  log_info "API is available at: http://localhost:${PORT:-3000}"
  log_info "GraphQL playground is available at: http://localhost:${PORT:-3000}/graphql"
  log_info "Press Ctrl+C to stop the application."
  
  # Keep the script running to show logs
  wait $(cat "$ROOT_DIR/.pid")
}

# Run the main function
main