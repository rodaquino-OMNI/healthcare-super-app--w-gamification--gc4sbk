#!/bin/bash
# Make script executable with: chmod +x logs-collector.sh

# =========================================================================
# AUSTA SuperApp Logs Collector
# =========================================================================
# This script collects, filters, and manages logs from Docker containers
# in the AUSTA SuperApp development environment.
#
# Features:
# - Service-specific log collection
# - Log level filtering
# - Pattern matching
# - Output to file with rotation
# - Colorized output
# - Support for structured (JSON) and human-readable formats
# - Real-time log following
# - Correlation ID tracking
# =========================================================================

set -e

# Default values
SERVICE="all"
LOG_LEVEL="all"
PATTERN=""
OUTPUT_FILE=""
MAX_FILE_SIZE="10M"
MAX_FILES="5"
FOLLOW=false
FORMAT="auto"
COLOR=true
CORRELATION_ID=""
JOURNEY=""
USER_ID=""
TIMESTAMP_FORMAT="relative"
VERBOSE=false

# ANSI color codes
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
GRAY="\033[0;37m"
BOLD="\033[1m"
RESET="\033[0m"

# =========================================================================
# Help and usage information
# =========================================================================
show_help() {
    echo -e "${BOLD}AUSTA SuperApp Logs Collector${RESET}"
    echo ""
    echo "Collects, filters, and manages logs from Docker containers."
    echo ""
    echo -e "${BOLD}Usage:${RESET}"
    echo "  $0 [options]"
    echo ""
    echo -e "${BOLD}Options:${RESET}"
    echo "  -s, --service SERVICE      Filter logs by service name (default: all)"
    echo "                            Available services: api-gateway, auth-service, health-service,"
    echo "                            care-service, plan-service, gamification-engine, notification-service"
    echo "  -l, --level LEVEL         Filter logs by level (default: all)"
    echo "                            Available levels: debug, info, warn, error, fatal"
    echo "  -p, --pattern PATTERN     Filter logs by pattern"
    echo "  -o, --output FILE         Save logs to file"
    echo "  -m, --max-size SIZE       Maximum log file size before rotation (default: 10M)"
    echo "  -n, --max-files NUM       Maximum number of rotated files to keep (default: 5)"
    echo "  -f, --follow              Follow log output in real-time"
    echo "  --format FORMAT           Output format: json, text, auto (default: auto)"
    echo "  --no-color                Disable colored output"
    echo "  --correlation-id ID       Filter logs by correlation ID"
    echo "  --journey JOURNEY         Filter logs by journey (health, care, plan)"
    echo "  --user-id ID              Filter logs by user ID"
    echo "  --timestamp FORMAT        Timestamp format: iso, relative, none (default: relative)"
    echo "  -v, --verbose             Enable verbose output"
    echo "  -h, --help                Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${RESET}"
    echo "  # Show all logs from all services"
    echo "  $0"
    echo ""
    echo "  # Show only error logs from the gamification-engine"
    echo "  $0 -s gamification-engine -l error"
    echo ""
    echo "  # Follow logs from auth-service and save to file"
    echo "  $0 -s auth-service -f -o auth-logs.txt"
    echo ""
    echo "  # Filter logs containing a specific user ID"
    echo "  $0 --user-id 12345"
    echo ""
    echo "  # Track logs across services with a correlation ID"
    echo "  $0 --correlation-id abc-123-xyz"
    echo ""
    echo "  # Show logs from the health journey"
    echo "  $0 --journey health"
    echo ""
    echo -e "${BOLD}Log Levels:${RESET}"
    echo "  DEBUG   - Detailed information for debugging"
    echo "  INFO    - Normal operational messages"
    echo "  WARN    - Warning conditions that should be addressed"
    echo "  ERROR   - Error conditions that don't stop the application"
    echo "  FATAL   - Critical errors that cause the application to terminate"
}

# =========================================================================
# Argument parsing
# =========================================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -l|--level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        -p|--pattern)
            PATTERN="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -m|--max-size)
            MAX_FILE_SIZE="$2"
            shift 2
            ;;
        -n|--max-files)
            MAX_FILES="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --no-color)
            COLOR=false
            shift
            ;;
        --correlation-id)
            CORRELATION_ID="$2"
            shift 2
            ;;
        --journey)
            JOURNEY="$2"
            shift 2
            ;;
        --user-id)
            USER_ID="$2"
            shift 2
            ;;
        --timestamp)
            TIMESTAMP_FORMAT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# =========================================================================
# Utility functions
# =========================================================================

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if jq is installed
check_dependencies() {
    if ! command_exists jq; then
        echo -e "${RED}Error: jq is required for JSON processing but not installed.${RESET}"
        echo "Please install jq using your package manager:"
        echo "  - Debian/Ubuntu: sudo apt-get install jq"
        echo "  - macOS: brew install jq"
        echo "  - Windows: choco install jq"
        exit 1
    fi
    
    if ! command_exists docker; then
        echo -e "${RED}Error: docker is required but not installed.${RESET}"
        echo "Please install Docker from https://docs.docker.com/get-docker/"
        exit 1
    fi
}

# Get list of running containers for the specified service
get_containers() {
    local service=$1
    local containers
    
    if [[ "$service" == "all" ]]; then
        containers=$(docker ps --format '{{.Names}}' | grep -E 'api-gateway|auth-service|health-service|care-service|plan-service|gamification-engine|notification-service')
    else
        containers=$(docker ps --format '{{.Names}}' | grep "$service")
    fi
    
    if [[ -z "$containers" ]]; then
        echo -e "${YELLOW}Warning: No running containers found for service: $service${RESET}"
        exit 0
    fi
    
    echo "$containers"
}

# Format timestamp based on user preference
format_timestamp() {
    local timestamp=$1
    local format=$2
    
    case $format in
        iso)
            echo "$timestamp"
            ;;
        relative)
            local now=$(date +%s)
            local log_time=$(date -d "$timestamp" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${timestamp%%.*}" +%s 2>/dev/null)
            local diff=$((now - log_time))
            
            if [[ $diff -lt 60 ]]; then
                echo "${diff}s ago"
            elif [[ $diff -lt 3600 ]]; then
                echo "$((diff / 60))m ago"
            elif [[ $diff -lt 86400 ]]; then
                echo "$((diff / 3600))h ago"
            else
                echo "$((diff / 86400))d ago"
            fi
            ;;
        none)
            echo ""
            ;;
    esac
}

# Get color for log level
get_level_color() {
    local level=$1
    
    if [[ "$COLOR" != "true" ]]; then
        echo ""
        return
    fi
    
    case $level in
        DEBUG)
            echo "$GRAY"
            ;;
        INFO)
            echo "$GREEN"
            ;;
        WARN)
            echo "$YELLOW"
            ;;
        ERROR)
            echo "$RED"
            ;;
        FATAL)
            echo "$RED$BOLD"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Format log entry for display
format_log_entry() {
    local log=$1
    local is_json=false
    
    # Check if the log is in JSON format
    if [[ "$log" == *"{"* ]] && [[ "$log" == *"}"* ]]; then
        is_json=true
    fi
    
    if [[ "$is_json" == "true" ]] && [[ "$FORMAT" != "text" ]]; then
        # Process JSON log
        local timestamp level message service journey correlation_id user_id
        
        # Extract fields using jq
        timestamp=$(echo "$log" | jq -r '.timestamp // ""')
        level=$(echo "$log" | jq -r '.level // "INFO"')
        message=$(echo "$log" | jq -r '.message // ""')
        service=$(echo "$log" | jq -r '.service // ""')
        journey=$(echo "$log" | jq -r '.context.journey // ""')
        correlation_id=$(echo "$log" | jq -r '.context.correlationId // ""')
        user_id=$(echo "$log" | jq -r '.context.userId // ""')
        
        # Format timestamp
        local formatted_timestamp=""
        if [[ -n "$timestamp" ]] && [[ "$TIMESTAMP_FORMAT" != "none" ]]; then
            formatted_timestamp="[$(format_timestamp "$timestamp" "$TIMESTAMP_FORMAT")]"
        fi
        
        # Get color for log level
        local level_color=$(get_level_color "$level")
        
        # Format output
        if [[ "$FORMAT" == "json" ]]; then
            # Return the original JSON
            echo "$log"
        else
            # Format as human-readable text
            local output=""
            
            if [[ -n "$formatted_timestamp" ]]; then
                output+="$formatted_timestamp "
            fi
            
            if [[ -n "$service" ]]; then
                output+="${CYAN}[$service]${RESET} "
            fi
            
            if [[ -n "$journey" ]]; then
                output+="${MAGENTA}[$journey]${RESET} "
            fi
            
            output+="${level_color}${level}${RESET}: $message"
            
            if [[ -n "$correlation_id" ]]; then
                output+=" ${BLUE}(correlation: $correlation_id)${RESET}"
            fi
            
            if [[ -n "$user_id" ]]; then
                output+=" ${YELLOW}(user: $user_id)${RESET}"
            fi
            
            echo -e "$output"
        fi
    else
        # Non-JSON log or forced text format
        echo -e "$log"
    fi
}

# Filter log by level
filter_by_level() {
    local log=$1
    local filter_level=$2
    
    if [[ "$filter_level" == "all" ]]; then
        echo "$log"
        return
    fi
    
    # Convert filter level to uppercase
    filter_level=$(echo "$filter_level" | tr '[:lower:]' '[:upper:]')
    
    # Define log level hierarchy
    declare -A level_hierarchy
    level_hierarchy[DEBUG]=1
    level_hierarchy[INFO]=2
    level_hierarchy[WARN]=3
    level_hierarchy[ERROR]=4
    level_hierarchy[FATAL]=5
    
    # Get the minimum level to show
    local min_level=${level_hierarchy[$filter_level]}
    
    # Check if the log is in JSON format
    if [[ "$log" == *"{"* ]] && [[ "$log" == *"}"* ]]; then
        # Extract log level from JSON
        local log_level=$(echo "$log" | jq -r '.level // "INFO"')
        local log_level_value=${level_hierarchy[$log_level]}
        
        # Show log if its level is >= the filter level
        if [[ -n "$log_level_value" ]] && [[ $log_level_value -ge $min_level ]]; then
            echo "$log"
        fi
    else
        # For non-JSON logs, use simple pattern matching
        if [[ "$log" == *"$filter_level"* ]]; then
            echo "$log"
        fi
    fi
}

# Filter log by pattern
filter_by_pattern() {
    local log=$1
    local pattern=$2
    
    if [[ -z "$pattern" ]]; then
        echo "$log"
        return
    fi
    
    if [[ "$log" == *"$pattern"* ]]; then
        echo "$log"
    fi
}

# Filter log by correlation ID
filter_by_correlation_id() {
    local log=$1
    local correlation_id=$2
    
    if [[ -z "$correlation_id" ]]; then
        echo "$log"
        return
    fi
    
    # Check if the log is in JSON format
    if [[ "$log" == *"{"* ]] && [[ "$log" == *"}"* ]]; then
        # Extract correlation ID from JSON
        local log_correlation_id=$(echo "$log" | jq -r '.context.correlationId // ""')
        
        if [[ "$log_correlation_id" == "$correlation_id" ]]; then
            echo "$log"
        fi
    else
        # For non-JSON logs, use simple pattern matching
        if [[ "$log" == *"$correlation_id"* ]]; then
            echo "$log"
        fi
    fi
}

# Filter log by journey
filter_by_journey() {
    local log=$1
    local journey=$2
    
    if [[ -z "$journey" ]]; then
        echo "$log"
        return
    fi
    
    # Check if the log is in JSON format
    if [[ "$log" == *"{"* ]] && [[ "$log" == *"}"* ]]; then
        # Extract journey from JSON
        local log_journey=$(echo "$log" | jq -r '.context.journey // ""')
        
        if [[ "$log_journey" == "$journey" ]]; then
            echo "$log"
        fi
    else
        # For non-JSON logs, use simple pattern matching
        if [[ "$log" == *"$journey"* ]]; then
            echo "$log"
        fi
    fi
}

# Filter log by user ID
filter_by_user_id() {
    local log=$1
    local user_id=$2
    
    if [[ -z "$user_id" ]]; then
        echo "$log"
        return
    fi
    
    # Check if the log is in JSON format
    if [[ "$log" == *"{"* ]] && [[ "$log" == *"}"* ]]; then
        # Extract user ID from JSON
        local log_user_id=$(echo "$log" | jq -r '.context.userId // ""')
        
        if [[ "$log_user_id" == "$user_id" ]]; then
            echo "$log"
        fi
    else
        # For non-JSON logs, use simple pattern matching
        if [[ "$log" == *"$user_id"* ]]; then
            echo "$log"
        fi
    fi
}

# Apply all filters to a log entry
apply_filters() {
    local log=$1
    local result
    
    # Apply level filter
    result=$(filter_by_level "$log" "$LOG_LEVEL")
    if [[ -z "$result" ]]; then
        return
    fi
    
    # Apply pattern filter
    result=$(filter_by_pattern "$result" "$PATTERN")
    if [[ -z "$result" ]]; then
        return
    fi
    
    # Apply correlation ID filter
    result=$(filter_by_correlation_id "$result" "$CORRELATION_ID")
    if [[ -z "$result" ]]; then
        return
    fi
    
    # Apply journey filter
    result=$(filter_by_journey "$result" "$JOURNEY")
    if [[ -z "$result" ]]; then
        return
    fi
    
    # Apply user ID filter
    result=$(filter_by_user_id "$result" "$USER_ID")
    if [[ -z "$result" ]]; then
        return
    fi
    
    # Format the log entry
    format_log_entry "$result"
}

# Setup log rotation
setup_log_rotation() {
    local output_file=$1
    local max_size=$2
    local max_files=$3
    
    # Check if the output file exists and is larger than max_size
    if [[ -f "$output_file" ]]; then
        local file_size=$(du -k "$output_file" | cut -f1)
        local max_size_kb=$(echo "$max_size" | sed 's/[^0-9]//g')
        
        # Convert max_size to KB if it's in MB or GB
        if [[ "$max_size" == *M* ]]; then
            max_size_kb=$((max_size_kb * 1024))
        elif [[ "$max_size" == *G* ]]; then
            max_size_kb=$((max_size_kb * 1024 * 1024))
        fi
        
        if [[ $file_size -ge $max_size_kb ]]; then
            # Rotate logs
            for ((i=max_files-1; i>=1; i--)); do
                if [[ -f "${output_file}.$i" ]]; then
                    mv "${output_file}.$i" "${output_file}.$((i+1))"
                fi
            done
            
            mv "$output_file" "${output_file}.1"
            touch "$output_file"
            
            echo -e "${YELLOW}Log file rotated: $output_file -> ${output_file}.1${RESET}"
        fi
    fi
}

# =========================================================================
# Main log collection logic
# =========================================================================

# Check dependencies
check_dependencies

# Print configuration if verbose mode is enabled
if [[ "$VERBOSE" == "true" ]]; then
    echo -e "${BOLD}Configuration:${RESET}"
    echo "Service: $SERVICE"
    echo "Log Level: $LOG_LEVEL"
    echo "Pattern: $PATTERN"
    echo "Output File: $OUTPUT_FILE"
    echo "Max File Size: $MAX_FILE_SIZE"
    echo "Max Files: $MAX_FILES"
    echo "Follow: $FOLLOW"
    echo "Format: $FORMAT"
    echo "Color: $COLOR"
    echo "Correlation ID: $CORRELATION_ID"
    echo "Journey: $JOURNEY"
    echo "User ID: $USER_ID"
    echo "Timestamp Format: $TIMESTAMP_FORMAT"
    echo "Verbose: $VERBOSE"
    echo ""
 fi

# Get containers for the specified service
containers=$(get_containers "$SERVICE")

if [[ "$VERBOSE" == "true" ]]; then
    echo -e "${BOLD}Collecting logs from containers:${RESET}"
    echo "$containers"
    echo ""
fi

# Setup log collection command
log_cmd="docker logs"
if [[ "$FOLLOW" == "true" ]]; then
    log_cmd="$log_cmd -f"
fi

# Setup output redirection
if [[ -n "$OUTPUT_FILE" ]]; then
    # Create or truncate the output file
    if [[ ! -f "$OUTPUT_FILE" ]]; then
        touch "$OUTPUT_FILE"
    else
        # Check if rotation is needed
        setup_log_rotation "$OUTPUT_FILE" "$MAX_FILE_SIZE" "$MAX_FILES"
    fi
    
    echo -e "${GREEN}Saving logs to: $OUTPUT_FILE${RESET}"
    echo -e "${GREEN}Max file size: $MAX_FILE_SIZE, Max files: $MAX_FILES${RESET}"
    echo ""
fi

# Print header
echo -e "${BOLD}AUSTA SuperApp Logs${RESET}"
echo -e "${GRAY}Started at $(date)${RESET}"
echo -e "${GRAY}Press Ctrl+C to stop${RESET}"
echo ""

# Process logs from each container
for container in $containers; do
    # Extract service name from container name
    service_name=$(echo "$container" | sed -E 's/.*_([^_]+)_[0-9]+/\1/')
    
    if [[ "$FOLLOW" == "true" ]]; then
        # For follow mode, we need to run in background and tag each line with the container name
        if [[ -n "$OUTPUT_FILE" ]]; then
            # Follow logs and save to file
            $log_cmd "$container" | while read -r line; do
                filtered=$(apply_filters "$line")
                if [[ -n "$filtered" ]]; then
                    echo "$filtered" | tee -a "$OUTPUT_FILE"
                    
                    # Check if rotation is needed after each write
                    setup_log_rotation "$OUTPUT_FILE" "$MAX_FILE_SIZE" "$MAX_FILES"
                fi
            done &
        else
            # Follow logs without saving to file
            $log_cmd "$container" | while read -r line; do
                filtered=$(apply_filters "$line")
                if [[ -n "$filtered" ]]; then
                    echo "$filtered"
                fi
            done &
        fi
    else
        # For non-follow mode, collect all logs at once
        if [[ -n "$OUTPUT_FILE" ]]; then
            # Collect logs and save to file
            docker logs "$container" | while read -r line; do
                filtered=$(apply_filters "$line")
                if [[ -n "$filtered" ]]; then
                    echo "$filtered" | tee -a "$OUTPUT_FILE"
                fi
            done
        else
            # Collect logs without saving to file
            docker logs "$container" | while read -r line; do
                filtered=$(apply_filters "$line")
                if [[ -n "$filtered" ]]; then
                    echo "$filtered"
                fi
            done
        fi
    fi
done

# If in follow mode, wait for user to press Ctrl+C
if [[ "$FOLLOW" == "true" ]]; then
    # Wait for all background processes
    wait
fi

echo -e "\n${GRAY}Log collection completed at $(date)${RESET}"