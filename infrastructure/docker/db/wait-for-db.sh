#!/bin/bash

# wait-for-db.sh - Utility script that waits for PostgreSQL to be ready to accept connections
#
# This script is used in the AUSTA SuperApp local development environment to ensure that
# database-dependent services only start after the database is fully initialized and ready.
# It implements robust connection checking with configurable timeout and exponential backoff
# for reliability.
#
# Usage: ./wait-for-db.sh [options]
#
# Options:
#   -h, --host HOST       Database host (default: localhost)
#   -p, --port PORT       Database port (default: 5432)
#   -U, --username USER   Database user (default: postgres)
#   -d, --dbname DBNAME   Database name (default: postgres)
#   -t, --timeout SECS    Maximum time to wait in seconds (default: 60)
#   -i, --interval SECS   Initial retry interval in seconds (default: 1)
#   -m, --max-interval    Maximum retry interval in seconds (default: 10)
#   --password PASS       Database password (default: postgres)
#   --help                Display this help message
#
# Exit codes:
#   0 - PostgreSQL is ready and accepting connections
#   1 - Error occurred or timeout reached

# Default values
HOST="localhost"
PORT=5432
USERNAME="postgres"
DBNAME="postgres"
PASSWORD="postgres"
TIMEOUT=60
INTERVAL=1
MAX_INTERVAL=10

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--host)
      HOST="$2"
      shift 2
      ;;
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -U|--username)
      USERNAME="$2"
      shift 2
      ;;
    -d|--dbname)
      DBNAME="$2"
      shift 2
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    -i|--interval)
      INTERVAL="$2"
      shift 2
      ;;
    -m|--max-interval)
      MAX_INTERVAL="$2"
      shift 2
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  -h, --host HOST       Database host (default: localhost)"
      echo "  -p, --port PORT       Database port (default: 5432)"
      echo "  -U, --username USER   Database user (default: postgres)"
      echo "  -d, --dbname DBNAME   Database name (default: postgres)"
      echo "  -t, --timeout SECS    Maximum time to wait in seconds (default: 60)"
      echo "  -i, --interval SECS   Initial retry interval in seconds (default: 1)"
      echo "  -m, --max-interval    Maximum retry interval in seconds (default: 10)"
      echo "  --password PASS       Database password (default: postgres)"
      echo "  --help                Display this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage information"
      exit 1
      ;;
  esac
done

# Export PGPASSWORD for psql command
# This allows psql to authenticate without a password prompt
export PGPASSWORD="$PASSWORD"

# Unset PGPASSWORD on script exit to avoid leaving the password in the environment
trap 'unset PGPASSWORD' EXIT

# Function to check if PostgreSQL is ready
check_postgres() {
  # Try to connect to PostgreSQL and execute a simple query
  # First check if the server is accepting connections (if pg_isready is available)
  if command -v pg_isready >/dev/null 2>&1; then
    if ! pg_isready -h "$HOST" -p "$PORT" -U "$USERNAME" > /dev/null 2>&1; then
      return 1
    fi
  fi
  
  # Then check if we can actually connect and run a query
  # This verifies that the database exists and the user has access
  psql -h "$HOST" -p "$PORT" -U "$USERNAME" -d "$DBNAME" -c "SELECT 1;" > /dev/null 2>&1
  
  # Return the exit code of the psql command
  # 0 = success (PostgreSQL is ready)
  # non-zero = failure (PostgreSQL is not ready)
  return $?
}

# Function to display elapsed time in a human-readable format
format_time() {
  local seconds=$1
  if [[ $seconds -lt 60 ]]; then
    echo "${seconds}s"
  elif [[ $seconds -lt 3600 ]]; then
    local minutes=$((seconds / 60))
    local remaining_seconds=$((seconds % 60))
    echo "${minutes}m ${remaining_seconds}s"
  else
    local hours=$((seconds / 3600))
    local minutes=$(( (seconds % 3600) / 60 ))
    local remaining_seconds=$((seconds % 60))
    echo "${hours}h ${minutes}m ${remaining_seconds}s"
  fi
}

echo "Waiting for PostgreSQL at ${HOST}:${PORT}..."
echo "Database: ${DBNAME}, User: ${USERNAME}"
echo "Timeout: ${TIMEOUT}s, Initial interval: ${INTERVAL}s, Max interval: ${MAX_INTERVAL}s"

# Print a divider line for better readability
echo "----------------------------------------"

# Initialize variables for retry logic
start_time=$(date +%s)
current_interval=$INTERVAL
attempt=1

# Main retry loop with exponential backoff
while true; do
  # Check if PostgreSQL is ready
  if check_postgres; then
    end_time=$(date +%s)
    elapsed=$((end_time - start_time))
    echo "----------------------------------------"
    echo "✅ PostgreSQL is ready! Connected to ${DBNAME} at ${HOST}:${PORT} after $(format_time $elapsed) and $attempt attempts."
    echo "----------------------------------------"
    exit 0
  fi

  # Check if we've exceeded the timeout
  current_time=$(date +%s)
  elapsed=$((current_time - start_time))
  if [[ $elapsed -ge $TIMEOUT ]]; then
    echo "----------------------------------------"
    echo "❌ Error: Timed out after $(format_time $elapsed) waiting for PostgreSQL to become available."
    echo "Last connection attempt failed. Please check:"
    echo "  - Is PostgreSQL running at ${HOST}:${PORT}?"
    echo "  - Are the credentials correct?"
    echo "  - Is the database '${DBNAME}' created?"
    echo "  - Are there any network issues?"
    echo "----------------------------------------"
    exit 1
  fi

  # Calculate remaining time
  remaining=$((TIMEOUT - elapsed))
  
  # Display status message
  echo "⏳ Attempt $attempt: PostgreSQL not ready yet. Retrying in ${current_interval}s... ($(format_time $remaining) remaining)"
  
  # Wait before retrying
  sleep $current_interval
  
  # Increase the interval for the next attempt (exponential backoff)
  current_interval=$((current_interval * 2))
  
  # Cap the interval at the maximum value
  if [[ $current_interval -gt $MAX_INTERVAL ]]; then
    current_interval=$MAX_INTERVAL
  fi
  
  # Increment attempt counter
  attempt=$((attempt + 1))
done