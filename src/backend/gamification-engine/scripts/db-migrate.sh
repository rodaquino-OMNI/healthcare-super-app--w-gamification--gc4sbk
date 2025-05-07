#!/bin/bash
# Make script executable with: chmod +x db-migrate.sh

# =========================================================
# Gamification Engine Database Migration Script
# =========================================================
# This script manages database migrations for the gamification-engine service.
# It provides functionality for generating, deploying, and resetting migrations
# with proper environment detection and error handling.
#
# Usage:
#   ./db-migrate.sh [command] [options]
#
# Commands:
#   generate   - Generate a new migration based on schema changes
#   deploy     - Deploy pending migrations to the database
#   reset      - Reset the database (development only)
#   status     - Show status of migrations
#   help       - Show this help message
#
# Options:
#   --name=<name>  - Name for the new migration (required for generate)
#   --env=<env>    - Environment (development, staging, production)
#                    Default: development
#   --force        - Force operation without confirmation (use with caution)
#
# Examples:
#   ./db-migrate.sh generate --name=add_user_points
#   ./db-migrate.sh deploy --env=staging
#   ./db-migrate.sh reset --force
#   ./db-migrate.sh status
# =========================================================

set -e

# Color definitions
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Default values
COMMAND=""
ENVIRONMENT="development"
MIGRATION_NAME=""
FORCE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PRISMA_DIR="$PROJECT_DIR/prisma"

# Function to display error messages and exit
function error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  exit 1
}

# Function to display warning messages
function warn() {
  echo -e "${YELLOW}WARNING: $1${NC}" >&2
}

# Function to display info messages
function info() {
  echo -e "${BLUE}INFO: $1${NC}"
}

# Function to display success messages
function success() {
  echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Function to display help message
function show_help() {
  grep -B1000 -A0 "^# Options:" "$0" | grep -v "^# Options:" | sed -e 's/^# //g' -e 's/^#//g'
  exit 0
}

# Function to parse command line arguments
function parse_args() {
  if [[ $# -eq 0 ]]; then
    show_help
  fi

  COMMAND="$1"
  shift

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --name=*)
        MIGRATION_NAME="${1#*=}"
        ;;
      --env=*)
        ENVIRONMENT="${1#*=}"
        ;;
      --force)
        FORCE=true
        ;;
      --help)
        show_help
        ;;
      *)
        error "Unknown option: $1"
        ;;
    esac
    shift
  done

  # Validate environment
  if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
  fi

  # Validate command
  if [[ "$COMMAND" != "generate" && "$COMMAND" != "deploy" && "$COMMAND" != "reset" && "$COMMAND" != "status" && "$COMMAND" != "help" ]]; then
    error "Invalid command: $COMMAND. Must be one of: generate, deploy, reset, status, help"
  fi

  # Validate migration name for generate command
  if [[ "$COMMAND" == "generate" && -z "$MIGRATION_NAME" ]]; then
    error "Migration name is required for generate command. Use --name=<name>"
  fi

  # Validate reset command is only used in development
  if [[ "$COMMAND" == "reset" && "$ENVIRONMENT" != "development" ]]; then
    error "Reset command can only be used in development environment"
  fi
}

# Function to validate DATABASE_URL
function validate_database_url() {
  if [[ -z "$DATABASE_URL" ]]; then
    # Check if .env file exists and try to load DATABASE_URL from it
    if [[ -f "$PROJECT_DIR/.env" ]]; then
      source "$PROJECT_DIR/.env"
    fi

    # Check if .env.$ENVIRONMENT file exists and try to load DATABASE_URL from it
    if [[ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]]; then
      source "$PROJECT_DIR/.env.$ENVIRONMENT"
    fi

    # If still empty, error out
    if [[ -z "$DATABASE_URL" ]]; then
      error "DATABASE_URL environment variable is not set. Please set it or add it to .env file."
    fi
  fi

  # Validate DATABASE_URL format
  if [[ ! "$DATABASE_URL" =~ ^postgresql://.*$ ]]; then
    error "DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql://"
  fi

  # Test database connection
  info "Testing database connection..."
  if ! npx prisma db execute --url="$DATABASE_URL" --command="SELECT 1" > /dev/null 2>&1; then
    error "Failed to connect to database. Please check your DATABASE_URL and ensure the database is running."
  fi
  success "Database connection successful"
}

# Function to generate a new migration
function generate_migration() {
  info "Generating migration: $MIGRATION_NAME"
  
  # Ensure prisma directory exists
  if [[ ! -d "$PRISMA_DIR" ]]; then
    error "Prisma directory not found at $PRISMA_DIR"
  fi

  # Generate migration
  cd "$PROJECT_DIR"
  npx prisma migrate dev --name="$MIGRATION_NAME" --create-only
  
  success "Migration generated successfully"
  info "Review the generated migration files in $PRISMA_DIR/migrations before deploying"
}

# Function to deploy migrations
function deploy_migrations() {
  info "Deploying migrations in $ENVIRONMENT environment"
  
  # Ensure prisma directory exists
  if [[ ! -d "$PRISMA_DIR" ]]; then
    error "Prisma directory not found at $PRISMA_DIR"
  fi

  # Check if there are migrations to apply
  cd "$PROJECT_DIR"
  MIGRATION_STATUS=$(npx prisma migrate status --preview 2>&1)
  
  if [[ "$MIGRATION_STATUS" =~ "No pending migrations" ]]; then
    info "No pending migrations to apply"
    return 0
  fi
  
  # Show pending migrations
  echo "$MIGRATION_STATUS"
  
  # Confirm deployment in production unless forced
  if [[ "$ENVIRONMENT" == "production" && "$FORCE" != true ]]; then
    read -p "Are you sure you want to deploy migrations to PRODUCTION? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      info "Migration deployment cancelled"
      exit 0
    fi
  fi

  # Deploy migrations based on environment
  cd "$PROJECT_DIR"
  case "$ENVIRONMENT" in
    development)
      npx prisma migrate dev
      ;;
    staging)
      # Use deploy for staging but with more logging
      npx prisma migrate deploy --preview
      npx prisma migrate deploy
      ;;
    production)
      # For production, use deploy with transaction
      info "Starting migration deployment with transaction protection"
      npx prisma migrate deploy
      ;;
  esac
  
  success "Migrations deployed successfully"
  
  # Run seed script in development environment if it exists
  if [[ "$ENVIRONMENT" == "development" && -f "$PRISMA_DIR/seed.ts" ]]; then
    info "Running seed script"
    npx prisma db seed
    success "Database seeded successfully"
  fi
}

# Function to reset database (development only)
function reset_database() {
  if [[ "$ENVIRONMENT" != "development" ]]; then
    error "Reset command can only be used in development environment"
  fi
  
  info "Resetting database in DEVELOPMENT environment"
  
  # Confirm reset unless forced
  if [[ "$FORCE" != true ]]; then
    read -p "Are you sure you want to RESET the development database? This will DELETE ALL DATA. (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      info "Database reset cancelled"
      exit 0
    fi
  fi
  
  # Reset database
  cd "$PROJECT_DIR"
  npx prisma migrate reset --force
  
  success "Database reset successfully"
}

# Function to show migration status
function show_migration_status() {
  info "Checking migration status for $ENVIRONMENT environment"
  
  # Ensure prisma directory exists
  if [[ ! -d "$PRISMA_DIR" ]]; then
    error "Prisma directory not found at $PRISMA_DIR"
  fi
  
  # Show migration status
  cd "$PROJECT_DIR"
  npx prisma migrate status
}

# Main function
function main() {
  echo -e "${BLUE}=== Gamification Engine Database Migration Tool ===${NC}"
  echo "Environment: $ENVIRONMENT"
  echo "Command: $COMMAND"
  echo
  
  # Validate DATABASE_URL for all commands except help
  if [[ "$COMMAND" != "help" ]]; then
    validate_database_url
  fi
  
  # Execute command
  case "$COMMAND" in
    generate)
      generate_migration
      ;;
    deploy)
      deploy_migrations
      ;;
    reset)
      reset_database
      ;;
    status)
      show_migration_status
      ;;
    help)
      show_help
      ;;
  esac
}

# Parse command line arguments
parse_args "$@"

# Run main function
main