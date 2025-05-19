#!/bin/bash
# Make this script executable with: chmod +x migrations.sh

# =========================================================================
# AUSTA SuperApp - Database Migrations Script
# =========================================================================
# This script automates the execution of Prisma migrations for all services.
# It detects and runs pending migrations in the correct order, ensuring that
# all database schemas are properly updated and synchronized with the latest
# application models.
#
# Usage: ./migrations.sh [options]
#
# Options:
#   --env <environment>    Specify environment (development, staging, production)
#                          Default: development
#   --service <name>       Run migrations only for the specified service
#   --dry-run              Check for pending migrations without applying them
#   --verbose              Enable verbose logging
#   --help                 Display this help message
# =========================================================================

set -e

# =========================================================================
# Configuration
# =========================================================================

# Base directory for the application
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"

# Default environment
ENVIRONMENT="development"

# Default verbosity
VERBOSE=false

# Default dry run setting
DRY_RUN=false

# Specific service to migrate (empty means all services)
SPECIFIC_SERVICE=""

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Migration order - services listed in the order they should be migrated
# This ensures that dependencies are migrated before dependent services
MIGRATION_ORDER=(
  "auth-service"
  "health-service"
  "care-service"
  "plan-service"
  "gamification-engine"
  "notification-service"
)

# =========================================================================
# Helper Functions
# =========================================================================

# Display help message
show_help() {
  echo -e "${CYAN}AUSTA SuperApp - Database Migrations Script${NC}"
  echo ""
  echo "This script automates the execution of Prisma migrations for all services."
  echo "It detects and runs pending migrations in the correct order, ensuring that"
  echo "all database schemas are properly updated and synchronized."
  echo ""
  echo -e "${YELLOW}Usage:${NC} ./migrations.sh [options]"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  --env <environment>    Specify environment (development, staging, production)"
  echo "                        Default: development"
  echo "  --service <name>       Run migrations only for the specified service"
  echo "  --dry-run              Check for pending migrations without applying them"
  echo "  --verbose              Enable verbose logging"
  echo "  --help                 Display this help message"
  echo ""
  echo -e "${YELLOW}Available services:${NC}"
  for service in "${MIGRATION_ORDER[@]}"; do
    echo "  - $service"
  done
  echo ""
  echo -e "${YELLOW}Examples:${NC}"
  echo "  ./migrations.sh --env production                # Run all migrations in production"
  echo "  ./migrations.sh --service health-service       # Migrate only health-service"
  echo "  ./migrations.sh --dry-run                     # Check for pending migrations"
  echo ""
}

# Log message with timestamp
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message"
      ;;
    "WARN")
      echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
      ;;
    "DEBUG")
      if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message"
      fi
      ;;
    *)
      echo -e "${timestamp} - $message"
      ;;
  esac
}

# Check if a service has Prisma configuration
has_prisma_config() {
  local service=$1
  local prisma_schema="${BASE_DIR}/src/backend/${service}/prisma/schema.prisma"
  
  if [ -f "$prisma_schema" ]; then
    log "DEBUG" "Found Prisma schema for $service at $prisma_schema"
    return 0
  else
    log "DEBUG" "No Prisma schema found for $service at $prisma_schema"
    return 1
  fi
}

# Check if a service has pending migrations
has_pending_migrations() {
  local service=$1
  local service_dir="${BASE_DIR}/src/backend/${service}"
  
  if ! has_prisma_config "$service"; then
    log "DEBUG" "Skipping migration check for $service (no Prisma configuration)"
    return 1
  fi
  
  log "DEBUG" "Checking for pending migrations in $service"
  
  # Change to service directory
  pushd "$service_dir" > /dev/null
  
  # Use Prisma migrate status to check for pending migrations
  # The command will exit with code 1 if there are pending migrations
  if npx prisma migrate status --schema=./prisma/schema.prisma | grep -q "Database schema is up to date"; then
    log "DEBUG" "No pending migrations for $service"
    popd > /dev/null
    return 1
  else
    log "DEBUG" "Found pending migrations for $service"
    popd > /dev/null
    return 0
  fi
}

# Run migrations for a specific service
run_migrations() {
  local service=$1
  local service_dir="${BASE_DIR}/src/backend/${service}"
  
  if ! has_prisma_config "$service"; then
    log "INFO" "Skipping migrations for $service (no Prisma configuration)"
    return 0
  fi
  
  log "INFO" "Running migrations for $service"
  
  # Change to service directory
  pushd "$service_dir" > /dev/null
  
  # Set environment-specific variables
  export NODE_ENV="$ENVIRONMENT"
  
  # Load environment variables if .env file exists
  if [ -f ".env.${ENVIRONMENT}" ]; then
    log "DEBUG" "Loading environment variables from .env.${ENVIRONMENT}"
    set -o allexport
    source ".env.${ENVIRONMENT}"
    set +o allexport
  elif [ -f ".env" ]; then
    log "DEBUG" "Loading environment variables from .env"
    set -o allexport
    source ".env"
    set +o allexport
  fi
  
  # Run migrations
  if [ "$DRY_RUN" = true ]; then
    log "INFO" "[DRY RUN] Would run migrations for $service"
    npx prisma migrate status --schema=./prisma/schema.prisma
  else
    log "INFO" "Applying migrations for $service"
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    
    # Generate Prisma client
    log "DEBUG" "Generating Prisma client for $service"
    npx prisma generate --schema=./prisma/schema.prisma
  fi
  
  # Return to original directory
  popd > /dev/null
  
  log "INFO" "Completed migrations for $service"
  return 0
}

# Check if a service exists in the migration order
service_exists() {
  local service=$1
  for s in "${MIGRATION_ORDER[@]}"; do
    if [ "$s" = "$service" ]; then
      return 0
    fi
  done
  return 1
}

# =========================================================================
# Parse Command Line Arguments
# =========================================================================

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    --service)
      SPECIFIC_SERVICE="$2"
      if ! service_exists "$SPECIFIC_SERVICE"; then
        log "ERROR" "Unknown service: $SPECIFIC_SERVICE"
        echo "Available services:"
        for s in "${MIGRATION_ORDER[@]}"; do
          echo "  - $s"
        done
        exit 1
      fi
      shift
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      log "ERROR" "Unknown option: $key"
      show_help
      exit 1
      ;;
  esac
done

# =========================================================================
# Main Execution
# =========================================================================

log "INFO" "Starting database migrations (Environment: $ENVIRONMENT)"

if [ "$DRY_RUN" = true ]; then
  log "INFO" "Running in dry-run mode - no changes will be applied"
fi

if [ -n "$SPECIFIC_SERVICE" ]; then
  log "INFO" "Running migrations only for $SPECIFIC_SERVICE"
  run_migrations "$SPECIFIC_SERVICE"
  exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    log "ERROR" "Failed to run migrations for $SPECIFIC_SERVICE"
    exit $exit_code
  fi
else
  # Check for pending migrations across all services
  pending_migrations=false
  for service in "${MIGRATION_ORDER[@]}"; do
    if has_pending_migrations "$service"; then
      pending_migrations=true
      log "INFO" "Pending migrations found for $service"
    fi
  done
  
  if [ "$pending_migrations" = false ]; then
    log "INFO" "No pending migrations found for any service"
    exit 0
  fi
  
  # Run migrations in the specified order
  for service in "${MIGRATION_ORDER[@]}"; do
    run_migrations "$service"
    exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
      log "ERROR" "Failed to run migrations for $service"
      exit $exit_code
    fi
  done
fi

log "INFO" "Database migrations completed successfully"

# Create a migration summary file for tracking
SUMMARY_FILE="${BASE_DIR}/infrastructure/docker/db/migration_summary.log"
echo "Migration completed at $(date)" >> "$SUMMARY_FILE"
echo "Environment: $ENVIRONMENT" >> "$SUMMARY_FILE"
echo "Services migrated:" >> "$SUMMARY_FILE"

if [ -n "$SPECIFIC_SERVICE" ]; then
  echo "  - $SPECIFIC_SERVICE" >> "$SUMMARY_FILE"
else
  for service in "${MIGRATION_ORDER[@]}"; do
    if has_prisma_config "$service"; then
      echo "  - $service" >> "$SUMMARY_FILE"
    fi
  done
fi

echo "-----------------------------------" >> "$SUMMARY_FILE"

exit 0