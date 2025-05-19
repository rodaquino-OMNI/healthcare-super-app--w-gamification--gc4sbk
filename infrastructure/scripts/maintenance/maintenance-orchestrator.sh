#!/bin/bash

#############################################################################
# AUSTA SuperApp Maintenance Orchestrator
#
# This script orchestrates all maintenance activities for the AUSTA SuperApp
# infrastructure and services. It determines which tasks should be executed
# based on schedules or on-demand requests, coordinates dependencies between
# tasks, handles logging and reporting, and ensures graceful error recovery
# if maintenance tasks fail.
#
# Usage: ./maintenance-orchestrator.sh [options]
#
# Options:
#   -e, --environment ENV   Specify environment (dev, staging, prod) [default: current env]
#   -t, --task TASK         Run specific maintenance task
#   -a, --all               Run all scheduled maintenance tasks
#   -f, --force             Force execution even if outside maintenance window
#   -d, --dry-run           Show what would be executed without actually running
#   -v, --verbose           Enable verbose output
#   -h, --help              Display this help message
#
# Examples:
#   ./maintenance-orchestrator.sh --environment prod --task db-vacuum-analyze
#   ./maintenance-orchestrator.sh --all --dry-run
#
# Author: AUSTA Platform Team
# Created: May 2025
#############################################################################

# Exit on error, undefined variables, and propagate pipe errors
set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions
source "${SCRIPT_DIR}/common.sh"

# Default values
ENVIRONMENT=""
SPECIFIC_TASK=""
RUN_ALL=false
FORCE_EXECUTION=false
DRY_RUN=false
VERBOSE=false

# Maintenance task definitions with dependencies and schedules
declare -A TASK_DEPENDENCIES
declare -A TASK_SCHEDULES
declare -A TASK_DESCRIPTIONS
declare -A TASK_IMPACT
declare -A TASK_TIMEOUT

# Initialize task metadata
function initialize_task_metadata() {
    # Database maintenance tasks
    TASK_DEPENDENCIES["db-vacuum-analyze"]=""
    TASK_SCHEDULES["db-vacuum-analyze"]="daily"
    TASK_DESCRIPTIONS["db-vacuum-analyze"]="PostgreSQL vacuum analysis to reclaim storage and update statistics"
    TASK_IMPACT["db-vacuum-analyze"]="none"
    TASK_TIMEOUT["db-vacuum-analyze"]="3600" # 1 hour

    TASK_DEPENDENCIES["db-index-optimize"]="db-vacuum-analyze"
    TASK_SCHEDULES["db-index-optimize"]="weekly"
    TASK_DESCRIPTIONS["db-index-optimize"]="Database index optimization to improve query performance"
    TASK_IMPACT["db-index-optimize"]="none"
    TASK_TIMEOUT["db-index-optimize"]="7200" # 2 hours

    # Kubernetes maintenance tasks
    TASK_DEPENDENCIES["k8s-node-rotation"]=""
    TASK_SCHEDULES["k8s-node-rotation"]="monthly"
    TASK_DESCRIPTIONS["k8s-node-rotation"]="Kubernetes node rotation for security updates and kernel patches"
    TASK_IMPACT["k8s-node-rotation"]="none (rolling update)"
    TASK_TIMEOUT["k8s-node-rotation"]="14400" # 4 hours

    TASK_DEPENDENCIES["k8s-eks-upgrade"]="k8s-node-rotation"
    TASK_SCHEDULES["k8s-eks-upgrade"]="quarterly"
    TASK_DESCRIPTIONS["k8s-eks-upgrade"]="EKS cluster version upgrade"
    TASK_IMPACT["k8s-eks-upgrade"]="none (rolling update)"
    TASK_TIMEOUT["k8s-eks-upgrade"]="21600" # 6 hours

    # Security maintenance tasks
    TASK_DEPENDENCIES["security-os-patch"]=""
    TASK_SCHEDULES["security-os-patch"]="monthly"
    TASK_DESCRIPTIONS["security-os-patch"]="OS security patching for EKS nodes"
    TASK_IMPACT["security-os-patch"]="none (rolling update)"
    TASK_TIMEOUT["security-os-patch"]="10800" # 3 hours

    TASK_DEPENDENCIES["security-deps-update"]=""
    TASK_SCHEDULES["security-deps-update"]="weekly"
    TASK_DESCRIPTIONS["security-deps-update"]="Dependency updates for security vulnerabilities"
    TASK_IMPACT["security-deps-update"]="requires testing"
    TASK_TIMEOUT["security-deps-update"]="7200" # 2 hours

    # Backup verification tasks
    TASK_DEPENDENCIES["backup-verify"]=""
    TASK_SCHEDULES["backup-verify"]="monthly"
    TASK_DESCRIPTIONS["backup-verify"]="Backup restoration test to verify backup integrity"
    TASK_IMPACT["backup-verify"]="none (uses clone)"
    TASK_TIMEOUT["backup-verify"]="10800" # 3 hours

    TASK_DEPENDENCIES["dr-drill"]="backup-verify"
    TASK_SCHEDULES["dr-drill"]="quarterly"
    TASK_DESCRIPTIONS["dr-drill"]="Disaster recovery drill to test failover procedures"
    TASK_IMPACT["dr-drill"]="none (uses DR region)"
    TASK_TIMEOUT["dr-drill"]="18000" # 5 hours
}

# Parse command line arguments
function parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--task)
                SPECIFIC_TASK="$2"
                shift 2
                ;;
            -a|--all)
                RUN_ALL=true
                shift
                ;;
            -f|--force)
                FORCE_EXECUTION=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
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
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # If environment is not specified, detect current environment
    if [[ -z "$ENVIRONMENT" ]]; then
        ENVIRONMENT=$(detect_environment)
        log_info "Detected environment: $ENVIRONMENT"
    fi

    # Validate environment
    if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
        exit 1
    fi
}

# Display help message
function show_help() {
    grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# \?//'
}

# Check if we're in a maintenance window for the specified environment
function is_maintenance_window() {
    local env=$1
    local task=$2
    
    # If force execution is enabled, always return true
    if [[ "$FORCE_EXECUTION" == "true" ]]; then
        return 0
    fi
    
    # Get current day of week (0-6, Sunday is 0) and hour (0-23)
    local day_of_week=$(date +%w)
    local hour=$(date +%H)
    
    # Define maintenance windows for each environment
    case "$env" in
        dev)
            # Development environment: Any time
            return 0
            ;;
        staging)
            # Staging environment: Weekdays after hours (7PM-7AM) and weekends
            if [[ "$day_of_week" == "0" || "$day_of_week" == "6" ]] || \
               [[ "$hour" -ge 19 || "$hour" -lt 7 ]]; then
                return 0
            else
                return 1
            fi
            ;;
        prod)
            # Production environment: Depends on task impact
            local impact=${TASK_IMPACT[$task]}
            
            if [[ "$impact" == "none"* ]]; then
                # Tasks with no impact can run anytime
                return 0
            else
                # Tasks with impact: Only during low-traffic hours (1AM-5AM)
                if [[ "$hour" -ge 1 && "$hour" -lt 5 ]]; then
                    return 0
                else
                    return 1
                fi
            fi
            ;;
    esac
    
    # Default: Not in maintenance window
    return 1
}

# Check if a task is due to run based on its schedule
function is_task_due() {
    local task=$1
    local schedule=${TASK_SCHEDULES[$task]}
    
    # If running a specific task or all tasks, consider it due
    if [[ -n "$SPECIFIC_TASK" || "$RUN_ALL" == "true" ]]; then
        return 0
    fi
    
    # Get current date components
    local current_day=$(date +%d)
    local current_weekday=$(date +%u) # 1-7, Monday is 1
    local current_month=$(date +%m)
    local current_quarter=$(( ($(date +%m) - 1) / 3 + 1 ))
    
    case "$schedule" in
        daily)
            # Daily tasks are always due
            return 0
            ;;
        weekly)
            # Weekly tasks run on Sunday (day 7)
            if [[ "$current_weekday" -eq 7 ]]; then
                return 0
            fi
            ;;
        monthly)
            # Monthly tasks run on the 1st of the month
            if [[ "$current_day" -eq 1 ]]; then
                return 0
            fi
            ;;
        quarterly)
            # Quarterly tasks run on the 1st day of each quarter
            if [[ "$current_day" -eq 1 && ("$current_month" -eq 1 || "$current_month" -eq 4 || "$current_month" -eq 7 || "$current_month" -eq 10) ]]; then
                return 0
            fi
            ;;
    esac
    
    # Not due
    return 1
}

# Build a dependency graph and return a sorted list of tasks to execute
function build_execution_plan() {
    local requested_task=$1
    local -a execution_plan
    local -A visited
    
    # Helper function for depth-first traversal
    function visit_task() {
        local task=$1
        
        # Skip if already visited
        if [[ -n "${visited[$task]:-}" ]]; then
            return
        fi
        
        # Mark as visited
        visited[$task]=1
        
        # Visit dependencies first
        local deps=${TASK_DEPENDENCIES[$task]}
        if [[ -n "$deps" ]]; then
            for dep in $deps; do
                visit_task "$dep"
            done
        fi
        
        # Add task to execution plan
        execution_plan+=("$task")
    }
    
    # If a specific task is requested, build plan for that task
    if [[ -n "$requested_task" ]]; then
        if [[ -z "${TASK_DESCRIPTIONS[$requested_task]:-}" ]]; then
            log_error "Unknown task: $requested_task"
            exit 1
        fi
        visit_task "$requested_task"
    else
        # Otherwise, build plan for all due tasks
        for task in "${!TASK_DESCRIPTIONS[@]}"; do
            if is_task_due "$task"; then
                visit_task "$task"
            fi
        done
    fi
    
    # Return the execution plan
    echo "${execution_plan[@]:-}"
}

# Execute a maintenance task with timeout and error handling
function execute_task() {
    local task=$1
    local timeout=${TASK_TIMEOUT[$task]}
    local task_script="${SCRIPT_DIR}/${task}.sh"
    local start_time=$(date +%s)
    local status_file="/tmp/maintenance_${task}_status_$$"
    local log_file="/tmp/maintenance_${task}_log_$$"
    
    # Check if task script exists
    if [[ ! -f "$task_script" ]]; then
        log_error "Task script not found: $task_script"
        return 1
    fi
    
    # Make sure the script is executable
    chmod +x "$task_script"
    
    # Log task execution start
    log_info "Starting maintenance task: $task (${TASK_DESCRIPTIONS[$task]})"
    send_metric "maintenance_task_start" "task=$task,environment=$ENVIRONMENT" 1
    
    # If dry run, just log and return
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would execute: $task_script --environment $ENVIRONMENT"
        return 0
    fi
    
    # Execute the task with timeout
    log_debug "Executing: $task_script --environment $ENVIRONMENT"
    {
        timeout "$timeout" "$task_script" --environment "$ENVIRONMENT" > "$log_file" 2>&1
        echo $? > "$status_file"
    } &
    local task_pid=$!
    
    # Wait for task to complete
    wait "$task_pid" || true
    
    # Get task exit status
    local task_status=$(cat "$status_file")
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Clean up temporary files
    rm -f "$status_file"
    
    # Process task result
    if [[ "$task_status" -eq 0 ]]; then
        log_info "Maintenance task completed successfully: $task (duration: $(format_duration $duration))"
        send_metric "maintenance_task_success" "task=$task,environment=$ENVIRONMENT" 1
        send_metric "maintenance_task_duration" "task=$task,environment=$ENVIRONMENT" "$duration"
        
        # Archive logs
        archive_task_logs "$task" "$log_file" "success"
        return 0
    elif [[ "$task_status" -eq 124 || "$task_status" -eq 137 ]]; then
        log_error "Maintenance task timed out after $(format_duration $timeout): $task"
        send_metric "maintenance_task_timeout" "task=$task,environment=$ENVIRONMENT" 1
        send_alert "Maintenance task timed out" "Task $task in $ENVIRONMENT environment timed out after $(format_duration $timeout)" "warning"
        
        # Archive logs
        archive_task_logs "$task" "$log_file" "timeout"
        return 2
    else
        log_error "Maintenance task failed with status $task_status: $task"
        send_metric "maintenance_task_failure" "task=$task,environment=$ENVIRONMENT" 1
        send_alert "Maintenance task failed" "Task $task in $ENVIRONMENT environment failed with status $task_status" "critical"
        
        # Archive logs
        archive_task_logs "$task" "$log_file" "failure"
        return 1
    fi
}

# Archive task logs to S3 and local log directory
function archive_task_logs() {
    local task=$1
    local log_file=$2
    local status=$3
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_dir="/var/log/austa/maintenance"
    local s3_bucket="austa-${ENVIRONMENT}-logs"
    local s3_prefix="maintenance/${ENVIRONMENT}/${task}/${timestamp}_${status}"
    
    # Create log directory if it doesn't exist
    mkdir -p "$log_dir"
    
    # Copy log to local log directory
    cp "$log_file" "${log_dir}/${task}_${timestamp}_${status}.log"
    
    # Upload log to S3 if not in dev environment
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        if command -v aws &> /dev/null; then
            aws s3 cp "$log_file" "s3://${s3_bucket}/${s3_prefix}.log" || \
                log_warning "Failed to upload logs to S3"
        else
            log_warning "AWS CLI not found, skipping S3 log upload"
        fi
    fi
    
    # Clean up temporary log file
    rm -f "$log_file"
}

# Format duration in seconds to human-readable format
function format_duration() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    
    if [[ "$hours" -gt 0 ]]; then
        echo "${hours}h ${minutes}m ${secs}s"
    elif [[ "$minutes" -gt 0 ]]; then
        echo "${minutes}m ${secs}s"
    else
        echo "${secs}s"
    fi
}

# Send metric to monitoring system
function send_metric() {
    local metric_name=$1
    local tags=$2
    local value=$3
    
    # Skip if dry run
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    # Use AWS CloudWatch if available
    if command -v aws &> /dev/null; then
        log_debug "Sending metric to CloudWatch: $metric_name[$tags]=$value"
        aws cloudwatch put-metric-data \
            --namespace "AUSTA/Maintenance" \
            --metric-name "$metric_name" \
            --dimensions "Environment=$ENVIRONMENT,Task=${tags#*=}" \
            --value "$value" \
            --unit "Count" || log_warning "Failed to send metric to CloudWatch"
    fi
    
    # Use Prometheus Pushgateway if available
    if command -v curl &> /dev/null && [[ -n "${PUSHGATEWAY_URL:-}" ]]; then
        log_debug "Sending metric to Prometheus: $metric_name[$tags]=$value"
        echo "$metric_name{$tags} $value $(date +%s)000" | \
            curl -s --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/maintenance" || \
            log_warning "Failed to send metric to Prometheus"
    fi
}

# Send alert to monitoring/alerting system
function send_alert() {
    local title=$1
    local message=$2
    local severity=$3
    
    # Skip if dry run
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log_info "Sending alert: [$severity] $title - $message"
    
    # Use AWS SNS if available
    if command -v aws &> /dev/null; then
        local sns_topic="arn:aws:sns:us-east-1:123456789012:austa-${ENVIRONMENT}-alerts"
        aws sns publish \
            --topic-arn "$sns_topic" \
            --subject "[AUSTA-$ENVIRONMENT-$severity] $title" \
            --message "$message" || log_warning "Failed to send alert to SNS"
    fi
    
    # Use PagerDuty if available and severity is high enough
    if command -v curl &> /dev/null && [[ "$severity" == "critical" ]] && [[ -n "${PAGERDUTY_KEY:-}" ]]; then
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "{
                \"routing_key\": \"${PAGERDUTY_KEY}\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"$title\",
                    \"source\": \"maintenance-orchestrator\",
                    \"severity\": \"$severity\",
                    \"component\": \"maintenance\",
                    \"group\": \"$ENVIRONMENT\",
                    \"class\": \"maintenance\",
                    \"custom_details\": {
                        \"message\": \"$message\",
                        \"environment\": \"$ENVIRONMENT\"
                    }
                }
            }" \
            "https://events.pagerduty.com/v2/enqueue" || log_warning "Failed to send alert to PagerDuty"
    fi
}

# Generate a maintenance report
function generate_report() {
    local -a executed_tasks=($@)
    local report_file="/tmp/maintenance_report_${ENVIRONMENT}_$(date +%Y%m%d).txt"
    local success_count=0
    local failure_count=0
    local skipped_count=0
    
    # Create report header
    cat > "$report_file" << EOF
==========================================================================
                AUSTA SuperApp Maintenance Report
==========================================================================
Environment: $ENVIRONMENT
Date: $(date)
Execution Mode: $(if [[ -n "$SPECIFIC_TASK" ]]; then echo "Specific task: $SPECIFIC_TASK"; elif [[ "$RUN_ALL" == "true" ]]; then echo "All tasks"; else echo "Scheduled tasks"; fi)
$(if [[ "$DRY_RUN" == "true" ]]; then echo "DRY RUN - No tasks were actually executed"; fi)

Task Execution Summary:
--------------------------------------------------------------------------
EOF
    
    # Add task execution details
    for task in "${!TASK_DESCRIPTIONS[@]}"; do
        local status="SKIPPED"
        local reason="Not scheduled"
        
        # Check if task was executed
        if [[ " ${executed_tasks[*]} " =~ " $task " ]]; then
            # Get task status from metrics
            if [[ -f "/tmp/maintenance_${task}_status" ]]; then
                local task_status=$(cat "/tmp/maintenance_${task}_status")
                if [[ "$task_status" -eq 0 ]]; then
                    status="SUCCESS"
                    ((success_count++))
                else
                    status="FAILED"
                    reason="Exit code: $task_status"
                    ((failure_count++))
                fi
                rm -f "/tmp/maintenance_${task}_status"
            else
                status="UNKNOWN"
                reason="Status file not found"
                ((failure_count++))
            fi
        else
            ((skipped_count++))
            
            # Determine reason for skipping
            if ! is_task_due "$task"; then
                reason="Not scheduled for today"
            elif [[ -n "$SPECIFIC_TASK" && "$SPECIFIC_TASK" != "$task" ]]; then
                reason="Different task specified"
            elif ! is_maintenance_window "$ENVIRONMENT" "$task"; then
                reason="Outside maintenance window"
            fi
        fi
        
        # Add to report
        printf "%-20s %-10s %-50s %-15s\n" "$task" "$status" "${TASK_DESCRIPTIONS[$task]}" "$reason" >> "$report_file"
    done
    
    # Add summary
    cat >> "$report_file" << EOF
--------------------------------------------------------------------------
Summary: $success_count succeeded, $failure_count failed, $skipped_count skipped
==========================================================================
EOF
    
    # Log report location
    log_info "Maintenance report generated: $report_file"
    
    # Send report via email if not in dev environment
    if [[ "$ENVIRONMENT" != "dev" && "$DRY_RUN" != "true" ]]; then
        if command -v mail &> /dev/null; then
            mail -s "[AUSTA-$ENVIRONMENT] Maintenance Report $(date +%Y-%m-%d)" "platform-team@austa.com" < "$report_file" || \
                log_warning "Failed to send maintenance report email"
        else
            log_warning "Mail command not found, skipping report email"
        fi
    fi
    
    # Upload report to S3 if not in dev environment
    if [[ "$ENVIRONMENT" != "dev" && "$DRY_RUN" != "true" ]]; then
        if command -v aws &> /dev/null; then
            local s3_bucket="austa-${ENVIRONMENT}-logs"
            local s3_prefix="maintenance/reports/${ENVIRONMENT}/$(date +%Y/%m/%d)/maintenance_report.txt"
            aws s3 cp "$report_file" "s3://${s3_bucket}/${s3_prefix}" || \
                log_warning "Failed to upload report to S3"
        else
            log_warning "AWS CLI not found, skipping S3 report upload"
        fi
    fi
    
    # Return overall status (0 if all succeeded, 1 if any failed)
    if [[ "$failure_count" -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

# Main function
function main() {
    local start_time=$(date +%s)
    local -a executed_tasks
    local overall_status=0
    
    # Initialize task metadata
    initialize_task_metadata
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Log script start
    log_info "Starting maintenance orchestrator in $ENVIRONMENT environment"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Running in DRY RUN mode - no tasks will be executed"
    fi
    
    # Build execution plan
    local execution_plan=($(build_execution_plan "$SPECIFIC_TASK"))
    
    if [[ ${#execution_plan[@]} -eq 0 ]]; then
        log_info "No maintenance tasks to execute"
        exit 0
    fi
    
    # Log execution plan
    log_info "Execution plan: ${execution_plan[*]}"
    
    # Execute tasks
    for task in "${execution_plan[@]}"; do
        # Check if we're in a maintenance window for this task
        if ! is_maintenance_window "$ENVIRONMENT" "$task"; then
            log_warning "Skipping task $task: Outside maintenance window"
            continue
        fi
        
        # Execute the task
        executed_tasks+=("$task")
        execute_task "$task"
        local task_status=$?
        
        # Save task status for reporting
        echo "$task_status" > "/tmp/maintenance_${task}_status"
        
        # Update overall status
        if [[ "$task_status" -ne 0 ]]; then
            overall_status=1
        fi
    done
    
    # Generate report
    generate_report "${executed_tasks[@]}"
    
    # Log script end
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_info "Maintenance orchestrator completed in $(format_duration $duration) with status $overall_status"
    
    # Send completion metric
    send_metric "maintenance_orchestrator_completion" "environment=$ENVIRONMENT" "$overall_status"
    
    # Exit with overall status
    exit "$overall_status"
}

# Execute main function
main "$@"