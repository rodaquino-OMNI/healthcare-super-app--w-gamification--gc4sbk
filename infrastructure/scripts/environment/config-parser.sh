#!/bin/bash

# =========================================================================
# AUSTA SuperApp Configuration Parser
# =========================================================================
# This script reads, validates, and merges configuration from multiple sources
# (env files, AWS Parameter Store, environment variables) into a consistent
# format for all applications with support for different deployment tiers.
#
# Usage: source ./config-parser.sh [options]
#
# Options:
#   --env=<environment>     Specify environment (dev, staging, prod)
#   --journey=<journey>     Specify journey (health, care, plan)
#   --service=<service>     Specify service name
#   --validate              Validate configuration against requirements
#   --export                Export parsed configuration as environment variables
#   --aws-params            Load parameters from AWS Parameter Store
#   --help                  Display this help message
#
# Examples:
#   source ./config-parser.sh --env=dev --journey=health --service=health-service --validate --export
#   source ./config-parser.sh --env=prod --aws-params --export
# =========================================================================

set -e

# Default values
ENVIRONMENT="dev"
JOURNEY=""
SERVICE=""
VALIDATE=false
EXPORT=false
AWS_PARAMS=false
DEBUG=false

# Base paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
CONFIG_DIR="${ROOT_DIR}/infrastructure/config"

# Color codes for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# =========================================================================
# Helper Functions
# =========================================================================

function print_help {
    echo "AUSTA SuperApp Configuration Parser"
    echo ""
    echo "Usage: source ./config-parser.sh [options]"
    echo ""
    echo "Options:"
    echo "  --env=<environment>     Specify environment (dev, staging, prod)"
    echo "  --journey=<journey>     Specify journey (health, care, plan)"
    echo "  --service=<service>     Specify service name"
    echo "  --validate              Validate configuration against requirements"
    echo "  --export                Export parsed configuration as environment variables"
    echo "  --aws-params            Load parameters from AWS Parameter Store"
    echo "  --debug                 Enable debug output"
    echo "  --help                  Display this help message"
    echo ""
    echo "Examples:"
    echo "  source ./config-parser.sh --env=dev --journey=health --service=health-service --validate --export"
    echo "  source ./config-parser.sh --env=prod --aws-params --export"
}

function log_info {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warning {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error {
    echo -e "${RED}[ERROR]${NC} $1"
}

function log_debug {
    if [ "$DEBUG" = true ]; then
        echo -e "[DEBUG] $1"
    fi
}

function check_dependencies {
    local missing_deps=false

    # Check for required commands
    for cmd in jq aws grep sed awk; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            missing_deps=true
        fi
    done

    if [ "$missing_deps" = true ]; then
        log_error "Please install missing dependencies and try again."
        return 1
    fi

    return 0
}

# =========================================================================
# Configuration Loading Functions
# =========================================================================

function load_base_config {
    log_debug "Loading base configuration..."
    
    # Define the base config files to load in order of precedence (lowest to highest)
    local base_config_files=(
        "${CONFIG_DIR}/defaults.env"
        "${CONFIG_DIR}/${ENVIRONMENT}.env"
    )
    
    # Load each base config file if it exists
    for config_file in "${base_config_files[@]}"; do
        if [ -f "$config_file" ]; then
            log_debug "Loading config file: $config_file"
            set -o allexport
            source "$config_file"
            set +o allexport
        else
            log_debug "Config file not found (skipping): $config_file"
        fi
    done
}

function load_journey_config {
    if [ -z "$JOURNEY" ]; then
        log_debug "No journey specified, skipping journey-specific configuration."
        return 0
    fi
    
    log_debug "Loading journey-specific configuration for '$JOURNEY'..."
    
    # Define the journey config files to load in order of precedence (lowest to highest)
    local journey_config_files=(
        "${CONFIG_DIR}/journeys/${JOURNEY}/defaults.env"
        "${CONFIG_DIR}/journeys/${JOURNEY}/${ENVIRONMENT}.env"
    )
    
    # Load each journey config file if it exists
    for config_file in "${journey_config_files[@]}"; do
        if [ -f "$config_file" ]; then
            log_debug "Loading journey config file: $config_file"
            set -o allexport
            source "$config_file"
            set +o allexport
        else
            log_debug "Journey config file not found (skipping): $config_file"
        fi
    done
}

function load_service_config {
    if [ -z "$SERVICE" ]; then
        log_debug "No service specified, skipping service-specific configuration."
        return 0
    fi
    
    log_debug "Loading service-specific configuration for '$SERVICE'..."
    
    # Define the service config files to load in order of precedence (lowest to highest)
    local service_config_files=(
        "${CONFIG_DIR}/services/${SERVICE}/defaults.env"
        "${CONFIG_DIR}/services/${SERVICE}/${ENVIRONMENT}.env"
    )
    
    # Load each service config file if it exists
    for config_file in "${service_config_files[@]}"; do
        if [ -f "$config_file" ]; then
            log_debug "Loading service config file: $config_file"
            set -o allexport
            source "$config_file"
            set +o allexport
        else
            log_debug "Service config file not found (skipping): $config_file"
        fi
    done
    
    # Load local development overrides if in dev environment
    if [ "$ENVIRONMENT" = "dev" ]; then
        local local_override="${ROOT_DIR}/src/backend/${SERVICE}/.env.local"
        if [ -f "$local_override" ]; then
            log_debug "Loading local development overrides: $local_override"
            set -o allexport
            source "$local_override"
            set +o allexport
        fi
    fi
}

function load_aws_parameters {
    if [ "$AWS_PARAMS" != true ]; then
        log_debug "AWS Parameter Store integration not enabled, skipping."
        return 0
    fi
    
    log_info "Loading configuration from AWS Parameter Store..."
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured properly. Please configure AWS CLI and try again."
        return 1
    fi
    
    # Determine parameter path prefix based on environment and service
    local param_path="/austa/${ENVIRONMENT}"
    if [ -n "$JOURNEY" ]; then
        param_path="${param_path}/${JOURNEY}"
    fi
    if [ -n "$SERVICE" ]; then
        param_path="${param_path}/${SERVICE}"
    fi
    
    log_debug "Fetching parameters from path: $param_path"
    
    # Get parameters from AWS Parameter Store
    local params
    params=$(aws ssm get-parameters-by-path \
        --path "$param_path" \
        --recursive \
        --with-decryption \
        --query "Parameters[*].{Name:Name,Value:Value}" \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        log_error "Failed to fetch parameters from AWS Parameter Store."
        return 1
    fi
    
    # Process and export parameters
    local param_count=$(echo "$params" | jq length)
    if [ "$param_count" -gt 0 ]; then
        log_debug "Processing $param_count parameters from AWS Parameter Store"
        
        for i in $(seq 0 $((param_count-1))); do
            local param_name=$(echo "$params" | jq -r .[$i].Name)
            local param_value=$(echo "$params" | jq -r .[$i].Value)
            
            # Extract the variable name from the parameter path
            local var_name=$(basename "$param_name" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
            
            log_debug "Setting parameter: $var_name"
            export "$var_name"="$param_value"
        done
        
        log_success "Loaded $param_count parameters from AWS Parameter Store"
    else
        log_warning "No parameters found in AWS Parameter Store at path: $param_path"
    fi
}

# =========================================================================
# Configuration Validation Functions
# =========================================================================

function validate_required_variables {
    if [ "$VALIDATE" != true ]; then
        log_debug "Validation not enabled, skipping."
        return 0
    fi
    
    log_info "Validating required configuration variables..."
    
    local requirements_file
    local missing_vars=false
    
    # Determine which requirements file to use
    if [ -n "$SERVICE" ]; then
        requirements_file="${CONFIG_DIR}/requirements/${SERVICE}.json"
    elif [ -n "$JOURNEY" ]; then
        requirements_file="${CONFIG_DIR}/requirements/${JOURNEY}.json"
    else
        requirements_file="${CONFIG_DIR}/requirements/common.json"
    fi
    
    if [ ! -f "$requirements_file" ]; then
        log_warning "Requirements file not found: $requirements_file"
        log_warning "Skipping validation of required variables."
        return 0
    fi
    
    log_debug "Using requirements file: $requirements_file"
    
    # Get required variables for the current environment
    local required_vars
    required_vars=$(jq -r ".environments.${ENVIRONMENT}.required_vars[]" "$requirements_file" 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$required_vars" ]; then
        log_warning "No required variables defined for environment '$ENVIRONMENT' in $requirements_file"
        return 0
    fi
    
    # Check each required variable
    while IFS= read -r var_name; do
        if [ -z "${!var_name}" ]; then
            log_error "Missing required variable: $var_name"
            missing_vars=true
        else
            log_debug "Required variable present: $var_name"
        fi
    done <<< "$required_vars"
    
    # Check for format validation rules
    local format_rules
    format_rules=$(jq -r ".format_validations | keys[]" "$requirements_file" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$format_rules" ]; then
        while IFS= read -r var_name; do
            if [ -n "${!var_name}" ]; then
                local pattern
                pattern=$(jq -r ".format_validations.\"${var_name}\"" "$requirements_file")
                
                if ! [[ "${!var_name}" =~ $pattern ]]; then
                    log_error "Variable $var_name does not match required format: $pattern"
                    missing_vars=true
                else
                    log_debug "Variable $var_name matches required format"
                fi
            fi
        done <<< "$format_rules"
    fi
    
    if [ "$missing_vars" = true ]; then
        log_error "Configuration validation failed. Please check the errors above."
        return 1
    else
        log_success "All required configuration variables are present and valid."
        return 0
    fi
}

function validate_connections {
    if [ "$VALIDATE" != true ]; then
        return 0
    fi
    
    log_info "Validating connection configurations..."
    
    # Validate database connection string if present
    if [ -n "$DATABASE_URL" ]; then
        log_debug "Validating DATABASE_URL format"
        
        # Simple regex for PostgreSQL connection string
        if ! [[ "$DATABASE_URL" =~ ^postgres(ql)?://[^:]+:[^@]+@[^:]+:[0-9]+/[^?]+ ]]; then
            log_error "DATABASE_URL has invalid format"
        else
            log_debug "DATABASE_URL format is valid"
        fi
    fi
    
    # Validate Redis connection if present
    if [ -n "$REDIS_URL" ]; then
        log_debug "Validating REDIS_URL format"
        
        # Simple regex for Redis connection string
        if ! [[ "$REDIS_URL" =~ ^redis://[^:]*:[0-9]+(/[0-9]+)? ]]; then
            log_error "REDIS_URL has invalid format"
        else
            log_debug "REDIS_URL format is valid"
        fi
    fi
    
    # Validate Kafka connection if present
    if [ -n "$KAFKA_BROKERS" ]; then
        log_debug "Validating KAFKA_BROKERS format"
        
        # Check if it's a comma-separated list of host:port
        if ! [[ "$KAFKA_BROKERS" =~ ^([^:]+:[0-9]+(,[^:]+:[0-9]+)*)$ ]]; then
            log_error "KAFKA_BROKERS has invalid format (should be host:port,host:port,...)"
        else
            log_debug "KAFKA_BROKERS format is valid"
        fi
    fi
    
    log_success "Connection configuration validation completed"
}

# =========================================================================
# Configuration Export Functions
# =========================================================================

function normalize_config {
    log_debug "Normalizing configuration variables..."
    
    # Convert legacy variable names to new standardized format if needed
    # This ensures backward compatibility with older configuration files
    
    # Database connection standardization
    if [ -n "$DB_URL" ] && [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="$DB_URL"
        log_debug "Normalized DB_URL to DATABASE_URL"
    fi
    
    # Redis connection standardization
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ] && [ -z "$REDIS_URL" ]; then
        export REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
        log_debug "Normalized REDIS_HOST and REDIS_PORT to REDIS_URL"
    fi
    
    # Kafka connection standardization
    if [ -n "$KAFKA_HOST" ] && [ -n "$KAFKA_PORT" ] && [ -z "$KAFKA_BROKERS" ]; then
        export KAFKA_BROKERS="${KAFKA_HOST}:${KAFKA_PORT}"
        log_debug "Normalized KAFKA_HOST and KAFKA_PORT to KAFKA_BROKERS"
    fi
    
    # JWT secret standardization
    if [ -n "$JWT_SECRET_KEY" ] && [ -z "$JWT_SECRET" ]; then
        export JWT_SECRET="$JWT_SECRET_KEY"
        log_debug "Normalized JWT_SECRET_KEY to JWT_SECRET"
    fi
    
    # API URL standardization
    if [ -n "$API_BASE_URL" ] && [ -z "$API_URL" ]; then
        export API_URL="$API_BASE_URL"
        log_debug "Normalized API_BASE_URL to API_URL"
    fi
    
    # Environment standardization
    if [ -n "$NODE_ENV" ] && [ -z "$APP_ENV" ]; then
        export APP_ENV="$NODE_ENV"
        log_debug "Normalized NODE_ENV to APP_ENV"
    fi
    
    # Add journey-specific prefix to variables if needed
    if [ -n "$JOURNEY" ] && [ "$EXPORT" = true ]; then
        local journey_upper=$(echo "$JOURNEY" | tr '[:lower:]' '[:upper:]')
        
        # Only add journey prefix to journey-specific variables that don't already have it
        if [ -n "$JOURNEY_API_KEY" ] && [ -z "${journey_upper}_API_KEY" ]; then
            export "${journey_upper}_API_KEY"="$JOURNEY_API_KEY"
            log_debug "Added journey prefix to JOURNEY_API_KEY"
        fi
        
        if [ -n "$JOURNEY_SECRET" ] && [ -z "${journey_upper}_SECRET" ]; then
            export "${journey_upper}_SECRET"="$JOURNEY_SECRET"
            log_debug "Added journey prefix to JOURNEY_SECRET"
        fi
    fi
    
    log_debug "Configuration normalization completed"
}

function export_config_summary {
    if [ "$EXPORT" != true ]; then
        return 0
    fi
    
    log_info "Configuration summary:"
    
    # Print a summary of the loaded configuration
    echo -e "\n${BLUE}=== AUSTA SuperApp Configuration ===${NC}"
    echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
    
    if [ -n "$JOURNEY" ]; then
        echo -e "${BLUE}Journey:${NC} $JOURNEY"
    fi
    
    if [ -n "$SERVICE" ]; then
        echo -e "${BLUE}Service:${NC} $SERVICE"
    fi
    
    echo -e "\n${BLUE}=== Core Configuration ===${NC}"
    echo -e "${BLUE}NODE_ENV:${NC} ${NODE_ENV:-not set}"
    echo -e "${BLUE}APP_ENV:${NC} ${APP_ENV:-not set}"
    echo -e "${BLUE}LOG_LEVEL:${NC} ${LOG_LEVEL:-not set}"
    
    if [ -n "$DATABASE_URL" ]; then
        # Mask the password in the connection string for display
        local masked_db_url=$(echo "$DATABASE_URL" | sed -E 's/(://)([^:]+):([^@]+)@/\1\2:******@/')
        echo -e "${BLUE}DATABASE_URL:${NC} $masked_db_url"
    fi
    
    if [ -n "$REDIS_URL" ]; then
        echo -e "${BLUE}REDIS_URL:${NC} $REDIS_URL"
    fi
    
    if [ -n "$KAFKA_BROKERS" ]; then
        echo -e "${BLUE}KAFKA_BROKERS:${NC} $KAFKA_BROKERS"
    fi
    
    # Show journey-specific configuration if applicable
    if [ -n "$JOURNEY" ]; then
        local journey_upper=$(echo "$JOURNEY" | tr '[:lower:]' '[:upper:]')
        echo -e "\n${BLUE}=== $journey_upper Journey Configuration ===${NC}"
        
        # Use parameter expansion to check if variables with the journey prefix exist
        local journey_vars=$(env | grep "^${journey_upper}_" | sort)
        if [ -n "$journey_vars" ]; then
            echo "$journey_vars" | while IFS= read -r line; do
                local var_name=$(echo "$line" | cut -d= -f1)
                local var_value=$(echo "$line" | cut -d= -f2-)
                
                # Mask sensitive values
                if [[ "$var_name" =~ .*(_SECRET|_KEY|_TOKEN|_PASSWORD).* ]]; then
                    var_value="******"
                fi
                
                echo -e "${BLUE}${var_name}:${NC} ${var_value}"
            done
        else
            echo -e "${YELLOW}No journey-specific variables found${NC}"
        fi
    fi
    
    echo -e "\n${GREEN}Configuration loaded successfully${NC}\n"
}

# =========================================================================
# Main Script Execution
# =========================================================================

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --env=*)
            ENVIRONMENT="${arg#*=}"
            ;;
        --journey=*)
            JOURNEY="${arg#*=}"
            ;;
        --service=*)
            SERVICE="${arg#*=}"
            ;;
        --validate)
            VALIDATE=true
            ;;
        --export)
            EXPORT=true
            ;;
        --aws-params)
            AWS_PARAMS=true
            ;;
        --debug)
            DEBUG=true
            ;;
        --help)
            print_help
            return 0
            ;;
        *)
            log_error "Unknown option: $arg"
            print_help
            return 1
            ;;
    esacdone

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
    return 1
fi

# Validate journey if specified
if [ -n "$JOURNEY" ] && [[ ! "$JOURNEY" =~ ^(health|care|plan)$ ]]; then
    log_error "Invalid journey: $JOURNEY. Must be one of: health, care, plan"
    return 1
fi

# Check for required dependencies
if ! check_dependencies; then
    return 1
fi

log_info "Starting configuration parser for environment: $ENVIRONMENT"

# Load configuration in order of precedence
load_base_config
load_journey_config
load_service_config
load_aws_parameters

# Normalize configuration variables
normalize_config

# Validate configuration if requested
if [ "$VALIDATE" = true ]; then
    validate_required_variables
    validate_connections
fi

# Export configuration summary if requested
export_config_summary

log_success "Configuration parsing completed successfully"
return 0