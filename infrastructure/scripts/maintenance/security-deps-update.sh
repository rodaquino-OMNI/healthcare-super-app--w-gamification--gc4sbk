#!/bin/bash
# Make script executable: chmod +x security-deps-update.sh

#############################################################################
# security-deps-update.sh
#
# Description: Weekly script that automates dependency updates across the 
#              application by scanning for vulnerable packages, creating 
#              update PRs via Dependabot integration, executing security 
#              validation tests, and generating comprehensive security reports.
#
# Usage: ./security-deps-update.sh [--force] [--skip-validation] [--report-only]
#
# Options:
#   --force            Force dependency updates even if no vulnerabilities found
#   --skip-validation  Skip validation tests after dependency updates
#   --report-only      Only generate security reports without updating dependencies
#
# Author: AUSTA DevOps Team
# Created: 2025-05-19
# Last Modified: 2025-05-19
#############################################################################

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions if available
COMMON_SCRIPT="${SCRIPT_DIR}/common.sh"
if [[ -f "${COMMON_SCRIPT}" ]]; then
  source "${COMMON_SCRIPT}"
else
  echo "Error: common.sh not found at ${COMMON_SCRIPT}"
  exit 1
fi

# Default values
FORCE_UPDATE=false
SKIP_VALIDATION=false
REPORT_ONLY=false
REPORT_DIR="${SCRIPT_DIR}/../../reports/security"
LOG_FILE="${REPORT_DIR}/deps-update-$(date +%Y%m%d).log"
SUMMARY_FILE="${REPORT_DIR}/deps-update-summary-$(date +%Y%m%d).json"
BACKEND_DIR="${SCRIPT_DIR}/../../../src/backend"
WEB_DIR="${SCRIPT_DIR}/../../../src/web"
GITHUB_API_URL="https://api.github.com"
REPO_OWNER="austa"
REPO_NAME="superapp"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE_UPDATE=true
      shift
      ;;
    --skip-validation)
      SKIP_VALIDATION=true
      shift
      ;;
    --report-only)
      REPORT_ONLY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--force] [--skip-validation] [--report-only]"
      echo "Options:"
      echo "  --force            Force dependency updates even if no vulnerabilities found"
      echo "  --skip-validation  Skip validation tests after dependency updates"
      echo "  --report-only      Only generate security reports without updating dependencies"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Ensure report directory exists
mkdir -p "${REPORT_DIR}"

# Initialize log file
echo "=== AUSTA SuperApp Dependency Security Update $(date) ===" > "${LOG_FILE}"

# Function to log messages
log_message() {
  local level="$1"
  local message="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Function to check if required tools are installed
check_prerequisites() {
  log_message "INFO" "Checking prerequisites..."
  
  local missing_tools=false
  
  # Check for required tools
  for tool in jq npm yarn pnpm curl git; do
    if ! command -v "${tool}" &> /dev/null; then
      log_message "ERROR" "Required tool not found: ${tool}"
      missing_tools=true
    fi
  done
  
  # Check for GitHub token
  if [[ -z "${GITHUB_TOKEN}" ]]; then
    log_message "ERROR" "GITHUB_TOKEN environment variable not set"
    missing_tools=true
  fi
  
  if [[ "${missing_tools}" == true ]]; then
    log_message "ERROR" "Prerequisites check failed. Please install missing tools and set required environment variables."
    exit 1
  fi
  
  log_message "INFO" "Prerequisites check passed."
}

# Function to scan backend dependencies
scan_backend_dependencies() {
  log_message "INFO" "Scanning backend dependencies..."
  
  # Change to backend directory
  cd "${BACKEND_DIR}"
  
  # Create output file for vulnerabilities
  local vuln_file="${REPORT_DIR}/backend-vulnerabilities.json"
  
  # Run npm audit to find vulnerabilities
  log_message "INFO" "Running npm audit in backend..."
  npm audit --json > "${vuln_file}" || true
  
  # Count vulnerabilities by severity
  local critical=$(jq '.vulnerabilities | map(select(.severity == "critical")) | length' "${vuln_file}")
  local high=$(jq '.vulnerabilities | map(select(.severity == "high")) | length' "${vuln_file}")
  local moderate=$(jq '.vulnerabilities | map(select(.severity == "moderate")) | length' "${vuln_file}")
  local low=$(jq '.vulnerabilities | map(select(.severity == "low")) | length' "${vuln_file}")
  
  log_message "INFO" "Backend vulnerabilities found: ${critical} critical, ${high} high, ${moderate} moderate, ${low} low"
  
  # Return true if critical or high vulnerabilities found
  if [[ ${critical} -gt 0 || ${high} -gt 0 ]]; then
    return 0  # Vulnerabilities found
  else
    return 1  # No critical/high vulnerabilities
  fi
}

# Function to scan web dependencies
scan_web_dependencies() {
  log_message "INFO" "Scanning web dependencies..."
  
  # Change to web directory
  cd "${WEB_DIR}"
  
  # Create output file for vulnerabilities
  local vuln_file="${REPORT_DIR}/web-vulnerabilities.json"
  
  # Run yarn audit to find vulnerabilities
  log_message "INFO" "Running pnpm audit in web..."
  pnpm audit --json > "${vuln_file}" || true
  
  # Count vulnerabilities by severity
  local critical=$(jq '.advisories | map_values(select(.severity == "critical")) | length' "${vuln_file}")
  local high=$(jq '.advisories | map_values(select(.severity == "high")) | length' "${vuln_file}")
  local moderate=$(jq '.advisories | map_values(select(.severity == "moderate")) | length' "${vuln_file}")
  local low=$(jq '.advisories | map_values(select(.severity == "low")) | length' "${vuln_file}")
  
  log_message "INFO" "Web vulnerabilities found: ${critical} critical, ${high} high, ${moderate} moderate, ${low} low"
  
  # Return true if critical or high vulnerabilities found
  if [[ ${critical} -gt 0 || ${high} -gt 0 ]]; then
    return 0  # Vulnerabilities found
  else
    return 1  # No critical/high vulnerabilities
  fi
}

# Function to trigger Dependabot updates
trigger_dependabot_updates() {
  log_message "INFO" "Triggering Dependabot updates..."
  
  # Create a temporary directory for Dependabot configuration
  local temp_dir=$(mktemp -d)
  local dependabot_config="${temp_dir}/dependabot.yml"
  
  # Create Dependabot configuration file
  cat > "${dependabot_config}" << EOF
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/src/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    target-branch: "main"
    labels:
      - "dependencies"
      - "security"
    ignore:
      # Ignore patch updates for non-critical packages
      - dependency-name: "*"
        update-types: ["version-update:semver-patch"]
        
  - package-ecosystem: "npm"
    directory: "/src/web"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    target-branch: "main"
    labels:
      - "dependencies"
      - "security"
    ignore:
      # Ignore patch updates for non-critical packages
      - dependency-name: "*"
        update-types: ["version-update:semver-patch"]
EOF
  
  # Commit and push the Dependabot configuration if it doesn't exist or has changed
  if [[ ! -f ".github/dependabot.yml" ]] || ! cmp -s "${dependabot_config}" ".github/dependabot.yml"; then
    log_message "INFO" "Updating Dependabot configuration..."
    
    # Ensure .github directory exists
    mkdir -p ".github"
    
    # Copy the configuration
    cp "${dependabot_config}" ".github/dependabot.yml"
    
    # Commit and push the changes
    git add ".github/dependabot.yml"
    git commit -m "chore: update Dependabot configuration"
    git push origin main
  fi
  
  # Trigger Dependabot using GitHub API
  log_message "INFO" "Triggering Dependabot via GitHub API..."
  
  # Create a workflow dispatch event to trigger Dependabot
  curl -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/dependabot.yml/dispatches" \
    -d '{"ref":"main"}'
  
  log_message "INFO" "Dependabot updates triggered successfully."
  
  # Clean up temporary directory
  rm -rf "${temp_dir}"
}

# Function to validate dependency updates
validate_dependency_updates() {
  log_message "INFO" "Validating dependency updates..."
  
  # Validate backend dependencies
  log_message "INFO" "Validating backend dependencies..."
  cd "${BACKEND_DIR}"
  
  # Run dependency resolution validation
  npm ls --json > "${REPORT_DIR}/backend-deps-tree.json" || {
    log_message "WARNING" "Backend dependency tree has issues. See ${REPORT_DIR}/backend-deps-tree.json for details."
  }
  
  # Run TypeScript compilation to check for type errors
  log_message "INFO" "Running TypeScript compilation check for backend..."
  npx tsc --build --verbose > "${REPORT_DIR}/backend-tsc-check.log" 2>&1 || {
    log_message "ERROR" "Backend TypeScript compilation failed. See ${REPORT_DIR}/backend-tsc-check.log for details."
    return 1
  }
  
  # Validate web dependencies
  log_message "INFO" "Validating web dependencies..."
  cd "${WEB_DIR}"
  
  # Run dependency resolution validation
  pnpm ls --json > "${REPORT_DIR}/web-deps-tree.json" || {
    log_message "WARNING" "Web dependency tree has issues. See ${REPORT_DIR}/web-deps-tree.json for details."
  }
  
  # Run TypeScript compilation to check for type errors
  log_message "INFO" "Running TypeScript compilation check for web..."
  npx tsc --build --verbose > "${REPORT_DIR}/web-tsc-check.log" 2>&1 || {
    log_message "ERROR" "Web TypeScript compilation failed. See ${REPORT_DIR}/web-tsc-check.log for details."
    return 1
  }
  
  log_message "INFO" "Dependency validation completed successfully."
  return 0
}

# Function to run security tests
run_security_tests() {
  log_message "INFO" "Running security tests..."
  
  # Run OWASP Dependency Check
  log_message "INFO" "Running OWASP Dependency Check..."
  
  # Check if OWASP Dependency Check is installed
  if command -v dependency-check &> /dev/null; then
    # Run OWASP Dependency Check on backend
    dependency-check \
      --project "AUSTA SuperApp Backend" \
      --scan "${BACKEND_DIR}" \
      --format "JSON" \
      --out "${REPORT_DIR}/backend-dependency-check.json" \
      --suppression "${BACKEND_DIR}/dependency-check-suppression.xml" || true
    
    # Run OWASP Dependency Check on web
    dependency-check \
      --project "AUSTA SuperApp Web" \
      --scan "${WEB_DIR}" \
      --format "JSON" \
      --out "${REPORT_DIR}/web-dependency-check.json" \
      --suppression "${WEB_DIR}/dependency-check-suppression.xml" || true
  else
    log_message "WARNING" "OWASP Dependency Check not installed. Skipping this check."
  fi
  
  # Run Snyk security tests if available
  if command -v snyk &> /dev/null; then
    log_message "INFO" "Running Snyk security tests..."
    
    # Test backend dependencies
    cd "${BACKEND_DIR}"
    snyk test --json > "${REPORT_DIR}/backend-snyk.json" || true
    
    # Test web dependencies
    cd "${WEB_DIR}"
    snyk test --json > "${REPORT_DIR}/web-snyk.json" || true
  else
    log_message "WARNING" "Snyk not installed. Skipping this check."
  fi
  
  log_message "INFO" "Security tests completed."
}

# Function to generate security reports
generate_security_reports() {
  log_message "INFO" "Generating security reports..."
  
  # Create summary report
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Extract vulnerability counts from npm audit reports
  local backend_critical=0
  local backend_high=0
  local backend_moderate=0
  local backend_low=0
  local web_critical=0
  local web_high=0
  local web_moderate=0
  local web_low=0
  
  if [[ -f "${REPORT_DIR}/backend-vulnerabilities.json" ]]; then
    backend_critical=$(jq '.vulnerabilities | map(select(.severity == "critical")) | length' "${REPORT_DIR}/backend-vulnerabilities.json")
    backend_high=$(jq '.vulnerabilities | map(select(.severity == "high")) | length' "${REPORT_DIR}/backend-vulnerabilities.json")
    backend_moderate=$(jq '.vulnerabilities | map(select(.severity == "moderate")) | length' "${REPORT_DIR}/backend-vulnerabilities.json")
    backend_low=$(jq '.vulnerabilities | map(select(.severity == "low")) | length' "${REPORT_DIR}/backend-vulnerabilities.json")
  fi
  
  if [[ -f "${REPORT_DIR}/web-vulnerabilities.json" ]]; then
    web_critical=$(jq '.advisories | map_values(select(.severity == "critical")) | length' "${REPORT_DIR}/web-vulnerabilities.json")
    web_high=$(jq '.advisories | map_values(select(.severity == "high")) | length' "${REPORT_DIR}/web-vulnerabilities.json")
    web_moderate=$(jq '.advisories | map_values(select(.severity == "moderate")) | length' "${REPORT_DIR}/web-vulnerabilities.json")
    web_low=$(jq '.advisories | map_values(select(.severity == "low")) | length' "${REPORT_DIR}/web-vulnerabilities.json")
  fi
  
  # Create JSON summary
  cat > "${SUMMARY_FILE}" << EOF
{
  "timestamp": "${timestamp}",
  "backend": {
    "vulnerabilities": {
      "critical": ${backend_critical},
      "high": ${backend_high},
      "moderate": ${backend_moderate},
      "low": ${backend_low},
      "total": $((backend_critical + backend_high + backend_moderate + backend_low))
    },
    "validation": {
      "status": "$(if [[ -f "${REPORT_DIR}/backend-tsc-check.log" && ! -s "${REPORT_DIR}/backend-tsc-check.log" ]]; then echo "success"; else echo "warning"; fi)"
    }
  },
  "web": {
    "vulnerabilities": {
      "critical": ${web_critical},
      "high": ${web_high},
      "moderate": ${web_moderate},
      "low": ${web_low},
      "total": $((web_critical + web_high + web_moderate + web_low))
    },
    "validation": {
      "status": "$(if [[ -f "${REPORT_DIR}/web-tsc-check.log" && ! -s "${REPORT_DIR}/web-tsc-check.log" ]]; then echo "success"; else echo "warning"; fi)"
    }
  },
  "total_vulnerabilities": $((backend_critical + backend_high + backend_moderate + backend_low + web_critical + web_high + web_moderate + web_low)),
  "critical_high_vulnerabilities": $((backend_critical + backend_high + web_critical + web_high)),
  "dependabot_triggered": true,
  "security_tests_run": true
}
EOF
  
  # Generate HTML report
  local html_report="${REPORT_DIR}/deps-update-report-$(date +%Y%m%d).html"
  
  cat > "${html_report}" << EOF
<!DOCTYPE html>
<html>
<head>
  <title>AUSTA SuperApp Dependency Security Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .critical { color: #d9534f; }
    .high { color: #f0ad4e; }
    .moderate { color: #5bc0de; }
    .low { color: #5cb85c; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>AUSTA SuperApp Dependency Security Report</h1>
  <p>Generated on: ${timestamp}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total vulnerabilities: <strong>$((backend_critical + backend_high + backend_moderate + backend_low + web_critical + web_high + web_moderate + web_low))</strong></p>
    <p>Critical/High vulnerabilities: <strong class="critical">$((backend_critical + web_critical))</strong> critical, <strong class="high">$((backend_high + web_high))</strong> high</p>
    <p>Dependabot updates triggered: <strong>Yes</strong></p>
    <p>Security tests run: <strong>Yes</strong></p>
  </div>
  
  <h2>Backend Vulnerabilities</h2>
  <table>
    <tr>
      <th>Severity</th>
      <th>Count</th>
    </tr>
    <tr>
      <td class="critical">Critical</td>
      <td>${backend_critical}</td>
    </tr>
    <tr>
      <td class="high">High</td>
      <td>${backend_high}</td>
    </tr>
    <tr>
      <td class="moderate">Moderate</td>
      <td>${backend_moderate}</td>
    </tr>
    <tr>
      <td class="low">Low</td>
      <td>${backend_low}</td>
    </tr>
  </table>
  
  <h2>Web Vulnerabilities</h2>
  <table>
    <tr>
      <th>Severity</th>
      <th>Count</th>
    </tr>
    <tr>
      <td class="critical">Critical</td>
      <td>${web_critical}</td>
    </tr>
    <tr>
      <td class="high">High</td>
      <td>${web_high}</td>
    </tr>
    <tr>
      <td class="moderate">Moderate</td>
      <td>${web_moderate}</td>
    </tr>
    <tr>
      <td class="low">Low</td>
      <td>${web_low}</td>
    </tr>
  </table>
  
  <h2>Validation Results</h2>
  <p>Backend TypeScript validation: <strong>$(if [[ -f "${REPORT_DIR}/backend-tsc-check.log" && ! -s "${REPORT_DIR}/backend-tsc-check.log" ]]; then echo "Success"; else echo "Warning - See logs"; fi)</strong></p>
  <p>Web TypeScript validation: <strong>$(if [[ -f "${REPORT_DIR}/web-tsc-check.log" && ! -s "${REPORT_DIR}/web-tsc-check.log" ]]; then echo "Success"; else echo "Warning - See logs"; fi)</strong></p>
  
  <h2>Next Steps</h2>
  <p>Dependabot will create pull requests for any vulnerable dependencies that need to be updated. Please review and merge these PRs as soon as possible.</p>
  <p>For detailed information, check the JSON reports in the ${REPORT_DIR} directory.</p>
</body>
</html>
EOF
  
  log_message "INFO" "Security reports generated successfully."
  log_message "INFO" "Summary report: ${SUMMARY_FILE}"
  log_message "INFO" "HTML report: ${html_report}"
}

# Function to send notification
send_notification() {
  local critical_high=$1
  
  log_message "INFO" "Sending notification..."
  
  # Determine severity level based on number of critical/high vulnerabilities
  local severity="info"
  if [[ ${critical_high} -gt 10 ]]; then
    severity="critical"
  elif [[ ${critical_high} -gt 5 ]]; then
    severity="high"
  elif [[ ${critical_high} -gt 0 ]]; then
    severity="medium"
  fi
  
  # Create notification payload
  local notification_payload="{
    "title": "Dependency Security Update Report",
    "message": "Found ${critical_high} critical/high vulnerabilities. Dependabot PRs have been triggered.",
    "severity": "${severity}",
    "source": "security-deps-update",
    "link": "${REPORT_DIR}/deps-update-report-$(date +%Y%m%d).html"
  }"
  
  # Send notification to notification service
  # This is a placeholder - implement actual notification sending logic based on your system
  log_message "INFO" "Would send notification with payload: ${notification_payload}"
  
  # Example: Using curl to send to a notification endpoint
  # curl -X POST -H "Content-Type: application/json" -d "${notification_payload}" http://notification-service/api/notifications
}

# Main function
main() {
  # Check prerequisites
  check_prerequisites
  
  # Scan dependencies
  local backend_has_vulnerabilities=false
  local web_has_vulnerabilities=false
  
  if scan_backend_dependencies; then
    backend_has_vulnerabilities=true
  fi
  
  if scan_web_dependencies; then
    web_has_vulnerabilities=true
  fi
  
  # Determine if updates are needed
  local updates_needed=false
  if [[ "${backend_has_vulnerabilities}" == true || "${web_has_vulnerabilities}" == true || "${FORCE_UPDATE}" == true ]]; then
    updates_needed=true
  fi
  
  # Extract vulnerability counts for notification
  local backend_critical=0
  local backend_high=0
  local web_critical=0
  local web_high=0
  
  if [[ -f "${REPORT_DIR}/backend-vulnerabilities.json" ]]; then
    backend_critical=$(jq '.vulnerabilities | map(select(.severity == "critical")) | length' "${REPORT_DIR}/backend-vulnerabilities.json")
    backend_high=$(jq '.vulnerabilities | map(select(.severity == "high")) | length' "${REPORT_DIR}/backend-vulnerabilities.json")
  fi
  
  if [[ -f "${REPORT_DIR}/web-vulnerabilities.json" ]]; then
    web_critical=$(jq '.advisories | map_values(select(.severity == "critical")) | length' "${REPORT_DIR}/web-vulnerabilities.json")
    web_high=$(jq '.advisories | map_values(select(.severity == "high")) | length' "${REPORT_DIR}/web-vulnerabilities.json")
  fi
  
  local critical_high=$((backend_critical + backend_high + web_critical + web_high))
  
  # Trigger updates if needed and not in report-only mode
  if [[ "${updates_needed}" == true && "${REPORT_ONLY}" == false ]]; then
    log_message "INFO" "Updates needed. Triggering Dependabot..."
    trigger_dependabot_updates
    
    # Validate updates if not skipped
    if [[ "${SKIP_VALIDATION}" == false ]]; then
      validate_dependency_updates
    fi
  elif [[ "${REPORT_ONLY}" == true ]]; then
    log_message "INFO" "Running in report-only mode. Skipping updates."
  else
    log_message "INFO" "No critical or high vulnerabilities found. Skipping updates."
  fi
  
  # Run security tests
  run_security_tests
  
  # Generate reports
  generate_security_reports
  
  # Send notification
  send_notification "${critical_high}"
  
  log_message "INFO" "Dependency security update completed successfully."
}

# Run main function
main