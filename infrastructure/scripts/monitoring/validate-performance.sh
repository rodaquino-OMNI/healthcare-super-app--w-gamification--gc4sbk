#!/bin/bash

# =============================================================================
# AUSTA SuperApp - Post-Deployment Performance Validation Script
# =============================================================================
#
# This script validates the performance of the AUSTA SuperApp after deployment
# by comparing current metrics against stored baselines. It performs statistical
# significance testing to identify meaningful changes and detects anomalies in
# performance metrics.
#
# The script integrates with CI/CD pipelines to automatically block deployments
# that fail performance criteria.
#
# Usage: ./validate-performance.sh [options]
#
# Options:
#   -e, --environment <env>    Environment to validate (default: staging)
#   -t, --threshold <percent>  Regression threshold percentage (default: 10)
#   -s, --significance <value> Statistical significance level (default: 0.05)
#   -p, --prometheus <url>     Prometheus server URL (default: http://prometheus:9090)
#   -b, --baseline <path>      Path to baseline metrics file (optional)
#   -o, --output <path>        Path to output report file (default: ./performance-report.json)
#   -v, --verbose              Enable verbose output
#   -h, --help                 Show this help message
#
# Exit codes:
#   0 - Performance validation passed
#   1 - Performance validation failed
#   2 - Invalid arguments or configuration
#   3 - Error retrieving metrics
#
# =============================================================================

set -eo pipefail

# -----------------------------------------------------------------------------
# Configuration and defaults
# -----------------------------------------------------------------------------
ENVIRONMENT="staging"
REGRESSION_THRESHOLD=10
SIGNIFICANCE_LEVEL=0.05
PROMETHEUS_URL="http://prometheus:9090"
OUTPUT_FILE="./performance-report.json"
VERBOSE=false
BASELINE_FILE=""
DEPLOYMENT_ID=$(date +%Y%m%d%H%M%S)
TEMP_DIR="/tmp/perf-validation-${DEPLOYMENT_ID}"

# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------

# Print usage information
function show_help {
    grep '^#' "$0" | grep -v '#!/bin/bash

# Make script executable: chmod +x validate-performance.sh' | sed 's/^# \?//'
    exit 0
}

# Log message with timestamp
function log {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] [${level}] ${message}"
}

# Log message if verbose mode is enabled
function log_verbose {
    if [[ "$VERBOSE" == true ]]; then
        log "DEBUG" "$*"
    fi
}

# Log error message and exit with error code
function log_error {
    log "ERROR" "$*"
    exit 1
}

# Query Prometheus for metrics
function query_prometheus {
    local query=$1
    local time=$2
    local url="${PROMETHEUS_URL}/api/v1/query"
    local params="query=${query}"
    
    if [[ -n "$time" ]]; then
        params="${params}&time=${time}"
    fi
    
    log_verbose "Querying Prometheus: ${url} with params: ${params}"
    
    local response
    response=$(curl -s -G --data-urlencode "${params}" "${url}")
    
    if [[ $(echo "$response" | jq -r '.status') != "success" ]]; then
        log "ERROR" "Failed to query Prometheus: $(echo "$response" | jq -r '.error // "Unknown error"')"
        return 1
    fi
    
    echo "$response" | jq -r '.data.result'
}

# Calculate statistical significance using t-test
function calculate_significance {
    local baseline_values=$1
    local current_values=$2
    
    # Calculate means
    local baseline_mean=$(echo "$baseline_values" | jq -s 'add/length')
    local current_mean=$(echo "$current_values" | jq -s 'add/length')
    
    # Calculate standard deviations
    local baseline_sd=$(echo "$baseline_values" | jq -s 'if length <= 1 then 0 else (map(. - ('"$baseline_mean"')) | map(. * .) | add / (length - 1)) | sqrt end')
    local current_sd=$(echo "$current_values" | jq -s 'if length <= 1 then 0 else (map(. - ('"$current_mean"')) | map(. * .) | add / (length - 1)) | sqrt end')
    
    # Calculate sample sizes
    local baseline_n=$(echo "$baseline_values" | jq -s 'length')
    local current_n=$(echo "$current_values" | jq -s 'length')
    
    # Calculate t-statistic
    # t = (mean1 - mean2) / sqrt((sd1^2/n1) + (sd2^2/n2))
    local t_stat
    if [[ "$baseline_sd" == "0" && "$current_sd" == "0" ]]; then
        # If both standard deviations are 0, we can't calculate t-statistic
        # This happens when all values are the same
        if [[ "$baseline_mean" == "$current_mean" ]]; then
            t_stat=0
        else
            # Different means but no variance - definitely significant
            t_stat=999
        fi
    else
        local denominator=$(echo "scale=10; sqrt(($baseline_sd^2/$baseline_n) + ($current_sd^2/$current_n))" | bc)
        if [[ "$denominator" == "0" || "$denominator" == ".0000000000" ]]; then
            # Avoid division by zero
            t_stat=0
        else
            t_stat=$(echo "scale=10; ($baseline_mean - $current_mean) / $denominator" | bc)
            # Take absolute value
            t_stat=$(echo "$t_stat" | sed 's/^-//')
        fi
    fi
    
    # Calculate degrees of freedom (Welch-Satterthwaite equation)
    local df
    if [[ "$baseline_sd" == "0" && "$current_sd" == "0" ]]; then
        df=$((baseline_n + current_n - 2))
    else
        local num=$(echo "scale=10; (($baseline_sd^2/$baseline_n) + ($current_sd^2/$current_n))^2" | bc)
        local denom=$(echo "scale=10; (($baseline_sd^2/$baseline_n)^2/($baseline_n-1)) + (($current_sd^2/$current_n)^2/($current_n-1))" | bc)
        if [[ "$denom" == "0" || "$denom" == ".0000000000" ]]; then
            df=$((baseline_n + current_n - 2))
        else
            df=$(echo "scale=0; $num / $denom" | bc)
        fi
    fi
    
    # For simplicity, we'll use a lookup table for critical t-values at common significance levels
    # This is a simplified approach; in a production environment, you might want to use a more accurate method
    local critical_t
    if [[ "$df" -le 10 ]]; then
        critical_t=2.228 # For df=10, alpha=0.05 (two-tailed)
    elif [[ "$df" -le 20 ]]; then
        critical_t=2.086 # For df=20, alpha=0.05 (two-tailed)
    elif [[ "$df" -le 30 ]]; then
        critical_t=2.042 # For df=30, alpha=0.05 (two-tailed)
    elif [[ "$df" -le 60 ]]; then
        critical_t=2.000 # For df=60, alpha=0.05 (two-tailed)
    elif [[ "$df" -le 120 ]]; then
        critical_t=1.980 # For df=120, alpha=0.05 (two-tailed)
    else
        critical_t=1.960 # For df=inf, alpha=0.05 (two-tailed)
    fi
    
    # Determine if the difference is statistically significant
    local is_significant
    if (( $(echo "$t_stat > $critical_t" | bc -l) )); then
        is_significant=true
    else
        is_significant=false
    fi
    
    # Calculate p-value (simplified approximation)
    # This is a very rough approximation; in a production environment, you might want to use a more accurate method
    local p_value
    if (( $(echo "$t_stat > 10" | bc -l) )); then
        p_value=0.0001
    elif (( $(echo "$t_stat > 5" | bc -l) )); then
        p_value=0.001
    elif (( $(echo "$t_stat > $critical_t" | bc -l) )); then
        p_value=0.01
    elif (( $(echo "$t_stat > 1.5" | bc -l) )); then
        p_value=0.1
    else
        p_value=0.5
    fi
    
    # Return results as JSON
    echo "{
        \"baseline_mean\": $baseline_mean,
        \"current_mean\": $current_mean,
        \"baseline_sd\": $baseline_sd,
        \"current_sd\": $current_sd,
        \"baseline_n\": $baseline_n,
        \"current_n\": $current_n,
        \"t_statistic\": $t_stat,
        \"degrees_of_freedom\": $df,
        \"p_value\": $p_value,
        \"is_significant\": $is_significant
    }"
}

# Detect anomalies in metrics
function detect_anomalies {
    local baseline_values=$1
    local current_values=$2
    local metric_name=$3
    local threshold=$4
    
    # Calculate baseline statistics
    local baseline_mean=$(echo "$baseline_values" | jq -s 'add/length')
    local baseline_sd=$(echo "$baseline_values" | jq -s 'if length <= 1 then 0 else (map(. - ('"$baseline_mean"')) | map(. * .) | add / (length - 1)) | sqrt end')
    
    # Calculate z-scores for current values
    local anomalies=$(echo "$current_values" | jq --argjson mean "$baseline_mean" --argjson sd "$baseline_sd" --arg threshold "$threshold" -s '
        if $sd == 0 then
            map(if . != $mean then {value: ., z_score: 999, is_anomaly: true} else {value: ., z_score: 0, is_anomaly: false} end)
        else
            map({
                value: .,
                z_score: (. - $mean) / $sd,
                is_anomaly: (((. - $mean) / $mean * 100 | abs) > ($threshold | tonumber))
            })
        end
    ')
    
    # Count anomalies
    local anomaly_count=$(echo "$anomalies" | jq '[.[] | select(.is_anomaly == true)] | length')
    local total_count=$(echo "$anomalies" | jq 'length')
    
    # Calculate percentage of anomalies
    local anomaly_percentage
    if [[ "$total_count" -eq 0 ]]; then
        anomaly_percentage=0
    else
        anomaly_percentage=$(echo "scale=2; $anomaly_count * 100 / $total_count" | bc)
    fi
    
    # Return results as JSON
    echo "{
        \"metric\": \"$metric_name\",
        \"baseline_mean\": $baseline_mean,
        \"baseline_sd\": $baseline_sd,
        \"anomaly_count\": $anomaly_count,
        \"total_count\": $total_count,
        \"anomaly_percentage\": $anomaly_percentage,
        \"anomalies\": $anomalies
    }"
}

# Calculate percentage change between baseline and current metrics
function calculate_change {
    local baseline_mean=$1
    local current_mean=$2
    
    if [[ "$baseline_mean" == "0" ]]; then
        if [[ "$current_mean" == "0" ]]; then
            echo "0"
        else
            echo "100"
        fi
    else
        echo "scale=2; ($current_mean - $baseline_mean) / $baseline_mean * 100" | bc
    fi
}

# -----------------------------------------------------------------------------
# Parse command line arguments
# -----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--threshold)
            REGRESSION_THRESHOLD="$2"
            shift 2
            ;;
        -s|--significance)
            SIGNIFICANCE_LEVEL="$2"
            shift 2
            ;;
        -p|--prometheus)
            PROMETHEUS_URL="$2"
            shift 2
            ;;
        -b|--baseline)
            BASELINE_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            ;;
    esac
done

# Create temporary directory
mkdir -p "$TEMP_DIR"

# -----------------------------------------------------------------------------
# Define metrics to monitor
# -----------------------------------------------------------------------------
log "INFO" "Initializing performance validation for ${ENVIRONMENT} environment"

# Define the metrics to monitor
declare -A METRICS
METRICS=(
    ["container_startup_time"]="avg(container_startup_seconds{environment=\"${ENVIRONMENT}\"})"
    ["api_response_time"]="avg(http_request_duration_seconds{environment=\"${ENVIRONMENT}\", handler=~\"api.*\"})"
    ["database_query_time"]="avg(database_query_duration_seconds{environment=\"${ENVIRONMENT}\"})"
    ["memory_usage"]="avg(container_memory_usage_bytes{environment=\"${ENVIRONMENT}\"}) / 1024 / 1024"
    ["cpu_usage"]="avg(rate(container_cpu_usage_seconds_total{environment=\"${ENVIRONMENT}\"}[5m]) * 100)"
    ["error_rate"]="sum(rate(http_requests_total{environment=\"${ENVIRONMENT}\", status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total{environment=\"${ENVIRONMENT}\"}[5m])) * 100"
    ["journey_completion_time"]="avg(journey_completion_seconds{environment=\"${ENVIRONMENT}\"})"
    ["gamification_event_processing_time"]="avg(event_processing_duration_seconds{environment=\"${ENVIRONMENT}\", service=\"gamification-engine\"})"
)

# Define journey-specific metrics
declare -A JOURNEY_METRICS
JOURNEY_METRICS=(
    ["health_journey_response_time"]="avg(http_request_duration_seconds{environment=\"${ENVIRONMENT}\", service=\"health-service\"})"
    ["care_journey_response_time"]="avg(http_request_duration_seconds{environment=\"${ENVIRONMENT}\", service=\"care-service\"})"
    ["plan_journey_response_time"]="avg(http_request_duration_seconds{environment=\"${ENVIRONMENT}\", service=\"plan-service\"})"
)

# Combine all metrics
for key in "${!JOURNEY_METRICS[@]}"; do
    METRICS["$key"]="${JOURNEY_METRICS[$key]}"
done

# -----------------------------------------------------------------------------
# Retrieve baseline metrics
# -----------------------------------------------------------------------------
log "INFO" "Retrieving baseline metrics"

BASELINE_DATA="{}"

if [[ -n "$BASELINE_FILE" && -f "$BASELINE_FILE" ]]; then
    # Use provided baseline file
    log_verbose "Using baseline file: $BASELINE_FILE"
    BASELINE_DATA=$(cat "$BASELINE_FILE")
else
    # Query Prometheus for baseline metrics (from 24 hours ago)
    log_verbose "Querying Prometheus for baseline metrics"
    
    # Get timestamp from 24 hours ago
    BASELINE_TIME=$(date -u -d "24 hours ago" +"%Y-%m-%dT%H:%M:%SZ")
    
    # Initialize baseline data
    BASELINE_DATA="{}"
    
    # Query each metric
    for metric_name in "${!METRICS[@]}"; do
        query="${METRICS[$metric_name]}"
        log_verbose "Querying baseline for $metric_name: $query"
        
        # Query for the last 1 hour of data from 24 hours ago
        result=$(query_prometheus "${query}[1h]" "$BASELINE_TIME")
        
        if [[ $? -ne 0 ]]; then
            log "WARN" "Failed to retrieve baseline data for $metric_name"
            continue
        fi
        
        # Extract values from result
        values=$(echo "$result" | jq -r '.[] | .values[] | .[1] | tonumber')
        
        # Add to baseline data
        BASELINE_DATA=$(echo "$BASELINE_DATA" | jq --arg name "$metric_name" --arg values "$values" \
            '. + {($name): {values: $values | split("\n") | map(tonumber)}}')
    done
    
    # Save baseline data to file for future reference
    echo "$BASELINE_DATA" > "$TEMP_DIR/baseline_data.json"
fi

# -----------------------------------------------------------------------------
# Retrieve current metrics
# -----------------------------------------------------------------------------
log "INFO" "Retrieving current metrics"

# Initialize current data
CURRENT_DATA="{}"

# Query each metric
for metric_name in "${!METRICS[@]}"; do
    query="${METRICS[$metric_name]}"
    log_verbose "Querying current for $metric_name: $query"
    
    # Query for the last 15 minutes of data
    result=$(query_prometheus "${query}[15m]")
    
    if [[ $? -ne 0 ]]; then
        log "WARN" "Failed to retrieve current data for $metric_name"
        continue
    fi
    
    # Extract values from result
    values=$(echo "$result" | jq -r '.[] | .values[] | .[1] | tonumber')
    
    # Add to current data
    CURRENT_DATA=$(echo "$CURRENT_DATA" | jq --arg name "$metric_name" --arg values "$values" \
        '. + {($name): {values: $values | split("\n") | map(tonumber)}}')
done

# Save current data to file for reference
echo "$CURRENT_DATA" > "$TEMP_DIR/current_data.json"

# -----------------------------------------------------------------------------
# Analyze metrics
# -----------------------------------------------------------------------------
log "INFO" "Analyzing metrics"

# Initialize results
RESULTS="{}"
FAILED_METRICS=0
TOTAL_METRICS=0

# Analyze each metric
for metric_name in "${!METRICS[@]}"; do
    # Skip if we don't have data for this metric
    if ! echo "$BASELINE_DATA" | jq -e --arg name "$metric_name" '.[$name]' > /dev/null || \
       ! echo "$CURRENT_DATA" | jq -e --arg name "$metric_name" '.[$name]' > /dev/null; then
        log "WARN" "Skipping analysis for $metric_name: missing data"
        continue
    fi
    
    TOTAL_METRICS=$((TOTAL_METRICS + 1))
    
    # Get baseline and current values
    baseline_values=$(echo "$BASELINE_DATA" | jq -r --arg name "$metric_name" '.[$name].values | map(tostring) | join("\n")')
    current_values=$(echo "$CURRENT_DATA" | jq -r --arg name "$metric_name" '.[$name].values | map(tostring) | join("\n")')
    
    # Calculate statistical significance
    significance=$(calculate_significance "$baseline_values" "$current_values")
    
    # Detect anomalies
    anomalies=$(detect_anomalies "$baseline_values" "$current_values" "$metric_name" "$REGRESSION_THRESHOLD")
    
    # Calculate means for percentage change
    baseline_mean=$(echo "$significance" | jq -r '.baseline_mean')
    current_mean=$(echo "$significance" | jq -r '.current_mean')
    
    # Calculate percentage change
    percent_change=$(calculate_change "$baseline_mean" "$current_mean")
    
    # Determine if this metric has regressed
    is_regression=false
    if echo "$significance" | jq -e '.is_significant' > /dev/null; then
        # Only consider it a regression if the change is statistically significant
        if (( $(echo "$percent_change > $REGRESSION_THRESHOLD" | bc -l) )); then
            # For metrics where lower is better (most performance metrics)
            is_regression=true
            FAILED_METRICS=$((FAILED_METRICS + 1))
        elif [[ "$metric_name" == "error_rate" ]] && (( $(echo "$percent_change > 0" | bc -l) )); then
            # For error rate, any increase is bad
            is_regression=true
            FAILED_METRICS=$((FAILED_METRICS + 1))
        fi
    fi
    
    # Add to results
    RESULTS=$(echo "$RESULTS" | jq --arg name "$metric_name" \
        --argjson significance "$significance" \
        --argjson anomalies "$anomalies" \
        --arg percent_change "$percent_change" \
        --arg is_regression "$is_regression" \
        '. + {($name): {
            significance: $significance,
            anomalies: $anomalies,
            percent_change: $percent_change | tonumber,
            is_regression: $is_regression == "true"
        }}')
    
    # Log the result
    if [[ "$is_regression" == "true" ]]; then
        log "WARN" "Regression detected in $metric_name: ${percent_change}% change (baseline: ${baseline_mean}, current: ${current_mean})"
    else
        log_verbose "No regression detected in $metric_name: ${percent_change}% change (baseline: ${baseline_mean}, current: ${current_mean})"
    fi
done

# -----------------------------------------------------------------------------
# Generate report
# -----------------------------------------------------------------------------
log "INFO" "Generating performance report"

# Calculate overall result
PASS_PERCENTAGE=$(echo "scale=2; ($TOTAL_METRICS - $FAILED_METRICS) * 100 / $TOTAL_METRICS" | bc)
OVERALL_RESULT="PASS"

if [[ "$FAILED_METRICS" -gt 0 ]]; then
    OVERALL_RESULT="FAIL"
fi

# Create final report
REPORT=$(cat <<EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "$ENVIRONMENT",
    "deployment_id": "$DEPLOYMENT_ID",
    "overall_result": "$OVERALL_RESULT",
    "metrics_analyzed": $TOTAL_METRICS,
    "metrics_passed": $((TOTAL_METRICS - FAILED_METRICS)),
    "metrics_failed": $FAILED_METRICS,
    "pass_percentage": $PASS_PERCENTAGE,
    "regression_threshold": $REGRESSION_THRESHOLD,
    "significance_level": $SIGNIFICANCE_LEVEL,
    "results": $RESULTS
}
EOF
)

# Save report to file
echo "$REPORT" | jq '.' > "$OUTPUT_FILE"

# -----------------------------------------------------------------------------
# Determine exit status
# -----------------------------------------------------------------------------
log "INFO" "Performance validation complete: $OVERALL_RESULT"

if [[ "$OVERALL_RESULT" == "PASS" ]]; then
    log "INFO" "All metrics within acceptable thresholds"
    exit 0
else
    log "ERROR" "Performance validation failed: $FAILED_METRICS out of $TOTAL_METRICS metrics show regression"
    exit 1
fi