#!/bin/bash

# =========================================================================
# AUSTA SuperApp Deployment Rollback Script
# =========================================================================
# This script orchestrates rollback procedures for failed deployments.
# It detects deployment type (canary, blue-green, standard), invokes the
# appropriate rollback strategy, and coordinates between Kubernetes rollbacks
# and database rollbacks if needed.
#
# Usage: ./rollback.sh [service-name] [namespace] [--force] [--skip-db-rollback]
# =========================================================================

set -e

# Source common functions and configurations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../common/logging.sh"
source "${SCRIPT_DIR}/../common/k8s-utils.sh"
source "${SCRIPT_DIR}/../common/db-utils.sh"
source "${SCRIPT_DIR}/../common/monitoring.sh"

# Default values
FORCE_ROLLBACK=false
SKIP_DB_ROLLBACK=false
ALERT_MONITORING=true

# =========================================================================
# Function: print_usage
# Description: Displays the script usage information
# =========================================================================
function print_usage {
  echo "Usage: $0 [service-name] [namespace] [options]"
  echo ""
  echo "Arguments:"
  echo "  service-name       Name of the service to rollback"
  echo "  namespace          Kubernetes namespace where the service is deployed"
  echo ""
  echo "Options:"
  echo "  --force            Force rollback without verification"
  echo "  --skip-db-rollback Skip database rollback steps"
  echo "  --no-alert         Don't send alerts to monitoring system"
  echo "  --help             Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 api-gateway shared-services"
  echo "  $0 health-service health-journey --force"
  echo "  $0 gamification-engine gamification --skip-db-rollback"
}

# =========================================================================
# Function: parse_arguments
# Description: Parse command line arguments
# =========================================================================
function parse_arguments {
  if [[ $# -lt 2 ]]; then
    log_error "Insufficient arguments provided."
    print_usage
    exit 1
  fi

  SERVICE_NAME=$1
  NAMESPACE=$2
  shift 2

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force)
        FORCE_ROLLBACK=true
        ;;
      --skip-db-rollback)
        SKIP_DB_ROLLBACK=true
        ;;
      --no-alert)
        ALERT_MONITORING=false
        ;;
      --help)
        print_usage
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        print_usage
        exit 1
        ;;
    esac
    shift
  done

  log_info "Rollback requested for service '$SERVICE_NAME' in namespace '$NAMESPACE'"
  if [[ "$FORCE_ROLLBACK" == "true" ]]; then
    log_warning "Force rollback enabled - verification steps will be skipped"
  fi
  if [[ "$SKIP_DB_ROLLBACK" == "true" ]]; then
    log_warning "Database rollback steps will be skipped"
  fi
}

# =========================================================================
# Function: detect_deployment_type
# Description: Detects the deployment type (canary, blue-green, standard)
# =========================================================================
function detect_deployment_type {
  log_info "Detecting deployment type for $SERVICE_NAME..."

  # Check for blue-green deployment (service with -blue or -green suffix)
  if kubectl get deployment -n "$NAMESPACE" "$SERVICE_NAME-blue" &>/dev/null || \
     kubectl get deployment -n "$NAMESPACE" "$SERVICE_NAME-green" &>/dev/null; then
    DEPLOYMENT_TYPE="blue-green"
    log_info "Detected blue-green deployment"
    return
  fi

  # Check for canary deployment (service with -canary suffix or canary labels)
  if kubectl get deployment -n "$NAMESPACE" "$SERVICE_NAME-canary" &>/dev/null || \
     [[ $(kubectl get deployment -n "$NAMESPACE" -l "app=$SERVICE_NAME,track=canary" -o name 2>/dev/null | wc -l) -gt 0 ]]; then
    DEPLOYMENT_TYPE="canary"
    log_info "Detected canary deployment"
    return
  fi

  # Default to standard deployment
  DEPLOYMENT_TYPE="standard"
  log_info "Detected standard deployment"
}

# =========================================================================
# Function: check_database_migration
# Description: Checks if the service has database migrations that need rollback
# =========================================================================
function check_database_migration {
  log_info "Checking if database rollback is needed for $SERVICE_NAME..."

  # Skip if explicitly requested
  if [[ "$SKIP_DB_ROLLBACK" == "true" ]]; then
    log_warning "Database rollback check skipped as requested"
    DB_ROLLBACK_NEEDED=false
    return
  fi

  # Check if this service has a database component
  case "$SERVICE_NAME" in
    health-service|care-service|plan-service|gamification-engine|auth-service)
      # These services have database components
      DB_ROLLBACK_NEEDED=true
      log_info "Service $SERVICE_NAME has database components that may need rollback"
      ;;
    *)
      # Other services don't have database components
      DB_ROLLBACK_NEEDED=false
      log_info "Service $SERVICE_NAME does not have database components that need rollback"
      ;;
  esac

  # If needed, check if there are recent migrations
  if [[ "$DB_ROLLBACK_NEEDED" == "true" ]]; then
    # Get the timestamp of the most recent deployment
    DEPLOY_TIMESTAMP=$(kubectl get deployment -n "$NAMESPACE" -l "app=$SERVICE_NAME" -o jsonpath='{.items[0].metadata.creationTimestamp}')
    
    # Check if there are migrations after the deployment timestamp
    RECENT_MIGRATIONS=$(db_check_recent_migrations "$SERVICE_NAME" "$DEPLOY_TIMESTAMP")
    
    if [[ -z "$RECENT_MIGRATIONS" ]]; then
      log_info "No recent database migrations found for $SERVICE_NAME"
      DB_ROLLBACK_NEEDED=false
    else
      log_warning "Recent database migrations found for $SERVICE_NAME, rollback may be needed"
      log_info "Recent migrations: $RECENT_MIGRATIONS"
    fi
  fi
}

# =========================================================================
# Function: perform_standard_rollback
# Description: Performs a standard Kubernetes deployment rollback
# =========================================================================
function perform_standard_rollback {
  log_info "Performing standard rollback for $SERVICE_NAME in namespace $NAMESPACE"

  # Get current revision before rollback
  CURRENT_REVISION=$(kubectl rollout history deployment "$SERVICE_NAME" -n "$NAMESPACE" | grep -A1 "REVISION" | tail -n1 | awk '{print $1}')
  log_info "Current revision is $CURRENT_REVISION"

  # Perform the rollback
  log_info "Rolling back deployment..."
  kubectl rollout undo deployment "$SERVICE_NAME" -n "$NAMESPACE"

  # Wait for rollback to complete
  log_info "Waiting for rollback to complete..."
  if ! kubectl rollout status deployment "$SERVICE_NAME" -n "$NAMESPACE" --timeout=300s; then
    log_error "Rollback failed to complete within timeout period"
    return 1
  fi

  # Get new revision after rollback
  NEW_REVISION=$(kubectl rollout history deployment "$SERVICE_NAME" -n "$NAMESPACE" | grep -A1 "REVISION" | tail -n1 | awk '{print $1}')
  log_info "Rolled back from revision $CURRENT_REVISION to $NEW_REVISION"

  # Verify the rollback
  if [[ "$FORCE_ROLLBACK" != "true" ]]; then
    log_info "Verifying rollback..."
    if ! verify_deployment_health "$SERVICE_NAME" "$NAMESPACE"; then
      log_error "Post-rollback verification failed"
      return 1
    fi
  fi

  log_success "Standard rollback completed successfully"
  return 0
}

# =========================================================================
# Function: perform_blue_green_rollback
# Description: Performs a blue-green deployment rollback by switching traffic
# =========================================================================
function perform_blue_green_rollback {
  log_info "Performing blue-green rollback for $SERVICE_NAME in namespace $NAMESPACE"

  # Determine active and inactive deployments
  if kubectl get service -n "$NAMESPACE" "$SERVICE_NAME" -o jsonpath='{.spec.selector.deployment}' 2>/dev/null | grep -q "blue"; then
    ACTIVE_DEPLOYMENT="$SERVICE_NAME-blue"
    INACTIVE_DEPLOYMENT="$SERVICE_NAME-green"
    NEW_COLOR="green"
  elif kubectl get service -n "$NAMESPACE" "$SERVICE_NAME" -o jsonpath='{.spec.selector.deployment}' 2>/dev/null | grep -q "green"; then
    ACTIVE_DEPLOYMENT="$SERVICE_NAME-green"
    INACTIVE_DEPLOYMENT="$SERVICE_NAME-blue"
    NEW_COLOR="blue"
  else
    log_error "Could not determine active deployment color"
    return 1
  fi

  log_info "Current active deployment: $ACTIVE_DEPLOYMENT"
  log_info "Target inactive deployment: $INACTIVE_DEPLOYMENT"

  # Check if inactive deployment exists and is ready
  if ! kubectl get deployment -n "$NAMESPACE" "$INACTIVE_DEPLOYMENT" &>/dev/null; then
    log_error "Inactive deployment $INACTIVE_DEPLOYMENT does not exist"
    return 1
  fi

  # Verify inactive deployment is healthy before switching
  if [[ "$FORCE_ROLLBACK" != "true" ]]; then
    log_info "Verifying health of inactive deployment $INACTIVE_DEPLOYMENT before switching traffic"
    if ! verify_deployment_health "$INACTIVE_DEPLOYMENT" "$NAMESPACE"; then
      log_error "Inactive deployment $INACTIVE_DEPLOYMENT is not healthy, cannot rollback"
      return 1
    fi
  fi

  # Switch traffic to inactive deployment
  log_info "Switching traffic from $ACTIVE_DEPLOYMENT to $INACTIVE_DEPLOYMENT"
  kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p "{\"spec\":{\"selector\":{\"deployment\":\"$NEW_COLOR\"}}}"

  # Verify service is now pointing to the correct deployment
  CURRENT_DEPLOYMENT=$(kubectl get service -n "$NAMESPACE" "$SERVICE_NAME" -o jsonpath='{.spec.selector.deployment}')
  if [[ "$CURRENT_DEPLOYMENT" != "$NEW_COLOR" ]]; then
    log_error "Failed to switch traffic to $NEW_COLOR deployment"
    return 1
  fi

  log_info "Traffic successfully switched to $INACTIVE_DEPLOYMENT"

  # Verify the rollback
  if [[ "$FORCE_ROLLBACK" != "true" ]]; then
    log_info "Verifying rollback..."
    if ! verify_service_health "$SERVICE_NAME" "$NAMESPACE"; then
      log_error "Post-rollback verification failed"
      # Emergency rollback to original deployment
      log_warning "Emergency rollback: switching traffic back to $ACTIVE_DEPLOYMENT"
      kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p "{\"spec\":{\"selector\":{\"deployment\":\"$(echo $ACTIVE_DEPLOYMENT | sed 's/.*-//g')\"}}}"
      return 1
    fi
  fi

  log_success "Blue-green rollback completed successfully"
  return 0
}

# =========================================================================
# Function: perform_canary_rollback
# Description: Performs a canary deployment rollback
# =========================================================================
function perform_canary_rollback {
  log_info "Performing canary rollback for $SERVICE_NAME in namespace $NAMESPACE"

  # Check if canary deployment exists
  CANARY_DEPLOYMENT="$SERVICE_NAME-canary"
  if ! kubectl get deployment -n "$NAMESPACE" "$CANARY_DEPLOYMENT" &>/dev/null; then
    # Look for deployment with canary label
    CANARY_DEPLOYMENT=$(kubectl get deployment -n "$NAMESPACE" -l "app=$SERVICE_NAME,track=canary" -o name 2>/dev/null | sed 's|deployment.apps/||')
    if [[ -z "$CANARY_DEPLOYMENT" ]]; then
      log_error "No canary deployment found for $SERVICE_NAME"
      return 1
    fi
  fi

  # Get stable deployment
  STABLE_DEPLOYMENT="$SERVICE_NAME"
  if ! kubectl get deployment -n "$NAMESPACE" "$STABLE_DEPLOYMENT" &>/dev/null; then
    STABLE_DEPLOYMENT=$(kubectl get deployment -n "$NAMESPACE" -l "app=$SERVICE_NAME,track=stable" -o name 2>/dev/null | sed 's|deployment.apps/||')
    if [[ -z "$STABLE_DEPLOYMENT" ]]; then
      log_error "No stable deployment found for $SERVICE_NAME"
      return 1
    fi
  fi

  log_info "Canary deployment: $CANARY_DEPLOYMENT"
  log_info "Stable deployment: $STABLE_DEPLOYMENT"

  # Check if we're using Istio for traffic splitting
  if kubectl get virtualservice -n "$NAMESPACE" "$SERVICE_NAME" &>/dev/null; then
    log_info "Detected Istio VirtualService for traffic management"
    
    # Update VirtualService to route 100% traffic to stable deployment
    log_info "Updating VirtualService to route all traffic to stable deployment"
    kubectl apply -f - <<EOF
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: $SERVICE_NAME
  namespace: $NAMESPACE
spec:
  hosts:
  - $SERVICE_NAME
  http:
  - route:
    - destination:
        host: $SERVICE_NAME
        subset: stable
      weight: 100
EOF
  else
    # We're using standard Kubernetes services with labels
    log_info "Using standard Kubernetes services for traffic management"
    
    # Update service selector to only target stable deployment
    log_info "Updating service selector to target only stable deployment"
    kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p '{"spec":{"selector":{"track":"stable"}}}'
  fi

  # Scale down canary deployment
  log_info "Scaling down canary deployment $CANARY_DEPLOYMENT"
  kubectl scale deployment "$CANARY_DEPLOYMENT" -n "$NAMESPACE" --replicas=0

  # Verify the rollback
  if [[ "$FORCE_ROLLBACK" != "true" ]]; then
    log_info "Verifying rollback..."
    if ! verify_service_health "$SERVICE_NAME" "$NAMESPACE"; then
      log_error "Post-rollback verification failed"
      return 1
    fi
  fi

  log_success "Canary rollback completed successfully"
  return 0
}

# =========================================================================
# Function: perform_database_rollback
# Description: Performs database migration rollback if needed
# =========================================================================
function perform_database_rollback {
  if [[ "$DB_ROLLBACK_NEEDED" != "true" ]]; then
    log_info "Database rollback not needed, skipping"
    return 0
  fi

  log_info "Performing database rollback for $SERVICE_NAME"

  # Get the previous migration version
  PREVIOUS_VERSION=$(db_get_previous_migration "$SERVICE_NAME")
  if [[ -z "$PREVIOUS_VERSION" ]]; then
    log_error "Could not determine previous migration version"
    return 1
  fi

  log_info "Rolling back database to version $PREVIOUS_VERSION"
  
  # Perform the database rollback
  if ! db_rollback_migration "$SERVICE_NAME" "$PREVIOUS_VERSION"; then
    log_error "Database rollback failed"
    return 1
  fi

  log_success "Database rollback completed successfully"
  return 0
}

# =========================================================================
# Function: verify_deployment_health
# Description: Verifies the health of a deployment after rollback
# =========================================================================
function verify_deployment_health {
  local deployment=$1
  local namespace=$2
  log_info "Verifying health of deployment $deployment in namespace $namespace"

  # Check if deployment is available
  local available=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.availableReplicas}')
  local desired=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}')
  
  if [[ -z "$available" || "$available" -lt "$desired" ]]; then
    log_error "Deployment $deployment is not fully available: $available/$desired replicas ready"
    return 1
  fi

  # Check if pods are running and ready
  local pods=$(kubectl get pods -n "$namespace" -l "app=$deployment" -o name)
  if [[ -z "$pods" ]]; then
    log_error "No pods found for deployment $deployment"
    return 1
  fi

  for pod in $pods; do
    local pod_name=$(echo "$pod" | sed 's|pod/||')
    local pod_status=$(kubectl get pod "$pod_name" -n "$namespace" -o jsonpath='{.status.phase}')
    local pod_ready=$(kubectl get pod "$pod_name" -n "$namespace" -o jsonpath='{.status.containerStatuses[0].ready}')
    
    if [[ "$pod_status" != "Running" || "$pod_ready" != "true" ]]; then
      log_error "Pod $pod_name is not healthy: status=$pod_status, ready=$pod_ready"
      return 1
    fi
  done

  log_info "Deployment $deployment is healthy"
  return 0
}

# =========================================================================
# Function: verify_service_health
# Description: Verifies the health of a service after rollback
# =========================================================================
function verify_service_health {
  local service=$1
  local namespace=$2
  log_info "Verifying health of service $service in namespace $namespace"

  # Check if service exists
  if ! kubectl get service "$service" -n "$namespace" &>/dev/null; then
    log_error "Service $service does not exist in namespace $namespace"
    return 1
  fi

  # Get the selector labels
  local selector=$(kubectl get service "$service" -n "$namespace" -o jsonpath='{.spec.selector}' | jq -r 'to_entries | map("\(.key)=\(.value)") | join(",")')
  if [[ -z "$selector" ]]; then
    log_error "Service $service has no selector labels"
    return 1
  fi

  # Check if there are endpoints
  local endpoints=$(kubectl get endpoints "$service" -n "$namespace" -o jsonpath='{.subsets[*].addresses}')
  if [[ -z "$endpoints" ]]; then
    log_error "Service $service has no endpoints"
    return 1
  fi

  # Check if the service has health checks defined
  local health_path="/health"
  case "$service" in
    api-gateway)
      health_path="/api/health"
      ;;
    auth-service)
      health_path="/auth/health"
      ;;
    health-service)
      health_path="/health/status"
      ;;
    care-service)
      health_path="/care/health"
      ;;
    plan-service)
      health_path="/plan/health"
      ;;
    gamification-engine)
      health_path="/gamification/health"
      ;;
    notification-service)
      health_path="/notifications/health"
      ;;
  esac

  # Try to call the health endpoint
  log_info "Checking health endpoint $health_path for service $service"
  local pod_name=$(kubectl get pods -n "$namespace" -l "$selector" -o jsonpath='{.items[0].metadata.name}')
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for service $service with selector $selector"
    return 1
  fi

  # Use kubectl exec to call the health endpoint
  local health_result=$(kubectl exec "$pod_name" -n "$namespace" -- curl -s -o /dev/null -w "%{http_code}" http://localhost:8080$health_path 2>/dev/null)
  if [[ "$health_result" != "200" ]]; then
    log_error "Health check failed for service $service: HTTP $health_result"
    return 1
  fi

  log_info "Service $service is healthy"
  return 0
}

# =========================================================================
# Function: send_alert
# Description: Sends alert to monitoring system about the rollback
# =========================================================================
function send_alert {
  local status=$1
  local message=$2

  if [[ "$ALERT_MONITORING" != "true" ]]; then
    log_info "Monitoring alerts disabled, skipping alert"
    return 0
  fi

  log_info "Sending alert to monitoring system: $message"
  monitoring_send_alert "$SERVICE_NAME" "$NAMESPACE" "$status" "$message"
}

# =========================================================================
# Function: perform_rollback
# Description: Main function to orchestrate the rollback process
# =========================================================================
function perform_rollback {
  # Start rollback process
  log_info "Starting rollback process for $SERVICE_NAME in namespace $NAMESPACE"
  send_alert "info" "Rollback initiated for $SERVICE_NAME in namespace $NAMESPACE"

  # Detect deployment type
  detect_deployment_type

  # Check if database rollback is needed
  check_database_migration

  # Perform the appropriate rollback based on deployment type
  local rollback_success=false
  case "$DEPLOYMENT_TYPE" in
    standard)
      if perform_standard_rollback; then
        rollback_success=true
      fi
      ;;
    blue-green)
      if perform_blue_green_rollback; then
        rollback_success=true
      fi
      ;;
    canary)
      if perform_canary_rollback; then
        rollback_success=true
      fi
      ;;
    *)
      log_error "Unknown deployment type: $DEPLOYMENT_TYPE"
      send_alert "error" "Rollback failed: Unknown deployment type $DEPLOYMENT_TYPE"
      exit 1
      ;;
  esac

  # If application rollback was successful and database rollback is needed, perform it
  if [[ "$rollback_success" == "true" && "$DB_ROLLBACK_NEEDED" == "true" && "$SKIP_DB_ROLLBACK" != "true" ]]; then
    if ! perform_database_rollback; then
      log_error "Database rollback failed"
      send_alert "error" "Application rollback succeeded but database rollback failed for $SERVICE_NAME"
      exit 1
    fi
  fi

  # Final status
  if [[ "$rollback_success" == "true" ]]; then
    log_success "Rollback completed successfully for $SERVICE_NAME in namespace $NAMESPACE"
    send_alert "success" "Rollback completed successfully for $SERVICE_NAME in namespace $NAMESPACE"
    return 0
  else
    log_error "Rollback failed for $SERVICE_NAME in namespace $NAMESPACE"
    send_alert "error" "Rollback failed for $SERVICE_NAME in namespace $NAMESPACE"
    return 1
  fi
}

# =========================================================================
# Main script execution
# =========================================================================

# Parse command line arguments
parse_arguments "$@"

# Perform the rollback
perform_rollback

# Exit with the appropriate status code
exit $?