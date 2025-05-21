#!/bin/bash

# =========================================================================
# Gamification Engine Database Migration Script
# =========================================================================
# 
# This script manages database migrations for the gamification-engine service.
# It ensures the database schema is properly updated during deployments by
# running Prisma migrations, with built-in safeguards against data loss.
#
# Usage:
#   ./db-migrate.sh [options]
#
# Options:
#   --env <environment>    Specify environment (dev, staging, prod)
#                          Default: dev
#   --operation <op>       Specify operation (generate, deploy, reset)
#                          Default: deploy
#   --name <name>          Migration name (required for generate operation)
#   --help                 Display this help message
#
# Examples:
#   ./db-migrate.sh --env dev --operation deploy
#   ./db-migrate.sh --env staging --operation deploy
#   ./db-migrate.sh --env dev --operation generate --name add_leaderboard_table
#   ./db-migrate.sh --env dev --operation reset
#
# =========================================================================

# Set strict mode
set -e

# Default values
ENVIRONMENT="dev"
OPERATION="deploy"
MIGRATION_NAME=""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# =========================================================================
# Helper Functions
# =========================================================================

# Display help message
show_help() {
  grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //g' | sed 's/^#//g'
  exit 0
}

# Log message with timestamp
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$BLUE ;;
    "SUCCESS") color=$GREEN ;;
    "WARNING") color=$YELLOW ;;
    "ERROR") color=$RED ;;
  esac
  
  echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message${NC}"
}

# Check if required commands are available
check_requirements() {
  log "INFO" "Checking requirements..."
  
  if ! command -v npx &> /dev/null; then
    log "ERROR" "npx is not installed. Please install Node.js and npm."
    exit 1
  fi
  
  if ! command -v prisma &> /dev/null && ! [ -f "$ROOT_DIR/node_modules/.bin/prisma" ]; then
    log "ERROR" "Prisma CLI is not installed. Please run 'npm install' in the project root."
    exit 1
  fi
  
  log "SUCCESS" "All requirements satisfied."
}

# Validate database connection
validate_db_connection() {
  log "INFO" "Validating database connection..."
  
  if [ -z "$DATABASE_URL" ]; then
    log "ERROR" "DATABASE_URL environment variable is not set."
    log "ERROR" "Please set the DATABASE_URL environment variable or create a .env file."
    exit 1
  fi
  
  # Try to connect to the database
  if ! npx prisma db execute --stdin --schema="$ROOT_DIR/prisma/schema.prisma" <<< "SELECT 1;" &> /dev/null; then
    log "ERROR" "Failed to connect to the database. Please check your DATABASE_URL."
    exit 1
  fi
  
  log "SUCCESS" "Database connection successful."
}

# =========================================================================
# Migration Functions
# =========================================================================

# Generate a new migration
generate_migration() {
  if [ -z "$MIGRATION_NAME" ]; then
    log "ERROR" "Migration name is required for generate operation."
    log "ERROR" "Use --name <migration_name> to specify a name."
    exit 1
  fi
  
  log "INFO" "Generating migration '$MIGRATION_NAME'..."
  
  # Create migration
  if [ "$ENVIRONMENT" == "dev" ]; then
    npx prisma migrate dev --name "$MIGRATION_NAME" --schema="$ROOT_DIR/prisma/schema.prisma" --create-only
    log "SUCCESS" "Migration created successfully. Review the generated SQL before applying."
  else
    log "ERROR" "Migrations can only be generated in the dev environment."
    exit 1
  fi
}

# Deploy existing migrations
deploy_migrations() {
  log "INFO" "Deploying migrations in $ENVIRONMENT environment..."
  
  case $ENVIRONMENT in
    "dev")
      # Development environment - apply migrations and generate client
      npx prisma migrate dev --schema="$ROOT_DIR/prisma/schema.prisma"
      log "SUCCESS" "Migrations applied successfully in development environment."
      ;;
      
    "staging")
      # Staging environment - apply migrations safely
      npx prisma migrate deploy --schema="$ROOT_DIR/prisma/schema.prisma"
      log "SUCCESS" "Migrations applied successfully in staging environment."
      ;;
      
    "prod")
      # Production environment - confirm before applying
      log "WARNING" "You are about to apply migrations to the PRODUCTION database."
      log "WARNING" "This operation cannot be undone and may cause downtime."
      read -p "Are you sure you want to continue? (y/N): " confirm
      
      if [[ $confirm =~ ^[Yy]$ ]]; then
        log "INFO" "Applying migrations to production..."
        npx prisma migrate deploy --schema="$ROOT_DIR/prisma/schema.prisma"
        log "SUCCESS" "Migrations applied successfully in production environment."
      else
        log "INFO" "Migration cancelled by user."
        exit 0
      fi
      ;;
      
    *)
      log "ERROR" "Unknown environment: $ENVIRONMENT"
      exit 1
      ;;
  esac
  
  # Generate Prisma client after migrations
  log "INFO" "Generating Prisma client..."
  npx prisma generate --schema="$ROOT_DIR/prisma/schema.prisma"
  log "SUCCESS" "Prisma client generated successfully."
}

# Reset database (development only)
reset_database() {
  if [ "$ENVIRONMENT" != "dev" ]; then
    log "ERROR" "Database reset is only allowed in the development environment."
    exit 1
  fi
  
  log "WARNING" "You are about to RESET the development database."
  log "WARNING" "This will DELETE ALL DATA in the database."
  read -p "Are you sure you want to continue? (y/N): " confirm
  
  if [[ $confirm =~ ^[Yy]$ ]]; then
    log "INFO" "Resetting development database..."
    npx prisma migrate reset --force --schema="$ROOT_DIR/prisma/schema.prisma"
    log "SUCCESS" "Database reset successfully."
  else
    log "INFO" "Database reset cancelled by user."
    exit 0
  fi
}

# =========================================================================
# Main Script
# =========================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --operation)
      OPERATION="$2"
      shift 2
      ;;
    --name)
      MIGRATION_NAME="$2"
      shift 2
      ;;
    --help)
      show_help
      ;;
    *)
      log "ERROR" "Unknown option: $1"
      show_help
      ;;
  esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  log "ERROR" "Invalid environment: $ENVIRONMENT"
  log "ERROR" "Valid environments are: dev, staging, prod"
  exit 1
fi

# Validate operation
if [[ ! "$OPERATION" =~ ^(generate|deploy|reset)$ ]]; then
  log "ERROR" "Invalid operation: $OPERATION"
  log "ERROR" "Valid operations are: generate, deploy, reset"
  exit 1
fi

# Display configuration
log "INFO" "======================================================="
log "INFO" "Gamification Engine Database Migration"
log "INFO" "======================================================="
log "INFO" "Environment: $ENVIRONMENT"
log "INFO" "Operation: $OPERATION"
if [ -n "$MIGRATION_NAME" ]; then
  log "INFO" "Migration Name: $MIGRATION_NAME"
fi
log "INFO" "======================================================="

# Check requirements
check_requirements

# Change to project root directory
cd "$ROOT_DIR"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  log "INFO" "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Validate database connection
validate_db_connection

# Execute requested operation
case $OPERATION in
  "generate")
    generate_migration
    ;;
  "deploy")
    deploy_migrations
    ;;
  "reset")
    reset_database
    ;;
esac

log "SUCCESS" "Migration operation completed successfully."
exit 0