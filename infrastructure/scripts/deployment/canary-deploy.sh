#!/bin/bash

# =========================================================================
# AUSTA SuperApp - Canary Deployment Script
# =========================================================================
# This script implements a canary deployment strategy for journey services,
# enabling progressive traffic shifting with configurable increments,
# automated health and metric validation between shifts, and automatic
# rollback capabilities if health checks fail.
#
# Usage:
#   ./canary-deploy.sh \
#     --service <service-name> \
#     --namespace <namespace> \
#     --new-version <image-tag> \
#     --increment <percentage> \
#     --max-surge <percentage> \
#     --validation-period <seconds> \
#     --max-errors <count> \
#     [--dry-run] \
#     [--skip-confirmation]
# =========================================================================

set -e

# =========================================================================
# Configuration and Constants
# =========================================================================
DEFAULT_INCREMENT=10
DEFAULT_MAX_SURGE=25
DEFAULT_VALIDATION_PERIOD=60
DEFAULT_MAX_ERRORS=0
DEFAULT_TIMEOUT=600

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

# Display usage information
function show_usage {
  echo -e "${CYAN}AUSTA SuperApp - Canary Deployment Script${NC}"
  echo ""
  echo "Usage:"
  echo "  $0 \\"
  echo "    --service <service-name> \\"
  echo "    --namespace <namespace> \\"
  echo "    --new-version <image-tag> \\"
  echo "    [--increment <percentage>] \\"
  echo "    [--max-surge <percentage>] \\"
  echo "    [--validation-period <seconds>] \\"
  echo "    [--max-errors <count>] \\"
  echo "    [--timeout <seconds>] \\"
  echo "    [--dry-run] \\"
  echo "    [--skip-confirmation]"
  echo ""
  echo "Options:"
  echo "  --service            Name of the service to deploy"
  echo "  --namespace          Kubernetes namespace (e.g., health-journey, care-journey, plan-journey)"
  echo "  --new-version        New container image tag to deploy"
  echo "  --increment          Traffic increment percentage (default: ${DEFAULT_INCREMENT}%)"
  echo "  --max-surge          Maximum additional pods during deployment (default: ${DEFAULT_MAX_SURGE}%)"
  echo "  --validation-period  Time in seconds to validate between increments (default: ${DEFAULT_VALIDATION_PERIOD}s)"
  echo "  --max-errors         Maximum allowed errors during validation (default: ${DEFAULT_MAX_ERRORS})"
  echo "  --timeout            Maximum deployment time in seconds (default: ${DEFAULT_TIMEOUT}s)"
  echo "  --dry-run            Simulate deployment without making changes"
  echo "  --skip-confirmation  Skip confirmation prompts"
  echo ""
  echo "Example:"
  echo "  $0 --service health-metrics --namespace health-journey --new-version 1.2.3-a1b2c3d --increment 20"
}

# Log messages with timestamp and level
function log {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      echo -e "${timestamp} ${GREEN}[INFO]${NC} $message"
      ;;
    "WARN")
      echo -e "${timestamp} ${YELLOW}[WARN]${NC} $message"
      ;;
    "ERROR")
      echo -e "${timestamp} ${RED}[ERROR]${NC} $message"
      ;;
    "DEBUG")
      if [[ "$DEBUG" == "true" ]]; then
        echo -e "${timestamp} ${BLUE}[DEBUG]${NC} $message"
      fi
      ;;
    *)
      echo -e "${timestamp} [UNKNOWN] $message"
      ;;
  esac
}

# Check if a command exists
function command_exists {
  command -v "$1" >/dev/null 2>&1
}

# Check if required tools are installed
function check_prerequisites {
  log "INFO" "Checking prerequisites..."
  
  local missing_tools=false
  
  for tool in kubectl jq curl; do
    if ! command_exists "$tool"; then
      log "ERROR" "Required tool not found: $tool"
      missing_tools=true
    fi
  done
  
  if [[ "$missing_tools" == "true" ]]; then
    log "ERROR" "Please install the missing tools and try again."
    exit 1
  fi
  
  # Verify kubectl can connect to the cluster
  if ! kubectl get nodes &>/dev/null; then
    log "ERROR" "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
  fi
  
  log "INFO" "Prerequisites check passed."
}

# Validate that the service exists in the namespace
function validate_service {
  log "INFO" "Validating service ${SERVICE} in namespace ${NAMESPACE}..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "[DRY RUN] Skipping service validation."
    return 0
  fi
  
  if ! kubectl get deployment "$SERVICE" -n "$NAMESPACE" &>/dev/null; then
    log "ERROR" "Service deployment '$SERVICE' not found in namespace '$NAMESPACE'."
    exit 1
  fi
  
  log "INFO" "Service validation passed."
}

# Get the current image version of the service
function get_current_version {
  log "DEBUG" "Getting current version for service ${SERVICE}..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    CURRENT_VERSION="current-version"
    log "INFO" "[DRY RUN] Using placeholder current version: ${CURRENT_VERSION}"
    return 0
  fi
  
  CURRENT_VERSION=$(kubectl get deployment "$SERVICE" -n "$NAMESPACE" -o json | \
                    jq -r '.spec.template.spec.containers[0].image' | \
                    awk -F ':' '{print $2}')
  
  if [[ -z "$CURRENT_VERSION" ]]; then
    log "ERROR" "Failed to get current version for service '$SERVICE'."
    exit 1
  fi
  
  log "INFO" "Current version: ${CURRENT_VERSION}"
}

# Create a canary deployment for the service
function create_canary_deployment {
  log "INFO" "Creating canary deployment for ${SERVICE} with version ${NEW_VERSION}..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "[DRY RUN] Would create canary deployment '${SERVICE}-canary' with image version '${NEW_VERSION}'."
    return 0
  fi
  
  # Get the current deployment manifest
  local deployment_json=$(kubectl get deployment "$SERVICE" -n "$NAMESPACE" -o json)
  
  # Create a modified version for the canary
  local canary_name="${SERVICE}-canary"
  local canary_json=$(echo "$deployment_json" | \
    jq --arg name "$canary_name" \
       --arg version "$NEW_VERSION" \
       --arg service "$SERVICE" \
       '.metadata.name = $name | 
        .metadata.labels.version = "canary" | 
        .spec.selector.matchLabels.version = "canary" | 
        .spec.template.metadata.labels.version = "canary" | 
        .spec.template.spec.containers[0].image = (.spec.template.spec.containers[0].image | split(":")[0] + ":" + $version) | 
        .spec.replicas = 1')
  
  # Apply the canary deployment
  echo "$canary_json" | kubectl apply -f - || {
    log "ERROR" "Failed to create canary deployment."
    exit 1
  }
  
  # Wait for canary deployment to be ready
  log "INFO" "Waiting for canary deployment to be ready..."
  kubectl rollout status deployment/"$canary_name" -n "$NAMESPACE" --timeout="${TIMEOUT}s" || {
    log "ERROR" "Canary deployment failed to become ready within timeout period."
    delete_canary_deployment
    exit 1
  }
  
  log "INFO" "Canary deployment created successfully."
}

# Update service to split traffic between stable and canary
function update_service_traffic_split {
  local stable_weight=$1
  local canary_weight=$2
  
  log "INFO" "Updating traffic split: ${stable_weight}% stable, ${canary_weight}% canary..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "[DRY RUN] Would update service to split traffic: ${stable_weight}% stable, ${canary_weight}% canary."
    return 0
  fi
  
  # Get the current service
  local service_json=$(kubectl get service "$SERVICE" -n "$NAMESPACE" -o json)
  
  # Check if we need to modify the service to support canary
  if ! echo "$service_json" | jq -e '.spec.selector.version' &>/dev/null; then
    # Service doesn't have version selector, need to update it
    log "INFO" "Updating service to support canary routing..."
    
    # Add version selector to the stable deployment
    kubectl patch deployment "$SERVICE" -n "$NAMESPACE" --type=json \
      -p="[{\"op\":\"add\",\"path\":\"/spec/template/metadata/labels/version\",\"value\":\"stable\"}]" || {
      log "ERROR" "Failed to update stable deployment labels."
      delete_canary_deployment
      exit 1
    }
    
    # Wait for stable deployment to be updated
    kubectl rollout status deployment/"$SERVICE" -n "$NAMESPACE" --timeout="${TIMEOUT}s" || {
      log "ERROR" "Stable deployment update failed within timeout period."
      delete_canary_deployment
      exit 1
    }
    
    # Update service with version selector
    local updated_service_json=$(echo "$service_json" | \
      jq '.spec.selector.version = "stable"')
    
    echo "$updated_service_json" | kubectl apply -f - || {
      log "ERROR" "Failed to update service with version selector."
      delete_canary_deployment
      exit 1
    }
  fi
  
  # Create or update the canary service for traffic splitting
  if ! kubectl get service "$SERVICE-canary" -n "$NAMESPACE" &>/dev/null; then
    log "INFO" "Creating canary service..."
    
    # Create a new service for canary traffic
    local canary_service_json=$(echo "$service_json" | \
      jq --arg name "${SERVICE}-canary" \
         '.metadata.name = $name | 
          .metadata.labels.role = "canary" | 
          .spec.selector.version = "canary"')
    
    echo "$canary_service_json" | kubectl apply -f - || {
      log "ERROR" "Failed to create canary service."
      delete_canary_deployment
      exit 1
    }
  fi
  
  # Update Istio VirtualService for traffic splitting if it exists
  if kubectl get virtualservice "$SERVICE" -n "$NAMESPACE" &>/dev/null; then
    log "INFO" "Updating Istio VirtualService for traffic splitting..."
    
    local vs_json=$(kubectl get virtualservice "$SERVICE" -n "$NAMESPACE" -o json)
    local updated_vs_json=$(echo "$vs_json" | \
      jq --arg stable "$stable_weight" \
         --arg canary "$canary_weight" \
         --arg service "$SERVICE" \
         '.spec.http[0].route = [
            {
              "destination": {
                "host": $service,
                "subset": "stable"
              },
              "weight": ($stable|tonumber)
            },
            {
              "destination": {
                "host": $service,
                "subset": "canary"
              },
              "weight": ($canary|tonumber)
            }
          ]')
    
    echo "$updated_vs_json" | kubectl apply -f - || {
      log "ERROR" "Failed to update Istio VirtualService."
      delete_canary_deployment
      exit 1
    }
  else
    # If no Istio, try to use native Kubernetes traffic splitting with labels and annotations
    log "INFO" "No Istio VirtualService found. Using native Kubernetes traffic splitting..."
    
    # Update service with traffic annotations
    local updated_service_json=$(echo "$service_json" | \
      jq --arg stable "$stable_weight" \
         --arg canary "$canary_weight" \
         '.metadata.annotations."traffic-split-stable" = $stable | 
          .metadata.annotations."traffic-split-canary" = $canary')
    
    echo "$updated_service_json" | kubectl apply -f - || {
      log "ERROR" "Failed to update service with traffic split annotations."
      delete_canary_deployment
      exit 1
    }
  fi
  
  log "INFO" "Traffic split updated successfully."
}

# Validate the canary deployment health
function validate_canary_health {
  log "INFO" "Validating canary health for ${VALIDATION_PERIOD} seconds..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "[DRY RUN] Would validate canary health for ${VALIDATION_PERIOD} seconds."
    return 0
  fi
  
  local start_time=$(date +%s)
  local end_time=$((start_time + VALIDATION_PERIOD))
  local error_count=0
  
  # Check if Prometheus is available for metric validation
  local prometheus_available=false
  if kubectl get service prometheus-server -n monitoring &>/dev/null; then
    prometheus_available=true
    log "INFO" "Prometheus detected, will include metric validation."
  else
    log "WARN" "Prometheus not detected, skipping metric validation."
  fi
  
  while [ $(date +%s) -lt $end_time ]; do
    # Check pod health
    local canary_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$SERVICE,version=canary" -o name)
    
    if [[ -z "$canary_pods" ]]; then
      log "ERROR" "No canary pods found. Deployment may have failed."
      error_count=$((error_count + 1))
    else
      for pod in $canary_pods; do
        local pod_status=$(kubectl get "$pod" -n "$NAMESPACE" -o jsonpath='{.status.phase}')
        local container_ready=$(kubectl get "$pod" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].ready}')
        
        if [[ "$pod_status" != "Running" || "$container_ready" != "true" ]]; then
          log "ERROR" "Canary pod $pod is not healthy: status=$pod_status, ready=$container_ready"
          error_count=$((error_count + 1))
        fi
      done
    fi
    
    # Check for pod restarts
    local restart_count=$(kubectl get pods -n "$NAMESPACE" -l "app=$SERVICE,version=canary" -o jsonpath='{.items[*].status.containerStatuses[0].restartCount}' | tr -s '[:space:]' '+' | bc)
    if [[ $restart_count -gt 0 ]]; then
      log "ERROR" "Canary pods have restarted $restart_count times."
      error_count=$((error_count + 1))
    fi
    
    # Check metrics if Prometheus is available
    if [[ "$prometheus_available" == "true" ]]; then
      # Get Prometheus service endpoint
      local prom_svc=$(kubectl get svc -n monitoring prometheus-server -o jsonpath='{.spec.clusterIP}')
      
      # Check error rate for canary version
      local error_rate_query="sum(rate(http_requests_total{service=\"${SERVICE}\",version=\"canary\",status_code=~\"5..\"}[1m])) / sum(rate(http_requests_total{service=\"${SERVICE}\",version=\"canary\"}[1m])) * 100"
      local error_rate=$(curl -s "http://${prom_svc}:9090/api/v1/query" --data-urlencode "query=${error_rate_query}" | jq -r '.data.result[0].value[1]' 2>/dev/null)
      
      if [[ ! -z "$error_rate" && "$error_rate" != "null" && $(echo "$error_rate > 5" | bc -l) -eq 1 ]]; then
        log "ERROR" "Canary error rate is too high: ${error_rate}%"
        error_count=$((error_count + 1))
      fi
      
      # Check latency for canary version
      local latency_query="histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"${SERVICE}\",version=\"canary\"}[1m])) by (le))"
      local latency=$(curl -s "http://${prom_svc}:9090/api/v1/query" --data-urlencode "query=${latency_query}" | jq -r '.data.result[0].value[1]' 2>/dev/null)
      
      if [[ ! -z "$latency" && "$latency" != "null" ]]; then
        # Get stable version latency for comparison
        local stable_latency_query="histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"${SERVICE}\",version=\"stable\"}[1m])) by (le))"
        local stable_latency=$(curl -s "http://${prom_svc}:9090/api/v1/query" --data-urlencode "query=${stable_latency_query}" | jq -r '.data.result[0].value[1]' 2>/dev/null)
        
        if [[ ! -z "$stable_latency" && "$stable_latency" != "null" && $(echo "$latency > $stable_latency * 1.5" | bc -l) -eq 1 ]]; then
          log "ERROR" "Canary latency is too high: ${latency}s (stable: ${stable_latency}s)"
          error_count=$((error_count + 1))
        fi
      fi
    fi
    
    # Check if we've exceeded the maximum allowed errors
    if [[ $error_count -gt $MAX_ERRORS ]]; then
      log "ERROR" "Validation failed: error count ($error_count) exceeds maximum allowed ($MAX_ERRORS)."
      return 1
    fi
    
    # Wait before next check
    sleep 5
  done
  
  if [[ $error_count -gt $MAX_ERRORS ]]; then
    log "ERROR" "Validation failed: error count ($error_count) exceeds maximum allowed ($MAX_ERRORS)."
    return 1
  fi
  
  log "INFO" "Canary validation successful."
  return 0
}

# Promote canary to stable (full deployment)
function promote_canary {
  log "INFO" "Promoting canary to stable..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "[DRY RUN] Would promote canary to stable by updating the main deployment image to ${NEW_VERSION}."
    return 0
  fi
  
  # Update the main deployment with the new version
  kubectl set image deployment/"$SERVICE" -n "$NAMESPACE" "$SERVICE=${SERVICE}:${NEW_VERSION}" || {
    log "ERROR" "Failed to update main deployment image."
    return 1
  }
  
  # Update version label
  kubectl patch deployment "$SERVICE" -n "$NAMESPACE" --type=json \
    -p="[{\"op\":\"replace\",\"path\":\"/spec/template/metadata/labels/version\",\"value\":\"stable\"}]" || {
    log "ERROR" "Failed to update stable deployment version label."
    return 1
  }
  
  # Wait for the main deployment to be ready
  log "INFO" "Waiting for main deployment to be updated..."
  kubectl rollout status deployment/"$SERVICE" -n "$NAMESPACE" --timeout="${TIMEOUT}s" || {
    log "ERROR" "Main deployment update failed within timeout period."
    return 1
  }
  
  # Reset traffic to 100% stable
  update_service_traffic_split 100 0
  
  log "INFO" "Canary promotion completed successfully."
  return 0
}

# Delete the canary deployment and service
function delete_canary_deployment {
  log "INFO" "Cleaning up canary resources..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "[DRY RUN] Would delete canary deployment and service."
    return 0
  fi
  
  # Delete canary deployment
  kubectl delete deployment "${SERVICE}-canary" -n "$NAMESPACE" --ignore-not-found || {
    log "WARN" "Failed to delete canary deployment."
  }
  
  # Delete canary service if it exists
  kubectl delete service "${SERVICE}-canary" -n "$NAMESPACE" --ignore-not-found || {
    log "WARN" "Failed to delete canary service."
  }
  
  # Reset traffic to 100% stable if Istio VirtualService exists
  if kubectl get virtualservice "$SERVICE" -n "$NAMESPACE" &>/dev/null; then
    local vs_json=$(kubectl get virtualservice "$SERVICE" -n "$NAMESPACE" -o json)
    local updated_vs_json=$(echo "$vs_json" | \
      jq --arg service "$SERVICE" \
         '.spec.http[0].route = [
            {
              "destination": {
                "host": $service,
                "subset": "stable"
              },
              "weight": 100
            }
          ]')
    
    echo "$updated_vs_json" | kubectl apply -f - || {
      log "WARN" "Failed to reset Istio VirtualService."
    }
  fi
  
  log "INFO" "Canary resources cleaned up."
}

# Rollback deployment to the previous version
function rollback_deployment {
  log "ERROR" "Rolling back deployment to previous version ${CURRENT_VERSION}..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "[DRY RUN] Would roll back to previous version ${CURRENT_VERSION}."
    return 0
  fi
  
  # Reset traffic to 100% stable
  update_service_traffic_split 100 0
  
  # Delete canary resources
  delete_canary_deployment
  
  log "INFO" "Rollback completed."
}

# Execute the canary deployment process
function execute_canary_deployment {
  log "INFO" "Starting canary deployment process for ${SERVICE} in namespace ${NAMESPACE}..."
  log "INFO" "New version: ${NEW_VERSION}, Current version: ${CURRENT_VERSION}"
  log "INFO" "Traffic increment: ${INCREMENT}%, Validation period: ${VALIDATION_PERIOD}s"
  
  # Create the canary deployment
  create_canary_deployment
  
  # Progressive traffic shifting
  local current_weight=0
  while [ $current_weight -lt 100 ]; do
    # Calculate next weight, ensuring we don't exceed 100%
    local next_weight=$((current_weight + INCREMENT))
    if [ $next_weight -gt 100 ]; then
      next_weight=100
    fi
    
    # Update traffic split
    local stable_weight=$((100 - next_weight))
    update_service_traffic_split $stable_weight $next_weight
    
    # Validate canary health
    if ! validate_canary_health; then
      log "ERROR" "Canary validation failed at ${next_weight}% traffic. Rolling back."
      rollback_deployment
      exit 1
    fi
    
    log "INFO" "Successfully validated canary at ${next_weight}% traffic."
    current_weight=$next_weight
    
    # If we've reached 100%, we're done with incremental shifting
    if [ $current_weight -ge 100 ]; then
      break
    fi
  done
  
  # Promote canary to stable
  if ! promote_canary; then
    log "ERROR" "Failed to promote canary to stable. Rolling back."
    rollback_deployment
    exit 1
  fi
  
  # Clean up canary resources
  delete_canary_deployment
  
  log "INFO" "Canary deployment completed successfully."
}

# =========================================================================
# Main Script
# =========================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --service)
      SERVICE="$2"
      shift
      shift
      ;;
    --namespace)
      NAMESPACE="$2"
      shift
      shift
      ;;
    --new-version)
      NEW_VERSION="$2"
      shift
      shift
      ;;
    --increment)
      INCREMENT="$2"
      shift
      shift
      ;;
    --max-surge)
      MAX_SURGE="$2"
      shift
      shift
      ;;
    --validation-period)
      VALIDATION_PERIOD="$2"
      shift
      shift
      ;;
    --max-errors)
      MAX_ERRORS="$2"
      shift
      shift
      ;;
    --timeout)
      TIMEOUT="$2"
      shift
      shift
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    --skip-confirmation)
      SKIP_CONFIRMATION="true"
      shift
      ;;
    --debug)
      DEBUG="true"
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      log "ERROR" "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$SERVICE" || -z "$NAMESPACE" || -z "$NEW_VERSION" ]]; then
  log "ERROR" "Missing required parameters."
  show_usage
  exit 1
fi

# Set default values if not provided
INCREMENT=${INCREMENT:-$DEFAULT_INCREMENT}
MAX_SURGE=${MAX_SURGE:-$DEFAULT_MAX_SURGE}
VALIDATION_PERIOD=${VALIDATION_PERIOD:-$DEFAULT_VALIDATION_PERIOD}
MAX_ERRORS=${MAX_ERRORS:-$DEFAULT_MAX_ERRORS}
TIMEOUT=${TIMEOUT:-$DEFAULT_TIMEOUT}
DRY_RUN=${DRY_RUN:-false}
SKIP_CONFIRMATION=${SKIP_CONFIRMATION:-false}
DEBUG=${DEBUG:-false}

# Check prerequisites
check_prerequisites

# Validate service exists
validate_service

# Get current version
get_current_version

# Display deployment plan
echo -e "\n${CYAN}=== Canary Deployment Plan ===${NC}"
echo -e "Service:           ${MAGENTA}${SERVICE}${NC}"
echo -e "Namespace:         ${MAGENTA}${NAMESPACE}${NC}"
echo -e "Current Version:   ${MAGENTA}${CURRENT_VERSION}${NC}"
echo -e "New Version:       ${MAGENTA}${NEW_VERSION}${NC}"
echo -e "Traffic Increment: ${MAGENTA}${INCREMENT}%${NC}"
echo -e "Validation Period: ${MAGENTA}${VALIDATION_PERIOD}s${NC}"
echo -e "Max Errors:        ${MAGENTA}${MAX_ERRORS}${NC}"
echo -e "Timeout:           ${MAGENTA}${TIMEOUT}s${NC}"
echo -e "Dry Run:           ${MAGENTA}${DRY_RUN}${NC}"
echo -e "${CYAN}=============================${NC}\n"

# Confirm deployment if not skipped
if [[ "$SKIP_CONFIRMATION" != "true" ]]; then
  read -p "Proceed with deployment? (y/n): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log "INFO" "Deployment cancelled by user."
    exit 0
  fi
fi

# Execute canary deployment
execute_canary_deployment

exit 0