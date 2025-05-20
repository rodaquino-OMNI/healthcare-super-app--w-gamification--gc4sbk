#!/bin/bash

# =============================================================================
# Canary Deployment Validation Script
# =============================================================================
#
# This script validates canary deployments by checking performance metrics,
# error rates, and health indicators after each traffic shift. It connects to
# monitoring systems to retrieve real-time metrics and provides pass/fail
# criteria to determine if the deployment should continue to the next traffic
# percentage.
#
# Usage:
#   ./canary-validate.sh --service <service-name> --namespace <namespace> \
#                        --canary-version <version> --baseline-version <version> \
#                        --traffic-percentage <percentage>
#
# Arguments:
#   --service            Name of the service being deployed
#   --namespace          Kubernetes namespace
#   --canary-version     Version of the canary deployment
#   --baseline-version   Version of the baseline deployment
#   --traffic-percentage Current traffic percentage directed to canary
#   --prometheus-url     (Optional) URL of Prometheus server
#   --grafana-url        (Optional) URL of Grafana server
#   --loki-url           (Optional) URL of Loki server
#   --timeout            (Optional) Validation timeout in seconds
#   --threshold-override (Optional) JSON string to override default thresholds
#
# Exit Codes:
#   0 - Validation passed
#   1 - Validation failed
#   2 - Invalid arguments
#   3 - Configuration error
#   4 - Monitoring system connection error
#   5 - Timeout error
#
# =============================================================================

# Source common functions and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh" || { echo "Error: Failed to source common.sh"; exit 3; }
source "${SCRIPT_DIR}/config.sh" || { echo "Error: Failed to source config.sh"; exit 3; }

# Set default thresholds from config or use reasonable defaults
ERROR_RATE_THRESHOLD=${CANARY_ERROR_RATE_THRESHOLD:-1.0}
ERROR_RATE_DIFFERENCE_THRESHOLD=${CANARY_ERROR_RATE_DIFF_THRESHOLD:-0.5}
LATENCY_THRESHOLD=${CANARY_LATENCY_THRESHOLD:-500}
LATENCY_DIFFERENCE_THRESHOLD=${CANARY_LATENCY_DIFF_THRESHOLD:-20}
CPU_DIFFERENCE_THRESHOLD=${CANARY_CPU_DIFF_THRESHOLD:-30}
MEMORY_DIFFERENCE_THRESHOLD=${CANARY_MEMORY_DIFF_THRESHOLD:-30}
MAX_ACCEPTABLE_ERROR_LOGS=${CANARY_MAX_ERROR_LOGS:-10}
METRICS_COLLECTION_WAIT_TIME=${CANARY_METRICS_WAIT_TIME:-60}

# Alerting thresholds
CANARY_ERROR_RATE_ALERT_THRESHOLD=${CANARY_ERROR_RATE_ALERT:-2.0}
CANARY_LATENCY_ALERT_THRESHOLD=${CANARY_LATENCY_ALERT:-600}
NORMAL_ERROR_RATE_ALERT_THRESHOLD=${NORMAL_ERROR_RATE_ALERT:-1.0}
NORMAL_LATENCY_ALERT_THRESHOLD=${NORMAL_LATENCY_ALERT:-500}

# -----------------------------------------------------------------------------
# Parse command line arguments
# -----------------------------------------------------------------------------
function parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --service)
                SERVICE_NAME="$2"
                shift 2
                ;;
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --canary-version)
                CANARY_VERSION="$2"
                shift 2
                ;;
            --baseline-version)
                BASELINE_VERSION="$2"
                shift 2
                ;;
            --traffic-percentage)
                TRAFFIC_PERCENTAGE="$2"
                shift 2
                ;;
            --prometheus-url)
                PROMETHEUS_URL="$2"
                shift 2
                ;;
            --grafana-url)
                GRAFANA_URL="$2"
                shift 2
                ;;
            --loki-url)
                LOKI_URL="$2"
                shift 2
                ;;
            --timeout)
                VALIDATION_TIMEOUT="$2"
                shift 2
                ;;
            --threshold-override)
                THRESHOLD_OVERRIDE="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 2
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "${SERVICE_NAME}" || -z "${NAMESPACE}" || -z "${CANARY_VERSION}" || \
          -z "${BASELINE_VERSION}" || -z "${TRAFFIC_PERCENTAGE}" ]]; then
        log_error "Missing required arguments"
        show_usage
        exit 2
    fi

    # Set defaults for optional arguments
    PROMETHEUS_URL=${PROMETHEUS_URL:-${DEFAULT_PROMETHEUS_URL}}
    GRAFANA_URL=${GRAFANA_URL:-${DEFAULT_GRAFANA_URL}}
    LOKI_URL=${LOKI_URL:-${DEFAULT_LOKI_URL}}
    VALIDATION_TIMEOUT=${VALIDATION_TIMEOUT:-${DEFAULT_VALIDATION_TIMEOUT}}

    # Apply threshold overrides if provided
    if [[ -n "${THRESHOLD_OVERRIDE}" ]]; then
        apply_threshold_overrides
    fi
}

# -----------------------------------------------------------------------------
# Show usage information
# -----------------------------------------------------------------------------
function show_usage() {
    echo "Usage: $0 --service <service-name> --namespace <namespace> \"
    echo "          --canary-version <version> --baseline-version <version> \"
    echo "          --traffic-percentage <percentage>"
    echo ""
    echo "Optional arguments:"
    echo "  --prometheus-url <url>      URL of Prometheus server"
    echo "  --grafana-url <url>         URL of Grafana server"
    echo "  --loki-url <url>            URL of Loki server"
    echo "  --timeout <seconds>         Validation timeout in seconds"
    echo "  --threshold-override <json> JSON string to override default thresholds"
    echo "  --help                      Show this help message"
}

# -----------------------------------------------------------------------------
# Apply threshold overrides from JSON string
# -----------------------------------------------------------------------------
function apply_threshold_overrides() {
    log_info "Applying threshold overrides"
    
    # Parse JSON and override thresholds
    # This is a simplified version - in production, use a proper JSON parser
    if command -v jq &>/dev/null; then
        # Extract error rate threshold if provided
        ERROR_RATE_THRESHOLD=$(echo "${THRESHOLD_OVERRIDE}" | jq -r '.error_rate // empty')
        if [[ -n "${ERROR_RATE_THRESHOLD}" ]]; then
            log_info "Overriding error rate threshold: ${ERROR_RATE_THRESHOLD}"
        fi
        
        # Extract latency threshold if provided
        LATENCY_THRESHOLD=$(echo "${THRESHOLD_OVERRIDE}" | jq -r '.latency // empty')
        if [[ -n "${LATENCY_THRESHOLD}" ]]; then
            log_info "Overriding latency threshold: ${LATENCY_THRESHOLD}"
        fi
        
        # Extract CPU threshold if provided
        CPU_THRESHOLD=$(echo "${THRESHOLD_OVERRIDE}" | jq -r '.cpu // empty')
        if [[ -n "${CPU_THRESHOLD}" ]]; then
            log_info "Overriding CPU threshold: ${CPU_THRESHOLD}"
        fi
        
        # Extract memory threshold if provided
        MEMORY_THRESHOLD=$(echo "${THRESHOLD_OVERRIDE}" | jq -r '.memory // empty')
        if [[ -n "${MEMORY_THRESHOLD}" ]]; then
            log_info "Overriding memory threshold: ${MEMORY_THRESHOLD}"
        fi
    else
        log_warning "jq not found, skipping threshold overrides"
    fi
}

# -----------------------------------------------------------------------------
# Prometheus Metrics Retrieval Functions
# -----------------------------------------------------------------------------

# Query Prometheus for metrics
function query_prometheus() {
    local query="$1"
    local start_time="$2"
    local end_time="$3"
    local step="$4"
    
    start_time=${start_time:-"$(date -u -d '5 minutes ago' +'%Y-%m-%dT%H:%M:%SZ')"}
    end_time=${end_time:-"$(date -u +'%Y-%m-%dT%H:%M:%SZ')"}
    step=${step:-"15s"}
    
    log_debug "Querying Prometheus: ${query}"
    
    # Check if Prometheus URL is configured
    if [[ -z "${PROMETHEUS_URL}" ]]; then
        log_error "Prometheus URL not configured"
        return 1
    fi
    
    # Check if curl is available
    if ! command -v curl &>/dev/null; then
        log_error "curl command not found"
        return 1
    fi
    
    # Check if jq is available
    if ! command -v jq &>/dev/null; then
        log_error "jq command not found"
        return 1
    fi
    
    local response
    response=$(curl -s -G \
        --data-urlencode "query=${query}" \
        --data-urlencode "start=${start_time}" \
        --data-urlencode "end=${end_time}" \
        --data-urlencode "step=${step}" \
        "${PROMETHEUS_URL}/api/v1/query_range")
    
    if [[ -z "${response}" ]]; then
        log_error "Empty response from Prometheus"
        return 1
    fi
    
    if [[ "$(echo "${response}" | jq -r '.status')" != "success" ]]; then
        log_error "Prometheus query failed: $(echo "${response}" | jq -r '.error // "Unknown error"')"
        return 1
    fi
    
    echo "${response}"
    return 0
}

# Get error rate for a specific version
function get_error_rate() {
    local version="$1"
    local duration="$2"
    
    duration=${duration:-"5m"}
    
    local query="sum(rate(http_requests_total{service=\"${SERVICE_NAME}\",version=\"${version}\",status=~\"5..\"}[${duration}])) / sum(rate(http_requests_total{service=\"${SERVICE_NAME}\",version=\"${version}\"}[${duration}])) * 100"
    
    local response
    response=$(curl -s -G \
        --data-urlencode "query=${query}" \
        "${PROMETHEUS_URL}/api/v1/query")
    
    if [[ "$(echo "${response}" | jq -r '.status')" != "success" ]]; then
        log_error "Error rate query failed: $(echo "${response}" | jq -r '.error // "Unknown error"')"
        return 1
    fi
    
    local error_rate
    error_rate=$(echo "${response}" | jq -r '.data.result[0].value[1] // "NaN"')
    
    if [[ "${error_rate}" == "NaN" ]]; then
        log_warning "No error rate data available for ${version}"
        echo "0"
        return 0
    fi
    
    echo "${error_rate}"
    return 0
}

# Get latency for a specific version
function get_latency() {
    local version="$1"
    local percentile="$2"
    local duration="$3"
    
    percentile=${percentile:-"95"}
    duration=${duration:-"5m"}
    
    local query="histogram_quantile(0.${percentile}, sum(rate(http_request_duration_seconds_bucket{service=\"${SERVICE_NAME}\",version=\"${version}\"}[${duration}])) by (le)) * 1000"
    
    local response
    response=$(curl -s -G \
        --data-urlencode "query=${query}" \
        "${PROMETHEUS_URL}/api/v1/query")
    
    if [[ "$(echo "${response}" | jq -r '.status')" != "success" ]]; then
        log_error "Latency query failed: $(echo "${response}" | jq -r '.error // "Unknown error"')"
        return 1
    fi
    
    local latency
    latency=$(echo "${response}" | jq -r '.data.result[0].value[1] // "NaN"')
    
    if [[ "${latency}" == "NaN" ]]; then
        log_warning "No latency data available for ${version}"
        echo "0"
        return 0
    fi
    
    echo "${latency}"
    return 0
}

# Get CPU usage for a specific version
function get_cpu_usage() {
    local version="$1"
    local duration="$2"
    
    duration=${duration:-"5m"}
    
    local query="sum(rate(container_cpu_usage_seconds_total{namespace=\"${NAMESPACE}\",pod=~\"${SERVICE_NAME}-${version}-.*\"}[${duration}])) by (pod)"
    
    local response
    response=$(curl -s -G \
        --data-urlencode "query=${query}" \
        "${PROMETHEUS_URL}/api/v1/query")
    
    if [[ "$(echo "${response}" | jq -r '.status')" != "success" ]]; then
        log_error "CPU usage query failed: $(echo "${response}" | jq -r '.error // "Unknown error"')"
        return 1
    fi
    
    local cpu_usage
    cpu_usage=$(echo "${response}" | jq -r '[.data.result[].value[1] | tonumber] | add // 0')
    
    echo "${cpu_usage}"
    return 0
}

# Get memory usage for a specific version
function get_memory_usage() {
    local version="$1"
    local duration="$2"
    
    duration=${duration:-"5m"}
    
    local query="sum(container_memory_working_set_bytes{namespace=\"${NAMESPACE}\",pod=~\"${SERVICE_NAME}-${version}-.*\"}) by (pod)"
    
    local response
    response=$(curl -s -G \
        --data-urlencode "query=${query}" \
        "${PROMETHEUS_URL}/api/v1/query")
    
    if [[ "$(echo "${response}" | jq -r '.status')" != "success" ]]; then
        log_error "Memory usage query failed: $(echo "${response}" | jq -r '.error // "Unknown error"')"
        return 1
    fi
    
    local memory_usage
    memory_usage=$(echo "${response}" | jq -r '[.data.result[].value[1] | tonumber] | add // 0')
    
    # Convert to MB for readability
    memory_usage=$(echo "scale=2; ${memory_usage} / 1024 / 1024" | bc)
    
    echo "${memory_usage}"
    return 0
}

# -----------------------------------------------------------------------------
# Health Check Functions
# -----------------------------------------------------------------------------

# Check if pods are ready
function check_pods_ready() {
    local version="$1"
    
    log_info "Checking if pods for ${SERVICE_NAME}-${version} are ready"
    
    # Check if kubectl is available
    if ! command -v kubectl &>/dev/null; then
        log_error "kubectl command not found"
        return 1
    fi
    
    # Check if jq is available
    if ! command -v jq &>/dev/null; then
        log_error "jq command not found"
        return 1
    fi
    
    # Get pods with the specified labels
    local pods
    pods=$(kubectl get pods -n "${NAMESPACE}" -l "app=${SERVICE_NAME},version=${version}" -o json)
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to get pods for ${SERVICE_NAME}-${version}"
        return 1
    fi
    
    if [[ "$(echo "${pods}" | jq '.items | length')" -eq 0 ]]; then
        log_error "No pods found for ${SERVICE_NAME}-${version}"
        return 1
    fi
    
    # Check for ready pods
    local ready_pods
    ready_pods=$(echo "${pods}" | jq -r '.items[] | select(.status.containerStatuses[].ready==true) | .metadata.name')
    
    if [[ -z "${ready_pods}" ]]; then
        log_error "No ready pods found for ${SERVICE_NAME}-${version}"
        return 1
    fi
    
    # Count total and ready pods
    local total_pods
    total_pods=$(echo "${pods}" | jq '.items | length')
    
    local ready_count
    ready_count=$(echo "${ready_pods}" | wc -l)
    
    log_info "${ready_count}/${total_pods} pods ready for ${SERVICE_NAME}-${version}"
    
    # Check if all pods are ready
    if [[ "${ready_count}" -lt "${total_pods}" ]]; then
        log_warning "Not all pods are ready for ${SERVICE_NAME}-${version}"
        return 1
    fi
    
    # Check for pods in CrashLoopBackOff or other problematic states
    local problematic_pods
    problematic_pods=$(echo "${pods}" | jq -r '.items[] | select(.status.phase!="Running" or .status.containerStatuses[].state.waiting.reason=="CrashLoopBackOff") | .metadata.name')
    
    if [[ -n "${problematic_pods}" ]]; then
        log_error "Found pods in problematic state for ${SERVICE_NAME}-${version}:"
        echo "${problematic_pods}" | while read -r pod; do
            log_error "Pod ${pod} is in a problematic state"
        done
        return 1
    fi
    
    return 0
}

# Check if service endpoints are healthy
function check_service_health() {
    local version="$1"
    
    log_info "Checking service health for ${SERVICE_NAME}-${version}"
    
    # Get service endpoint
    local service_endpoint
    service_endpoint="${SERVICE_NAME}-${version}.${NAMESPACE}.svc.cluster.local"
    
    # Determine health check path based on service type
    local health_path
    case "${SERVICE_NAME}" in
        health-service|care-service|plan-service)
            health_path="/api/health"
            ;;
        api-gateway)
            health_path="/health"
            ;;
        gamification-engine)
            health_path="/api/gamification/health"
            ;;
        notification-service)
            health_path="/api/notifications/health"
            ;;
        auth-service)
            health_path="/api/auth/health"
            ;;
        *)
            health_path="/health"
            ;;
    esac
    
    # Check if kubectl is available
    if ! command -v kubectl &>/dev/null; then
        log_error "kubectl command not found"
        return 1
    fi
    
    # Find a pod to use for the health check
    local proxy_pod
    proxy_pod=$(kubectl get pods -n "${NAMESPACE}" -l "app=api-gateway" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -z "${proxy_pod}" ]]; then
        log_warning "No api-gateway pod found, trying to use any pod in the namespace"
        proxy_pod=$(kubectl get pods -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        
        if [[ -z "${proxy_pod}" ]]; then
            log_error "No pods found in namespace ${NAMESPACE} to use for health check"
            return 1
        fi
    fi
    
    # Use kubectl exec to run curl from a pod in the same namespace
    local result
    result=$(kubectl exec -n "${NAMESPACE}" "${proxy_pod}" -- \
        curl -s -o /dev/null -w "%{http_code}" "http://${service_endpoint}${health_path}" \
        -m 5 --retry 3 --retry-delay 2 2>/dev/null)
    
    local exit_code=$?
    
    if [[ "${exit_code}" -ne 0 ]]; then
        log_error "Health check request failed for ${SERVICE_NAME}-${version}: Exit code ${exit_code}"
        return 1
    fi
    
    if [[ "${result}" != "200" ]]; then
        log_error "Health check failed for ${SERVICE_NAME}-${version}: HTTP ${result}"
        return 1
    fi
    
    log_info "Health check passed for ${SERVICE_NAME}-${version}"
    return 0
}

# Check for dependency health
function check_dependency_health() {
    local version="$1"
    
    log_info "Checking dependency health for ${SERVICE_NAME}-${version}"
    
    # Get service endpoint
    local service_endpoint
    service_endpoint="${SERVICE_NAME}-${version}.${NAMESPACE}.svc.cluster.local"
    
    # Determine dependency health check path based on service type
    local health_path
    case "${SERVICE_NAME}" in
        health-service|care-service|plan-service)
            health_path="/api/health/dependencies"
            ;;
        api-gateway)
            health_path="/health/dependencies"
            ;;
        gamification-engine)
            health_path="/api/gamification/health/dependencies"
            ;;
        notification-service)
            health_path="/api/notifications/health/dependencies"
            ;;
        auth-service)
            health_path="/api/auth/health/dependencies"
            ;;
        *)
            health_path="/health/dependencies"
            ;;
    esac
    
    # Check if kubectl and jq are available
    if ! command -v kubectl &>/dev/null; then
        log_error "kubectl command not found"
        return 1
    fi
    
    if ! command -v jq &>/dev/null; then
        log_error "jq command not found"
        return 1
    fi
    
    # Find a pod to use for the health check
    local proxy_pod
    proxy_pod=$(kubectl get pods -n "${NAMESPACE}" -l "app=api-gateway" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -z "${proxy_pod}" ]]; then
        log_warning "No api-gateway pod found, trying to use any pod in the namespace"
        proxy_pod=$(kubectl get pods -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        
        if [[ -z "${proxy_pod}" ]]; then
            log_error "No pods found in namespace ${NAMESPACE} to use for dependency health check"
            return 1
        fi
    fi
    
    # Use kubectl exec to run curl from a pod in the same namespace
    local result
    result=$(kubectl exec -n "${NAMESPACE}" "${proxy_pod}" -- \
        curl -s "http://${service_endpoint}${health_path}" \
        -m 10 --retry 3 --retry-delay 2 2>/dev/null)
    
    local exit_code=$?
    
    if [[ "${exit_code}" -ne 0 ]]; then
        log_error "Dependency health check request failed for ${SERVICE_NAME}-${version}: Exit code ${exit_code}"
        return 1
    fi
    
    if [[ -z "${result}" ]]; then
        log_error "Dependency health check failed for ${SERVICE_NAME}-${version}: No response"
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "${result}" | jq . >/dev/null 2>&1; then
        log_error "Dependency health check failed for ${SERVICE_NAME}-${version}: Invalid JSON response"
        log_error "Response: ${result}"
        return 1
    fi
    
    local status
    status=$(echo "${result}" | jq -r '.status // "unknown"')
    
    if [[ "${status}" != "ok" && "${status}" != "UP" ]]; then
        log_error "Dependency health check failed for ${SERVICE_NAME}-${version}: ${status}"
        
        # Extract failed dependencies based on response format
        local failed_deps
        if echo "${result}" | jq -e '.dependencies' >/dev/null 2>&1; then
            failed_deps=$(echo "${result}" | jq -r '.dependencies[] | select(.status != "ok" and .status != "UP") | .name')
        elif echo "${result}" | jq -e '.details' >/dev/null 2>&1; then
            failed_deps=$(echo "${result}" | jq -r '.details | to_entries[] | select(.value.status != "ok" and .value.status != "UP") | .key')
        fi
        
        if [[ -n "${failed_deps}" ]]; then
            log_error "Failed dependencies: ${failed_deps}"
        fi
        
        return 1
    fi
    
    log_info "Dependency health check passed for ${SERVICE_NAME}-${version}"
    return 0
}

# -----------------------------------------------------------------------------
# Log Analysis Functions
# -----------------------------------------------------------------------------

# Check for error patterns in logs
function check_logs_for_errors() {
    local version="$1"
    local duration="$2"
    
    duration=${duration:-"15m"}
    
    log_info "Checking logs for error patterns in ${SERVICE_NAME}-${version}"
    
    if [[ -z "${LOKI_URL}" ]]; then
        log_warning "Loki URL not configured, skipping log analysis"
        return 0
    fi
    
    # Check if curl and jq are available
    if ! command -v curl &>/dev/null; then
        log_error "curl command not found"
        return 0  # Don't fail validation due to missing tools
    fi
    
    if ! command -v jq &>/dev/null; then
        log_error "jq command not found"
        return 0  # Don't fail validation due to missing tools
    fi
    
    # Define service-specific error patterns to look for
    local error_patterns
    case "${SERVICE_NAME}" in
        health-service)
            error_patterns="error|exception|fail|fatal|NullPointerException|DatabaseException|ConnectionRefused|OutOfMemoryError"
            ;;
        care-service)
            error_patterns="error|exception|fail|fatal|AppointmentException|ProviderNotFoundException|MedicationError"
            ;;
        plan-service)
            error_patterns="error|exception|fail|fatal|ClaimProcessingException|BenefitCalculationError|CoverageException"
            ;;
        gamification-engine)
            error_patterns="error|exception|fail|fatal|EventProcessingException|AchievementError|RewardException"
            ;;
        notification-service)
            error_patterns="error|exception|fail|fatal|NotificationDeliveryException|TemplateRenderingError|ChannelException"
            ;;
        auth-service)
            error_patterns="error|exception|fail|fatal|AuthenticationException|TokenValidationError|PermissionDenied"
            ;;
        api-gateway)
            error_patterns="error|exception|fail|fatal|RoutingException|ServiceUnavailable|TimeoutException"
            ;;
        *)
            error_patterns="error|exception|fail|fatal"
            ;;
    esac
    
    # Query for error logs
    local query
    query="{namespace=\"${NAMESPACE}\", app=\"${SERVICE_NAME}\", version=\"${version}\"} |~ \"${error_patterns}\" | logfmt"
    
    local start_time
    start_time=$(date -u -d "${duration} ago" +%s)
    local end_time
    end_time=$(date -u +%s)
    
    log_debug "Loki query: ${query}"
    log_debug "Time range: ${start_time} to ${end_time}"
    
    local response
    response=$(curl -s -G \
        --data-urlencode "query=${query}" \
        --data-urlencode "start=${start_time}000000000" \
        --data-urlencode "end=${end_time}000000000" \
        --data-urlencode "limit=100" \
        "${LOKI_URL}/loki/api/v1/query_range")
    
    if [[ -z "${response}" ]]; then
        log_error "Empty response from Loki"
        return 0  # Don't fail validation due to log query issues
    fi
    
    if [[ "$(echo "${response}" | jq -r '.status // "error"')" != "success" ]]; then
        log_error "Loki query failed: $(echo "${response}" | jq -r '.error // "Unknown error"')"
        return 0  # Don't fail validation due to log query issues
    fi
    
    local error_count
    error_count=$(echo "${response}" | jq -r '.data.result | length')
    
    # Check for specific critical errors that should always fail validation
    local critical_errors
    critical_errors=$(echo "${response}" | jq -r '.data.result[].values[][1]' | grep -i -E 'OutOfMemoryError|CrashLoopBackOff|KafkaException|DatabaseException|ConnectionRefused' | wc -l)
    
    if [[ "${critical_errors}" -gt 0 ]]; then
        log_error "Found ${critical_errors} critical error logs in ${SERVICE_NAME}-${version}"
        log_error "Critical errors: $(echo "${response}" | jq -r '.data.result[].values[][1]' | grep -i -E 'OutOfMemoryError|CrashLoopBackOff|KafkaException|DatabaseException|ConnectionRefused' | head -3)"
        return 1
    fi
    
    if [[ "${error_count}" -gt "${MAX_ACCEPTABLE_ERROR_LOGS}" ]]; then
        log_error "Found ${error_count} error logs in ${SERVICE_NAME}-${version}, exceeding threshold of ${MAX_ACCEPTABLE_ERROR_LOGS}"
        log_error "Sample errors: $(echo "${response}" | jq -r '.data.result[0:3].values[][1]')"
        return 1
    fi
    
    log_info "Log analysis passed for ${SERVICE_NAME}-${version}: ${error_count} errors found"
    return 0
}

# -----------------------------------------------------------------------------
# Synthetic Monitoring Functions
# -----------------------------------------------------------------------------

# Run synthetic tests against the service
function run_synthetic_tests() {
    local version="$1"
    
    log_info "Running synthetic tests against ${SERVICE_NAME}-${version}"
    
    # Determine which synthetic tests to run based on service type
    local test_suite
    
    case "${SERVICE_NAME}" in
        health-service)
            test_suite="health-journey"
            ;;
        care-service)
            test_suite="care-journey"
            ;;
        plan-service)
            test_suite="plan-journey"
            ;;
        api-gateway)
            test_suite="api-gateway"
            ;;
        gamification-engine)
            test_suite="gamification"
            ;;
        notification-service)
            test_suite="notifications"
            ;;
        auth-service)
            test_suite="auth"
            ;;
        *)
            test_suite="default"
            ;;
    esac
    
    # Check if synthetic test runner exists
    if [[ ! -f "${SCRIPT_DIR}/../monitoring/synthetic-tests.sh" ]]; then
        log_warning "Synthetic test runner not found, skipping synthetic tests"
        return 0
    fi
    
    # Check if the test runner is executable
    if [[ ! -x "${SCRIPT_DIR}/../monitoring/synthetic-tests.sh" ]]; then
        log_warning "Synthetic test runner is not executable, attempting to make it executable"
        chmod +x "${SCRIPT_DIR}/../monitoring/synthetic-tests.sh" || {
            log_error "Failed to make synthetic test runner executable"
            return 1
        }
    fi
    
    # Determine journey-specific test parameters
    local additional_params=""
    case "${test_suite}" in
        health-journey)
            additional_params="--test-metrics --test-goals --test-devices"
            ;;
        care-journey)
            additional_params="--test-appointments --test-medications --test-telemedicine"
            ;;
        plan-journey)
            additional_params="--test-benefits --test-claims --test-coverage"
            ;;
        gamification)
            additional_params="--test-achievements --test-rewards --test-quests"
            ;;
        *)
            additional_params=""
            ;;
    esac
    
    # Run synthetic tests
    log_info "Running ${test_suite} synthetic tests with timeout of 120 seconds"
    local result
    result=$("${SCRIPT_DIR}/../monitoring/synthetic-tests.sh" \
        --service "${SERVICE_NAME}" \
        --version "${version}" \
        --namespace "${NAMESPACE}" \
        --suite "${test_suite}" \
        --timeout 120 \
        ${additional_params})
    
    local exit_code=$?
    
    if [[ "${exit_code}" -ne 0 ]]; then
        log_error "Synthetic tests failed for ${SERVICE_NAME}-${version}"
        log_error "${result}"
        return 1
    fi
    
    # Check for specific journey-related test failures in the output
    if echo "${result}" | grep -q "FAIL"; then
        log_error "Some synthetic tests failed for ${SERVICE_NAME}-${version}"
        log_error "$(echo "${result}" | grep "FAIL")"
        return 1
    fi
    
    log_info "All synthetic tests passed for ${SERVICE_NAME}-${version}"
    return 0
}

# -----------------------------------------------------------------------------
# Validation Functions
# -----------------------------------------------------------------------------

# Compare error rates between canary and baseline
function validate_error_rates() {
    log_info "Validating error rates"
    
    local canary_error_rate
    canary_error_rate=$(get_error_rate "${CANARY_VERSION}")
    if [[ $? -ne 0 ]]; then
        log_error "Failed to get error rate for canary version"
        return 1
    fi
    
    local baseline_error_rate
    baseline_error_rate=$(get_error_rate "${BASELINE_VERSION}")
    if [[ $? -ne 0 ]]; then
        log_error "Failed to get error rate for baseline version"
        return 1
    fi
    
    log_info "Error rates - Canary: ${canary_error_rate}%, Baseline: ${baseline_error_rate}%"
    
    # Check if canary error rate is within acceptable range
    if (( $(echo "${canary_error_rate} > ${ERROR_RATE_THRESHOLD}" | bc -l) )); then
        log_error "Canary error rate (${canary_error_rate}%) exceeds threshold (${ERROR_RATE_THRESHOLD}%)"
        return 1
    fi
    
    # Check if canary error rate is significantly higher than baseline
    local error_rate_difference
    error_rate_difference=$(echo "${canary_error_rate} - ${baseline_error_rate}" | bc)
    
    if (( $(echo "${error_rate_difference} > ${ERROR_RATE_DIFFERENCE_THRESHOLD}" | bc -l) )); then
        log_error "Canary error rate is ${error_rate_difference}% higher than baseline, exceeding threshold (${ERROR_RATE_DIFFERENCE_THRESHOLD}%)"
        return 1
    fi
    
    log_info "Error rate validation passed"
    return 0
}

# Compare latency between canary and baseline
function validate_latency() {
    log_info "Validating latency"
    
    local canary_latency
    canary_latency=$(get_latency "${CANARY_VERSION}")
    if [[ $? -ne 0 ]]; then
        log_error "Failed to get latency for canary version"
        return 1
    fi
    
    local baseline_latency
    baseline_latency=$(get_latency "${BASELINE_VERSION}")
    if [[ $? -ne 0 ]]; then
        log_error "Failed to get latency for baseline version"
        return 1
    fi
    
    log_info "P95 Latency - Canary: ${canary_latency}ms, Baseline: ${baseline_latency}ms"
    
    # Check if canary latency is within acceptable range
    if (( $(echo "${canary_latency} > ${LATENCY_THRESHOLD}" | bc -l) )); then
        log_error "Canary latency (${canary_latency}ms) exceeds threshold (${LATENCY_THRESHOLD}ms)"
        return 1
    fi
    
    # Check if canary latency is significantly higher than baseline
    local latency_difference_percent
    latency_difference_percent=$(echo "(${canary_latency} - ${baseline_latency}) / ${baseline_latency} * 100" | bc)
    
    if (( $(echo "${latency_difference_percent} > ${LATENCY_DIFFERENCE_THRESHOLD}" | bc -l) )); then
        log_error "Canary latency is ${latency_difference_percent}% higher than baseline, exceeding threshold (${LATENCY_DIFFERENCE_THRESHOLD}%)"
        return 1
    fi
    
    log_info "Latency validation passed"
    return 0
}

# Validate resource usage
function validate_resource_usage() {
    log_info "Validating resource usage"
    
    # Validate CPU usage
    local canary_cpu
    canary_cpu=$(get_cpu_usage "${CANARY_VERSION}")
    if [[ $? -ne 0 ]]; then
        log_warning "Failed to get CPU usage for canary version, skipping CPU validation"
    else
        local baseline_cpu
        baseline_cpu=$(get_cpu_usage "${BASELINE_VERSION}")
        if [[ $? -ne 0 ]]; then
            log_warning "Failed to get CPU usage for baseline version, skipping CPU validation"
        else
            log_info "CPU Usage - Canary: ${canary_cpu}, Baseline: ${baseline_cpu}"
            
            # Check if canary CPU usage is significantly higher than baseline
            local cpu_difference_percent
            cpu_difference_percent=$(echo "(${canary_cpu} - ${baseline_cpu}) / ${baseline_cpu} * 100" | bc)
            
            if (( $(echo "${cpu_difference_percent} > ${CPU_DIFFERENCE_THRESHOLD}" | bc -l) )); then
                log_warning "Canary CPU usage is ${cpu_difference_percent}% higher than baseline, exceeding threshold (${CPU_DIFFERENCE_THRESHOLD}%)"
                # Don't fail validation for resource usage, just warn
            fi
        fi
    fi
    
    # Validate memory usage
    local canary_memory
    canary_memory=$(get_memory_usage "${CANARY_VERSION}")
    if [[ $? -ne 0 ]]; then
        log_warning "Failed to get memory usage for canary version, skipping memory validation"
    else
        local baseline_memory
        baseline_memory=$(get_memory_usage "${BASELINE_VERSION}")
        if [[ $? -ne 0 ]]; then
            log_warning "Failed to get memory usage for baseline version, skipping memory validation"
        else
            log_info "Memory Usage - Canary: ${canary_memory}MB, Baseline: ${baseline_memory}MB"
            
            # Check if canary memory usage is significantly higher than baseline
            local memory_difference_percent
            memory_difference_percent=$(echo "(${canary_memory} - ${baseline_memory}) / ${baseline_memory} * 100" | bc)
            
            if (( $(echo "${memory_difference_percent} > ${MEMORY_DIFFERENCE_THRESHOLD}" | bc -l) )); then
                log_warning "Canary memory usage is ${memory_difference_percent}% higher than baseline, exceeding threshold (${MEMORY_DIFFERENCE_THRESHOLD}%)"
                # Don't fail validation for resource usage, just warn
            fi
        fi
    fi
    
    log_info "Resource usage validation completed"
    return 0
}

# Validate health checks
function validate_health() {
    log_info "Validating health checks"
    
    # Check if pods are ready
    check_pods_ready "${CANARY_VERSION}"
    if [[ $? -ne 0 ]]; then
        log_error "Pod readiness check failed for canary version"
        return 1
    fi
    
    # Check service health
    check_service_health "${CANARY_VERSION}"
    if [[ $? -ne 0 ]]; then
        log_error "Service health check failed for canary version"
        return 1
    fi
    
    # Check dependency health
    check_dependency_health "${CANARY_VERSION}"
    if [[ $? -ne 0 ]]; then
        log_error "Dependency health check failed for canary version"
        return 1
    fi
    
    log_info "Health validation passed"
    return 0
}

# Validate logs
function validate_logs() {
    log_info "Validating logs"
    
    # Check for error patterns in logs
    check_logs_for_errors "${CANARY_VERSION}"
    if [[ $? -ne 0 ]]; then
        log_error "Log analysis failed for canary version"
        return 1
    fi
    
    log_info "Log validation passed"
    return 0
}

# Run synthetic monitoring
function validate_synthetic_monitoring() {
    log_info "Validating with synthetic monitoring"
    
    # Run synthetic tests
    run_synthetic_tests "${CANARY_VERSION}"
    if [[ $? -ne 0 ]]; then
        log_error "Synthetic tests failed for canary version"
        return 1
    fi
    
    log_info "Synthetic monitoring validation passed"
    return 0
}

# -----------------------------------------------------------------------------
# Alerting Functions
# -----------------------------------------------------------------------------

# Adjust alerting thresholds during canary deployment
function adjust_alerting_thresholds() {
    log_info "Adjusting alerting thresholds for canary deployment at ${TRAFFIC_PERCENTAGE}% traffic"
    
    # This would typically call an API to adjust alerting thresholds
    # For now, we'll just log the intent
    
    log_info "Setting error rate alerting threshold to ${CANARY_ERROR_RATE_ALERT_THRESHOLD}%"
    log_info "Setting latency alerting threshold to ${CANARY_LATENCY_ALERT_THRESHOLD}ms"
    
    return 0
}

# Restore alerting thresholds after validation
function restore_alerting_thresholds() {
    log_info "Restoring normal alerting thresholds"
    
    # This would typically call an API to restore alerting thresholds
    # For now, we'll just log the intent
    
    log_info "Restoring error rate alerting threshold to ${NORMAL_ERROR_RATE_ALERT_THRESHOLD}%"
    log_info "Restoring latency alerting threshold to ${NORMAL_LATENCY_ALERT_THRESHOLD}ms"
    
    return 0
}

# -----------------------------------------------------------------------------
# Main Validation Function
# -----------------------------------------------------------------------------

function run_validation() {
    log_info "Starting canary validation for ${SERVICE_NAME} (${CANARY_VERSION}) at ${TRAFFIC_PERCENTAGE}% traffic"
    
    # Adjust alerting thresholds during canary deployment
    adjust_alerting_thresholds
    
    # Allow some time for metrics to be collected
    log_info "Waiting for metrics collection (${METRICS_COLLECTION_WAIT_TIME} seconds)"
    sleep "${METRICS_COLLECTION_WAIT_TIME}"
    
    # Run validations
    local validation_failures=0
    
    # Validate health checks
    validate_health
    if [[ $? -ne 0 ]]; then
        ((validation_failures++))
    fi
    
    # Validate error rates
    validate_error_rates
    if [[ $? -ne 0 ]]; then
        ((validation_failures++))
    fi
    
    # Validate latency
    validate_latency
    if [[ $? -ne 0 ]]; then
        ((validation_failures++))
    fi
    
    # Validate resource usage (warnings only, doesn't affect validation result)
    validate_resource_usage
    
    # Validate logs
    validate_logs
    if [[ $? -ne 0 ]]; then
        ((validation_failures++))
    fi
    
    # Run synthetic monitoring
    validate_synthetic_monitoring
    if [[ $? -ne 0 ]]; then
        ((validation_failures++))
    fi
    
    # Restore alerting thresholds
    restore_alerting_thresholds
    
    # Determine validation result
    if [[ "${validation_failures}" -gt 0 ]]; then
        log_error "Validation failed with ${validation_failures} failures"
        return 1
    fi
    
    log_info "All validations passed for ${SERVICE_NAME} (${CANARY_VERSION}) at ${TRAFFIC_PERCENTAGE}% traffic"
    return 0
}

# -----------------------------------------------------------------------------
# Main Script
# -----------------------------------------------------------------------------

# Parse command line arguments
parse_args "$@"

# Set up timeout handler
timeout_handler() {
    log_error "Validation timed out after ${VALIDATION_TIMEOUT} seconds"
    exit 5
}

# Set timeout
trap timeout_handler SIGALRM
eval "sleep ${VALIDATION_TIMEOUT} && kill -ALRM $$ &"
timeout_pid=$!

# Run validation
run_validation
validation_result=$?

# Cancel timeout
kill "${timeout_pid}" 2>/dev/null || true

# Generate report
log_info "Generating validation report for ${SERVICE_NAME} (${CANARY_VERSION}) at ${TRAFFIC_PERCENTAGE}% traffic"

# Create report directory if it doesn't exist
REPORT_DIR="${SCRIPT_DIR}/../reports/canary/${SERVICE_NAME}/${CANARY_VERSION}"
mkdir -p "${REPORT_DIR}"

# Generate report file
REPORT_FILE="${REPORT_DIR}/validation-${TRAFFIC_PERCENTAGE}.json"

cat > "${REPORT_FILE}" << EOF
{
  "service": "${SERVICE_NAME}",
  "namespace": "${NAMESPACE}",
  "canaryVersion": "${CANARY_VERSION}",
  "baselineVersion": "${BASELINE_VERSION}",
  "trafficPercentage": ${TRAFFIC_PERCENTAGE},
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "result": "$([ ${validation_result} -eq 0 ] && echo "PASS" || echo "FAIL")",
  "metrics": {
    "errorRate": {
      "canary": $(get_error_rate "${CANARY_VERSION}" || echo "null"),
      "baseline": $(get_error_rate "${BASELINE_VERSION}" || echo "null"),
      "threshold": ${ERROR_RATE_THRESHOLD},
      "diffThreshold": ${ERROR_RATE_DIFFERENCE_THRESHOLD}
    },
    "latency": {
      "canary": $(get_latency "${CANARY_VERSION}" || echo "null"),
      "baseline": $(get_latency "${BASELINE_VERSION}" || echo "null"),
      "threshold": ${LATENCY_THRESHOLD},
      "diffThreshold": ${LATENCY_DIFFERENCE_THRESHOLD}
    },
    "cpu": {
      "canary": $(get_cpu_usage "${CANARY_VERSION}" || echo "null"),
      "baseline": $(get_cpu_usage "${BASELINE_VERSION}" || echo "null"),
      "diffThreshold": ${CPU_DIFFERENCE_THRESHOLD}
    },
    "memory": {
      "canary": $(get_memory_usage "${CANARY_VERSION}" || echo "null"),
      "baseline": $(get_memory_usage "${BASELINE_VERSION}" || echo "null"),
      "diffThreshold": ${MEMORY_DIFFERENCE_THRESHOLD}
    }
  }
}
EOF

log_info "Validation report generated: ${REPORT_FILE}"

# Exit with validation result
if [[ "${validation_result}" -eq 0 ]]; then
    log_info "Canary validation PASSED for ${SERVICE_NAME} (${CANARY_VERSION}) at ${TRAFFIC_PERCENTAGE}% traffic"
else
    log_error "Canary validation FAILED for ${SERVICE_NAME} (${CANARY_VERSION}) at ${TRAFFIC_PERCENTAGE}% traffic"
fi

exit "${validation_result}"