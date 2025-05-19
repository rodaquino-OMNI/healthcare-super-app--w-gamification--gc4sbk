#!/bin/bash

# =========================================================================
# AUSTA SuperApp Maintenance Scheduler
# =========================================================================
# This script generates and configures crontab entries for maintenance tasks
# across different environments (development, staging, production).
# It handles scheduling for daily, weekly, monthly, and quarterly tasks,
# with environment-specific timing adjustments and monitoring integration.
# =========================================================================

set -e

# -------------------------------------------------------------------------
# Configuration Variables
# -------------------------------------------------------------------------

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAINTENANCE_DIR="${SCRIPT_DIR}/.."
LOG_DIR="/var/log/austa/maintenance"
CRONTAB_FILE="/etc/cron.d/austa-maintenance"

# Environment detection
if [[ -f "/etc/austa/environment" ]]; then
  ENVIRONMENT=$(cat /etc/austa/environment)
else
  # Default to development if not specified
  ENVIRONMENT="development"
fi

# Monitoring integration
MONITORING_ENDPOINT="http://monitoring-service:8080/api/v1/maintenance"
MONITORING_API_KEY="${MONITORING_API_KEY:-default-key}"

# -------------------------------------------------------------------------
# Environment-specific maintenance windows
# -------------------------------------------------------------------------

# Default maintenance windows by environment
case "${ENVIRONMENT}" in
  "production")
    # Production: Maintenance during lowest traffic periods
    DAILY_WINDOW="01:00"    # 1:00 AM
    WEEKLY_WINDOW="SAT 02:00"  # Saturday 2:00 AM
    MONTHLY_WINDOW="1 03:00"   # 1st day of month 3:00 AM
    QUARTERLY_WINDOW="1 04:00" # 1st day of quarter 4:00 AM
    ;;
  "staging")
    # Staging: Maintenance during business hours for observation
    DAILY_WINDOW="22:00"    # 10:00 PM
    WEEKLY_WINDOW="FRI 23:00"  # Friday 11:00 PM
    MONTHLY_WINDOW="15 00:00"  # 15th day of month 12:00 AM
    QUARTERLY_WINDOW="15 01:00" # 15th day of quarter 1:00 AM
    ;;
  *) # Development and others
    # Development: Immediate maintenance for faster testing
    DAILY_WINDOW="20:00"    # 8:00 PM
    WEEKLY_WINDOW="MON 21:00"  # Monday 9:00 PM
    MONTHLY_WINDOW="20 22:00"  # 20th day of month 10:00 PM
    QUARTERLY_WINDOW="20 23:00" # 20th day of quarter 11:00 PM
    ;;
esac

# -------------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------------

# Function to create log directory if it doesn't exist
setup_log_directory() {
  if [[ ! -d "${LOG_DIR}" ]]; then
    mkdir -p "${LOG_DIR}"
    chmod 755 "${LOG_DIR}"
  fi
}

# Function to notify monitoring system about task execution
notify_monitoring() {
  local task_name="$1"
  local status="$2"
  local message="$3"
  
  # Send notification to monitoring endpoint
  curl -s -X POST "${MONITORING_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${MONITORING_API_KEY}" \
    -d "{
      \"task\": \"${task_name}\",
      \"environment\": \"${ENVIRONMENT}\",
      \"status\": \"${status}\",
      \"message\": \"${message}\",
      \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }" > /dev/null 2>&1 || true
}

# Function to generate crontab entry with monitoring integration
generate_crontab_entry() {
  local schedule="$1"
  local task_name="$2"
  local script_path="$3"
  local log_file="${LOG_DIR}/${task_name}.log"
  
  # Create wrapper command that includes monitoring notifications
  local wrapper_cmd=""
  wrapper_cmd+="{ echo \"[\$(date)] Starting ${task_name}\" >> ${log_file}; "
  wrapper_cmd+="curl -s -X POST \"${MONITORING_ENDPOINT}\" -H \"Content-Type: application/json\" -H \"X-API-Key: ${MONITORING_API_KEY}\" "
  wrapper_cmd+="-d \"{\\\"task\\\": \\\"${task_name}\\\", \\\"environment\\\": \\\"${ENVIRONMENT}\\\", \\\"status\\\": \\\"started\\\", \\\"timestamp\\\": \\\"\$(date -u +\\\"%Y-%m-%dT%H:%M:%SZ\\\")\\\"}\"; "
  wrapper_cmd+="${script_path} >> ${log_file} 2>&1; "
  wrapper_cmd+="exit_code=\$?; "
  wrapper_cmd+="status=\"completed\"; "
  wrapper_cmd+="[[ \$exit_code -ne 0 ]] && status=\"failed\"; "
  wrapper_cmd+="echo \"[\$(date)] Finished ${task_name} with status \$status (exit code: \$exit_code)\" >> ${log_file}; "
  wrapper_cmd+="curl -s -X POST \"${MONITORING_ENDPOINT}\" -H \"Content-Type: application/json\" -H \"X-API-Key: ${MONITORING_API_KEY}\" "
  wrapper_cmd+="-d \"{\\\"task\\\": \\\"${task_name}\\\", \\\"environment\\\": \\\"${ENVIRONMENT}\\\", \\\"status\\\": \\\"\$status\\\", \\\"exit_code\\\": \$exit_code, \\\"timestamp\\\": \\\"\$(date -u +\\\"%Y-%m-%dT%H:%M:%SZ\\\")\\\"}\"; "
  wrapper_cmd+="}"
  
  # Return the complete crontab entry
  echo "${schedule} root ${wrapper_cmd}"
}

# Function to parse maintenance window into cron schedule
parse_maintenance_window() {
  local window="$1"
  local type="$2"
  
  # Extract hour and minute
  local hour_minute=""
  local day="*"
  local month="*"
  local weekday="*"
  
  case "${type}" in
    "daily")
      hour_minute="${window}"
      ;;
    "weekly")
      # Format: "DAY HH:MM" (e.g., "SAT 02:00")
      weekday=$(echo "${window}" | awk '{print $1}')
      hour_minute=$(echo "${window}" | awk '{print $2}')
      
      # Convert text day to number (0-6, where 0 is Sunday)
      case "${weekday}" in
        "SUN") weekday="0" ;;
        "MON") weekday="1" ;;
        "TUE") weekday="2" ;;
        "WED") weekday="3" ;;
        "THU") weekday="4" ;;
        "FRI") weekday="5" ;;
        "SAT") weekday="6" ;;
      esac
      ;;
    "monthly")
      # Format: "DD HH:MM" (e.g., "1 03:00")
      day=$(echo "${window}" | awk '{print $1}')
      hour_minute=$(echo "${window}" | awk '{print $2}')
      ;;
    "quarterly")
      # Format: "DD HH:MM" (e.g., "1 04:00")
      # For quarterly, we'll use months 1,4,7,10
      day=$(echo "${window}" | awk '{print $1}')
      hour_minute=$(echo "${window}" | awk '{print $2}')
      month="1,4,7,10"
      ;;
  esac
  
  # Extract hour and minute from HH:MM format
  local hour=$(echo "${hour_minute}" | cut -d: -f1)
  local minute=$(echo "${hour_minute}" | cut -d: -f2)
  
  # Return cron schedule format: minute hour day month weekday
  echo "${minute} ${hour} ${day} ${month} ${weekday}"
}

# Function to check for maintenance conflicts
check_conflicts() {
  local new_schedule="$1"
  local task_name="$2"
  local conflict_found=false
  
  # Parse the new schedule components
  local new_minute=$(echo "${new_schedule}" | awk '{print $1}')
  local new_hour=$(echo "${new_schedule}" | awk '{print $2}')
  local new_day=$(echo "${new_schedule}" | awk '{print $3}')
  local new_month=$(echo "${new_schedule}" | awk '{print $4}')
  local new_weekday=$(echo "${new_schedule}" | awk '{print $5}')
  
  # Check against existing schedules in the temporary file
  if [[ -f "${TEMP_CRONTAB}" ]]; then
    while IFS= read -r line; do
      # Skip comments and empty lines
      [[ "${line}" =~ ^\s*# || -z "${line}" ]] && continue
      
      # Extract schedule and existing task name
      local existing_schedule=$(echo "${line}" | awk '{print $1, $2, $3, $4, $5}')
      local existing_task=$(echo "${line}" | grep -o "Starting [a-zA-Z0-9_-]*" | cut -d' ' -f2)
      
      # Skip if we can't identify the task
      [[ -z "${existing_task}" ]] && continue
      
      # Parse existing schedule components
      local ex_minute=$(echo "${existing_schedule}" | awk '{print $1}')
      local ex_hour=$(echo "${existing_schedule}" | awk '{print $2}')
      local ex_day=$(echo "${existing_schedule}" | awk '{print $3}')
      local ex_month=$(echo "${existing_schedule}" | awk '{print $4}')
      local ex_weekday=$(echo "${existing_schedule}" | awk '{print $5}')
      
      # Check for potential conflict (scheduled within 30 minutes)
      # This is a simplified check - a more sophisticated check would consider
      # the actual calendar and handle special cases like month boundaries
      if [[ "${new_hour}" == "${ex_hour}" && 
            (( $(( ${new_minute#0} - ${ex_minute#0} )) < 30 && $(( ${new_minute#0} - ${ex_minute#0} )) > -30 )) && 
            ("${new_day}" == "${ex_day}" || "${new_day}" == "*" || "${ex_day}" == "*") && 
            ("${new_month}" == "${ex_month}" || "${new_month}" == "*" || "${ex_month}" == "*") && 
            ("${new_weekday}" == "${ex_weekday}" || "${new_weekday}" == "*" || "${ex_weekday}" == "*") ]]; then
        echo "WARNING: Potential scheduling conflict between '${task_name}' and '${existing_task}'" >&2
        echo "  New task: ${new_schedule} ${task_name}" >&2
        echo "  Existing: ${existing_schedule} ${existing_task}" >&2
        
        # Adjust the new schedule to avoid conflict (add 30 minutes)
        new_minute=$(( (${new_minute#0} + 30) % 60 ))
        new_hour=$(( ${new_hour#0} + (${new_minute#0} + 30) / 60 ))
        new_hour=$(( ${new_hour} % 24 ))
        
        # Format with leading zeros
        new_minute=$(printf "%02d" ${new_minute})
        new_hour=$(printf "%02d" ${new_hour})
        
        new_schedule="${new_minute} ${new_hour} ${new_day} ${new_month} ${new_weekday}"
        echo "  Adjusted: ${new_schedule} ${task_name}" >&2
        conflict_found=true
        break
      fi
    done < "${TEMP_CRONTAB}"
  fi
  
  # Return the potentially adjusted schedule
  echo "${new_schedule}"
}

# -------------------------------------------------------------------------
# Main Script Logic
# -------------------------------------------------------------------------

# Create temporary file for building crontab
TEMP_CRONTAB=$(mktemp)

# Setup log directory
setup_log_directory

# Add header to crontab file
cat > "${TEMP_CRONTAB}" << EOF
# AUSTA SuperApp Maintenance Schedule
# Environment: ${ENVIRONMENT}
# Generated: $(date)
# DO NOT EDIT MANUALLY - Use schedule.sh to regenerate

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=""

# Maintenance Tasks

EOF

# -------------------------------------------------------------------------
# Database Maintenance Tasks
# -------------------------------------------------------------------------

# 1. RDS Maintenance Window (Monthly)
rds_schedule=$(parse_maintenance_window "${MONTHLY_WINDOW}" "monthly")
rds_schedule=$(check_conflicts "${rds_schedule}" "rds_maintenance")
rds_entry=$(generate_crontab_entry "${rds_schedule}" "rds_maintenance" "${MAINTENANCE_DIR}/database/rds_maintenance.sh")
echo "${rds_entry}" >> "${TEMP_CRONTAB}"

# 2. Index Optimization (Weekly)
index_schedule=$(parse_maintenance_window "${WEEKLY_WINDOW}" "weekly")
index_schedule=$(check_conflicts "${index_schedule}" "index_optimization")
index_entry=$(generate_crontab_entry "${index_schedule}" "index_optimization" "${MAINTENANCE_DIR}/database/optimize_indices.sh")
echo "${index_entry}" >> "${TEMP_CRONTAB}"

# 3. Vacuum Analysis (Daily)
vacuum_schedule=$(parse_maintenance_window "${DAILY_WINDOW}" "daily")
vacuum_schedule=$(check_conflicts "${vacuum_schedule}" "vacuum_analysis")
vacuum_entry=$(generate_crontab_entry "${vacuum_schedule}" "vacuum_analysis" "${MAINTENANCE_DIR}/database/vacuum_analyze.sh")
echo "${vacuum_entry}" >> "${TEMP_CRONTAB}"

# -------------------------------------------------------------------------
# Kubernetes Maintenance Tasks
# -------------------------------------------------------------------------

# 1. EKS Version Upgrade (Quarterly)
eks_schedule=$(parse_maintenance_window "${QUARTERLY_WINDOW}" "quarterly")
eks_schedule=$(check_conflicts "${eks_schedule}" "eks_upgrade")
eks_entry=$(generate_crontab_entry "${eks_schedule}" "eks_upgrade" "${MAINTENANCE_DIR}/kubernetes/eks_upgrade.sh")
echo "${eks_entry}" >> "${TEMP_CRONTAB}"

# 2. Node Rotation (Monthly)
node_schedule=$(parse_maintenance_window "${MONTHLY_WINDOW}" "monthly")
node_schedule=$(check_conflicts "${node_schedule}" "node_rotation")
node_entry=$(generate_crontab_entry "${node_schedule}" "node_rotation" "${MAINTENANCE_DIR}/kubernetes/rotate_nodes.sh")
echo "${node_entry}" >> "${TEMP_CRONTAB}"

# -------------------------------------------------------------------------
# Security Update Tasks
# -------------------------------------------------------------------------

# 1. OS Patching (Monthly)
os_schedule=$(parse_maintenance_window "${MONTHLY_WINDOW}" "monthly")
os_schedule=$(check_conflicts "${os_schedule}" "os_patching")
os_entry=$(generate_crontab_entry "${os_schedule}" "os_patching" "${MAINTENANCE_DIR}/security/os_patching.sh")
echo "${os_entry}" >> "${TEMP_CRONTAB}"

# 2. Dependency Updates (Weekly)
dep_schedule=$(parse_maintenance_window "${WEEKLY_WINDOW}" "weekly")
dep_schedule=$(check_conflicts "${dep_schedule}" "dependency_updates")
dep_entry=$(generate_crontab_entry "${dep_schedule}" "dependency_updates" "${MAINTENANCE_DIR}/security/update_dependencies.sh")
echo "${dep_entry}" >> "${TEMP_CRONTAB}"

# -------------------------------------------------------------------------
# Backup Verification Tasks
# -------------------------------------------------------------------------

# 1. Backup Restoration Test (Monthly)
backup_schedule=$(parse_maintenance_window "${MONTHLY_WINDOW}" "monthly")
backup_schedule=$(check_conflicts "${backup_schedule}" "backup_verification")
backup_entry=$(generate_crontab_entry "${backup_schedule}" "backup_verification" "${MAINTENANCE_DIR}/backup/verify_backups.sh")
echo "${backup_entry}" >> "${TEMP_CRONTAB}"

# 2. DR Drill (Quarterly)
dr_schedule=$(parse_maintenance_window "${QUARTERLY_WINDOW}" "quarterly")
dr_schedule=$(check_conflicts "${dr_schedule}" "dr_drill")
dr_entry=$(generate_crontab_entry "${dr_schedule}" "dr_drill" "${MAINTENANCE_DIR}/backup/dr_drill.sh")
echo "${dr_entry}" >> "${TEMP_CRONTAB}"

# -------------------------------------------------------------------------
# Install the crontab file
# -------------------------------------------------------------------------

# Add a verification task to check if maintenance scripts exist
verify_schedule="0 0 * * 0"  # Weekly on Sunday at midnight
verify_entry=$(generate_crontab_entry "${verify_schedule}" "verify_scripts" "${SCRIPT_DIR}/verify_maintenance_scripts.sh")
echo "${verify_entry}" >> "${TEMP_CRONTAB}"

# Install the crontab file
if [[ -w "${CRONTAB_FILE}" ]] || [[ $(id -u) -eq 0 ]]; then
  # Install as root or if we have write permissions
  cat "${TEMP_CRONTAB}" > "${CRONTAB_FILE}"
  chmod 644 "${CRONTAB_FILE}"
  echo "Installed maintenance schedule to ${CRONTAB_FILE}"
  
  # Notify monitoring that schedule was updated
  notify_monitoring "maintenance_schedule" "updated" "Maintenance schedule updated for ${ENVIRONMENT} environment"
  
  # Reload cron service if possible
  if command -v systemctl >/dev/null 2>&1; then
    systemctl restart cron || systemctl restart crond || true
  fi
else
  # We don't have permissions, output to stdout instead
  echo "Insufficient permissions to write to ${CRONTAB_FILE}"
  echo "Generated crontab content:"
  cat "${TEMP_CRONTAB}"
  echo "To install, run this script as root or with sudo"
fi

# Clean up temporary file
rm -f "${TEMP_CRONTAB}"

exit 0