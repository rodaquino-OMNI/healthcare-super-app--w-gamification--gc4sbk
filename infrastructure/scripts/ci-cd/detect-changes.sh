#!/bin/bash

# detect-changes.sh
#
# This script detects changes in the AUSTA SuperApp monorepo and generates
# a dynamic build matrix for GitHub Actions, enabling targeted rebuilds of
# only affected packages based on dependency graph analysis.
#
# Usage: ./detect-changes.sh [base_ref]
#   base_ref: Optional git reference to compare against (default: origin/main)
#
# Output:
#   - matrix: JSON object with build matrix for GitHub Actions
#   - affected_workspaces: Space-separated list of affected workspace names
#
# Example GitHub Actions workflow usage:
#
# jobs:
#   detect-changes:
#     runs-on: ubuntu-latest
#     outputs:
#       matrix: ${{ steps.set-matrix.outputs.matrix }}
#       affected_workspaces: ${{ steps.set-matrix.outputs.affected_workspaces }}
#     steps:
#       - uses: actions/checkout@v3
#         with:
#           fetch-depth: 0
#       - id: set-matrix
#         run: ./infrastructure/scripts/ci-cd/detect-changes.sh
#
#   build:
#     needs: detect-changes
#     if: ${{ needs.detect-changes.outputs.affected_workspaces != 'none' }}
#     runs-on: ubuntu-latest
#     strategy:
#       matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
#     steps:
#       - uses: actions/checkout@v3
#       - uses: actions/setup-node@v3
#         with:
#           node-version: '18.15.0'
#       # Build steps for the specific workspace

set -e

# Default base reference if not provided
BASE_REF=${1:-"origin/main"}
echo "Comparing changes against: $BASE_REF"

# Root directories for different workspaces
BACKEND_ROOT="src/backend"
WEB_ROOT="src/web"
INFRA_ROOT="infrastructure"

# Define workspaces and their paths
declare -A WORKSPACE_PATHS=(
  # Backend services
  ["api-gateway"]="$BACKEND_ROOT/api-gateway"
  ["auth-service"]="$BACKEND_ROOT/auth-service"
  ["gamification-engine"]="$BACKEND_ROOT/gamification-engine"
  ["health-service"]="$BACKEND_ROOT/health-service"
  ["care-service"]="$BACKEND_ROOT/care-service"
  ["plan-service"]="$BACKEND_ROOT/plan-service"
  ["notification-service"]="$BACKEND_ROOT/notification-service"
  ["backend-shared"]="$BACKEND_ROOT/shared"
  ["backend-packages"]="$BACKEND_ROOT/packages"
  
  # Frontend applications
  ["web"]="$WEB_ROOT/web"
  ["mobile"]="$WEB_ROOT/mobile"
  
  # Design system packages
  ["design-system"]="$WEB_ROOT/design-system"
  ["primitives"]="$WEB_ROOT/primitives"
  ["interfaces"]="$WEB_ROOT/interfaces"
  ["journey-context"]="$WEB_ROOT/journey-context"
)

# Define workspace dependencies
# Format: [workspace]="space-separated list of dependencies"
declare -A WORKSPACE_DEPS=(
  # Backend service dependencies
  ["api-gateway"]="backend-shared backend-packages"
  ["auth-service"]="backend-shared backend-packages"
  ["gamification-engine"]="backend-shared backend-packages"
  ["health-service"]="backend-shared backend-packages"
  ["care-service"]="backend-shared backend-packages"
  ["plan-service"]="backend-shared backend-packages"
  ["notification-service"]="backend-shared backend-packages"
  
  # Frontend application dependencies
  ["web"]="design-system primitives interfaces journey-context"
  ["mobile"]="design-system primitives interfaces journey-context"
  
  # Design system dependencies
  ["design-system"]="primitives interfaces"
  ["journey-context"]="interfaces"
)

# Get changed files
echo "Fetching changed files..."

# Make sure we have the base ref
if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "Base reference $BASE_REF not found, fetching..."
  git fetch origin "$BASE_REF" --depth=1 || {
    echo "Failed to fetch $BASE_REF"
    exit 1
  }
fi

CHANGED_FILES=$(git diff --name-only "$BASE_REF"...HEAD)

if [ -z "$CHANGED_FILES" ]; then
  echo "No changes detected"
  exit 0
fi

# Print changed files for debugging
echo "Changed files:"
echo "$CHANGED_FILES" | tr '\n' ' '
echo ""

# Determine directly changed workspaces
declare -A CHANGED_WORKSPACES
for workspace in "${!WORKSPACE_PATHS[@]}"; do
  path=${WORKSPACE_PATHS[$workspace]}
  if echo "$CHANGED_FILES" | grep -q "^$path/"; then
    echo "Detected changes in workspace: $workspace"
    CHANGED_WORKSPACES[$workspace]=1
  fi
done

# Special case for root configuration files that affect all workspaces
if echo "$CHANGED_FILES" | grep -q -E "^(package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|yarn\.lock|lerna\.json)$"; then
  echo "Detected changes in root configuration files - marking all workspaces as affected"
  for workspace in "${!WORKSPACE_PATHS[@]}"; do
    CHANGED_WORKSPACES[$workspace]=1
  done
fi

# Special case for backend root configuration
if echo "$CHANGED_FILES" | grep -q -E "^$BACKEND_ROOT/(package\.json|lerna\.json|tsconfig\.json)$"; then
  echo "Detected changes in backend root configuration - marking all backend workspaces as affected"
  for workspace in "api-gateway" "auth-service" "gamification-engine" "health-service" "care-service" "plan-service" "notification-service" "backend-shared" "backend-packages"; do
    CHANGED_WORKSPACES[$workspace]=1
  done
fi

# Special case for web root configuration
if echo "$CHANGED_FILES" | grep -q -E "^$WEB_ROOT/(package\.json|turbo\.json|tsconfig\.json)$"; then
  echo "Detected changes in web root configuration - marking all web workspaces as affected"
  for workspace in "web" "mobile" "design-system" "primitives" "interfaces" "journey-context"; do
    CHANGED_WORKSPACES[$workspace]=1
  done
fi

# Special case for infrastructure changes
if echo "$CHANGED_FILES" | grep -q -E "^$INFRA_ROOT/(kubernetes|terraform|docker)/"; then
  echo "Detected changes in infrastructure - determining affected workspaces"
  
  # Check for specific service infrastructure changes
  if echo "$CHANGED_FILES" | grep -q "$INFRA_ROOT/kubernetes/api-gateway/"; then
    CHANGED_WORKSPACES["api-gateway"]=1
  fi
  if echo "$CHANGED_FILES" | grep -q "$INFRA_ROOT/kubernetes/auth-service/"; then
    CHANGED_WORKSPACES["auth-service"]=1
  fi
  if echo "$CHANGED_FILES" | grep -q "$INFRA_ROOT/kubernetes/gamification/"; then
    CHANGED_WORKSPACES["gamification-engine"]=1
  fi
  if echo "$CHANGED_FILES" | grep -q "$INFRA_ROOT/kubernetes/health-journey/"; then
    CHANGED_WORKSPACES["health-service"]=1
  fi
  if echo "$CHANGED_FILES" | grep -q "$INFRA_ROOT/kubernetes/care-journey/"; then
    CHANGED_WORKSPACES["care-service"]=1
  fi
  if echo "$CHANGED_FILES" | grep -q "$INFRA_ROOT/kubernetes/plan-journey/"; then
    CHANGED_WORKSPACES["plan-service"]=1
  fi
  if echo "$CHANGED_FILES" | grep -q "$INFRA_ROOT/kubernetes/notification-service/"; then
    CHANGED_WORKSPACES["notification-service"]=1
  fi
  
  # Global infrastructure changes affect all services
  if echo "$CHANGED_FILES" | grep -q -E "$INFRA_ROOT/(terraform|docker)/"; then
    echo "Detected changes in global infrastructure - marking all workspaces as affected"
    for workspace in "${!WORKSPACE_PATHS[@]}"; do
      CHANGED_WORKSPACES[$workspace]=1
    done
  fi
fi

# Special case for CI/CD changes
if echo "$CHANGED_FILES" | grep -q -E "^(\.github/workflows/|$INFRA_ROOT/scripts/ci-cd/)"; then
  echo "Detected changes in CI/CD configuration - marking all workspaces as affected"
  for workspace in "${!WORKSPACE_PATHS[@]}"; do
    CHANGED_WORKSPACES[$workspace]=1
  done
fi

# Analyze dependency graph to find affected workspaces
declare -A AFFECTED_WORKSPACES

# First, add all directly changed workspaces to affected
for workspace in "${!CHANGED_WORKSPACES[@]}"; do
  AFFECTED_WORKSPACES[$workspace]=1
done

# Function to recursively find dependent workspaces
# This implements a depth-first traversal of the dependency graph
# to find all workspaces that depend on the changed workspaces
find_dependents() {
  local package=$1
  for workspace in "${!WORKSPACE_DEPS[@]}"; do
    local deps=${WORKSPACE_DEPS[$workspace]}
    # Check if this workspace depends on the package
    if [[ " $deps " == *" $package "* ]] || [[ "$deps" == "$package"* ]] || [[ "$deps" == *"$package" ]]; then
      # Only process if not already marked as affected
      if [ -z "${AFFECTED_WORKSPACES[$workspace]}" ]; then
        echo "Workspace '$workspace' is affected because it depends on '$package'"
        AFFECTED_WORKSPACES[$workspace]=1
        # Recursively find workspaces that depend on this one
        find_dependents "$workspace"
      fi
    fi
  done
}

# Find all affected workspaces based on dependency graph
for workspace in "${!CHANGED_WORKSPACES[@]}"; do
  echo "Analyzing dependencies for changed workspace: $workspace"
  find_dependents "$workspace"
done

# Generate build matrix for GitHub Actions
MATRIX_INCLUDE=""
for workspace in "${!AFFECTED_WORKSPACES[@]}"; do
  if [ -n "$MATRIX_INCLUDE" ]; then
    MATRIX_INCLUDE="$MATRIX_INCLUDE,"
  fi
  MATRIX_INCLUDE="$MATRIX_INCLUDE{\"workspace\":\"$workspace\",\"path\":\"${WORKSPACE_PATHS[$workspace]}\"}"
done

# If no workspaces are affected, include a dummy entry to prevent workflow failure
if [ -z "$MATRIX_INCLUDE" ]; then
  echo "No workspaces affected, adding dummy entry"
  MATRIX_INCLUDE="{\"workspace\":\"none\",\"path\":\"./\"}"
  AFFECTED_WORKSPACES["none"]=1
fi

# Output the matrix using GitHub Actions environment file
MATRIX="{\"include\":[$MATRIX_INCLUDE]}"

# Generate a sorted list of affected workspaces
AFFECTED_LIST=$(printf "%s\n" "${!AFFECTED_WORKSPACES[@]}" | sort | tr '\n' ' ')

# Use GitHub environment file if available, otherwise just echo
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "matrix=$MATRIX" >> $GITHUB_OUTPUT
  echo "affected_workspaces=$AFFECTED_LIST" >> $GITHUB_OUTPUT
  echo "Outputs written to GitHub environment file"
else
  # For local testing, just echo the outputs
  echo "matrix=$MATRIX"
  echo "affected_workspaces=$AFFECTED_LIST"
fi

# Print summary information
echo "Generated build matrix for affected workspaces:"
echo "$MATRIX"

echo "Affected workspaces: $AFFECTED_LIST"

# Make sure the script is executable
chmod +x "$0"