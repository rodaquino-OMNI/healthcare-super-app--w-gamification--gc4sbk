#!/bin/bash
# Make script executable: chmod +x infrastructure/scripts/environment/env-manager.sh

# =========================================================================
# AUSTA SuperApp - Environment Variable Manager
# =========================================================================
# This script provides centralized management of environment variables across
# development, staging, and production environments with support for
# journey-specific configurations.
#
# Features:
# - Standardized environment variable naming conventions
# - Environment-specific variable loading (.env.local, .env.staging, .env.production)
# - Validation of required environment variables by service
# - Journey-specific environment variable management
# - Variable normalization and transformation
# - Export to various formats (shell, docker, kubernetes)
#
# Usage: ./env-manager.sh [options] <command>
#
# Options:
#   -e, --env=<environment>     Specify environment (local, dev, staging, prod)
#   -j, --journey=<journey>     Specify journey context (health, care, plan)
#   -s, --service=<service>     Specify service name
#   -f, --file=<file>           Specify custom .env file path
#   -o, --output=<format>       Output format (shell, docker, k8s, dotenv)
#   -d, --directory=<dir>       Base directory for env files (default: current dir)
#   -v, --verbose               Enable verbose output
#   -h, --help                  Display this help message
#
# Commands:
#   load       Load and export environment variables
#   validate   Validate environment variables against requirements
#   normalize  Normalize variable names to standard format
#   transform  Transform variables between formats
#   list       List all available environment variables
#   generate   Generate template .env files
#
# Examples:
#   # Load variables for local development of health journey
#   ./env-manager.sh --env=local --journey=health load
#
#   # Validate variables for production deployment of auth service
#   ./env-manager.sh --env=prod --service=auth-service validate
#
#   # Generate Kubernetes ConfigMap for care journey in staging
#   ./env-manager.sh --env=staging --journey=care --output=k8s load
#
#   # Normalize variable names in a custom .env file
#   ./env-manager.sh --file=./my-custom.env normalize
#
#   # List all environment variables for plan journey
#   ./env-manager.sh --journey=plan list
# =========================================================================

set -e

# Default values
ENVIRONMENT="local"
JOURNEY=""
SERVICE=""
ENV_FILE=""
OUTPUT_FORMAT="shell"
BASE_DIR="$(pwd)"
VERBOSE=false

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# =========================================================================
# Helper Functions
# =========================================================================

function print_usage {
    echo -e "${BLUE}AUSTA SuperApp - Environment Variable Manager${NC}"
    echo ""
    echo "Usage: $0 [options] <command>"
    echo ""
    echo "Options:"
    echo "  -e, --env=<environment>     Specify environment (local, dev, staging, prod)"
    echo "  -j, --journey=<journey>     Specify journey context (health, care, plan)"
    echo "  -s, --service=<service>     Specify service name"
    echo "  -f, --file=<file>           Specify custom .env file path"
    echo "  -o, --output=<format>       Output format (shell, docker, k8s, dotenv)"
    echo "  -d, --directory=<dir>       Base directory for env files (default: current dir)"
    echo "  -v, --verbose               Enable verbose output"
    echo "  -h, --help                  Display this help message"
    echo ""
    echo "Commands:"
    echo "  load       Load and export environment variables"
    echo "  validate   Validate environment variables against requirements"
    echo "  normalize  Normalize variable names to standard format"
    echo "  transform  Transform variables between formats"
    echo "  list       List all available environment variables"
    echo "  generate   Generate template .env files"
    echo ""
    echo "Examples:"
    echo "  # Load variables for local development of health journey"
    echo "  ./env-manager.sh --env=local --journey=health load"
    echo ""
    echo "  # Validate variables for production deployment of auth service"
    echo "  ./env-manager.sh --env=prod --service=auth-service validate"
    echo ""
    echo "  # Generate Kubernetes ConfigMap for care journey in staging"
    echo "  ./env-manager.sh --env=staging --journey=care --output=k8s load"
    echo ""
    echo "  # Normalize variable names in a custom .env file"
    echo "  ./env-manager.sh --file=./my-custom.env normalize"
    echo ""
    echo "  # List all environment variables for plan journey"
    echo "  ./env-manager.sh --journey=plan list"
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
    exit 1
}

function log_verbose {
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[VERBOSE]${NC} $1"
    fi
}

function validate_input {
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(local|dev|staging|prod)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be one of: local, dev, staging, prod"
    fi

    # Validate journey if specified
    if [ -n "$JOURNEY" ] && [[ ! "$JOURNEY" =~ ^(health|care|plan)$ ]]; then
        log_error "Invalid journey: $JOURNEY. Must be one of: health, care, plan"
    fi

    # Validate output format if specified
    if [[ ! "$OUTPUT_FORMAT" =~ ^(shell|docker|k8s|dotenv)$ ]]; then
        log_error "Invalid output format: $OUTPUT_FORMAT. Must be one of: shell, docker, k8s, dotenv"
    fi

    # Validate command
    if [[ ! "$COMMAND" =~ ^(load|validate|normalize|transform|list|generate)$ ]]; then
        log_error "Invalid command: $COMMAND. Must be one of: load, validate, normalize, transform, list, generate"
    fi
}

function ensure_directories {
    # Create environment directories if they don't exist
    local env_dirs=(
        "${ROOT_DIR}/.env"
        "${ROOT_DIR}/src/backend/.env"
        "${ROOT_DIR}/src/web/.env"
    )

    for dir in "${env_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_verbose "Created directory: $dir"
        fi
    done

    # Create journey-specific directories if needed
    if [ -n "$JOURNEY" ]; then
        local journey_dirs=(
            "${ROOT_DIR}/.env/${JOURNEY}"
            "${ROOT_DIR}/src/backend/.env/${JOURNEY}"
            "${ROOT_DIR}/src/web/.env/${JOURNEY}"
        )

        for dir in "${journey_dirs[@]}"; do
            if [ ! -d "$dir" ]; then
                mkdir -p "$dir"
                log_verbose "Created journey directory: $dir"
            fi
        done
    fi
}

# =========================================================================
# Environment Variable Management Functions
# =========================================================================

function find_env_files {
    local env_files=()
    local env_suffix=""

    # Determine environment file suffix
    case "$ENVIRONMENT" in
        local) env_suffix=".local" ;;
        dev)   env_suffix=".dev" ;;
        staging) env_suffix=".staging" ;;
        prod)  env_suffix=".production" ;;
    esac

    log_verbose "Looking for environment files with suffix: $env_suffix"

    # Add custom env file if specified
    if [ -n "$ENV_FILE" ]; then
        if [ -f "$ENV_FILE" ]; then
            env_files+=("$ENV_FILE")
            log_verbose "Added custom env file: $ENV_FILE"
        else
            log_warning "Custom env file not found: $ENV_FILE"
        fi
    fi

    # Add default env files in order of precedence (lowest to highest)
    local default_locations=(
        # Root level defaults
        "${ROOT_DIR}/.env"
        "${ROOT_DIR}/.env${env_suffix}"
        
        # Backend defaults
        "${ROOT_DIR}/src/backend/.env"
        "${ROOT_DIR}/src/backend/.env${env_suffix}"
        
        # Web defaults
        "${ROOT_DIR}/src/web/.env"
        "${ROOT_DIR}/src/web/.env${env_suffix}"
    )

    # Add service-specific env files if service is specified
    if [ -n "$SERVICE" ]; then
        default_locations+=(
            "${ROOT_DIR}/src/backend/${SERVICE}/.env"
            "${ROOT_DIR}/src/backend/${SERVICE}/.env${env_suffix}"
        )
    fi

    # Add journey-specific env files if journey is specified
    if [ -n "$JOURNEY" ]; then
        default_locations+=(
            "${ROOT_DIR}/.env/${JOURNEY}/.env"
            "${ROOT_DIR}/.env/${JOURNEY}/.env${env_suffix}"
            "${ROOT_DIR}/src/backend/.env/${JOURNEY}/.env"
            "${ROOT_DIR}/src/backend/.env/${JOURNEY}/.env${env_suffix}"
            "${ROOT_DIR}/src/web/.env/${JOURNEY}/.env"
            "${ROOT_DIR}/src/web/.env/${JOURNEY}/.env${env_suffix}"
        )

        # Add journey-service specific env files
        if [ -n "$SERVICE" ]; then
            default_locations+=(
                "${ROOT_DIR}/src/backend/${SERVICE}/.env.${JOURNEY}"
                "${ROOT_DIR}/src/backend/${SERVICE}/.env.${JOURNEY}${env_suffix}"
            )
        fi
    fi

    # Check each location and add existing files to the list
    for location in "${default_locations[@]}"; do
        if [ -f "$location" ]; then
            env_files+=("$location")
            log_verbose "Found env file: $location"
        fi
    done

    # Return the list of env files
    echo "${env_files[@]}"
}

function load_env_files {
    local env_files=($@)
    local loaded_count=0

    log_info "Loading environment variables..."

    # Load each env file in order
    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            log_verbose "Loading variables from: $env_file"
            set -o allexport
            source "$env_file"
            set +o allexport
            loaded_count=$((loaded_count+1))
        fi
    done

    if [ $loaded_count -eq 0 ]; then
        log_warning "No environment files were loaded"
    else
        log_success "Loaded variables from $loaded_count environment files"
    fi
}

function normalize_variables {
    log_info "Normalizing environment variables..."
    local normalized_count=0

    # Database URL normalization
    if [ -n "$DB_URL" ] && [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="$DB_URL"
        log_verbose "Normalized DB_URL to DATABASE_URL"
        normalized_count=$((normalized_count+1))
    fi

    # Database connection parameters normalization
    if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
        log_verbose "Normalized database connection parameters to DATABASE_URL"
        normalized_count=$((normalized_count+1))
    fi

    # Redis connection normalization
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ] && [ -z "$REDIS_URL" ]; then
        export REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
        log_verbose "Normalized REDIS_HOST and REDIS_PORT to REDIS_URL"
        normalized_count=$((normalized_count+1))
    fi

    # Kafka connection normalization
    if [ -n "$KAFKA_HOST" ] && [ -n "$KAFKA_PORT" ] && [ -z "$KAFKA_BROKERS" ]; then
        export KAFKA_BROKERS="${KAFKA_HOST}:${KAFKA_PORT}"
        log_verbose "Normalized KAFKA_HOST and KAFKA_PORT to KAFKA_BROKERS"
        normalized_count=$((normalized_count+1))
    fi

    # JWT secret normalization
    if [ -n "$JWT_SECRET_KEY" ] && [ -z "$JWT_SECRET" ]; then
        export JWT_SECRET="$JWT_SECRET_KEY"
        log_verbose "Normalized JWT_SECRET_KEY to JWT_SECRET"
        normalized_count=$((normalized_count+1))
    fi

    # API URL normalization
    if [ -n "$API_BASE_URL" ] && [ -z "$API_URL" ]; then
        export API_URL="$API_BASE_URL"
        log_verbose "Normalized API_BASE_URL to API_URL"
        normalized_count=$((normalized_count+1))
    fi

    # Environment normalization
    if [ -n "$NODE_ENV" ] && [ -z "$APP_ENV" ]; then
        export APP_ENV="$NODE_ENV"
        log_verbose "Normalized NODE_ENV to APP_ENV"
        normalized_count=$((normalized_count+1))
    fi

    # Journey-specific variable normalization
    if [ -n "$JOURNEY" ]; then
        local journey_upper=$(echo "$JOURNEY" | tr '[:lower:]' '[:upper:]')
        
        # Add journey prefix to journey-specific variables that don't already have it
        if [ -n "$JOURNEY_API_KEY" ] && [ -z "${journey_upper}_API_KEY" ]; then
            export "${journey_upper}_API_KEY"="$JOURNEY_API_KEY"
            log_verbose "Added journey prefix to JOURNEY_API_KEY"
            normalized_count=$((normalized_count+1))
        fi
        
        if [ -n "$JOURNEY_SECRET" ] && [ -z "${journey_upper}_SECRET" ]; then
            export "${journey_upper}_SECRET"="$JOURNEY_SECRET"
            log_verbose "Added journey prefix to JOURNEY_SECRET"
            normalized_count=$((normalized_count+1))
        fi
    fi

    log_success "Normalized $normalized_count environment variables"
}

function validate_variables {
    log_info "Validating environment variables..."
    local errors=0

    # Common required variables
    local common_required=("NODE_ENV")
    
    # Service-specific required variables
    local service_required=()
    if [ -n "$SERVICE" ]; then
        case "$SERVICE" in
            api-gateway)
                service_required=("PORT" "AUTH_SERVICE_URL" "HEALTH_SERVICE_URL" "CARE_SERVICE_URL" "PLAN_SERVICE_URL" "GAMIFICATION_ENGINE_URL")
                ;;
            auth-service)
                service_required=("PORT" "JWT_SECRET" "JWT_EXPIRATION" "DATABASE_URL" "REDIS_URL")
                ;;
            gamification-engine)
                service_required=("PORT" "DATABASE_URL" "KAFKA_BROKERS" "NOTIFICATION_SERVICE_URL")
                ;;
            notification-service)
                service_required=("PORT" "DATABASE_URL" "KAFKA_BROKERS" "EMAIL_PROVIDER" "SMS_PROVIDER")
                ;;
            *)
                # Default service requirements
                service_required=("PORT" "DATABASE_URL")
                ;;
        esac
    fi

    # Journey-specific required variables
    local journey_required=()
    if [ -n "$JOURNEY" ]; then
        case "$JOURNEY" in
            health)
                journey_required=("DATABASE_URL" "KAFKA_BROKERS" "FHIR_API_URL")
                ;;
            care)
                journey_required=("DATABASE_URL" "KAFKA_BROKERS" "TELEMEDICINE_API_URL")
                ;;
            plan)
                journey_required=("DATABASE_URL" "KAFKA_BROKERS" "INSURANCE_API_URL")
                ;;
        esac
    fi

    # Combine all required variables
    local all_required=( "${common_required[@]}" "${service_required[@]}" "${journey_required[@]}" )

    # Check each required variable
    for var_name in "${all_required[@]}"; do
        if [ -z "${!var_name}" ]; then
            log_error "Missing required variable: $var_name"
            errors=$((errors+1))
        else
            log_verbose "Required variable present: $var_name"
        fi
    done

    # Validate variable formats
    if [ -n "$DATABASE_URL" ]; then
        if ! [[ "$DATABASE_URL" =~ ^postgres(ql)?://[^:]+:[^@]+@[^:]+:[0-9]+/[^?]+ ]]; then
            log_warning "DATABASE_URL has invalid format"
            errors=$((errors+1))
        fi
    fi

    if [ -n "$REDIS_URL" ]; then
        if ! [[ "$REDIS_URL" =~ ^redis://[^:]*:[0-9]+(/[0-9]+)? ]]; then
            log_warning "REDIS_URL has invalid format"
            errors=$((errors+1))
        fi
    fi

    if [ -n "$KAFKA_BROKERS" ]; then
        if ! [[ "$KAFKA_BROKERS" =~ ^([^:]+:[0-9]+(,[^:]+:[0-9]+)*)$ ]]; then
            log_warning "KAFKA_BROKERS has invalid format (should be host:port,host:port,...)"
            errors=$((errors+1))
        fi
    fi

    # Return validation result
    if [ $errors -eq 0 ]; then
        log_success "All required environment variables are present and valid"
        return 0
    else
        log_warning "Environment validation found $errors error(s)"
        return 1
    fi
}

function list_variables {
    log_info "Listing environment variables..."

    # Determine which variables to list
    local filter=""
    if [ -n "$JOURNEY" ]; then
        local journey_upper=$(echo "$JOURNEY" | tr '[:lower:]' '[:upper:]')
        filter="${journey_upper}_"
        echo -e "\n${BLUE}=== $journey_upper Journey Variables ===${NC}"
    elif [ -n "$SERVICE" ]; then
        echo -e "\n${BLUE}=== $SERVICE Variables ===${NC}"
    else
        echo -e "\n${BLUE}=== All Environment Variables ===${NC}"
    fi

    # Group variables by category
    echo -e "\n${CYAN}Database Configuration:${NC}"
    env | grep -E "^(DATABASE_URL|DB_|POSTGRES_|PRISMA_)" | sort

    echo -e "\n${CYAN}Redis Configuration:${NC}"
    env | grep -E "^(REDIS_)" | sort

    echo -e "\n${CYAN}Kafka Configuration:${NC}"
    env | grep -E "^(KAFKA_)" | sort

    echo -e "\n${CYAN}Authentication Configuration:${NC}"
    env | grep -E "^(JWT_|AUTH_|OAUTH_)" | sort

    echo -e "\n${CYAN}API Configuration:${NC}"
    env | grep -E "^(API_|ENDPOINT_|URL_)" | sort

    echo -e "\n${CYAN}Feature Flags:${NC}"
    env | grep -E "^(FEATURE_|ENABLE_|DISABLE_)" | sort

    # Journey-specific variables if a journey is specified
    if [ -n "$JOURNEY" ]; then
        echo -e "\n${CYAN}${journey_upper} Journey Specific:${NC}"
        env | grep -E "^${filter}" | sort
    fi

    echo -e "\n${CYAN}Other Variables:${NC}"
    env | grep -v -E "^(DATABASE_URL|DB_|POSTGRES_|PRISMA_|REDIS_|KAFKA_|JWT_|AUTH_|OAUTH_|API_|ENDPOINT_|URL_|FEATURE_|ENABLE_|DISABLE_)" | sort

    log_success "Environment variables listed successfully"
}

function generate_env_template {
    log_info "Generating environment template..."

    local template_file=""
    local template_content=""

    # Determine template file path
    if [ -n "$ENV_FILE" ]; then
        template_file="$ENV_FILE"
    elif [ -n "$JOURNEY" ] && [ -n "$SERVICE" ]; then
        template_file="${ROOT_DIR}/src/backend/${SERVICE}/.env.${JOURNEY}.template"
    elif [ -n "$SERVICE" ]; then
        template_file="${ROOT_DIR}/src/backend/${SERVICE}/.env.template"
    elif [ -n "$JOURNEY" ]; then
        template_file="${ROOT_DIR}/.env/${JOURNEY}/.env.template"
    else
        template_file="${ROOT_DIR}/.env/template"
    fi

    # Check if file already exists
    if [ -f "$template_file" ]; then
        read -p "Template file already exists. Overwrite? (y/n): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "Template generation cancelled"
            return 0
        fi
    fi

    # Generate template content
    template_content+="# =========================================================================\n"
    template_content+="# AUSTA SuperApp Environment Template\n"
    template_content+="# =========================================================================\n"
    template_content+="# Environment: ${ENVIRONMENT}\n"
    if [ -n "$JOURNEY" ]; then
        template_content+="# Journey: ${JOURNEY}\n"
    fi
    if [ -n "$SERVICE" ]; then
        template_content+="# Service: ${SERVICE}\n"
    fi
    template_content+="# Generated: $(date)\n"
    template_content+="# =========================================================================\n\n"

    # Add common variables
    template_content+="# Common Configuration\n"
    template_content+="NODE_ENV=${ENVIRONMENT}\n"
    template_content+="PORT=3000\n"
    template_content+="LOG_LEVEL=info\n\n"

    # Add database configuration
    template_content+="# Database Configuration\n"
    template_content+="DATABASE_URL=postgresql://user:password@localhost:5432/austa\n\n"

    # Add Redis configuration
    template_content+="# Redis Configuration\n"
    template_content+="REDIS_URL=redis://localhost:6379\n\n"

    # Add Kafka configuration
    template_content+="# Kafka Configuration\n"
    template_content+="KAFKA_BROKERS=localhost:9092\n"
    template_content+="KAFKA_CONSUMER_GROUP=austa\n\n"

    # Add authentication configuration
    template_content+="# Authentication Configuration\n"
    template_content+="JWT_SECRET=change_this_to_a_secure_secret\n"
    template_content+="JWT_EXPIRATION=3600\n\n"

    # Add service-specific variables
    if [ -n "$SERVICE" ]; then
        template_content+="# ${SERVICE} Specific Configuration\n"
        case "$SERVICE" in
            api-gateway)
                template_content+="AUTH_SERVICE_URL=http://localhost:3001\n"
                template_content+="HEALTH_SERVICE_URL=http://localhost:3002\n"
                template_content+="CARE_SERVICE_URL=http://localhost:3003\n"
                template_content+="PLAN_SERVICE_URL=http://localhost:3004\n"
                template_content+="GAMIFICATION_ENGINE_URL=http://localhost:3005\n"
                template_content+="NOTIFICATION_SERVICE_URL=http://localhost:3006\n"
                ;;
            auth-service)
                template_content+="OAUTH_GOOGLE_CLIENT_ID=your_google_client_id\n"
                template_content+="OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret\n"
                template_content+="OAUTH_FACEBOOK_CLIENT_ID=your_facebook_client_id\n"
                template_content+="OAUTH_FACEBOOK_CLIENT_SECRET=your_facebook_client_secret\n"
                ;;
            gamification-engine)
                template_content+="NOTIFICATION_SERVICE_URL=http://localhost:3006\n"
                template_content+="ACHIEVEMENT_PROCESSING_INTERVAL=60\n"
                template_content+="LEADERBOARD_UPDATE_INTERVAL=300\n"
                ;;
            notification-service)
                template_content+="EMAIL_PROVIDER=smtp\n"
                template_content+="EMAIL_FROM=noreply@austa.com\n"
                template_content+="SMTP_HOST=localhost\n"
                template_content+="SMTP_PORT=1025\n"
                template_content+="SMTP_USER=user\n"
                template_content+="SMTP_PASSWORD=password\n"
                template_content+="SMS_PROVIDER=twilio\n"
                template_content+="SMS_FROM=+15551234567\n"
                template_content+="TWILIO_ACCOUNT_SID=your_twilio_account_sid\n"
                template_content+="TWILIO_AUTH_TOKEN=your_twilio_auth_token\n"
                ;;
        esac
        template_content+="\n"
    fi

    # Add journey-specific variables
    if [ -n "$JOURNEY" ]; then
        local journey_upper=$(echo "$JOURNEY" | tr '[:lower:]' '[:upper:]')
        template_content+="# ${journey_upper} Journey Specific Configuration\n"
        case "$JOURNEY" in
            health)
                template_content+="FHIR_API_URL=https://fhir-api.example.com/fhir\n"
                template_content+="FHIR_API_VERSION=R4\n"
                template_content+="FHIR_API_TIMEOUT=30000\n"
                template_content+="WEARABLE_API_ENABLED=true\n"
                template_content+="WEARABLE_SYNC_INTERVAL=3600\n"
                template_content+="WEARABLE_PROVIDERS=fitbit,garmin,apple_health\n"
                template_content+="FEATURE_HEALTH_INSIGHTS=true\n"
                template_content+="FEATURE_HEALTH_GOALS=true\n"
                template_content+="FEATURE_HEALTH_METRICS_SHARING=true\n"
                ;;
            care)
                template_content+="TELEMEDICINE_API_URL=https://telemedicine-api.example.com/api\n"
                template_content+="TELEMEDICINE_API_KEY=your_telemedicine_api_key\n"
                template_content+="TELEMEDICINE_PROVIDER_IDS=provider1,provider2,provider3\n"
                template_content+="APPOINTMENT_REMINDER_ENABLED=true\n"
                template_content+="APPOINTMENT_REMINDER_LEAD_TIME=24\n"
                template_content+="APPOINTMENT_CANCELLATION_WINDOW=4\n"
                template_content+="MEDICATION_REMINDER_ENABLED=true\n"
                template_content+="MEDICATION_DATABASE_URL=https://medication-db.example.com/api\n"
                template_content+="MEDICATION_API_KEY=your_medication_api_key\n"
                template_content+="FEATURE_SYMPTOM_CHECKER=true\n"
                template_content+="FEATURE_TELEMEDICINE=true\n"
                template_content+="FEATURE_PROVIDER_SEARCH=true\n"
                ;;
            plan)
                template_content+="INSURANCE_API_URL=https://insurance-api.example.com/api\n"
                template_content+="INSURANCE_API_KEY=your_insurance_api_key\n"
                template_content+="INSURANCE_PROVIDER_IDS=provider1,provider2,provider3\n"
                template_content+="PAYMENT_GATEWAY_URL=https://payment-gateway.example.com/api\n"
                template_content+="PAYMENT_GATEWAY_API_KEY=your_payment_api_key\n"
                template_content+="PAYMENT_METHODS=credit_card,debit_card,bank_transfer\n"
                template_content+="DOCUMENT_STORAGE_TYPE=s3\n"
                template_content+="DOCUMENT_STORAGE_BUCKET=austa-documents\n"
                template_content+="DOCUMENT_RETENTION_DAYS=365\n"
                template_content+="FEATURE_CLAIM_SUBMISSION=true\n"
                template_content+="FEATURE_BENEFIT_CALCULATOR=true\n"
                template_content+="FEATURE_PLAN_COMPARISON=true\n"
                ;;
        esac
        template_content+="\n"
    fi

    # Add feature flags
    template_content+="# Feature Flags\n"
    template_content+="FEATURE_GAMIFICATION=true\n"
    template_content+="FEATURE_NOTIFICATIONS=true\n"
    template_content+="FEATURE_DARK_MODE=true\n\n"

    # Add monitoring configuration
    template_content+="# Monitoring Configuration\n"
    template_content+="SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/project\n"
    template_content+="DATADOG_API_KEY=your_datadog_api_key\n"
    template_content+="ENABLE_PERFORMANCE_MONITORING=true\n"

    # Write template to file
    mkdir -p "$(dirname "$template_file")"
    echo -e "$template_content" > "$template_file"

    log_success "Generated environment template at: $template_file"
}

function output_variables {
    log_info "Outputting environment variables in $OUTPUT_FORMAT format..."

    local output_file=""
    if [ -n "$ENV_FILE" ]; then
        output_file="$ENV_FILE"
    elif [ -n "$JOURNEY" ] && [ -n "$SERVICE" ]; then
        output_file="${ROOT_DIR}/src/backend/${SERVICE}/.env.${JOURNEY}.${ENVIRONMENT}"
    elif [ -n "$SERVICE" ]; then
        output_file="${ROOT_DIR}/src/backend/${SERVICE}/.env.${ENVIRONMENT}"
    elif [ -n "$JOURNEY" ]; then
        output_file="${ROOT_DIR}/.env/${JOURNEY}/.env.${ENVIRONMENT}"
    else
        output_file="${ROOT_DIR}/.env/.env.${ENVIRONMENT}"
    fi

    case "$OUTPUT_FORMAT" in
        shell)
            # Output for shell script
            echo "# Generated by env-manager.sh on $(date)" > "$output_file"
            env | sort | while IFS= read -r line; do
                echo "export $line" >> "$output_file"
            done
            ;;
        docker)
            # Output for docker-compose.yml
            echo "# Generated by env-manager.sh on $(date)" > "$output_file"
            env | sort | while IFS= read -r line; do
                echo "$line" >> "$output_file"
            done
            ;;
        k8s)
            # Output for Kubernetes ConfigMap
            local config_name="austa"
            if [ -n "$SERVICE" ]; then
                config_name="$SERVICE"
            fi
            if [ -n "$JOURNEY" ]; then
                config_name="$config_name-$JOURNEY"
            fi
            config_name="$config_name-$ENVIRONMENT"

            echo "apiVersion: v1" > "$output_file"
            echo "kind: ConfigMap" >> "$output_file"
            echo "metadata:" >> "$output_file"
            echo "  name: $config_name-config" >> "$output_file"
            echo "data:" >> "$output_file"
            env | sort | while IFS= read -r line; do
                key=$(echo "$line" | cut -d= -f1)
                value=$(echo "$line" | cut -d= -f2-)
                echo "  $key: \"$value\"" >> "$output_file"
            done
            ;;
        dotenv)
            # Output for .env file
            echo "# Generated by env-manager.sh on $(date)" > "$output_file"
            env | sort | while IFS= read -r line; do
                echo "$line" >> "$output_file"
            done
            ;;
    esac

    log_success "Environment variables exported to: $output_file"
}

# =========================================================================
# Main Script Execution
# =========================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e=*|--env=*)
            ENVIRONMENT="${1#*=}"
            ;;
        -j=*|--journey=*)
            JOURNEY="${1#*=}"
            ;;
        -s=*|--service=*)
            SERVICE="${1#*=}"
            ;;
        -f=*|--file=*)
            ENV_FILE="${1#*=}"
            ;;
        -o=*|--output=*)
            OUTPUT_FORMAT="${1#*=}"
            ;;
        -d=*|--directory=*)
            BASE_DIR="${1#*=}"
            ;;
        -v|--verbose)
            VERBOSE=true
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        load|validate|normalize|transform|list|generate)
            COMMAND="$1"
            ;;
        *)
            log_error "Unknown option: $1"
            ;;
    esac
    shift
done

# Check if command is provided
if [ -z "$COMMAND" ]; then
    log_error "No command specified. Use one of: load, validate, normalize, transform, list, generate"
fi

# Validate input parameters
validate_input

# Ensure required directories exist
ensure_directories

# Execute command
case "$COMMAND" in
    load)
        env_files=$(find_env_files)
        load_env_files $env_files
        normalize_variables
        if [ "$OUTPUT_FORMAT" != "shell" ]; then
            output_variables
        fi
        ;;
    validate)
        env_files=$(find_env_files)
        load_env_files $env_files
        normalize_variables
        validate_variables
        ;;
    normalize)
        env_files=$(find_env_files)
        load_env_files $env_files
        normalize_variables
        output_variables
        ;;
    transform)
        env_files=$(find_env_files)
        load_env_files $env_files
        normalize_variables
        output_variables
        ;;
    list)
        env_files=$(find_env_files)
        load_env_files $env_files
        normalize_variables
        list_variables
        ;;
    generate)
        generate_env_template
        ;;
esac

log_success "Environment manager completed successfully"
exit 0