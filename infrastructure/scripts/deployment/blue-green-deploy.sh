#!/bin/bash

# =========================================================================
# blue-green-deploy.sh
# =========================================================================
# Implements blue-green deployment for critical services like API Gateway,
# creating a duplicate deployment with the new version, executing comprehensive
# validation, and switching traffic only when validation passes, providing
# instant rollback capability by reverting to the previous environment if
# issues are detected.
# =========================================================================

set -e

# Source common functions and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source configuration and common functions
source "${SCRIPT_DIR}/config.sh" 2>/dev/null || { echo "Error: config.sh not found"; exit 1; }
source "${SCRIPT_DIR}/common.sh" 2>/dev/null || { echo "Error: common.sh not found"; exit 1; }

# Set up logging with journey context
setup_logging "deployment" "blue-green" "${SERVICE:-unknown}"

# =========================================================================
# Configuration and Constants
# =========================================================================

# Default values
DEFAULT_NAMESPACE="default"
DEFAULT_VALIDATION_TIMEOUT=300  # 5 minutes
DEFAULT_STABILITY_PERIOD=300    # 5 minutes
DEFAULT_CLEANUP_DELAY=300       # 5 minutes
DEFAULT_PORT=4000               # Default container port
DEFAULT_SERVICE_PORT=80         # Default service port

# Environment-specific overrides from config.sh
NAMESPACE=${BLUE_GREEN_NAMESPACE:-$DEFAULT_NAMESPACE}
VALIDATION_TIMEOUT=${BLUE_GREEN_VALIDATION_TIMEOUT:-$DEFAULT_VALIDATION_TIMEOUT}
STABILITY_PERIOD=${BLUE_GREEN_STABILITY_PERIOD:-$DEFAULT_STABILITY_PERIOD}
CLEANUP_DELAY=${BLUE_GREEN_CLEANUP_DELAY:-$DEFAULT_CLEANUP_DELAY}
CONTAINER_PORT=${BLUE_GREEN_CONTAINER_PORT:-$DEFAULT_PORT}
SERVICE_PORT=${BLUE_GREEN_SERVICE_PORT:-$DEFAULT_SERVICE_PORT}

# =========================================================================
# Usage Information
# =========================================================================

function show_usage {
    cat << EOF
Usage: $(basename $0) [OPTIONS]

Implements blue-green deployment for critical services.

Options:
  -s, --service NAME       Service name to deploy (required)
  -i, --image IMAGE        Docker image with tag (required)
  -n, --namespace NAME     Kubernetes namespace (default: $NAMESPACE)
  -c, --config PATH        Path to service-specific config (optional)
  -t, --timeout SECONDS    Validation timeout in seconds (default: $VALIDATION_TIMEOUT)
  -p, --period SECONDS     Stability monitoring period (default: $STABILITY_PERIOD)
  -d, --delay SECONDS      Cleanup delay after switch (default: $CLEANUP_DELAY)
  --container-port PORT    Container port (default: $CONTAINER_PORT)
  --service-port PORT      Service port (default: $SERVICE_PORT)
  -f, --force              Force deployment even if validation fails (use with caution)
  -h, --help               Show this help message

Example:
  $(basename $0) --service api-gateway --image austa-superapp/api-gateway:v1.2.3

Note: This script requires kubectl access to the target cluster.
EOF
    exit 1
}

# =========================================================================
# Argument Parsing
# =========================================================================

SERVICE=""
IMAGE=""
CONFIG_PATH=""
FORCE_DEPLOY=false

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -i|--image)
            IMAGE="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -c|--config)
            CONFIG_PATH="$2"
            shift 2
            ;;
        -t|--timeout)
            VALIDATION_TIMEOUT="$2"
            shift 2
            ;;
        -p|--period)
            STABILITY_PERIOD="$2"
            shift 2
            ;;
        -d|--delay)
            CLEANUP_DELAY="$2"
            shift 2
            ;;
        --container-port)
            CONTAINER_PORT="$2"
            shift 2
            ;;
        --service-port)
            SERVICE_PORT="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Validate required arguments
if [[ -z "$SERVICE" ]]; then
    log_error "Service name is required"
    show_usage
fi

if [[ -z "$IMAGE" ]]; then
    log_error "Docker image is required"
    show_usage
fi

# =========================================================================
# Helper Functions
# =========================================================================

# Get the current active environment (blue or green)
function get_active_environment {
    local service=$1
    local namespace=$2
    
    # First try to get from annotation (more reliable)
    local annotation=$(kubectl get service "$service" -n "$namespace" -o jsonpath='{.metadata.annotations.austa\.com\.br/active-environment}' 2>/dev/null)
    
    if [[ -n "$annotation" ]]; then
        echo "$annotation"
        return
    fi
    
    # Fallback to selector if annotation doesn't exist
    local selector=$(kubectl get service "$service" -n "$namespace" -o jsonpath='{.spec.selector.environment}' 2>/dev/null)
    
    if [[ "$selector" == "blue" ]]; then
        echo "blue"
    elif [[ "$selector" == "green" ]]; then
        echo "green"
    else
        # If no environment selector exists, default to blue
        echo "blue"
    fi
}

# Check if a service exists
function service_exists {
    local service=$1
    local namespace=$2
    
    kubectl get service "$service" -n "$namespace" &>/dev/null
    return $?
}

# Get the inactive environment (the one we'll deploy to)
function get_inactive_environment {
    local active=$(get_active_environment "$1" "$2")
    
    if [[ "$active" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Check if a deployment exists
function deployment_exists {
    local deployment=$1
    local namespace=$2
    
    kubectl get deployment "$deployment" -n "$namespace" &>/dev/null
    return $?
}

# Wait for deployment to be ready
function wait_for_deployment {
    local deployment=$1
    local namespace=$2
    local timeout=$3
    
    log_info "Waiting for deployment $deployment to be ready (timeout: ${timeout}s)..."
    
    kubectl rollout status deployment "$deployment" -n "$namespace" --timeout="${timeout}s"
    return $?
}

# Switch traffic to the target environment
function switch_traffic {
    local service=$1
    local namespace=$2
    local target_env=$3
    
    log_info "Switching traffic for service $service to $target_env environment"
    
    # Update the service selector to point to the target environment
    kubectl patch service "$service" -n "$namespace" -p "{\"spec\":{\"selector\":{\"app\":\"$service\",\"environment\":\"$target_env\"}}}"
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to switch traffic to $target_env environment"
        return 1
    fi
    
    # Update annotations to record the switch
    kubectl annotate service "$service" -n "$namespace" \
        austa.com.br/active-environment="$target_env" \
        austa.com.br/last-switched="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --overwrite
    
    log_success "Successfully switched traffic to $target_env environment"
    return 0
}

# =========================================================================
# Main Deployment Logic
# =========================================================================

log_section "Starting blue-green deployment for $SERVICE"

# Check if service exists
if ! service_exists "$SERVICE" "$NAMESPACE"; then
    log_warning "Service $SERVICE does not exist in namespace $NAMESPACE"
    log_info "Creating service $SERVICE with initial selector pointing to the target environment"
    
    # Default to blue as the first environment
    TARGET_ENV="blue"
    ACTIVE_ENV="none"
    
    # Create the service if it doesn't exist
    cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
---
apiVersion: v1
kind: Service
metadata:
  name: $SERVICE
  namespace: $NAMESPACE
  labels:
    app: $SERVICE
  annotations:
    deployment.kubernetes.io/revision: "1"
    austa.com.br/deployment-type: "blue-green"
    austa.com.br/last-updated: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
spec:
  selector:
    app: $SERVICE
    environment: $TARGET_ENV
  ports:
  - port: $SERVICE_PORT
    targetPort: $CONTAINER_PORT
    protocol: TCP
  type: LoadBalancer
EOF
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to create service $SERVICE"
        exit 1
    fi
    
    log_success "Successfully created service $SERVICE"
else
    # Determine active and target environments
    ACTIVE_ENV=$(get_active_environment "$SERVICE" "$NAMESPACE")
    TARGET_ENV=$(get_inactive_environment "$SERVICE" "$NAMESPACE")
    
    log_info "Current active environment: $ACTIVE_ENV"
    log_info "Target environment for deployment: $TARGET_ENV"
fi

# Deployment names
ACTIVE_DEPLOYMENT="${SERVICE}-${ACTIVE_ENV}"
TARGET_DEPLOYMENT="${SERVICE}-${TARGET_ENV}"

# Check if the target deployment already exists
if deployment_exists "$TARGET_DEPLOYMENT" "$NAMESPACE"; then
    log_warning "Target deployment $TARGET_DEPLOYMENT already exists. It will be updated."
    
    # Update the existing deployment with the new image
    log_info "Updating deployment $TARGET_DEPLOYMENT with image $IMAGE"
    kubectl set image deployment/"$TARGET_DEPLOYMENT" "$SERVICE=$IMAGE" -n "$NAMESPACE"
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to update deployment $TARGET_DEPLOYMENT"
        exit 1
    fi
else
    # Create a new deployment based on the active one, but with the new image
    log_info "Creating new deployment $TARGET_DEPLOYMENT with image $IMAGE"
    
    # Get the current deployment YAML as a template
    if deployment_exists "$ACTIVE_DEPLOYMENT" "$NAMESPACE"; then
        log_info "Using existing deployment $ACTIVE_DEPLOYMENT as template"
        
        # Export the current deployment, modify it, and apply the new one
        kubectl get deployment "$ACTIVE_DEPLOYMENT" -n "$NAMESPACE" -o yaml | \
            sed "s/name: $ACTIVE_DEPLOYMENT/name: $TARGET_DEPLOYMENT/g" | \
            sed "s/environment: $ACTIVE_ENV/environment: $TARGET_ENV/g" | \
            sed "s|image: .*|image: $IMAGE|g" | \
            kubectl apply -f - -n "$NAMESPACE"
    else
        # If no active deployment exists, we need to create one from scratch or template
        log_warning "No existing deployment found. Creating new deployment from template."
        
        # Check if service-specific config exists
        if [[ -n "$CONFIG_PATH" && -f "$CONFIG_PATH" ]]; then
            log_info "Using service-specific configuration from $CONFIG_PATH"
            
            # Replace placeholders in the template
            sed "s/{{SERVICE}}/$SERVICE/g" "$CONFIG_PATH" | \
                sed "s/{{ENVIRONMENT}}/$TARGET_ENV/g" | \
                sed "s|{{IMAGE}}|$IMAGE|g" | \
                kubectl apply -f - -n "$NAMESPACE"
        else
            log_error "No existing deployment or configuration template found"
            log_error "Please provide a configuration template with --config"
            exit 1
        fi
    fi
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to create deployment $TARGET_DEPLOYMENT"
        exit 1
    fi
fi

# Wait for the deployment to be ready
log_info "Waiting for deployment $TARGET_DEPLOYMENT to be ready"
if ! wait_for_deployment "$TARGET_DEPLOYMENT" "$NAMESPACE" "$VALIDATION_TIMEOUT"; then
    log_error "Deployment $TARGET_DEPLOYMENT failed to become ready within timeout"
    
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
        log_error "Aborting deployment. Use --force to override."
        exit 1
    else
        log_warning "Forcing deployment despite readiness failure"
    fi
fi

# Validate the new deployment
log_section "Validating the new deployment"
log_info "Running validation for $TARGET_DEPLOYMENT"

# Use the blue-green-validate.sh script for comprehensive validation
if [[ -f "${SCRIPT_DIR}/blue-green-validate.sh" ]]; then
    "${SCRIPT_DIR}/blue-green-validate.sh" \
        --service "$SERVICE" \
        --deployment "$TARGET_DEPLOYMENT" \
        --namespace "$NAMESPACE" \
        --timeout "$VALIDATION_TIMEOUT"
    
    VALIDATION_RESULT=$?
    
    if [[ $VALIDATION_RESULT -ne 0 ]]; then
        log_error "Validation failed for $TARGET_DEPLOYMENT"
        
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            log_error "Aborting deployment. Use --force to override."
            exit 1
        else
            log_warning "Forcing deployment despite validation failure"
        fi
    else
        log_success "Validation successful for $TARGET_DEPLOYMENT"
    fi
else
    log_warning "Validation script not found. Skipping validation."
    log_warning "It is highly recommended to implement validation before switching traffic."
    
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
        log_error "Aborting deployment due to missing validation. Use --force to override."
        exit 1
    fi
fi

# Switch traffic to the new deployment
log_section "Switching traffic to the new deployment"

if ! switch_traffic "$SERVICE" "$NAMESPACE" "$TARGET_ENV"; then
    log_error "Failed to switch traffic to $TARGET_ENV environment"
    exit 1
fi

# Monitor the new deployment for stability
log_section "Monitoring new deployment for stability"
log_info "Monitoring $TARGET_DEPLOYMENT for ${STABILITY_PERIOD}s"

# Use the validate-deployment.sh script for monitoring if available
if [[ -f "${SCRIPT_DIR}/validate-deployment.sh" ]]; then
    "${SCRIPT_DIR}/validate-deployment.sh" \
        --service "$SERVICE" \
        --deployment "$TARGET_DEPLOYMENT" \
        --namespace "$NAMESPACE" \
        --duration "$STABILITY_PERIOD"
    
    MONITORING_RESULT=$?
    
    if [[ $MONITORING_RESULT -ne 0 ]]; then
        log_error "Stability monitoring failed for $TARGET_DEPLOYMENT"
        log_warning "Rolling back to $ACTIVE_ENV environment"
        
        # Roll back to the previous environment
        if ! switch_traffic "$SERVICE" "$NAMESPACE" "$ACTIVE_ENV"; then
            log_error "Failed to roll back to $ACTIVE_ENV environment"
            log_error "CRITICAL: Service may be in an inconsistent state!"
            exit 2
        fi
        
        log_info "Successfully rolled back to $ACTIVE_ENV environment"
        exit 1
    else
        log_success "Stability monitoring successful for $TARGET_DEPLOYMENT"
    fi
else
    log_warning "Monitoring script not found. Using basic sleep instead."
    log_info "Waiting for ${STABILITY_PERIOD}s to ensure stability..."
    sleep "$STABILITY_PERIOD"
    
    # Basic health check
    if ! kubectl rollout status deployment "$TARGET_DEPLOYMENT" -n "$NAMESPACE" --timeout=10s &>/dev/null; then
        log_error "Deployment $TARGET_DEPLOYMENT appears to be unhealthy after waiting period"
        log_warning "Rolling back to $ACTIVE_ENV environment"
        
        # Roll back to the previous environment
        if ! switch_traffic "$SERVICE" "$NAMESPACE" "$ACTIVE_ENV"; then
            log_error "Failed to roll back to $ACTIVE_ENV environment"
            log_error "CRITICAL: Service may be in an inconsistent state!"
            exit 2
        fi
        
        log_info "Successfully rolled back to $ACTIVE_ENV environment"
        exit 1
    fi
fi

# Schedule cleanup of the old deployment
log_section "Scheduling cleanup of the old deployment"

# Only clean up if there was an active environment before
if [[ "$ACTIVE_ENV" != "none" ]]; then
    log_info "Will clean up $ACTIVE_DEPLOYMENT after ${CLEANUP_DELAY}s"
    
    # Use a background process to clean up the old deployment after the delay
    (sleep "$CLEANUP_DELAY" && \
        log_info "Cleaning up old deployment $ACTIVE_DEPLOYMENT" && \
        kubectl delete deployment "$ACTIVE_DEPLOYMENT" -n "$NAMESPACE" && \
        log_success "Successfully cleaned up old deployment $ACTIVE_DEPLOYMENT" || \
        log_error "Failed to clean up old deployment $ACTIVE_DEPLOYMENT") &
else
    log_info "No previous deployment to clean up"
fi

log_section "Blue-green deployment completed successfully"
log_success "Service $SERVICE is now running in the $TARGET_ENV environment"

if [[ "$ACTIVE_ENV" != "none" ]]; then
    log_info "Old deployment $ACTIVE_DEPLOYMENT will be removed in ${CLEANUP_DELAY}s"
fi

# Record the deployment in the deployment history
DEPLOYMENT_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_DIR="${SCRIPT_DIR}/../logs"
mkdir -p "$LOG_DIR"
echo "$DEPLOYMENT_TIMESTAMP,$SERVICE,$TARGET_ENV,$IMAGE" >> "$LOG_DIR/blue-green-deployments.log"

exit 0