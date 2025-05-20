#!/bin/bash

# =========================================================================
# analyze-logs.sh
# =========================================================================
# 
# Log analysis script for the AUSTA SuperApp that queries Loki for error 
# patterns, generates insights from log data, automatically identifies 
# anomalies across services, and creates reports of recurring issues to 
# help prioritize bug fixes and improvements across all journeys.
#
# This script is part of the monitoring infrastructure and is designed to be
# run on a schedule to provide regular insights into application health.
#
# Usage: ./analyze-logs.sh [options]
#   Options:
#     -e, --environment     Environment to analyze (dev, staging, prod) [default: prod]
#     -p, --period          Time period to analyze (1h, 6h, 12h, 24h, 7d) [default: 24h]
#     -j, --journey         Specific journey to analyze (health, care, plan, all) [default: all]
#     -o, --output          Output format (text, json, html) [default: text]
#     -t, --threshold       Error threshold for alerting [default: 10]
#     -s, --severity        Minimum severity to include (debug, info, warn, error, fatal) [default: error]
#     -h, --help            Display this help message
#
# Dependencies:
#   - curl: For making HTTP requests to Loki API
#   - jq: For parsing JSON responses
#   - common.sh: For shared utility functions
#
# =========================================================================

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Default values
ENVIRONMENT="prod"
PERIOD="24h"
JOURNEY="all"
OUTPUT_FORMAT="text"
ERROR_THRESHOLD=10
MIN_SEVERITY="error"
LOKI_URL="http://loki.monitoring.svc.cluster.local:3100"
REPORT_DIR="/tmp/log-analysis"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -p|--period)
      PERIOD="$2"
      shift 2
      ;;
    -j|--journey)
      JOURNEY="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    -t|--threshold)
      ERROR_THRESHOLD="$2"
      shift 2
      ;;
    -s|--severity)
      MIN_SEVERITY="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./analyze-logs.sh [options]"
      echo "  Options:"
      echo "    -e, --environment     Environment to analyze (dev, staging, prod) [default: prod]"
      echo "    -p, --period          Time period to analyze (1h, 6h, 12h, 24h, 7d) [default: 24h]"
      echo "    -j, --journey         Specific journey to analyze (health, care, plan, all) [default: all]"
      echo "    -o, --output          Output format (text, json, html) [default: text]"
      echo "    -t, --threshold       Error threshold for alerting [default: 10]"
      echo "    -s, --severity        Minimum severity to include (debug, info, warn, error, fatal) [default: error]"
      echo "    -h, --help            Display this help message"
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate inputs
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  log_error "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
  exit 1
fi

if [[ ! "$PERIOD" =~ ^(1h|6h|12h|24h|7d)$ ]]; then
  log_error "Invalid period: $PERIOD. Must be one of: 1h, 6h, 12h, 24h, 7d"
  exit 1
fi

if [[ ! "$JOURNEY" =~ ^(health|care|plan|all)$ ]]; then
  log_error "Invalid journey: $JOURNEY. Must be one of: health, care, plan, all"
  exit 1
fi

if [[ ! "$OUTPUT_FORMAT" =~ ^(text|json|html)$ ]]; then
  log_error "Invalid output format: $OUTPUT_FORMAT. Must be one of: text, json, html"
  exit 1
fi

if [[ ! "$MIN_SEVERITY" =~ ^(debug|info|warn|error|fatal)$ ]]; then
  log_error "Invalid severity: $MIN_SEVERITY. Must be one of: debug, info, warn, error, fatal"
  exit 1
fi

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# =========================================================================
# Helper Functions
# =========================================================================

# Function to query Loki API
query_loki() {
  local query="$1"
  local start="$2"
  local limit="$3"
  
  if [[ -z "$limit" ]]; then
    limit=1000
  fi
  
  log_info "Querying Loki: $query"
  
  local response
  response=$(curl -s -G \
    --data-urlencode "query=$query" \
    --data-urlencode "start=$start" \
    --data-urlencode "limit=$limit" \
    "${LOKI_URL}/loki/api/v1/query_range")
  
  if [[ "$(echo "$response" | jq -r '.status')" != "success" ]]; then
    log_error "Loki query failed: $(echo "$response" | jq -r '.error // "Unknown error"')"
    return 1
  fi
  
  echo "$response"
  return 0
}

# Function to build Loki query based on parameters
build_query() {
  local service="$1"
  local severity="$2"
  local additional_filters="$3"
  
  local query="{env=\"${ENVIRONMENT}\"" 
  
  if [[ "$service" != "all" ]]; then
    query="${query}, service=\"${service}\""
  fi
  
  if [[ "$JOURNEY" != "all" ]]; then
    query="${query}, journey=\"${JOURNEY}\""
  fi
  
  if [[ -n "$severity" ]]; then
    query="${query}, level=\"${severity}\""
  fi
  
  query="${query}}"
  
  if [[ -n "$additional_filters" ]]; then
    query="${query} ${additional_filters}"
  fi
  
  echo "$query"
}

# Function to convert time period to Loki timestamp
period_to_timestamp() {
  local period="$1"
  local now=$(date +%s)
  local start
  
  case "$period" in
    1h)
      start=$((now - 3600))
      ;;
    6h)
      start=$((now - 21600))
      ;;
    12h)
      start=$((now - 43200))
      ;;
    24h)
      start=$((now - 86400))
      ;;
    7d)
      start=$((now - 604800))
      ;;
    *)
      start=$((now - 86400)) # Default to 24h
      ;;
  esac
  
  echo "${start}000000000" # Loki expects nanoseconds
}

# Function to analyze error patterns
analyze_error_patterns() {
  local service="$1"
  local response="$2"
  local output_file="$3"
  
  log_info "Analyzing error patterns for service: $service"
  
  # Extract error messages and count occurrences
  echo "$response" | jq -r '.data.result[] | .values[] | .[1]' | \
    jq -r '.message // .msg // .' 2>/dev/null | \
    grep -v "^null$" | sort | uniq -c | sort -nr > "$output_file"
  
  log_info "Found $(wc -l < "$output_file") unique error patterns for $service"
}

# Function to detect anomalies in error rates
detect_anomalies() {
  local service="$1"
  local period="$2"
  local output_file="$3"
  
  log_info "Detecting anomalies for service: $service over $period"
  
  # Get error counts in smaller time buckets to detect spikes
  local query=$(build_query "$service" "$MIN_SEVERITY" "| json | __error__ != \"\"")
  local start=$(period_to_timestamp "$period")
  
  # Query with step parameter to get time series data
  local response
  response=$(curl -s -G \
    --data-urlencode "query=$query" \
    --data-urlencode "start=$start" \
    --data-urlencode "step=5m" \
    "${LOKI_URL}/loki/api/v1/query_range")
  
  # Process time series data to find anomalies (sudden spikes)
  echo "$response" | jq -r '.data.result[] | .values | length' > "$output_file"
  
  # TODO: Implement more sophisticated anomaly detection algorithm
  # This is a placeholder for a more advanced implementation
}

# Function to generate journey-specific analysis
analyze_journey() {
  local journey="$1"
  local period="$2"
  local output_dir="$3"
  
  log_info "Analyzing journey: $journey for period: $period"
  
  mkdir -p "$output_dir/$journey"
  
  # Determine services for this journey
  local services
  case "$journey" in
    health)
      services="health-service"
      ;;
    care)
      services="care-service telemedicine-service"
      ;;
    plan)
      services="plan-service"
      ;;
    all)
      services="health-service care-service telemedicine-service plan-service api-gateway auth-service gamification-engine notification-service"
      ;;
    *)
      log_error "Unknown journey: $journey"
      return 1
      ;;
  esac
  
  # Analyze each service in the journey
  for service in $services; do
    log_info "Analyzing service: $service for journey: $journey"
    
    # Query for errors
    local query=$(build_query "$service" "$MIN_SEVERITY" "| json | __error__ != \"\"")
    local start=$(period_to_timestamp "$period")
    local response
    
    response=$(query_loki "$query" "$start")
    if [[ $? -ne 0 ]]; then
      log_error "Failed to query Loki for service: $service"
      continue
    fi
    
    # Analyze error patterns
    analyze_error_patterns "$service" "$response" "$output_dir/$journey/${service}_errors.txt"
    
    # Detect anomalies
    detect_anomalies "$service" "$period" "$output_dir/$journey/${service}_anomalies.txt"
    
    # Extract user impact information
    local user_impact_query=$(build_query "$service" "$MIN_SEVERITY" "| json | __error__ != \"\" | userId != \"\"")
    local user_impact_response
    
    user_impact_response=$(query_loki "$user_impact_query" "$start")
    if [[ $? -eq 0 ]]; then
      echo "$user_impact_response" | jq -r '.data.result[] | .values[] | .[1]' | \
        jq -r '.userId // .' 2>/dev/null | grep -v "^null$" | sort | uniq > "$output_dir/$journey/${service}_affected_users.txt"
      
      log_info "Found $(wc -l < "$output_dir/$journey/${service}_affected_users.txt") affected users for $service"
    fi
  done
}

# Function to generate error trend report
generate_error_trend_report() {
  local output_dir="$1"
  local report_file="$2"
  
  log_info "Generating error trend report"
  
  # Create report header
  cat > "$report_file" << EOF
========================================================================
  AUSTA SuperApp Error Analysis Report
  Environment: $ENVIRONMENT
  Period: $PERIOD
  Generated: $(date)
========================================================================

SUMMARY OF FINDINGS:

EOF
  
  # Process each journey
  local journeys
  if [[ "$JOURNEY" == "all" ]]; then
    journeys="health care plan"
  else
    journeys="$JOURNEY"
  fi
  
  local total_errors=0
  local critical_errors=0
  
  for journey in $journeys; do
    local journey_dir="$output_dir/$journey"
    
    if [[ ! -d "$journey_dir" ]]; then
      continue
    fi
    
    echo "JOURNEY: ${journey^^}" >> "$report_file"
    echo "------------------------------------------------------------------------" >> "$report_file"
    
    # Process each service in the journey
    for error_file in "$journey_dir"/*_errors.txt; do
      if [[ ! -f "$error_file" ]]; then
        continue
      fi
      
      local service=$(basename "$error_file" | sed 's/_errors.txt//')
      local error_count=$(wc -l < "$error_file")
      total_errors=$((total_errors + error_count))
      
      echo "Service: $service" >> "$report_file"
      echo "Total unique error patterns: $error_count" >> "$report_file"
      
      # Check for affected users
      local users_file="$journey_dir/${service}_affected_users.txt"
      if [[ -f "$users_file" ]]; then
        local affected_users=$(wc -l < "$users_file")
        echo "Affected users: $affected_users" >> "$report_file"
      fi
      
      # List top errors with severity classification
      echo "\nTop error patterns:" >> "$report_file"
      if [[ -s "$error_file" ]]; then
        head -10 "$error_file" | while read -r line; do
          local count=$(echo "$line" | awk '{print $1}')
          local message=$(echo "$line" | cut -d' ' -f2-)
          
          # Classify severity based on count and keywords
          local severity="LOW"
          if [[ $count -gt $ERROR_THRESHOLD ]]; then
            severity="HIGH"
            critical_errors=$((critical_errors + 1))
          elif [[ $count -gt $(($ERROR_THRESHOLD / 2)) ]]; then
            severity="MEDIUM"
          fi
          
          # Check for critical keywords
          if [[ "$message" =~ database|connection|timeout|crash|exception|failed|null|undefined ]]; then
            if [[ "$severity" != "HIGH" ]]; then
              severity="MEDIUM"
            fi
          fi
          
          echo "  [${severity}] ($count occurrences) $message" >> "$report_file"
        done
      else
        echo "  No errors found" >> "$report_file"
      fi
      
      echo "" >> "$report_file"
    done
    
    echo "" >> "$report_file"
  done
  
  # Add summary at the top
  local temp_file=$(mktemp)
  cat "$report_file" > "$temp_file"
  
  cat > "$report_file" << EOF
========================================================================
  AUSTA SuperApp Error Analysis Report
  Environment: $ENVIRONMENT
  Period: $PERIOD
  Generated: $(date)
========================================================================

SUMMARY OF FINDINGS:
- Total unique error patterns: $total_errors
- Critical issues requiring immediate attention: $critical_errors
- Analyzed journeys: ${JOURNEY}

EOF
  
  # Append the rest of the report
  tail -n +9 "$temp_file" >> "$report_file"
  rm "$temp_file"
  
  log_info "Error trend report generated: $report_file"
}

# Function to convert text report to JSON
convert_report_to_json() {
  local text_report="$1"
  local json_report="$2"
  
  log_info "Converting report to JSON format"
  
  # This is a simplified conversion - a more robust parser would be needed for production
  local json_content="{"
  json_content+="\"report_metadata\": {"
  json_content+="\"environment\": \"$ENVIRONMENT\","
  json_content+="\"period\": \"$PERIOD\","
  json_content+="\"generated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\""
  json_content+="},"
  
  # Extract summary information
  local total_errors=$(grep "Total unique error patterns:" "$text_report" | head -1 | awk '{print $5}')
  local critical_issues=$(grep "Critical issues requiring immediate attention:" "$text_report" | awk '{print $6}')
  
  json_content+="\"summary\": {"
  json_content+="\"total_error_patterns\": $total_errors,"
  json_content+="\"critical_issues\": $critical_issues,"
  json_content+="\"analyzed_journeys\": \"$JOURNEY\""
  json_content+="},"
  
  json_content+="\"journeys\": []"
  json_content+="}"
  
  echo "$json_content" | jq '.' > "$json_report"
  
  log_info "JSON report generated: $json_report"
}

# Function to convert text report to HTML
convert_report_to_html() {
  local text_report="$1"
  local html_report="$2"
  
  log_info "Converting report to HTML format"
  
  # Create HTML header
  cat > "$html_report" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AUSTA SuperApp Error Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #0066cc; margin-top: 30px; }
    .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
    .journey { margin-top: 30px; border-left: 5px solid #0066cc; padding-left: 15px; }
    .service { margin-top: 20px; }
    .error-list { margin-left: 20px; }
    .high { color: #cc0000; font-weight: bold; }
    .medium { color: #ff6600; }
    .low { color: #666; }
    .metadata { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>AUSTA SuperApp Error Analysis Report</h1>
  <div class="metadata">
    <p>Environment: $ENVIRONMENT</p>
    <p>Period: $PERIOD</p>
    <p>Generated: $(date)</p>
  </div>
  
  <div class="summary">
    <h2>Summary of Findings</h2>
    <ul>
      <li>Total unique error patterns: $(grep "Total unique error patterns:" "$text_report" | head -1 | awk '{print $5}')</li>
      <li>Critical issues requiring immediate attention: $(grep "Critical issues requiring immediate attention:" "$text_report" | awk '{print $6}')</li>
      <li>Analyzed journeys: ${JOURNEY}</li>
    </ul>
  </div>
  
  <div class="journeys">
EOF
  
  # Process the text report and convert to HTML
  local in_journey=false
  local in_service=false
  local current_journey=""
  local current_service=""
  
  while IFS= read -r line; do
    # Check for journey header
    if [[ "$line" =~ ^JOURNEY:\ ([A-Z]+)$ ]]; then
      current_journey=${BASH_REMATCH[1]}
      in_journey=true
      in_service=false
      
      # Close previous journey div if needed
      if [[ "$in_journey" == true && "$current_journey" != "" ]]; then
        echo "  </div>" >> "$html_report"
      fi
      
      # Start new journey div
      echo "  <div class=\"journey\">" >> "$html_report"
      echo "    <h2>Journey: $current_journey</h2>" >> "$html_report"
      continue
    fi
    
    # Check for service header
    if [[ "$line" =~ ^Service:\ (.+)$ && "$in_journey" == true ]]; then
      current_service=${BASH_REMATCH[1]}
      in_service=true
      
      # Close previous service div if needed
      if [[ "$in_service" == true && "$current_service" != "" ]]; then
        echo "    </div>" >> "$html_report"
      fi
      
      # Start new service div
      echo "    <div class=\"service\">" >> "$html_report"
      echo "      <h3>Service: $current_service</h3>" >> "$html_report"
      continue
    fi
    
    # Process error counts
    if [[ "$line" =~ ^Total\ unique\ error\ patterns:\ ([0-9]+)$ && "$in_service" == true ]]; then
      echo "      <p>Total unique error patterns: ${BASH_REMATCH[1]}</p>" >> "$html_report"
      continue
    fi
    
    # Process affected users
    if [[ "$line" =~ ^Affected\ users:\ ([0-9]+)$ && "$in_service" == true ]]; then
      echo "      <p>Affected users: ${BASH_REMATCH[1]}</p>" >> "$html_report"
      continue
    fi
    
    # Process top errors header
    if [[ "$line" == "Top error patterns:" && "$in_service" == true ]]; then
      echo "      <h4>Top error patterns:</h4>" >> "$html_report"
      echo "      <ul class=\"error-list\">" >> "$html_report"
      continue
    fi
    
    # Process error entries
    if [[ "$line" =~ ^[[:space:]]+\[([A-Z]+)\]\ \(([0-9]+)\ occurrences\)\ (.+)$ && "$in_service" == true ]]; then
      local severity=${BASH_REMATCH[1]}
      local count=${BASH_REMATCH[2]}
      local message=${BASH_REMATCH[3]}
      
      local severity_class="low"
      if [[ "$severity" == "HIGH" ]]; then
        severity_class="high"
      elif [[ "$severity" == "MEDIUM" ]]; then
        severity_class="medium"
      fi
      
      echo "        <li class=\"$severity_class\">[$severity] ($count occurrences) $message</li>" >> "$html_report"
      continue
    fi
    
    # Close error list if we've reached the end
    if [[ -z "$line" && "$in_service" == true ]]; then
      echo "      </ul>" >> "$html_report"
    fi
  done < "$text_report"
  
  # Close any open divs
  if [[ "$in_service" == true ]]; then
    echo "    </div>" >> "$html_report"
  fi
  
  if [[ "$in_journey" == true ]]; then
    echo "  </div>" >> "$html_report"
  fi
  
  # Add HTML footer
  cat >> "$html_report" << EOF
  </div>
</body>
</html>
EOF
  
  log_info "HTML report generated: $html_report"
}

# =========================================================================
# Main Execution
# =========================================================================

log_info "Starting log analysis for environment: $ENVIRONMENT, period: $PERIOD, journey: $JOURNEY"

# Create timestamp for this run
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="${REPORT_DIR}/${TIMESTAMP}"
mkdir -p "$OUTPUT_DIR"

# Analyze logs for the specified journey(s)
if [[ "$JOURNEY" == "all" ]]; then
  for j in "health" "care" "plan"; do
    analyze_journey "$j" "$PERIOD" "$OUTPUT_DIR"
  done
  
  # Also analyze shared services
  analyze_journey "all" "$PERIOD" "$OUTPUT_DIR"
else
  analyze_journey "$JOURNEY" "$PERIOD" "$OUTPUT_DIR"
fi

# Generate the error trend report
TEXT_REPORT="${OUTPUT_DIR}/error_analysis_report.txt"
generate_error_trend_report "$OUTPUT_DIR" "$TEXT_REPORT"

# Convert to requested format if not text
if [[ "$OUTPUT_FORMAT" == "json" ]]; then
  JSON_REPORT="${OUTPUT_DIR}/error_analysis_report.json"
  convert_report_to_json "$TEXT_REPORT" "$JSON_REPORT"
  FINAL_REPORT="$JSON_REPORT"
elif [[ "$OUTPUT_FORMAT" == "html" ]]; then
  HTML_REPORT="${OUTPUT_DIR}/error_analysis_report.html"
  convert_report_to_html "$TEXT_REPORT" "$HTML_REPORT"
  FINAL_REPORT="$HTML_REPORT"
else
  FINAL_REPORT="$TEXT_REPORT"
fi

# Create a symlink to the latest report
latest_link="${REPORT_DIR}/latest"
rm -f "$latest_link"
ln -s "$OUTPUT_DIR" "$latest_link"

log_info "Log analysis complete. Report generated at: $FINAL_REPORT"

# Check if any critical errors were found and exit with appropriate code
CRITICAL_COUNT=$(grep -c "\[HIGH\]" "$TEXT_REPORT" || true)
if [[ $CRITICAL_COUNT -gt 0 ]]; then
  log_warn "Found $CRITICAL_COUNT critical errors that require attention"
  exit 1
fi

exit 0