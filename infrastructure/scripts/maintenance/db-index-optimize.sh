#!/bin/bash

# ============================================================================
# AUSTA SuperApp - Database Index Optimization Script
# ============================================================================
# This script performs weekly index optimization for PostgreSQL RDS instances
# and TimescaleDB to ensure optimal query performance across all journey databases.
#
# Features:
# - Analyzes index usage patterns
# - Identifies unused or duplicate indexes
# - Rebuilds fragmented indexes
# - Generates performance reports with before/after comparisons
#
# Usage: ./db-index-optimize.sh [options]
#   Options:
#     -c, --config CONFIG_FILE  Path to config file (default: ./db-config.json)
#     -e, --env ENVIRONMENT     Environment (dev, staging, prod)
#     -d, --dry-run             Run in dry-run mode (no changes applied)
#     -v, --verbose             Enable verbose output
#     -h, --help                Display this help message
# ============================================================================

set -e

# Script version
VERSION="1.0.0"

# Default values
CONFIG_FILE="./db-config.json"
ENVIRONMENT="dev"
DRY_RUN=false
VERBOSE=false
LOG_DIR="/var/log/austa/db-maintenance"
LOG_FILE="${LOG_DIR}/index-optimize-$(date +%Y%m%d).log"
REPORT_DIR="/var/log/austa/db-reports"
REPORT_FILE="${REPORT_DIR}/index-report-$(date +%Y%m%d).html"

# ============================================================================
# Helper functions
# ============================================================================

# Display help message
show_help() {
  cat << EOF
AUSTA SuperApp - Database Index Optimization Script v${VERSION}

This script performs weekly index optimization for PostgreSQL RDS instances
and TimescaleDB to ensure optimal query performance across all journey databases.

Usage: ./db-index-optimize.sh [options]
  Options:
    -c, --config CONFIG_FILE  Path to config file (default: ./db-config.json)
    -e, --env ENVIRONMENT     Environment (dev, staging, prod)
    -d, --dry-run             Run in dry-run mode (no changes applied)
    -v, --verbose             Enable verbose output
    -h, --help                Display this help message
EOF
}

# Logging function
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Ensure log directory exists
  mkdir -p "${LOG_DIR}"
  
  echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
  
  if [[ "${level}" == "ERROR" ]]; then
    echo "[${timestamp}] [${level}] ${message}" >&2
  fi
}

# Verbose logging function
log_verbose() {
  if [[ "${VERBOSE}" == true ]]; then
    log "DEBUG" "$1"
  fi
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check required dependencies
check_dependencies() {
  log "INFO" "Checking dependencies..."
  
  local missing_deps=false
  
  for cmd in psql jq aws curl bc; do
    if ! command_exists "${cmd}"; then
      log "ERROR" "Required command '${cmd}' not found"
      missing_deps=true
    fi
  done
  
  if [[ "${missing_deps}" == true ]]; then
    log "ERROR" "Missing dependencies. Please install the required packages."
    exit 1
  fi
  
  log "INFO" "All dependencies are installed."
}

# Function to validate configuration
validate_config() {
  log "INFO" "Validating configuration file: ${CONFIG_FILE}"
  
  if [[ ! -f "${CONFIG_FILE}" ]]; then
    log "ERROR" "Configuration file not found: ${CONFIG_FILE}"
    exit 1
  fi
  
  # Validate JSON format
  if ! jq empty "${CONFIG_FILE}" 2>/dev/null; then
    log "ERROR" "Invalid JSON format in configuration file: ${CONFIG_FILE}"
    exit 1
  fi
  
  # Check if the environment exists in the config
  if ! jq -e ".environments.${ENVIRONMENT}" "${CONFIG_FILE}" >/dev/null 2>&1; then
    log "ERROR" "Environment '${ENVIRONMENT}' not found in configuration file"
    exit 1
  fi
  
  log "INFO" "Configuration validated successfully."
}

# Function to get database connection details from config
get_db_connections() {
  log "INFO" "Getting database connection details for environment: ${ENVIRONMENT}"
  
  # Extract database connections for the specified environment
  DB_CONNECTIONS=$(jq -r ".environments.${ENVIRONMENT}.databases[]" "${CONFIG_FILE}")
  
  if [[ -z "${DB_CONNECTIONS}" ]]; then
    log "ERROR" "No database connections found for environment: ${ENVIRONMENT}"
    exit 1
  fi
  
  log "INFO" "Found database connections for environment: ${ENVIRONMENT}"
  log_verbose "$(jq -r ".environments.${ENVIRONMENT}.databases | length" "${CONFIG_FILE}") database connections found"
}

# Function to initialize report
initialize_report() {
  log "INFO" "Initializing performance report"
  
  # Ensure report directory exists
  mkdir -p "${REPORT_DIR}"
  
  # Create HTML report header
  cat > "${REPORT_FILE}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AUSTA SuperApp - Database Index Optimization Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    .report-header { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .database-section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .database-header { background-color: #eef; padding: 10px; margin-bottom: 15px; border-radius: 3px; }
    .optimization-section { margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .unused { background-color: #ffe6e6; }
    .duplicate { background-color: #fff2e6; }
    .fragmented { background-color: #e6f2ff; }
    .optimized { background-color: #e6ffe6; }
    .summary { font-weight: bold; margin-top: 10px; }
    .performance-improvement { color: green; }
    .performance-degradation { color: red; }
    .no-change { color: gray; }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>AUSTA SuperApp - Database Index Optimization Report</h1>
    <p><strong>Date:</strong> $(date +"%Y-%m-%d %H:%M:%S")</p>
    <p><strong>Environment:</strong> ${ENVIRONMENT}</p>
    <p><strong>Mode:</strong> $(if [[ "${DRY_RUN}" == true ]]; then echo "Dry Run (No Changes Applied)"; else echo "Production Run"; fi)</p>
  </div>
  <div id="summary">
    <h2>Summary</h2>
    <p>Report generation in progress...</p>
  </div>
  <div id="databases">
    <h2>Database Details</h2>
    <!-- Database sections will be added here -->
  </div>
</body>
</html>
EOF

  log "INFO" "Report initialized at: ${REPORT_FILE}"
}

# Function to update report with database section
add_database_to_report() {
  local db_name=$1
  local db_type=$2
  local db_host=$3
  
  log_verbose "Adding database section to report: ${db_name}"
  
  # Create database section in the report
  cat >> "${REPORT_FILE}.tmp" << EOF
  <div class="database-section" id="${db_name}">
    <div class="database-header">
      <h3>${db_name}</h3>
      <p><strong>Type:</strong> ${db_type}</p>
      <p><strong>Host:</strong> ${db_host}</p>
    </div>
    <div class="optimization-section">
      <h4>Index Analysis</h4>
      <!-- Index analysis will be added here -->
    </div>
  </div>
EOF

  # Append to main report file
  cat "${REPORT_FILE}.tmp" >> "${REPORT_FILE}"
  rm "${REPORT_FILE}.tmp"
}

# Function to update report with index analysis
add_index_analysis_to_report() {
  local db_name=$1
  local unused_indexes=$2
  local duplicate_indexes=$3
  local fragmented_indexes=$4
  local optimized_indexes=$5
  local before_stats=$6
  local after_stats=$7
  
  log_verbose "Adding index analysis to report for database: ${db_name}"
  
  # Create temporary file for the analysis section
  cat > "${REPORT_FILE}.tmp" << EOF
  <div class="optimization-section">
    <h4>Unused Indexes</h4>
    <table>
      <tr>
        <th>Schema</th>
        <th>Table</th>
        <th>Index Name</th>
        <th>Index Definition</th>
        <th>Size</th>
        <th>Last Used</th>
        <th>Action</th>
      </tr>
${unused_indexes}
    </table>
    
    <h4>Duplicate Indexes</h4>
    <table>
      <tr>
        <th>Schema</th>
        <th>Table</th>
        <th>Index Name</th>
        <th>Duplicate Of</th>
        <th>Index Definition</th>
        <th>Size</th>
        <th>Action</th>
      </tr>
${duplicate_indexes}
    </table>
    
    <h4>Fragmented Indexes</h4>
    <table>
      <tr>
        <th>Schema</th>
        <th>Table</th>
        <th>Index Name</th>
        <th>Size Before</th>
        <th>Fragmentation %</th>
        <th>Size After</th>
        <th>Space Saved</th>
      </tr>
${fragmented_indexes}
    </table>
    
    <h4>Performance Comparison</h4>
    <table>
      <tr>
        <th>Metric</th>
        <th>Before</th>
        <th>After</th>
        <th>Change</th>
      </tr>
${before_after_stats}
    </table>
  </div>
EOF

  # Replace the placeholder in the main report
  sed -i "s|<!-- Index analysis will be added here -->|$(cat "${REPORT_FILE}.tmp")|" "${REPORT_FILE}"
  rm "${REPORT_FILE}.tmp"
}

# Function to update the summary section of the report
update_summary() {
  local total_dbs=$1
  local total_unused=$2
  local total_duplicate=$3
  local total_fragmented=$4
  local total_optimized=$5
  local total_space_saved=$6
  
  log "INFO" "Updating report summary"
  
  # Create summary content
  cat > "${REPORT_FILE}.tmp" << EOF
    <h2>Summary</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Databases Analyzed</td>
        <td>${total_dbs}</td>
      </tr>
      <tr>
        <td>Unused Indexes Identified</td>
        <td>${total_unused}</td>
      </tr>
      <tr>
        <td>Duplicate Indexes Identified</td>
        <td>${total_duplicate}</td>
      </tr>
      <tr>
        <td>Fragmented Indexes Rebuilt</td>
        <td>${total_fragmented}</td>
      </tr>
      <tr>
        <td>Total Indexes Optimized</td>
        <td>${total_optimized}</td>
      </tr>
      <tr>
        <td>Total Space Saved</td>
        <td>${total_space_saved}</td>
      </tr>
    </table>
EOF

  # Replace the placeholder in the main report
  sed -i "s|<div id="summary">.*<p>Report generation in progress...</p>|<div id="summary">\n$(cat "${REPORT_FILE}.tmp")|" "${REPORT_FILE}"
  rm "${REPORT_FILE}.tmp"
}

# ============================================================================
# Database optimization functions
# ============================================================================

# Function to collect database statistics before optimization
collect_before_stats() {
  local db_host=$1
  local db_port=$2
  local db_name=$3
  local db_user=$4
  local db_password=$5
  
  log "INFO" "Collecting statistics before optimization for database: ${db_name}"
  
  # Create SQL query to collect statistics
  local query="
    SELECT 'Total Index Count' as metric, count(*) as value FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
    SELECT 'Total Index Size' as metric, pg_size_pretty(sum(pg_relation_size(indexrelid))) as value FROM pg_index JOIN pg_class ON pg_class.oid = pg_index.indexrelid WHERE pg_class.relname NOT LIKE 'pg_%';
    SELECT 'Average Index Scan Count' as metric, COALESCE(round(avg(idx_scan)), 0) as value FROM pg_stat_user_indexes;
    SELECT 'Unused Index Count' as metric, count(*) as value FROM pg_stat_user_indexes WHERE idx_scan = 0 AND schemaname NOT IN ('pg_catalog', 'information_schema');
    SELECT 'Average Table Scan Ratio' as metric, round(avg(seq_scan::numeric / (case when seq_scan + idx_scan = 0 then 1 else seq_scan + idx_scan end) * 100), 2) as value FROM pg_stat_user_tables WHERE (seq_scan + idx_scan) > 0;
  "
  
  # Execute query and store results
  PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "${query}" > "/tmp/before_stats_${db_name}.txt"
  
  log_verbose "Statistics collected and saved to: /tmp/before_stats_${db_name}.txt"
}

# Function to collect database statistics after optimization
collect_after_stats() {
  local db_host=$1
  local db_port=$2
  local db_name=$3
  local db_user=$4
  local db_password=$5
  
  log "INFO" "Collecting statistics after optimization for database: ${db_name}"
  
  # Create SQL query to collect statistics (same as before_stats)
  local query="
    SELECT 'Total Index Count' as metric, count(*) as value FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
    SELECT 'Total Index Size' as metric, pg_size_pretty(sum(pg_relation_size(indexrelid))) as value FROM pg_index JOIN pg_class ON pg_class.oid = pg_index.indexrelid WHERE pg_class.relname NOT LIKE 'pg_%';
    SELECT 'Average Index Scan Count' as metric, COALESCE(round(avg(idx_scan)), 0) as value FROM pg_stat_user_indexes;
    SELECT 'Unused Index Count' as metric, count(*) as value FROM pg_stat_user_indexes WHERE idx_scan = 0 AND schemaname NOT IN ('pg_catalog', 'information_schema');
    SELECT 'Average Table Scan Ratio' as metric, round(avg(seq_scan::numeric / (case when seq_scan + idx_scan = 0 then 1 else seq_scan + idx_scan end) * 100), 2) as value FROM pg_stat_user_tables WHERE (seq_scan + idx_scan) > 0;
  "
  
  # Execute query and store results
  PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "${query}" > "/tmp/after_stats_${db_name}.txt"
  
  log_verbose "Statistics collected and saved to: /tmp/after_stats_${db_name}.txt"
}

# Function to compare before and after statistics
compare_stats() {
  local db_name=$1
  
  log "INFO" "Comparing before and after statistics for database: ${db_name}"
  
  local before_file="/tmp/before_stats_${db_name}.txt"
  local after_file="/tmp/after_stats_${db_name}.txt"
  local comparison=""
  
  # Check if both files exist
  if [[ ! -f "${before_file}" || ! -f "${after_file}" ]]; then
    log "ERROR" "Statistics files not found for comparison"
    return 1
  fi
  
  # Process each line in the before stats file
  while IFS='|' read -r metric before_value; do
    # Trim whitespace
    metric=$(echo "${metric}" | xargs)
    before_value=$(echo "${before_value}" | xargs)
    
    # Find the corresponding after value
    after_value=$(grep -F "${metric}" "${after_file}" | cut -d'|' -f2 | xargs)
    
    # Calculate change (if numeric)
    local change="N/A"
    local change_class="no-change"
    
    # Extract numeric values (if possible)
    local before_numeric=$(echo "${before_value}" | grep -o '[0-9.]*' | head -1)
    local after_numeric=$(echo "${after_value}" | grep -o '[0-9.]*' | head -1)
    
    if [[ -n "${before_numeric}" && -n "${after_numeric}" ]]; then
      # Calculate difference
      local diff=$(echo "${after_numeric} - ${before_numeric}" | bc)
      
      # Calculate percentage change if before value is not zero
      if [[ "${before_numeric}" != "0" ]]; then
        local percent=$(echo "scale=2; (${diff} / ${before_numeric}) * 100" | bc)
        change="${diff} (${percent}%)"
        
        # Determine if this is an improvement or degradation
        if [[ "${metric}" == "Total Index Size" || "${metric}" == "Unused Index Count" || "${metric}" == "Average Table Scan Ratio" ]]; then
          # For these metrics, lower is better
          if (( $(echo "${diff} < 0" | bc -l) )); then
            change_class="performance-improvement"
          elif (( $(echo "${diff} > 0" | bc -l) )); then
            change_class="performance-degradation"
          fi
        else
          # For other metrics, higher is generally better
          if (( $(echo "${diff} > 0" | bc -l) )); then
            change_class="performance-improvement"
          elif (( $(echo "${diff} < 0" | bc -l) )); then
            change_class="performance-degradation"
          fi
        fi
      else
        change="${diff} (N/A%)"
      fi
    fi
    
    # Add to comparison HTML
    comparison+="      <tr>
        <td>${metric}</td>
        <td>${before_value}</td>
        <td>${after_value}</td>
        <td class=\"${change_class}\">${change}</td>
      </tr>\n"
    
  done < "${before_file}"
  
  echo "${comparison}"
}

# Function to identify unused indexes
identify_unused_indexes() {
  local db_host=$1
  local db_port=$2
  local db_name=$3
  local db_user=$4
  local db_password=$5
  
  log "INFO" "Identifying unused indexes for database: ${db_name}"
  
  # SQL query to find unused indexes
  local query="
    SELECT
      schemaname as schema,
      relname as table,
      indexrelname as index,
      pg_get_indexdef(i.indexrelid) as definition,
      pg_size_pretty(pg_relation_size(i.indexrelid)) as size,
      CASE WHEN s.last_idx_scan IS NULL THEN 'Never' ELSE s.last_idx_scan::text END as last_used
    FROM
      pg_stat_user_indexes s
      JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE
      s.idx_scan = 0
      AND schemaname NOT IN ('pg_catalog', 'information_schema')
      AND NOT i.indisprimary
      AND NOT i.indisunique
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
    ORDER BY
      pg_relation_size(i.indexrelid) DESC;
  "
  
  # Execute query and store results
  PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "${query}" > "/tmp/unused_indexes_${db_name}.txt"
  
  # Count unused indexes
  local count=$(wc -l < "/tmp/unused_indexes_${db_name}.txt")
  log "INFO" "Found ${count} unused indexes in database: ${db_name}"
  
  # Format for HTML report
  local html_content=""
  while IFS='|' read -r schema table index definition size last_used; do
    # Trim whitespace
    schema=$(echo "${schema}" | xargs)
    table=$(echo "${table}" | xargs)
    index=$(echo "${index}" | xargs)
    definition=$(echo "${definition}" | xargs)
    size=$(echo "${size}" | xargs)
    last_used=$(echo "${last_used}" | xargs)
    
    # Create drop index statement
    local drop_statement="DROP INDEX IF EXISTS ${schema}.${index};"
    
    # Add to HTML content
    html_content+="      <tr class=\"unused\">
        <td>${schema}</td>
        <td>${table}</td>
        <td>${index}</td>
        <td>${definition}</td>
        <td>${size}</td>
        <td>${last_used}</td>
        <td>$(if [[ "${DRY_RUN}" == true ]]; then echo "Would drop"; else echo "Dropped"; fi)</td>
      </tr>\n"
    
    # Execute drop statement if not in dry-run mode
    if [[ "${DRY_RUN}" == false ]]; then
      log_verbose "Dropping unused index: ${schema}.${index}"
      PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -c "${drop_statement}" > /dev/null 2>&1
    fi
    
  done < "/tmp/unused_indexes_${db_name}.txt"
  
  echo "${html_content}"
  echo "${count}"
}

# Function to identify duplicate indexes
identify_duplicate_indexes() {
  local db_host=$1
  local db_port=$2
  local db_name=$3
  local db_user=$4
  local db_password=$5
  
  log "INFO" "Identifying duplicate indexes for database: ${db_name}"
  
  # SQL query to find duplicate indexes
  local query="
    WITH index_cols AS (
      SELECT
        i.indrelid,
        i.indexrelid,
        array_to_string(array_agg(a.attname ORDER BY array_position(i.indkey, a.attnum)), ',') as cols,
        array_to_string(array_agg(a.attname ORDER BY array_position(i.indkey, a.attnum)), ',') as col_list
      FROM
        pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      GROUP BY
        i.indrelid, i.indexrelid
    ),
    duplicate_groups AS (
      SELECT
        min(ic.indexrelid) as primary_idx,
        array_agg(ic.indexrelid) as duplicate_indexes,
        ic.indrelid,
        ic.col_list
      FROM
        index_cols ic
      GROUP BY
        ic.indrelid, ic.col_list
      HAVING
        count(*) > 1
    )
    SELECT
      ns.nspname as schema,
      t.relname as table,
      i_dup.relname as index,
      i_prim.relname as duplicate_of,
      pg_get_indexdef(di.indexrelid) as definition,
      pg_size_pretty(pg_relation_size(di.indexrelid)) as size
    FROM
      duplicate_groups dg
      JOIN pg_class t ON t.oid = dg.indrelid
      JOIN pg_class i_prim ON i_prim.oid = dg.primary_idx
      JOIN pg_index di ON di.indexrelid = ANY(dg.duplicate_indexes) AND di.indexrelid <> dg.primary_idx
      JOIN pg_class i_dup ON i_dup.oid = di.indexrelid
      JOIN pg_namespace ns ON ns.oid = t.relnamespace
    WHERE
      ns.nspname NOT IN ('pg_catalog', 'information_schema')
      AND NOT di.indisprimary
    ORDER BY
      pg_relation_size(di.indexrelid) DESC;
  "
  
  # Execute query and store results
  PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "${query}" > "/tmp/duplicate_indexes_${db_name}.txt"
  
  # Count duplicate indexes
  local count=$(wc -l < "/tmp/duplicate_indexes_${db_name}.txt")
  log "INFO" "Found ${count} duplicate indexes in database: ${db_name}"
  
  # Format for HTML report
  local html_content=""
  while IFS='|' read -r schema table index duplicate_of definition size; do
    # Trim whitespace
    schema=$(echo "${schema}" | xargs)
    table=$(echo "${table}" | xargs)
    index=$(echo "${index}" | xargs)
    duplicate_of=$(echo "${duplicate_of}" | xargs)
    definition=$(echo "${definition}" | xargs)
    size=$(echo "${size}" | xargs)
    
    # Create drop index statement
    local drop_statement="DROP INDEX IF EXISTS ${schema}.${index};"
    
    # Add to HTML content
    html_content+="      <tr class=\"duplicate\">
        <td>${schema}</td>
        <td>${table}</td>
        <td>${index}</td>
        <td>${duplicate_of}</td>
        <td>${definition}</td>
        <td>${size}</td>
        <td>$(if [[ "${DRY_RUN}" == true ]]; then echo "Would drop"; else echo "Dropped"; fi)</td>
      </tr>\n"
    
    # Execute drop statement if not in dry-run mode
    if [[ "${DRY_RUN}" == false ]]; then
      log_verbose "Dropping duplicate index: ${schema}.${index}"
      PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -c "${drop_statement}" > /dev/null 2>&1
    fi
    
  done < "/tmp/duplicate_indexes_${db_name}.txt"
  
  echo "${html_content}"
  echo "${count}"
}

# Function to identify and rebuild fragmented indexes
rebuild_fragmented_indexes() {
  local db_host=$1
  local db_port=$2
  local db_name=$3
  local db_user=$4
  local db_password=$5
  
  log "INFO" "Identifying fragmented indexes for database: ${db_name}"
  
  # SQL query to find fragmented indexes
  local query="
    SELECT
      schemaname as schema,
      tablename as table,
      indexname as index,
      pg_size_pretty(pg_relation_size(schemaname || '.' || indexname::text)) as size_before,
      round(100 * (1 - (pg_index.indpages::float / 
        CASE WHEN pg_index.indpages = 0 THEN 1 ELSE
          (pg_relation_size(pg_index.indexrelid) / (current_setting('block_size')::integer))
        END))) as fragmentation_pct
    FROM
      pg_stat_user_indexes
      JOIN pg_index ON pg_stat_user_indexes.indexrelid = pg_index.indexrelid
    WHERE
      schemaname NOT IN ('pg_catalog', 'information_schema')
      AND pg_relation_size(schemaname || '.' || indexname::text) > 1024 * 1024 -- Only indexes larger than 1MB
      AND round(100 * (1 - (pg_index.indpages::float / 
        CASE WHEN pg_index.indpages = 0 THEN 1 ELSE
          (pg_relation_size(pg_index.indexrelid) / (current_setting('block_size')::integer))
        END))) > 20 -- Only indexes with fragmentation > 20%
    ORDER BY
      fragmentation_pct DESC;
  "
  
  # Execute query and store results
  PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "${query}" > "/tmp/fragmented_indexes_${db_name}.txt"
  
  # Count fragmented indexes
  local count=$(wc -l < "/tmp/fragmented_indexes_${db_name}.txt")
  log "INFO" "Found ${count} fragmented indexes in database: ${db_name}"
  
  # Format for HTML report
  local html_content=""
  local total_space_saved="0"
  
  while IFS='|' read -r schema table index size_before fragmentation_pct; do
    # Trim whitespace
    schema=$(echo "${schema}" | xargs)
    table=$(echo "${table}" | xargs)
    index=$(echo "${index}" | xargs)
    size_before=$(echo "${size_before}" | xargs)
    fragmentation_pct=$(echo "${fragmentation_pct}" | xargs)
    
    # Get index definition
    local index_def=$(PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "SELECT pg_get_indexdef('${schema}.${index}'::regclass);" | xargs)
    
    # Create rebuild statement
    local rebuild_statement="REINDEX INDEX CONCURRENTLY ${schema}.${index};"
    
    # Execute rebuild statement if not in dry-run mode
    if [[ "${DRY_RUN}" == false ]]; then
      log_verbose "Rebuilding fragmented index: ${schema}.${index}"
      PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -c "${rebuild_statement}" > /dev/null 2>&1
    fi
    
    # Get size after rebuild
    local size_after="N/A"
    local space_saved="N/A"
    
    if [[ "${DRY_RUN}" == false ]]; then
      size_after=$(PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "SELECT pg_size_pretty(pg_relation_size('${schema}.${index}'::regclass));" | xargs)
      
      # Calculate space saved
      local size_before_bytes=$(PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "SELECT pg_relation_size('${schema}.${index}'::regclass) AS size_before_rebuild;" | xargs)
      local size_after_bytes=$(PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -t -c "SELECT pg_relation_size('${schema}.${index}'::regclass) AS size_after_rebuild;" | xargs)
      
      local bytes_saved=$((size_before_bytes - size_after_bytes))
      space_saved=$(echo "scale=2; ${bytes_saved} / 1024 / 1024" | bc)
      space_saved="${space_saved} MB"
      
      # Add to total space saved
      total_space_saved=$(echo "${total_space_saved} + ${bytes_saved}" | bc)
    else
      # Estimate size after and space saved based on fragmentation percentage
      local estimated_size_after=$(echo "scale=2; 100 - ${fragmentation_pct}" | bc)
      estimated_size_after=$(echo "scale=2; ${estimated_size_after} / 100" | bc)
      
      # Extract numeric size from size_before (remove MB, KB, etc.)
      local size_before_num=$(echo "${size_before}" | grep -o '[0-9.]*' | head -1)
      local size_before_unit=$(echo "${size_before}" | grep -o '[A-Za-z]*$')
      
      # Convert to consistent unit (MB)
      local size_before_mb
      if [[ "${size_before_unit}" == "GB" ]]; then
        size_before_mb=$(echo "${size_before_num} * 1024" | bc)
      elif [[ "${size_before_unit}" == "KB" ]]; then
        size_before_mb=$(echo "${size_before_num} / 1024" | bc)
      elif [[ "${size_before_unit}" == "bytes" ]]; then
        size_before_mb=$(echo "${size_before_num} / 1024 / 1024" | bc)
      else
        size_before_mb=${size_before_num}
      fi
      
      local estimated_size_after_mb=$(echo "${size_before_mb} * ${estimated_size_after}" | bc)
      local estimated_space_saved_mb=$(echo "${size_before_mb} - ${estimated_size_after_mb}" | bc)
      
      size_after="~$(printf "%.2f" ${estimated_size_after_mb}) MB (estimated)"
      space_saved="~$(printf "%.2f" ${estimated_space_saved_mb}) MB (estimated)"
      
      # Add to total space saved (convert to bytes for consistency)
      local estimated_space_saved_bytes=$(echo "${estimated_space_saved_mb} * 1024 * 1024" | bc)
      total_space_saved=$(echo "${total_space_saved} + ${estimated_space_saved_bytes}" | bc)
    fi
    
    # Add to HTML content
    html_content+="      <tr class=\"fragmented\">
        <td>${schema}</td>
        <td>${table}</td>
        <td>${index}</td>
        <td>${size_before}</td>
        <td>${fragmentation_pct}%</td>
        <td>${size_after}</td>
        <td>${space_saved}</td>
      </tr>\n"
    
  done < "/tmp/fragmented_indexes_${db_name}.txt"
  
  # Convert total space saved to human-readable format
  local total_space_saved_hr
  if (( $(echo "${total_space_saved} > 1024*1024*1024" | bc -l) )); then
    total_space_saved_hr=$(echo "scale=2; ${total_space_saved} / 1024 / 1024 / 1024" | bc)
    total_space_saved_hr="${total_space_saved_hr} GB"
  elif (( $(echo "${total_space_saved} > 1024*1024" | bc -l) )); then
    total_space_saved_hr=$(echo "scale=2; ${total_space_saved} / 1024 / 1024" | bc)
    total_space_saved_hr="${total_space_saved_hr} MB"
  else
    total_space_saved_hr=$(echo "scale=2; ${total_space_saved} / 1024" | bc)
    total_space_saved_hr="${total_space_saved_hr} KB"
  fi
  
  echo "${html_content}"
  echo "${count}"
  echo "${total_space_saved_hr}"
}

# Function to optimize a single database
optimize_database() {
  local db_config=$1
  
  # Extract database details
  local db_name=$(echo "${db_config}" | jq -r '.name')
  local db_type=$(echo "${db_config}" | jq -r '.type')
  local db_host=$(echo "${db_config}" | jq -r '.host')
  local db_port=$(echo "${db_config}" | jq -r '.port')
  local db_user=$(echo "${db_config}" | jq -r '.username')
  local db_password=$(echo "${db_config}" | jq -r '.password')
  
  log "INFO" "Starting optimization for database: ${db_name} (${db_type})"
  
  # Test connection
  if ! PGPASSWORD="${db_password}" psql -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" -c "SELECT 1;" > /dev/null 2>&1; then
    log "ERROR" "Failed to connect to database: ${db_name}"
    return 1
  fi
  
  log "INFO" "Successfully connected to database: ${db_name}"
  
  # Add database to report
  add_database_to_report "${db_name}" "${db_type}" "${db_host}"
  
  # Collect statistics before optimization
  collect_before_stats "${db_host}" "${db_port}" "${db_name}" "${db_user}" "${db_password}"
  
  # Identify unused indexes
  local unused_indexes_result=$(identify_unused_indexes "${db_host}" "${db_port}" "${db_name}" "${db_user}" "${db_password}")
  local unused_indexes=$(echo "${unused_indexes_result}" | sed '$d')
  local unused_count=$(echo "${unused_indexes_result}" | tail -1)
  
  # Identify duplicate indexes
  local duplicate_indexes_result=$(identify_duplicate_indexes "${db_host}" "${db_port}" "${db_name}" "${db_user}" "${db_password}")
  local duplicate_indexes=$(echo "${duplicate_indexes_result}" | sed '$d')
  local duplicate_count=$(echo "${duplicate_indexes_result}" | tail -1)
  
  # Rebuild fragmented indexes
  local fragmented_indexes_result=$(rebuild_fragmented_indexes "${db_host}" "${db_port}" "${db_name}" "${db_user}" "${db_password}")
  local fragmented_indexes=$(echo "${fragmented_indexes_result}" | sed -e '$d' -e '$d')
  local fragmented_count=$(echo "${fragmented_indexes_result}" | tail -2 | head -1)
  local space_saved=$(echo "${fragmented_indexes_result}" | tail -1)
  
  # Collect statistics after optimization
  collect_after_stats "${db_host}" "${db_port}" "${db_name}" "${db_user}" "${db_password}"
  
  # Compare before and after statistics
  local before_after_stats=$(compare_stats "${db_name}")
  
  # Update report with analysis
  add_index_analysis_to_report "${db_name}" "${unused_indexes}" "${duplicate_indexes}" "${fragmented_indexes}" "$((unused_count + duplicate_count + fragmented_count))" "${before_after_stats}"
  
  # Clean up temporary files
  rm -f "/tmp/before_stats_${db_name}.txt" "/tmp/after_stats_${db_name}.txt" "/tmp/unused_indexes_${db_name}.txt" "/tmp/duplicate_indexes_${db_name}.txt" "/tmp/fragmented_indexes_${db_name}.txt"
  
  log "INFO" "Completed optimization for database: ${db_name}"
  log "INFO" "Results: ${unused_count} unused indexes, ${duplicate_count} duplicate indexes, ${fragmented_count} fragmented indexes rebuilt, ${space_saved} space saved"
  
  # Return results
  echo "${unused_count}|${duplicate_count}|${fragmented_count}|${space_saved}"
}

# ============================================================================
# Main script
# ============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    -e|--env)
      ENVIRONMENT="$2"
      shift 2
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
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Start script execution
log "INFO" "Starting database index optimization script v${VERSION}"
log "INFO" "Environment: ${ENVIRONMENT}"
log "INFO" "Dry run mode: ${DRY_RUN}"

# Check dependencies
check_dependencies

# Validate configuration
validate_config

# Get database connections
get_db_connections

# Initialize report
initialize_report

# Initialize counters
total_dbs=0
total_unused=0
total_duplicate=0
total_fragmented=0
total_optimized=0
total_space_saved="0 bytes"

# Process each database
while read -r db_config; do
  # Optimize database
  result=$(optimize_database "${db_config}")
  
  if [[ $? -eq 0 ]]; then
    # Extract results
    IFS='|' read -r unused_count duplicate_count fragmented_count space_saved <<< "${result}"
    
    # Update counters
    total_dbs=$((total_dbs + 1))
    total_unused=$((total_unused + unused_count))
    total_duplicate=$((total_duplicate + duplicate_count))
    total_fragmented=$((total_fragmented + fragmented_count))
    total_optimized=$((total_unused + total_duplicate + total_fragmented))
    
    # Extract numeric value from space_saved
    local space_saved_num=$(echo "${space_saved}" | grep -o '[0-9.]*' | head -1)
    local space_saved_unit=$(echo "${space_saved}" | grep -o '[A-Za-z]*$')
    
    # Convert to bytes for addition
    local space_saved_bytes
    if [[ "${space_saved_unit}" == "GB" ]]; then
      space_saved_bytes=$(echo "${space_saved_num} * 1024 * 1024 * 1024" | bc)
    elif [[ "${space_saved_unit}" == "MB" ]]; then
      space_saved_bytes=$(echo "${space_saved_num} * 1024 * 1024" | bc)
    elif [[ "${space_saved_unit}" == "KB" ]]; then
      space_saved_bytes=$(echo "${space_saved_num} * 1024" | bc)
    else
      space_saved_bytes=${space_saved_num}
    fi
    
    # Extract numeric value from total_space_saved
    local total_saved_num=$(echo "${total_space_saved}" | grep -o '[0-9.]*' | head -1)
    local total_saved_unit=$(echo "${total_space_saved}" | grep -o '[A-Za-z]*$')
    
    # Convert to bytes for addition
    local total_saved_bytes
    if [[ "${total_saved_unit}" == "GB" ]]; then
      total_saved_bytes=$(echo "${total_saved_num} * 1024 * 1024 * 1024" | bc)
    elif [[ "${total_saved_unit}" == "MB" ]]; then
      total_saved_bytes=$(echo "${total_saved_num} * 1024 * 1024" | bc)
    elif [[ "${total_saved_unit}" == "KB" ]]; then
      total_saved_bytes=$(echo "${total_saved_num} * 1024" | bc)
    else
      total_saved_bytes=${total_saved_num}
    fi
    
    # Add to total space saved
    local new_total_bytes=$(echo "${total_saved_bytes} + ${space_saved_bytes}" | bc)
    
    # Convert back to human-readable format
    if (( $(echo "${new_total_bytes} > 1024*1024*1024" | bc -l) )); then
      total_space_saved=$(echo "scale=2; ${new_total_bytes} / 1024 / 1024 / 1024" | bc)
      total_space_saved="${total_space_saved} GB"
    elif (( $(echo "${new_total_bytes} > 1024*1024" | bc -l) )); then
      total_space_saved=$(echo "scale=2; ${new_total_bytes} / 1024 / 1024" | bc)
      total_space_saved="${total_space_saved} MB"
    elif (( $(echo "${new_total_bytes} > 1024" | bc -l) )); then
      total_space_saved=$(echo "scale=2; ${new_total_bytes} / 1024" | bc)
      total_space_saved="${total_space_saved} KB"
    else
      total_space_saved="${new_total_bytes} bytes"
    fi
  fi
done < <(jq -c ".environments.${ENVIRONMENT}.databases[]" "${CONFIG_FILE}")

# Update summary in report
update_summary "${total_dbs}" "${total_unused}" "${total_duplicate}" "${total_fragmented}" "${total_optimized}" "${total_space_saved}"

# Finish script execution
log "INFO" "Database index optimization completed"
log "INFO" "Summary: ${total_dbs} databases analyzed, ${total_unused} unused indexes, ${total_duplicate} duplicate indexes, ${total_fragmented} fragmented indexes rebuilt, ${total_optimized} total indexes optimized, ${total_space_saved} space saved"
log "INFO" "Report generated at: ${REPORT_FILE}"

# Exit successfully
exit 0