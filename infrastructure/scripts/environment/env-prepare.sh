#!/bin/bash
# Make sure this script is executable: chmod +x infrastructure/scripts/environment/env-prepare.sh

#########################################################################
# env-prepare.sh
#
# Main entry point script that orchestrates the environment preparation
# process by sequentially calling the specialized scripts for environment
# variables, configuration, secrets, validation, and runtime checks to
# ensure complete and consistent environment setup.
#
# This script implements:
# - Comprehensive environment preparation orchestration
# - Command-line interface with options for different deployment tiers
# - Detailed logging and error reporting for troubleshooting
# - Rollback mechanisms for failed environment setup
#
# Usage: ./env-prepare.sh [options]
#
# Options:
#   -e, --environment <env>   Specify environment (dev, staging, prod)
#   -j, --journey <journey>   Specify journey context (health, care, plan, all)
#   -s, --service <service>   Specify service name (optional)
#   -c, --config <path>       Specify custom config path (optional)
#   -d, --dry-run             Validate without applying changes
#   -f, --force               Skip confirmation prompts
#   -v, --verbose             Enable verbose output
#   -h, --help                Display this help message
#
# Examples:
#   ./env-prepare.sh -e dev -j health
#   ./env-prepare.sh --environment staging --journey all
#   ./env-prepare.sh -e prod -j care -s care-service
#   ./env-prepare.sh -e dev -j all --dry-run
#
#########################################################################

set -e

# Default values
ENVIRONMENT=""
JOURNEY="all"
SERVICE=""
CONFIG_PATH=""
DRY_RUN=false
FORCE=false
VERBOSE=false

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_MANAGER="${SCRIPT_DIR}/env-manager.sh"
CONFIG_PARSER="${SCRIPT_DIR}/config-parser.sh"
SECRETS_MANAGER="${SCRIPT_DIR}/secrets-manager.sh"
JOURNEY_CONFIG="${SCRIPT_DIR}/journey-config.sh"
ENV_VALIDATOR="${SCRIPT_DIR}/env-validator.sh"
RUNTIME_CHECK="${SCRIPT_DIR}/runtime-check.sh"

# ANSI color codes for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Timestamp for logs and rollback files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Rollback directory
ROLLBACK_DIR="/tmp/austa_env_rollback_${TIMESTAMP}"

# Display script usage
function show_usage {
    echo -e "${BLUE}Usage:${NC} ./env-prepare.sh [options]"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  -e, --environment <env>   Specify environment (dev, staging, prod)"
    echo "  -j, --journey <journey>   Specify journey context (health, care, plan, all)"
    echo "  -s, --service <service>   Specify service name (optional)"
    echo "  -c, --config <path>       Specify custom config path (optional)"
    echo "  -d, --dry-run             Validate without applying changes"
    echo "  -f, --force               Skip confirmation prompts"
    echo "  -v, --verbose             Enable verbose output"
    echo "  -h, --help                Display this help message"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./env-prepare.sh -e dev -j health"
    echo "  ./env-prepare.sh --environment staging --journey all"
    echo "  ./env-prepare.sh -e prod -j care -s care-service"
    echo "  ./env-prepare.sh -e dev -j all --dry-run"
    exit 1
}

# Log messages with different severity levels
function log_info {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_warn {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

function log_debug {
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

function log_step {
    echo -e "\n${MAGENTA}[STEP]${NC} $1\n"
}

# Validate environment value
function validate_environment {
    local env=$1
    case "$env" in
        dev|development)
            echo "dev"
            ;;
        staging|stage)
            echo "staging"
            ;;
        prod|production)
            echo "prod"
            ;;
        *)
            log_error "Invalid environment: $env. Must be one of: dev, staging, prod"
            exit 1
            ;;
    esac
}

# Validate journey value
function validate_journey {
    local journey=$1
    case "$journey" in
        health|care|plan|all)
            echo "$journey"
            ;;
        *)
            log_error "Invalid journey: $journey. Must be one of: health, care, plan, all"
            exit 1
            ;;
    esac
}

# Check if a script exists and is executable
function check_script {
    local script=$1
    if [ ! -f "$script" ]; then
        log_error "Required script not found: $script"
        exit 1
    fi
    
    if [ ! -x "$script" ]; then
        log_warn "Script is not executable: $script"
        log_info "Making script executable: chmod +x $script"
        chmod +x "$script"
    fi
}

# Create rollback directory and backup files
function setup_rollback {
    log_debug "Setting up rollback directory: $ROLLBACK_DIR"
    mkdir -p "$ROLLBACK_DIR"
    
    # Backup current environment files
    if [ -f ".env" ]; then
        cp ".env" "$ROLLBACK_DIR/.env.backup"
    fi
    
    if [ -f ".env.${ENVIRONMENT}" ]; then
        cp ".env.${ENVIRONMENT}" "$ROLLBACK_DIR/.env.${ENVIRONMENT}.backup"
    fi
    
    # Create rollback metadata
    cat > "$ROLLBACK_DIR/metadata.txt" << EOF
Timestamp: $(date)
Environment: $ENVIRONMENT
Journey: $JOURNEY
Service: $SERVICE
Config Path: $CONFIG_PATH
EOF
    
    log_debug "Rollback setup complete"
}

# Execute rollback if needed
function execute_rollback {
    local error_message=$1
    log_error "Environment preparation failed: $error_message"
    log_warn "Executing rollback..."
    
    # Restore environment files if they exist
    if [ -f "$ROLLBACK_DIR/.env.backup" ]; then
        log_debug "Restoring .env file"
        cp "$ROLLBACK_DIR/.env.backup" ".env"
    fi
    
    if [ -f "$ROLLBACK_DIR/.env.${ENVIRONMENT}.backup" ]; then
        log_debug "Restoring .env.${ENVIRONMENT} file"
        cp "$ROLLBACK_DIR/.env.${ENVIRONMENT}.backup" ".env.${ENVIRONMENT}"
    fi
    
    log_info "Rollback completed. Original environment has been restored."
    log_info "Rollback files are available at: $ROLLBACK_DIR"
    
    exit 1
}

# Execute a script with proper error handling
function execute_script {
    local script=$1
    local description=$2
    shift 2
    
    log_step "$description"
    log_debug "Executing: $script $@"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would execute: $script $@"
        return 0
    fi
    
    if ! "$script" "$@"; then
        execute_rollback "Failed to execute $script"
    fi
    
    log_info "Successfully completed: $description"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--environment)
            ENVIRONMENT=$(validate_environment "$2")
            shift
            shift
            ;;
        -j|--journey)
            JOURNEY=$(validate_journey "$2")
            shift
            shift
            ;;
        -s|--service)
            SERVICE="$2"
            shift
            shift
            ;;
        -c|--config)
            CONFIG_PATH="$2"
            shift
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            log_error "Unknown option: $key"
            show_usage
            ;;
    esac
done

# Validate required arguments
if [ -z "$ENVIRONMENT" ]; then
    log_error "Environment (-e, --environment) is required"
    show_usage
fi

# Check if required scripts exist and are executable
log_debug "Checking required scripts"
check_script "$ENV_MANAGER"
check_script "$CONFIG_PARSER"
check_script "$SECRETS_MANAGER"
check_script "$JOURNEY_CONFIG"
check_script "$ENV_VALIDATOR"
check_script "$RUNTIME_CHECK"

# Display execution plan
log_info "Environment Preparation Plan:"
log_info "  Environment: $ENVIRONMENT"
log_info "  Journey: $JOURNEY"
if [ -n "$SERVICE" ]; then
    log_info "  Service: $SERVICE"
fi
if [ -n "$CONFIG_PATH" ]; then
    log_info "  Custom Config: $CONFIG_PATH"
fi
if [ "$DRY_RUN" = true ]; then
    log_info "  Mode: DRY RUN (no changes will be applied)"
fi

# Confirm execution if not forced
if [ "$FORCE" != true ] && [ "$DRY_RUN" != true ]; then
    read -p "Continue with environment preparation? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled by user"
        exit 0
    fi
fi

# Setup rollback mechanism
if [ "$DRY_RUN" != true ]; then
    setup_rollback
fi

# Main execution
log_info "Starting environment preparation for AUSTA SuperApp"
log_info "Timestamp: $(date)"

# Build common arguments for all scripts
COMMON_ARGS="--environment $ENVIRONMENT"
if [ "$VERBOSE" = true ]; then
    COMMON_ARGS="$COMMON_ARGS --verbose"
fi
if [ "$DRY_RUN" = true ]; then
    COMMON_ARGS="$COMMON_ARGS --dry-run"
fi
if [ -n "$SERVICE" ]; then
    COMMON_ARGS="$COMMON_ARGS --service $SERVICE"
fi
if [ -n "$CONFIG_PATH" ]; then
    COMMON_ARGS="$COMMON_ARGS --config $CONFIG_PATH"
fi

# Step 1: Set up environment variables
execute_script "$ENV_MANAGER" "Setting up environment variables" $COMMON_ARGS

# Step 2: Parse and merge configuration
execute_script "$CONFIG_PARSER" "Parsing configuration" $COMMON_ARGS

# Step 3: Handle secrets
execute_script "$SECRETS_MANAGER" "Managing secrets" $COMMON_ARGS

# Step 4: Set up journey-specific configurations
if [ "$JOURNEY" = "all" ]; then
    # Process each journey separately
    for j in "health" "care" "plan"; do
        execute_script "$JOURNEY_CONFIG" "Configuring $j journey" $COMMON_ARGS --journey $j
    done
else
    # Process only the specified journey
    execute_script "$JOURNEY_CONFIG" "Configuring $JOURNEY journey" $COMMON_ARGS --journey $JOURNEY
fi

# Step 5: Validate the environment
execute_script "$ENV_VALIDATOR" "Validating environment" $COMMON_ARGS --journey $JOURNEY

# Step 6: Perform runtime checks
execute_script "$RUNTIME_CHECK" "Performing runtime checks" $COMMON_ARGS --journey $JOURNEY

# Cleanup rollback files if successful and not in dry-run mode
if [ "$DRY_RUN" != true ]; then
    log_debug "Cleaning up rollback files"
    rm -rf "$ROLLBACK_DIR"
fi

log_info "Environment preparation completed successfully"
log_info "Timestamp: $(date)"

exit 0