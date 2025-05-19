#!/bin/bash

# =========================================================================
# AUSTA SuperApp - GitHub Actions Build Cache Cleanup Script
# =========================================================================
# This script implements intelligent cleanup strategies for GitHub Actions
# build caches to prevent excessive storage usage while maintaining build speed.
# 
# Features:
# - Age-based cache pruning for optimal storage usage
# - Intelligent cache invalidation based on dependency changes
# - Workspace-specific cache management
# - Cache usage metrics reporting
#
# Usage: ./build-cache-clean.sh [--dry-run] [--verbose] [--max-age=DAYS] [--workspace=NAME]
# =========================================================================

set -e

# Default configuration
DRY_RUN=false
VERBOSE=false
MAX_AGE=14 # Default max age for caches in days
MAX_SIZE_PER_WORKSPACE=5 # Default max size in GB per workspace
WORKSPACE="" # Default to all workspaces
GH_TOKEN=${GITHUB_TOKEN:-""}
REPO_OWNER="austa"
REPO_NAME="superapp"

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --max-age=*)
      MAX_AGE="${arg#*=}"
      shift
      ;;
    --max-size=*)
      MAX_SIZE_PER_WORKSPACE="${arg#*=}"
      shift
      ;;
    --workspace=*)
      WORKSPACE="${arg#*=}"
      shift
      ;;
    --help)
      echo "Usage: ./build-cache-clean.sh [--dry-run] [--verbose] [--max-age=DAYS] [--max-size=GB] [--workspace=NAME]"
      echo ""
      echo "Options:"
      echo "  --dry-run         Show what would be done without actually deleting caches"
      echo "  --verbose        Show detailed information about cache operations"
      echo "  --max-age=DAYS   Maximum age in days for caches (default: 14)"
      echo "  --max-size=GB    Maximum size in GB per workspace (default: 5)"
      echo "  --workspace=NAME Only process caches for the specified workspace"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed. Please install it first.${NC}"
  echo "See: https://github.com/cli/cli#installation"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${RED}Error: jq is not installed. Please install it first.${NC}"
  echo "See: https://stedolan.github.io/jq/download/"
  exit 1
fi

# Check if GitHub token is available
if [ -z "$GH_TOKEN" ]; then
  echo -e "${RED}Error: GITHUB_TOKEN environment variable is not set.${NC}"
  echo "Please set the GITHUB_TOKEN environment variable with a token that has 'repo' and 'workflow' scopes."
  exit 1
fi

# Log function with verbosity control
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO")
      color=$GREEN
      ;;
    "WARN")
      color=$YELLOW
      ;;
    "ERROR")
      color=$RED
      ;;
    "DEBUG")
      color=$BLUE
      if [ "$VERBOSE" != "true" ]; then
        return
      fi
      ;;
  esac
  
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${color}${level}${NC}: ${message}"
}

# Function to get cache size in bytes
get_cache_size() {
  local cache_id=$1
  local size=$(gh api /repos/$REPO_OWNER/$REPO_NAME/actions/caches/$cache_id --jq '.size_in_bytes')
  echo $size
}

# Function to convert bytes to human-readable format
format_bytes() {
  local bytes=$1
  if [ $bytes -lt 1024 ]; then
    echo "${bytes}B"
  elif [ $bytes -lt 1048576 ]; then
    echo "$(( bytes / 1024 ))KB"
  elif [ $bytes -lt 1073741824 ]; then
    echo "$(( bytes / 1048576 ))MB"
  else
    echo "$(( bytes / 1073741824 ))GB"
  fi
}

# Function to extract workspace name from cache key
extract_workspace() {
  local cache_key=$1
  # Extract workspace name from cache key pattern: runner.os-workspace-hash
  if [[ $cache_key =~ -([^-]+)- ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo "unknown"
  fi
}

# Function to check if cache is older than MAX_AGE days
is_cache_old() {
  local created_at=$1
  local created_timestamp=$(date -d "$created_at" +%s)
  local current_timestamp=$(date +%s)
  local age_seconds=$((current_timestamp - created_timestamp))
  local age_days=$((age_seconds / 86400))
  
  if [ $age_days -gt $MAX_AGE ]; then
    return 0 # true in bash
  else
    return 1 # false in bash
  fi
}

# Function to delete a cache
delete_cache() {
  local cache_id=$1
  local cache_key=$2
  local reason=$3
  
  log "INFO" "Deleting cache: $cache_key (Reason: $reason)"
  
  if [ "$DRY_RUN" = "true" ]; then
    log "DEBUG" "[DRY RUN] Would delete cache $cache_id ($cache_key)"
  else
    gh api --method DELETE /repos/$REPO_OWNER/$REPO_NAME/actions/caches/$cache_id
    if [ $? -eq 0 ]; then
      log "INFO" "Successfully deleted cache: $cache_key"
    else
      log "ERROR" "Failed to delete cache: $cache_key"
    fi
  fi
}

# Function to check if a cache is still valid based on dependency changes
is_cache_valid() {
  local cache_key=$1
  local workspace=$(extract_workspace "$cache_key")
  
  # If the cache key doesn't contain a hash part, consider it invalid
  if [[ ! $cache_key =~ -[0-9a-f]{40}$ ]]; then
    log "DEBUG" "Cache key doesn't contain a valid hash: $cache_key"
    return 1 # false in bash
  fi
  
  # Extract the hash part from the cache key
  local cache_hash=$(echo $cache_key | grep -oE '[0-9a-f]{40}$')
  
  # Get the current hash of the lockfile for this workspace
  local lockfile_path=""
  case "$workspace" in
    "web")
      lockfile_path="src/web/pnpm-lock.yaml"
      ;;
    "mobile")
      lockfile_path="src/web/mobile/pnpm-lock.yaml"
      ;;
    "design-system")
      lockfile_path="src/web/design-system/pnpm-lock.yaml"
      ;;
    "primitives")
      lockfile_path="src/web/primitives/pnpm-lock.yaml"
      ;;
    "interfaces")
      lockfile_path="src/web/interfaces/pnpm-lock.yaml"
      ;;
    "journey-context")
      lockfile_path="src/web/journey-context/pnpm-lock.yaml"
      ;;
    "api-gateway" | "auth-service" | "gamification-engine" | "health-service" | "care-service" | "plan-service" | "notification-service")
      lockfile_path="src/backend/$workspace/pnpm-lock.yaml"
      ;;
    *)
      log "DEBUG" "Unknown workspace: $workspace, can't determine lockfile path"
      return 0 # true in bash - keep the cache if we can't determine validity
      ;;
  esac
  
  # If we're not in a git repository, we can't check the hash
  if [ ! -d ".git" ]; then
    log "DEBUG" "Not in a git repository, can't check lockfile hash"
    return 0 # true in bash - keep the cache if we can't determine validity
  fi
  
  # If the lockfile doesn't exist, consider the cache valid (can't determine)
  if [ ! -f "$lockfile_path" ]; then
    log "DEBUG" "Lockfile doesn't exist: $lockfile_path"
    return 0 # true in bash - keep the cache if we can't determine validity
  fi
  
  # Get the current hash of the lockfile
  local current_hash=$(git hash-object "$lockfile_path")
  
  # Compare the hashes
  if [ "$cache_hash" != "$current_hash" ]; then
    log "DEBUG" "Cache hash ($cache_hash) doesn't match current lockfile hash ($current_hash) for workspace: $workspace"
    return 1 # false in bash - cache is invalid
  fi
  
  return 0 # true in bash - cache is valid
}

# Main function to clean up caches
clean_caches() {
  log "INFO" "Starting cache cleanup process"
  log "INFO" "Configuration: MAX_AGE=$MAX_AGE days, MAX_SIZE_PER_WORKSPACE=$MAX_SIZE_PER_WORKSPACE GB"
  
  if [ "$DRY_RUN" = "true" ]; then
    log "INFO" "Running in DRY RUN mode - no caches will be deleted"
  fi
  
  if [ -n "$WORKSPACE" ]; then
    log "INFO" "Filtering caches for workspace: $WORKSPACE"
  fi
  
  # Get all caches
  log "INFO" "Fetching cache list from GitHub Actions..."
  local caches_json=$(gh api /repos/$REPO_OWNER/$REPO_NAME/actions/caches --paginate)
  
  if [ -z "$caches_json" ]; then
    log "ERROR" "Failed to fetch caches or no caches found"
    exit 1
  fi
  
  # Parse caches and group by workspace
  declare -A workspace_caches
  declare -A workspace_sizes
  
  log "INFO" "Analyzing caches..."
  
  # Process each cache
  echo "$caches_json" | jq -c '.actions_caches[]' | while read -r cache; do
    local cache_id=$(echo "$cache" | jq -r '.id')
    local cache_key=$(echo "$cache" | jq -r '.key')
    local created_at=$(echo "$cache" | jq -r '.created_at')
    local size_bytes=$(echo "$cache" | jq -r '.size_in_bytes')
    local size_human=$(format_bytes "$size_bytes")
    local workspace=$(extract_workspace "$cache_key")
    
    # Skip if we're filtering by workspace and this isn't the one
    if [ -n "$WORKSPACE" ] && [ "$WORKSPACE" != "$workspace" ]; then
      continue
    fi
    
    log "DEBUG" "Found cache: $cache_key, Size: $size_human, Created: $created_at, Workspace: $workspace"
    
    # Check if cache is old
    if is_cache_old "$created_at"; then
      delete_cache "$cache_id" "$cache_key" "older than $MAX_AGE days"
      continue
    fi
    
    # Check if cache is still valid based on dependency changes
    if ! is_cache_valid "$cache_key"; then
      delete_cache "$cache_id" "$cache_key" "dependencies have changed"
      continue
    fi
    
    # Add to workspace tracking
    if [ -z "${workspace_caches[$workspace]}" ]; then
      workspace_caches[$workspace]=""
      workspace_sizes[$workspace]=0
    fi
    
    workspace_caches[$workspace]="${workspace_caches[$workspace]} $cache_id:$cache_key:$size_bytes:$created_at"
    workspace_sizes[$workspace]=$((workspace_sizes[$workspace] + size_bytes))
  done
  
  # Process each workspace to enforce size limits
  for workspace in "${!workspace_sizes[@]}"; do
    local total_size=${workspace_sizes[$workspace]}
    local total_size_gb=$((total_size / 1073741824))
    local total_size_human=$(format_bytes "$total_size")
    
    log "INFO" "Workspace '$workspace' total cache size: $total_size_human"
    
    # Check if workspace exceeds size limit
    if [ $total_size_gb -gt $MAX_SIZE_PER_WORKSPACE ]; then
      log "WARN" "Workspace '$workspace' exceeds size limit of $MAX_SIZE_PER_WORKSPACE GB"
      
      # Sort caches by creation date (oldest first)
      local sorted_caches=$(echo "${workspace_caches[$workspace]}" | tr ' ' '\n' | sort -t: -k4)
      
      # Delete oldest caches until under the limit
      for cache_info in $sorted_caches; do
        IFS=':' read -r cache_id cache_key size_bytes created_at <<< "$cache_info"
        
        if [ $total_size_gb -le $MAX_SIZE_PER_WORKSPACE ]; then
          break
        fi
        
        delete_cache "$cache_id" "$cache_key" "workspace size limit exceeded"
        
        total_size=$((total_size - size_bytes))
        total_size_gb=$((total_size / 1073741824))
      done
      
      log "INFO" "Workspace '$workspace' new total cache size: $(format_bytes "$total_size")"
    fi
  done
  
  log "INFO" "Cache cleanup process completed"
}

# Generate cache usage metrics
generate_metrics() {
  log "INFO" "Generating cache usage metrics"
  
  # Get all caches
  local caches_json=$(gh api /repos/$REPO_OWNER/$REPO_NAME/actions/caches --paginate)
  
  if [ -z "$caches_json" ]; then
    log "ERROR" "Failed to fetch caches or no caches found"
    return
  fi
  
  # Calculate metrics
  local total_count=$(echo "$caches_json" | jq '.total_count')
  local total_size_bytes=$(echo "$caches_json" | jq '[.actions_caches[].size_in_bytes] | add')
  local total_size_human=$(format_bytes "$total_size_bytes")
  
  # Calculate workspace-specific metrics
  local workspace_metrics=$(echo "$caches_json" | jq -c '.actions_caches[] | {key, size_in_bytes, created_at}' | \
    while read -r cache; do
      local cache_key=$(echo "$cache" | jq -r '.key')
      local size_bytes=$(echo "$cache" | jq -r '.size_in_bytes')
      local workspace=$(extract_workspace "$cache_key")
      echo "$workspace $size_bytes"
    done | awk '{
      workspace[$1] += $2; count[$1]++
    } END {
      for (w in workspace) {
        printf "%s %d %d\n", w, count[w], workspace[w]
      }
    }')
  
  # Print metrics
  log "INFO" "Total caches: $total_count, Total size: $total_size_human"
  
  echo "$workspace_metrics" | while read -r line; do
    read -r workspace count size_bytes <<< "$line"
    local size_human=$(format_bytes "$size_bytes")
    log "INFO" "Workspace '$workspace': $count caches, Size: $size_human"
  done
  
  # Write metrics to file if not in dry run mode
  if [ "$DRY_RUN" != "true" ]; then
    local metrics_file="cache-metrics-$(date '+%Y%m%d').json"
    echo "$caches_json" | jq '{
      timestamp: "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",,
      total_count: .total_count,
      total_size_bytes: ([.actions_caches[].size_in_bytes] | add),
      workspaces: [.actions_caches[] | {key, size_in_bytes, created_at}] | group_by((.key | split("-") | .[1])) | map({
        name: .[0].key | split("-") | .[1],
        count: length,
        total_size_bytes: map(.size_in_bytes) | add
      })
    }' > "$metrics_file"
    
    log "INFO" "Metrics written to $metrics_file"
  fi
}

# Main execution
log "INFO" "AUSTA SuperApp - GitHub Actions Build Cache Cleanup"

# Run the cleanup process
clean_caches

# Generate metrics
generate_metrics

log "INFO" "Script execution completed"

exit 0