#!/bin/bash

# =========================================================================
# AUSTA SuperApp - Automated Rollback Script
# =========================================================================
# This script implements comprehensive rollback procedures for the AUSTA
# SuperApp deployment pipeline, supporting container rollback, database
# migration reversal, and configuration restoration.
#
# Supports different deployment strategies:
# - Rolling updates (staging)
# - Blue/green deployment (API Gateway)
# - Canary deployment (Journey Services)
# - Controlled migrations (Data Services)
#
# Usage: ./rollback.sh [options]
#
# Options:
#   -s, --service <service-name>     Service to rollback (required)
#   -e, --environment <env>          Environment: dev, staging, prod (required)
#   -t, --type <rollback-type>       Rollback type: container, database, config, all (default: all)
#   -r, --revision <revision>        Specific revision to rollback to (optional)
#   -f, --force                      Force rollback without confirmation
#   -n, --notify <email>             Email to notify about rollback status
#   -h, --help                       Display this help message
#
# Examples:
#   ./rollback.sh --service api-gateway --environment prod --type container
#   ./rollback.sh --service health-service --environment staging --type all
#   ./rollback.sh --service plan-service --environment prod --type database --revision 20230204000000
# =========================================================================

set -e

# Script version
VERSION="1.0.0"

# Default values
SERVICE=""
ENVIRONMENT=""
ROLLBACK_TYPE="all"
REVISION=""
FORCE=false
NOTIFY=""

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Paths
LOG_DIR="/var/log/austa/rollbacks"
LOG_FILE="${LOG_DIR}/rollback-$(date +%Y%m%d-%H%M%S).log"
CONFIG_BACKUP_DIR="/var/backup/austa/configs"

# =========================================================================
# Helper Functions
# =========================================================================

# Display script usage
function show_usage {
    grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^#//' | sed 's/^[ \t]*//' | head -n 20
    exit 1
}

# Log messages to console and log file
function log {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Create log directory if it doesn't exist
    mkdir -p "${LOG_DIR}"
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
        *)
            echo -e "${timestamp} - $message"
            ;;
    esac
    
    echo "${timestamp} - [${level}] - $message" >> "${LOG_FILE}"
}

# Send notification
function send_notification {
    local status=$1
    local details=$2
    
    if [ -z "$NOTIFY" ]; then
        return 0
    fi
    
    log "INFO" "Sending notification to $NOTIFY"
    
    # Use AWS SNS if available
    if command -v aws &> /dev/null; then
        aws sns publish \
            --topic-arn "arn:aws:sns:us-east-1:123456789012:austa-rollback-notifications" \
            --message "AUSTA SuperApp Rollback Status: $status - $details" \
            --subject "Rollback Notification: $SERVICE in $ENVIRONMENT" \
            || log "WARNING" "Failed to send SNS notification"
    fi
    
    # Email notification as fallback
    if command -v mail &> /dev/null; then
        echo "AUSTA SuperApp Rollback Status: $status - $details" | \
        mail -s "Rollback Notification: $SERVICE in $ENVIRONMENT" "$NOTIFY" \
        || log "WARNING" "Failed to send email notification"
    fi
}

# Verify prerequisites
function check_prerequisites {
    log "INFO" "Checking prerequisites..."
    
    # Check for kubectl
    if ! command -v kubectl &> /dev/null; then
        log "ERROR" "kubectl is required but not installed"
        exit 1
    fi
    
    # Check for required tools based on rollback type
    case $ROLLBACK_TYPE in
        "database" | "all")
            if ! command -v prisma &> /dev/null; then
                log "ERROR" "prisma CLI is required for database rollbacks but not installed"
                exit 1
            fi
            ;;
    esac
    
    # Verify connection to Kubernetes cluster
    kubectl get nodes &> /dev/null || {
        log "ERROR" "Cannot connect to Kubernetes cluster"
        exit 1
    }
    
    log "SUCCESS" "All prerequisites satisfied"
}

# Verify service exists
function verify_service {
    log "INFO" "Verifying service $SERVICE exists in $ENVIRONMENT environment..."
    
    # Check if the service exists in Kubernetes
    if ! kubectl get deployment "$SERVICE" -n "austa-$ENVIRONMENT" &> /dev/null; then
        log "ERROR" "Service $SERVICE not found in $ENVIRONMENT environment"
        exit 1
    fi
    
    log "SUCCESS" "Service $SERVICE found in $ENVIRONMENT environment"
}

# Get deployment strategy for service
function get_deployment_strategy {
    local service=$1
    local environment=$2
    
    if [ "$environment" == "staging" ]; then
        echo "rolling"
        return
    fi
    
    case $service in
        "api-gateway")
            echo "bluegreen"
            ;;
        "health-service" | "care-service" | "plan-service")
            echo "canary"
            ;;
        "gamification-engine" | "notification-service" | "auth-service")
            echo "canary"
            ;;
        *)
            # Default to rolling for unknown services
            echo "rolling"
            ;;
    esac
}

# Check if service is a data service
function is_data_service {
    local service=$1
    
    case $service in
        "health-service" | "plan-service" | "gamification-engine")
            return 0 # true
            ;;
        *)
            return 1 # false
            ;;
    esac
}

# Perform health check after rollback
function perform_health_check {
    log "INFO" "Performing health check for $SERVICE..."
    
    # Path to health check script
    local health_check_script="$(dirname "$0")/health-check.sh"
    
    # Check if health check script exists
    if [ ! -f "$health_check_script" ]; then
        log "WARNING" "Health check script not found at $health_check_script"
        return 1
    fi
    
    # Execute health check script
    if "$health_check_script" --service "$SERVICE" --environment "$ENVIRONMENT" --timeout 120; then
        log "SUCCESS" "Health check passed for $SERVICE"
        return 0
    else
        log "ERROR" "Health check failed for $SERVICE"
        return 1
    fi
}

# =========================================================================
# Rollback Functions
# =========================================================================

# Rollback container deployment
function rollback_container {
    log "INFO" "Starting container rollback for $SERVICE in $ENVIRONMENT environment"
    
    local deployment_strategy=$(get_deployment_strategy "$SERVICE" "$ENVIRONMENT")
    log "INFO" "Detected deployment strategy: $deployment_strategy"
    
    case $deployment_strategy in
        "rolling")
            rollback_rolling_deployment
            ;;
        "bluegreen")
            rollback_bluegreen_deployment
            ;;
        "canary")
            rollback_canary_deployment
            ;;
        *)
            log "ERROR" "Unknown deployment strategy: $deployment_strategy"
            return 1
            ;;
    esac
    
    # Verify rollback success with health check
    if perform_health_check; then
        log "SUCCESS" "Container rollback completed successfully for $SERVICE"
        return 0
    else
        log "ERROR" "Container rollback completed but health check failed for $SERVICE"
        return 1
    fi
}

# Rollback rolling deployment
function rollback_rolling_deployment {
    log "INFO" "Rolling back deployment for $SERVICE using rolling update strategy"
    
    local revision=""
    if [ -n "$REVISION" ]; then
        revision="--to-revision=$REVISION"
        log "INFO" "Rolling back to specific revision: $REVISION"
    fi
    
    # Execute rollback
    if kubectl rollout undo deployment "$SERVICE" -n "austa-$ENVIRONMENT" $revision; then
        log "INFO" "Waiting for rollout to complete..."
        kubectl rollout status deployment "$SERVICE" -n "austa-$ENVIRONMENT" --timeout=300s
        log "SUCCESS" "Rolling deployment rollback completed"
    else
        log "ERROR" "Failed to rollback rolling deployment"
        return 1
    fi
    
    return 0
}

# Rollback blue/green deployment
function rollback_bluegreen_deployment {
    log "INFO" "Rolling back deployment for $SERVICE using blue/green strategy"
    
    # For blue/green, we switch back to the previous service
    local current_service="${SERVICE}"
    local inactive_service="${SERVICE}-inactive"
    
    # Check if inactive service exists
    if ! kubectl get service "$inactive_service" -n "austa-$ENVIRONMENT" &> /dev/null; then
        log "ERROR" "Inactive service $inactive_service not found. Cannot perform blue/green rollback."
        return 1
    fi
    
    log "INFO" "Switching traffic from $current_service to $inactive_service"
    
    # Update the service selector to point to the inactive deployment
    local inactive_selector=$(kubectl get service "$inactive_service" -n "austa-$ENVIRONMENT" -o jsonpath='{.spec.selector.app}')
    
    if [ -z "$inactive_selector" ]; then
        log "ERROR" "Could not determine inactive selector"
        return 1
    fi
    
    # Patch the main service to point to the inactive deployment
    if kubectl patch service "$current_service" -n "austa-$ENVIRONMENT" --type='json' \
        -p="[{\"op\": \"replace\", \"path\": \"/spec/selector/app\", \"value\": \"$inactive_selector\"}]"; then
        
        log "SUCCESS" "Traffic switched to previous deployment"
        
        # Swap service names to maintain the active/inactive pattern
        kubectl patch service "$current_service" -n "austa-$ENVIRONMENT" --type='json' \
            -p="[{\"op\": \"replace\", \"path\": \"/metadata/labels/status\", \"value\": \"inactive\"}]" || \
            log "WARNING" "Failed to update service status label"
            
        kubectl patch service "$inactive_service" -n "austa-$ENVIRONMENT" --type='json' \
            -p="[{\"op\": \"replace\", \"path\": \"/metadata/labels/status\", \"value\": \"active\"}]" || \
            log "WARNING" "Failed to update service status label"
    else
        log "ERROR" "Failed to switch traffic to previous deployment"
        return 1
    fi
    
    return 0
}

# Rollback canary deployment
function rollback_canary_deployment {
    log "INFO" "Rolling back deployment for $SERVICE using canary strategy"
    
    # For canary, we need to adjust the traffic weight back to the previous version
    local current_service="${SERVICE}"
    local canary_service="${SERVICE}-canary"
    
    # Check if we're using Istio for traffic management
    if kubectl get virtualservice "$current_service" -n "austa-$ENVIRONMENT" &> /dev/null; then
        log "INFO" "Using Istio VirtualService for canary rollback"
        
        # Set traffic weight to 100% for the primary (previous) version
        if kubectl patch virtualservice "$current_service" -n "austa-$ENVIRONMENT" --type='json' \
            -p="[{\"op\": \"replace\", \"path\": \"/spec/http/0/route/0/weight\", \"value\": 100}, \
                {\"op\": \"replace\", \"path\": \"/spec/http/0/route/1/weight\", \"value\": 0}]"; then
            
            log "SUCCESS" "Traffic weight adjusted to 100% for primary version"
            
            # Delete the canary deployment if it exists
            if kubectl get deployment "$canary_service" -n "austa-$ENVIRONMENT" &> /dev/null; then
                kubectl delete deployment "$canary_service" -n "austa-$ENVIRONMENT" || \
                    log "WARNING" "Failed to delete canary deployment"
            fi
        else
            log "ERROR" "Failed to adjust traffic weights"
            return 1
        fi
    else
        # Fallback to basic Kubernetes rollback if Istio is not used
        log "INFO" "Istio not detected, falling back to basic deployment rollback"
        rollback_rolling_deployment
    fi
    
    return 0
}

# Rollback database migrations
function rollback_database {
    log "INFO" "Starting database rollback for $SERVICE in $ENVIRONMENT environment"
    
    # Check if this is a data service
    if ! is_data_service "$SERVICE"; then
        log "WARNING" "$SERVICE is not a data service, skipping database rollback"
        return 0
    fi
    
    # Determine the Prisma schema path
    local prisma_dir="/app/src/backend/$SERVICE/prisma"
    local schema_path="$prisma_dir/schema.prisma"
    
    # Check if we have a specific revision to rollback to
    if [ -z "$REVISION" ]; then
        log "ERROR" "Database rollback requires a specific migration revision"
        log "INFO" "Available migrations:"
        ls -la "$prisma_dir/migrations" || log "WARNING" "Could not list migrations"
        return 1
    fi
    
    log "INFO" "Rolling back database to migration: $REVISION"
    
    # Execute database rollback using Prisma
    if PRISMA_SCHEMA_PATH="$schema_path" prisma migrate resolve --rolled-back "$REVISION"; then
        log "SUCCESS" "Database rolled back to migration $REVISION"
    else
        log "ERROR" "Failed to rollback database to migration $REVISION"
        return 1
    fi
    
    # Verify database state
    if PRISMA_SCHEMA_PATH="$schema_path" prisma migrate status; then
        log "SUCCESS" "Database migration status verified"
    else
        log "WARNING" "Could not verify database migration status"
    fi
    
    return 0
}

# Rollback configuration
function rollback_config {
    log "INFO" "Starting configuration rollback for $SERVICE in $ENVIRONMENT environment"
    
    # Determine backup path for this service and environment
    local backup_path="$CONFIG_BACKUP_DIR/$ENVIRONMENT/$SERVICE"
    
    # Check if backup exists
    if [ ! -d "$backup_path" ]; then
        log "ERROR" "No configuration backups found at $backup_path"
        return 1
    fi
    
    # Get the latest backup if no specific revision is provided
    local config_backup=""
    if [ -z "$REVISION" ]; then
        config_backup=$(find "$backup_path" -type f -name "*.yaml" | sort -r | head -n 1)
        if [ -z "$config_backup" ]; then
            log "ERROR" "No configuration backups found"
            return 1
        fi
        log "INFO" "Using latest configuration backup: $(basename "$config_backup")"
    else
        config_backup="$backup_path/$REVISION.yaml"
        if [ ! -f "$config_backup" ]; then
            log "ERROR" "Configuration backup not found: $config_backup"
            return 1
        fi
        log "INFO" "Using specified configuration backup: $REVISION.yaml"
    fi
    
    # Apply the configuration backup
    log "INFO" "Applying configuration from backup: $config_backup"
    if kubectl apply -f "$config_backup" -n "austa-$ENVIRONMENT"; then
        log "SUCCESS" "Configuration restored from backup"
    else
        log "ERROR" "Failed to apply configuration from backup"
        return 1
    fi
    
    return 0
}

# =========================================================================
# Main Script Logic
# =========================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -s|--service)
            SERVICE="$2"
            shift
            shift
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        -t|--type)
            ROLLBACK_TYPE="$2"
            shift
            shift
            ;;
        -r|--revision)
            REVISION="$2"
            shift
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -n|--notify)
            NOTIFY="$2"
            shift
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Validate required parameters
if [ -z "$SERVICE" ]; then
    log "ERROR" "Service name is required"
    show_usage
fi

if [ -z "$ENVIRONMENT" ]; then
    log "ERROR" "Environment is required"
    show_usage
fi

# Validate environment
case $ENVIRONMENT in
    "dev"|"staging"|"prod")
        # Valid environment
        ;;
    *)
        log "ERROR" "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod."
        show_usage
        ;;
esac

# Validate rollback type
case $ROLLBACK_TYPE in
    "container"|"database"|"config"|"all")
        # Valid rollback type
        ;;
    *)
        log "ERROR" "Invalid rollback type: $ROLLBACK_TYPE. Must be container, database, config, or all."
        show_usage
        ;;
esac

# Display rollback information
log "INFO" "=== AUSTA SuperApp Rollback Script v$VERSION ==="
log "INFO" "Service: $SERVICE"
log "INFO" "Environment: $ENVIRONMENT"
log "INFO" "Rollback Type: $ROLLBACK_TYPE"
if [ -n "$REVISION" ]; then
    log "INFO" "Target Revision: $REVISION"
fi

# Confirm rollback unless forced
if [ "$FORCE" != "true" ]; then
    read -p "Are you sure you want to proceed with the rollback? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Rollback cancelled by user"
        exit 0
    fi
fi

# Check prerequisites
check_prerequisites

# Verify service exists
verify_service

# Initialize rollback status
ROLLBACK_STATUS="SUCCESS"
ROLLBACK_DETAILS=""

# Perform rollback based on type
if [ "$ROLLBACK_TYPE" == "container" ] || [ "$ROLLBACK_TYPE" == "all" ]; then
    if rollback_container; then
        log "SUCCESS" "Container rollback completed successfully"
    else
        log "ERROR" "Container rollback failed"
        ROLLBACK_STATUS="FAILURE"
        ROLLBACK_DETAILS="Container rollback failed"
    fi
fi

if [ "$ROLLBACK_TYPE" == "database" ] || [ "$ROLLBACK_TYPE" == "all" ]; then
    if rollback_database; then
        log "SUCCESS" "Database rollback completed successfully"
    else
        log "ERROR" "Database rollback failed"
        ROLLBACK_STATUS="FAILURE"
        ROLLBACK_DETAILS="${ROLLBACK_DETAILS}Database rollback failed. "
    fi
fi

if [ "$ROLLBACK_TYPE" == "config" ] || [ "$ROLLBACK_TYPE" == "all" ]; then
    if rollback_config; then
        log "SUCCESS" "Configuration rollback completed successfully"
    else
        log "ERROR" "Configuration rollback failed"
        ROLLBACK_STATUS="FAILURE"
        ROLLBACK_DETAILS="${ROLLBACK_DETAILS}Configuration rollback failed. "
    fi
fi

# Send notification if email is provided
if [ -n "$NOTIFY" ]; then
    if [ "$ROLLBACK_STATUS" == "SUCCESS" ]; then
        send_notification "SUCCESS" "Rollback completed successfully for $SERVICE in $ENVIRONMENT environment"
    else
        send_notification "FAILURE" "Rollback failed: $ROLLBACK_DETAILS"
    fi
fi

# Final status message
if [ "$ROLLBACK_STATUS" == "SUCCESS" ]; then
    log "SUCCESS" "Rollback process completed successfully for $SERVICE in $ENVIRONMENT environment"
    exit 0
else
    log "ERROR" "Rollback process failed: $ROLLBACK_DETAILS"
    exit 1
fi