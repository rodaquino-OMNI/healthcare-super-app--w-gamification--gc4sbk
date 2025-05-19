#!/bin/bash

# =========================================================================
# AUSTA SuperApp - Journey Configuration Manager
# =========================================================================
# This script manages journey-specific configurations for the AUSTA SuperApp,
# ensuring each journey (health, care, plan) has appropriate environment
# variables, feature flags, and infrastructure requirements properly set up
# in each environment (dev, staging, prod).
#
# Usage: ./journey-config.sh [journey] [environment] [action]
#   journey: health|care|plan|all
#   environment: dev|staging|prod
#   action: validate|export|apply
# =========================================================================

set -e

# Default values
JOURNEY="all"
ENVIRONMENT="dev"
ACTION="validate"
CONFIG_DIR="$(dirname "$0")/configs"
OUTPUT_DIR="$(dirname "$0")/output"

# Color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# =========================================================================
# Helper Functions
# =========================================================================

function print_usage {
    echo -e "${BLUE}AUSTA SuperApp - Journey Configuration Manager${NC}"
    echo ""
    echo "Usage: $0 [journey] [environment] [action]"
    echo "  journey: health|care|plan|all"
    echo "  environment: dev|staging|prod"
    echo "  action: validate|export|apply"
    echo ""
    echo "Examples:"
    echo "  $0 health dev validate  # Validate health journey config for dev environment"
    echo "  $0 all prod export     # Export all journey configs for production"
    echo "  $0 care staging apply  # Apply care journey config to staging environment"
    exit 1
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

function validate_input {
    # Validate journey
    if [[ ! "$JOURNEY" =~ ^(health|care|plan|all)$ ]]; then
        log_error "Invalid journey: $JOURNEY. Must be one of: health, care, plan, all"
    fi

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
    fi

    # Validate action
    if [[ ! "$ACTION" =~ ^(validate|export|apply)$ ]]; then
        log_error "Invalid action: $ACTION. Must be one of: validate, export, apply"
    fi
}

function ensure_directories {
    # Ensure config directory exists
    if [ ! -d "$CONFIG_DIR" ]; then
        mkdir -p "$CONFIG_DIR"
        log_info "Created config directory: $CONFIG_DIR"
    fi

    # Ensure output directory exists
    if [ ! -d "$OUTPUT_DIR" ]; then
        mkdir -p "$OUTPUT_DIR"
        log_info "Created output directory: $OUTPUT_DIR"
    fi

    # Ensure journey-specific config directories exist
    for j in "health" "care" "plan"; do
        if [ ! -d "$CONFIG_DIR/$j" ]; then
            mkdir -p "$CONFIG_DIR/$j"
            log_info "Created journey config directory: $CONFIG_DIR/$j"
        fi
    done
}

# =========================================================================
# Journey-Specific Configuration Functions
# =========================================================================

function configure_health_journey {
    local env=$1
    local config_file="$CONFIG_DIR/health/health-$env.env"
    local output_file="$OUTPUT_DIR/health-$env.env"
    
    log_info "Configuring Health Journey for $env environment"
    
    # Create default config if it doesn't exist
    if [ ! -f "$config_file" ]; then
        cat > "$config_file" << EOF
# Health Journey Configuration for $env environment

# Database Configuration
DATABASE_URL=postgresql://user:password@health-db:5432/healthdb

# Redis Configuration
REDIS_URL=redis://redis:6379

# Kafka Configuration
KAFKA_BROKERS=kafka:9092
KAFKA_CONSUMER_GROUP=health-journey

# FHIR API Integration
FHIR_API_URL=https://fhir-api.example.com/fhir
FHIR_API_VERSION=R4
FHIR_API_TIMEOUT=30000

# Wearable Device Integration
WEARABLE_API_ENABLED=true
WEARABLE_SYNC_INTERVAL=3600
WEARABLE_PROVIDERS=fitbit,garmin,apple_health

# Feature Flags
FEATURE_HEALTH_INSIGHTS=true
FEATURE_HEALTH_GOALS=true
FEATURE_HEALTH_METRICS_SHARING=true

# Monitoring
SENTRY_DSN=https://sentry.example.com/health
DATADOG_API_KEY=datadog_api_key

# Security
JWT_SECRET=jwt_secret_placeholder
EOF
        log_info "Created default health journey config for $env environment"
    fi
    
    # Validate health journey configuration
    validate_health_config "$config_file"
    
    # Export configuration if requested
    if [ "$ACTION" == "export" ] || [ "$ACTION" == "apply" ]; then
        cp "$config_file" "$output_file"
        log_success "Exported health journey config to $output_file"
    fi
    
    # Apply configuration if requested
    if [ "$ACTION" == "apply" ]; then
        apply_health_config "$output_file" "$env"
    fi
}

function validate_health_config {
    local config_file=$1
    local errors=0
    
    log_info "Validating health journey configuration: $config_file"
    
    # Source the config file to get variables
    source "$config_file"
    
    # Check required variables
    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    if [ -z "$REDIS_URL" ]; then
        log_warning "REDIS_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    if [ -z "$FHIR_API_URL" ]; then
        log_warning "FHIR_API_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    # Validate FHIR API version
    if [ -n "$FHIR_API_VERSION" ] && [[ ! "$FHIR_API_VERSION" =~ ^(DSTU2|DSTU3|R4|R5)$ ]]; then
        log_warning "Invalid FHIR_API_VERSION: $FHIR_API_VERSION. Must be one of: DSTU2, DSTU3, R4, R5"
        errors=$((errors+1))
    fi
    
    # Check if wearable integration is properly configured
    if [ "$WEARABLE_API_ENABLED" == "true" ] && [ -z "$WEARABLE_PROVIDERS" ]; then
        log_warning "WEARABLE_API_ENABLED is true but WEARABLE_PROVIDERS is not set"
        errors=$((errors+1))
    fi
    
    # Return validation result
    if [ $errors -eq 0 ]; then
        log_success "Health journey configuration is valid"
        return 0
    else
        log_warning "Health journey configuration has $errors error(s)"
        return 1
    fi
}

function apply_health_config {
    local config_file=$1
    local env=$2
    
    log_info "Applying health journey configuration to $env environment"
    
    # Source the config file to get variables
    source "$config_file"
    
    # Apply configuration to Kubernetes
    if command -v kubectl &> /dev/null; then
        # Create or update Kubernetes secrets
        kubectl create secret generic health-journey-config \
            --from-env-file="$config_file" \
            --namespace="health-journey" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        # Restart the deployment to pick up new configuration
        kubectl rollout restart deployment health-journey -n health-journey
        
        log_success "Applied health journey configuration to Kubernetes"
    else
        log_warning "kubectl not found, skipping Kubernetes configuration"
    fi
}

function configure_care_journey {
    local env=$1
    local config_file="$CONFIG_DIR/care/care-$env.env"
    local output_file="$OUTPUT_DIR/care-$env.env"
    
    log_info "Configuring Care Journey for $env environment"
    
    # Create default config if it doesn't exist
    if [ ! -f "$config_file" ]; then
        cat > "$config_file" << EOF
# Care Journey Configuration for $env environment

# Database Configuration
DATABASE_URL=postgresql://user:password@care-db:5432/caredb

# Redis Configuration
REDIS_URL=redis://redis:6379

# Kafka Configuration
KAFKA_BROKERS=kafka:9092
KAFKA_CONSUMER_GROUP=care-journey

# Telemedicine Integration
TELEMEDICINE_API_URL=https://telemedicine-api.example.com/api
TELEMEDICINE_API_KEY=telemedicine_api_key_placeholder
TELEMEDICINE_PROVIDER_IDS=provider1,provider2,provider3

# Appointment Scheduling
APPOINTMENT_REMINDER_ENABLED=true
APPOINTMENT_REMINDER_LEAD_TIME=24
APPOINTMENT_CANCELLATION_WINDOW=4

# Medication Management
MEDICATION_REMINDER_ENABLED=true
MEDICATION_DATABASE_URL=https://medication-db.example.com/api
MEDICATION_API_KEY=medication_api_key_placeholder

# Feature Flags
FEATURE_SYMPTOM_CHECKER=true
FEATURE_TELEMEDICINE=true
FEATURE_PROVIDER_SEARCH=true

# Monitoring
SENTRY_DSN=https://sentry.example.com/care
DATADOG_API_KEY=datadog_api_key

# Security
JWT_SECRET=jwt_secret_placeholder
EOF
        log_info "Created default care journey config for $env environment"
    fi
    
    # Validate care journey configuration
    validate_care_config "$config_file"
    
    # Export configuration if requested
    if [ "$ACTION" == "export" ] || [ "$ACTION" == "apply" ]; then
        cp "$config_file" "$output_file"
        log_success "Exported care journey config to $output_file"
    fi
    
    # Apply configuration if requested
    if [ "$ACTION" == "apply" ]; then
        apply_care_config "$output_file" "$env"
    fi
}

function validate_care_config {
    local config_file=$1
    local errors=0
    
    log_info "Validating care journey configuration: $config_file"
    
    # Source the config file to get variables
    source "$config_file"
    
    # Check required variables
    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    if [ -z "$REDIS_URL" ]; then
        log_warning "REDIS_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    # Validate telemedicine configuration
    if [ "$FEATURE_TELEMEDICINE" == "true" ]; then
        if [ -z "$TELEMEDICINE_API_URL" ]; then
            log_warning "FEATURE_TELEMEDICINE is enabled but TELEMEDICINE_API_URL is not set"
            errors=$((errors+1))
        fi
        
        if [ -z "$TELEMEDICINE_API_KEY" ]; then
            log_warning "FEATURE_TELEMEDICINE is enabled but TELEMEDICINE_API_KEY is not set"
            errors=$((errors+1))
        fi
        
        if [ -z "$TELEMEDICINE_PROVIDER_IDS" ]; then
            log_warning "FEATURE_TELEMEDICINE is enabled but TELEMEDICINE_PROVIDER_IDS is not set"
            errors=$((errors+1))
        fi
    fi
    
    # Validate medication reminder configuration
    if [ "$MEDICATION_REMINDER_ENABLED" == "true" ]; then
        if [ -z "$MEDICATION_DATABASE_URL" ]; then
            log_warning "MEDICATION_REMINDER_ENABLED is true but MEDICATION_DATABASE_URL is not set"
            errors=$((errors+1))
        fi
        
        if [ -z "$MEDICATION_API_KEY" ]; then
            log_warning "MEDICATION_REMINDER_ENABLED is true but MEDICATION_API_KEY is not set"
            errors=$((errors+1))
        fi
    fi
    
    # Return validation result
    if [ $errors -eq 0 ]; then
        log_success "Care journey configuration is valid"
        return 0
    else
        log_warning "Care journey configuration has $errors error(s)"
        return 1
    fi
}

function apply_care_config {
    local config_file=$1
    local env=$2
    
    log_info "Applying care journey configuration to $env environment"
    
    # Source the config file to get variables
    source "$config_file"
    
    # Apply configuration to Kubernetes
    if command -v kubectl &> /dev/null; then
        # Create or update Kubernetes secrets
        kubectl create secret generic care-journey-config \
            --from-env-file="$config_file" \
            --namespace="care-journey" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        # Restart the deployment to pick up new configuration
        kubectl rollout restart deployment care-service -n care-journey
        
        log_success "Applied care journey configuration to Kubernetes"
    else
        log_warning "kubectl not found, skipping Kubernetes configuration"
    fi
}

function configure_plan_journey {
    local env=$1
    local config_file="$CONFIG_DIR/plan/plan-$env.env"
    local output_file="$OUTPUT_DIR/plan-$env.env"
    
    log_info "Configuring Plan Journey for $env environment"
    
    # Create default config if it doesn't exist
    if [ ! -f "$config_file" ]; then
        cat > "$config_file" << EOF
# Plan Journey Configuration for $env environment

# Database Configuration
DATABASE_URL=postgresql://user:password@plan-db:5432/plandb

# Redis Configuration
REDIS_URL=redis://redis:6379

# Kafka Configuration
KAFKA_BROKERS=kafka:9092
KAFKA_CONSUMER_GROUP=plan-journey

# Insurance System Integration
INSURANCE_API_URL=https://insurance-api.example.com/api
INSURANCE_API_KEY=insurance_api_key_placeholder
INSURANCE_PROVIDER_IDS=provider1,provider2,provider3

# Payment Processing
PAYMENT_GATEWAY_URL=https://payment-gateway.example.com/api
PAYMENT_GATEWAY_API_KEY=payment_api_key_placeholder
PAYMENT_METHODS=credit_card,debit_card,bank_transfer

# Document Management
DOCUMENT_STORAGE_TYPE=s3
DOCUMENT_STORAGE_BUCKET=austa-documents
DOCUMENT_RETENTION_DAYS=365

# Feature Flags
FEATURE_CLAIM_SUBMISSION=true
FEATURE_BENEFIT_CALCULATOR=true
FEATURE_PLAN_COMPARISON=true

# Monitoring
SENTRY_DSN=https://sentry.example.com/plan
DATADOG_API_KEY=datadog_api_key

# Security
JWT_SECRET=jwt_secret_placeholder
EOF
        log_info "Created default plan journey config for $env environment"
    fi
    
    # Validate plan journey configuration
    validate_plan_config "$config_file"
    
    # Export configuration if requested
    if [ "$ACTION" == "export" ] || [ "$ACTION" == "apply" ]; then
        cp "$config_file" "$output_file"
        log_success "Exported plan journey config to $output_file"
    fi
    
    # Apply configuration if requested
    if [ "$ACTION" == "apply" ]; then
        apply_plan_config "$output_file" "$env"
    fi
}

function validate_plan_config {
    local config_file=$1
    local errors=0
    
    log_info "Validating plan journey configuration: $config_file"
    
    # Source the config file to get variables
    source "$config_file"
    
    # Check required variables
    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    if [ -z "$REDIS_URL" ]; then
        log_warning "REDIS_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    # Validate insurance system integration
    if [ -z "$INSURANCE_API_URL" ]; then
        log_warning "INSURANCE_API_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    if [ -z "$INSURANCE_API_KEY" ]; then
        log_warning "INSURANCE_API_KEY is not set in $config_file"
        errors=$((errors+1))
    fi
    
    # Validate payment processing
    if [ -z "$PAYMENT_GATEWAY_URL" ]; then
        log_warning "PAYMENT_GATEWAY_URL is not set in $config_file"
        errors=$((errors+1))
    fi
    
    if [ -z "$PAYMENT_GATEWAY_API_KEY" ]; then
        log_warning "PAYMENT_GATEWAY_API_KEY is not set in $config_file"
        errors=$((errors+1))
    fi
    
    # Validate document storage
    if [ "$DOCUMENT_STORAGE_TYPE" == "s3" ] && [ -z "$DOCUMENT_STORAGE_BUCKET" ]; then
        log_warning "DOCUMENT_STORAGE_TYPE is s3 but DOCUMENT_STORAGE_BUCKET is not set"
        errors=$((errors+1))
    fi
    
    # Return validation result
    if [ $errors -eq 0 ]; then
        log_success "Plan journey configuration is valid"
        return 0
    else
        log_warning "Plan journey configuration has $errors error(s)"
        return 1
    fi
}

function apply_plan_config {
    local config_file=$1
    local env=$2
    
    log_info "Applying plan journey configuration to $env environment"
    
    # Source the config file to get variables
    source "$config_file"
    
    # Apply configuration to Kubernetes
    if command -v kubectl &> /dev/null; then
        # Create or update Kubernetes secrets
        kubectl create secret generic plan-journey-config \
            --from-env-file="$config_file" \
            --namespace="plan-journey" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        # Restart the deployment to pick up new configuration
        kubectl rollout restart deployment plan-journey -n plan-journey
        
        log_success "Applied plan journey configuration to Kubernetes"
    else
        log_warning "kubectl not found, skipping Kubernetes configuration"
    fi
}

# =========================================================================
# Main Script Logic
# =========================================================================

# Parse command line arguments
if [ $# -ge 1 ]; then
    JOURNEY="$1"
fi

if [ $# -ge 2 ]; then
    ENVIRONMENT="$2"
fi

if [ $# -ge 3 ]; then
    ACTION="$3"
fi

# Validate input parameters
validate_input

# Ensure required directories exist
ensure_directories

# Process journey configurations
if [ "$JOURNEY" == "all" ] || [ "$JOURNEY" == "health" ]; then
    configure_health_journey "$ENVIRONMENT"
fi

if [ "$JOURNEY" == "all" ] || [ "$JOURNEY" == "care" ]; then
    configure_care_journey "$ENVIRONMENT"
fi

if [ "$JOURNEY" == "all" ] || [ "$JOURNEY" == "plan" ]; then
    configure_plan_journey "$ENVIRONMENT"
fi

log_success "Journey configuration completed successfully"