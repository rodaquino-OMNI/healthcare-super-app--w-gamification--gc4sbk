#!/bin/bash
# Make script executable: chmod +x build-workspace.sh

# ============================================================================
# build-workspace.sh
#
# Intelligent workspace-aware build script for the AUSTA SuperApp monorepo.
# Determines optimal build order for packages, implements dependency-aware
# incremental builds, and integrates with build caching for faster CI execution.
#
# Usage:
#   ./build-workspace.sh --workspace=<workspace_path> [options]
#
# Options:
#   --workspace=<path>       Required. Path to workspace (src/backend or src/web)
#   --incremental            Enable incremental builds (default: false)
#   --cache                  Enable build caching (default: true)
#   --verbose                Enable verbose output (default: false)
#   --skip-deps-check        Skip dependency validation (default: false)
#   --build-affected-only    Build only affected packages (default: false in CI, true in local)
#   --help                   Display this help message
# ============================================================================

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Default values
WORKSPACE=""
INCREMENTAL=false
CACHE=true
VERBOSE=false
SKIP_DEPS_CHECK=false
BUILD_AFFECTED_ONLY=false

# Determine if running in CI environment
if [ -n "$CI" ]; then
  BUILD_AFFECTED_ONLY=false
  echo "Running in CI environment"
else
  BUILD_AFFECTED_ONLY=true
  echo "Running in local environment"
fi

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# ============================================================================
# Helper functions
# ============================================================================

function print_help {
  echo -e "${CYAN}AUSTA SuperApp Workspace Build Script${NC}"
  echo ""
  echo "Usage: ./build-workspace.sh --workspace=<workspace_path> [options]"
  echo ""
  echo "Options:"
  echo "  --workspace=<path>       Required. Path to workspace (src/backend or src/web)"
  echo "  --incremental            Enable incremental builds (default: false)"
  echo "  --cache                  Enable build caching (default: true)"
  echo "  --verbose                Enable verbose output (default: false)"
  echo "  --skip-deps-check        Skip dependency validation (default: false)"
  echo "  --build-affected-only    Build only affected packages (default: false in CI, true in local)"
  echo "  --help                   Display this help message"
  echo ""
  echo "Examples:"
  echo "  ./build-workspace.sh --workspace=src/backend --incremental"
  echo "  ./build-workspace.sh --workspace=src/web --verbose --cache"
  exit 0
}

function log_info {
  echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warning {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error {
  echo -e "${RED}[ERROR]${NC} $1"
}

function log_step {
  echo -e "${MAGENTA}[STEP]${NC} $1"
}

function log_debug {
  if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}[DEBUG]${NC} $1"
  fi
}

function check_command {
  if ! command -v $1 &> /dev/null; then
    log_error "$1 is required but not installed. Please install it and try again."
    exit 1
  fi
}

function check_workspace_type {
  if [[ "$WORKSPACE" == *"/backend"* ]]; then
    echo "backend"
  elif [[ "$WORKSPACE" == *"/web"* ]]; then
    echo "web"
  else
    log_error "Unknown workspace type. Workspace path must contain '/backend' or '/web'."
    exit 1
  fi
}

function validate_dependencies {
  if [ "$SKIP_DEPS_CHECK" = true ]; then
    log_warning "Skipping dependency validation"
    return 0
  fi

  log_step "Validating dependencies in $WORKSPACE"
  
  # Check if validate-dependencies.js exists and use it
  if [ -f "$SCRIPT_DIR/validate-dependencies.js" ]; then
    log_info "Using validate-dependencies.js script"
    node "$SCRIPT_DIR/validate-dependencies.js" --workspace="$WORKSPACE"
    return $?
  fi
  
  # Fallback to basic dependency validation
  cd "$ROOT_DIR/$WORKSPACE"
  
  # Check for missing dependencies
  log_info "Checking for missing dependencies"
  if [ "$WORKSPACE_TYPE" = "backend" ]; then
    npm ls --all 2>&1 | grep -i "missing"
    if [ $? -eq 0 ]; then
      log_error "Missing dependencies found. Please run 'npm install' and try again."
      return 1
    fi
  else
    pnpm list -r 2>&1 | grep -i "missing"
    if [ $? -eq 0 ]; then
      log_error "Missing dependencies found. Please run 'pnpm install' and try again."
      return 1
    fi
  fi
  
  # Validate TypeScript project references
  log_info "Validating TypeScript project references"
  npx tsc --build --dry --verbose
  return $?
}

function get_affected_packages {
  log_step "Determining affected packages"
  
  # Check if detect-changes.sh exists and use it
  if [ -f "$SCRIPT_DIR/detect-changes.sh" ]; then
    log_info "Using detect-changes.sh script"
    "$SCRIPT_DIR/detect-changes.sh" --workspace="$WORKSPACE" --output=plain
    return $?
  fi
  
  # Fallback to building all packages if detect-changes.sh doesn't exist
  log_warning "detect-changes.sh not found, building all packages"
  cd "$ROOT_DIR/$WORKSPACE"
  
  if [ "$WORKSPACE_TYPE" = "backend" ]; then
    npx lerna list --all --json | jq -r '.[].name'
  else
    pnpm list -r --json | jq -r '.[].name'
  fi
  
  return 0
}

function determine_build_order {
  log_step "Determining optimal build order"
  cd "$ROOT_DIR/$WORKSPACE"
  
  if [ "$WORKSPACE_TYPE" = "backend" ]; then
    # For backend (Lerna)
    log_info "Using Lerna to determine build order"
    if [ "$BUILD_AFFECTED_ONLY" = true ]; then
      AFFECTED_PACKAGES=$(get_affected_packages)
      if [ -z "$AFFECTED_PACKAGES" ]; then
        log_info "No affected packages found, skipping build"
        return 0
      fi
      
      # Create a temporary file with the list of affected packages
      TEMP_FILE=$(mktemp)
      echo "$AFFECTED_PACKAGES" > "$TEMP_FILE"
      
      # Get the build order for affected packages
      npx lerna list --all --toposort --include-filtered-dependencies --scope "$(cat $TEMP_FILE | tr '\n' ',' | sed 's/,$//')" --json | jq -r '.[].name'
      
      rm "$TEMP_FILE"
    else
      npx lerna list --all --toposort --json | jq -r '.[].name'
    fi
  else
    # For web (Turborepo)
    log_info "Using Turborepo to determine build order"
    if [ "$BUILD_AFFECTED_ONLY" = true ]; then
      AFFECTED_PACKAGES=$(get_affected_packages)
      if [ -z "$AFFECTED_PACKAGES" ]; then
        log_info "No affected packages found, skipping build"
        return 0
      fi
      
      # Create a filter for affected packages
      FILTER="$(echo $AFFECTED_PACKAGES | tr '\n' ' ' | sed 's/ $//' | sed 's/ /\|/g')"
      
      # Get the build order using Turborepo
      npx turbo run build --dry-run --filter="$FILTER..." | grep "RUN" | awk '{print $2}' | sed 's/\[build\]//' | sort | uniq
    else
      npx turbo run build --dry-run | grep "RUN" | awk '{print $2}' | sed 's/\[build\]//' | sort | uniq
    fi
  fi
  
  return 0
}

function build_package {
  local package=$1
  log_info "Building package: $package"
  
  cd "$ROOT_DIR/$WORKSPACE"
  
  if [ "$WORKSPACE_TYPE" = "backend" ]; then
    # For backend (Lerna)
    if [ "$INCREMENTAL" = true ]; then
      npx lerna run build --scope="$package" --include-dependencies -- --incremental
    else
      npx lerna run build --scope="$package" --include-dependencies
    fi
  else
    # For web (Turborepo)
    if [ "$CACHE" = true ]; then
      CACHE_FLAG=""
    else
      CACHE_FLAG="--no-cache"
    fi
    
    if [ "$INCREMENTAL" = true ]; then
      npx turbo run build --filter="$package" $CACHE_FLAG -- --incremental
    else
      npx turbo run build --filter="$package" $CACHE_FLAG
    fi
  fi
  
  return $?
}

function build_typescript_project {
  log_step "Building TypeScript project in $WORKSPACE"
  cd "$ROOT_DIR/$WORKSPACE"
  
  # Build options
  BUILD_OPTS=""
  if [ "$INCREMENTAL" = true ]; then
    BUILD_OPTS="$BUILD_OPTS --incremental"
  fi
  
  if [ "$VERBOSE" = true ]; then
    BUILD_OPTS="$BUILD_OPTS --verbose"
  fi
  
  # Build TypeScript project
  if [ "$WORKSPACE_TYPE" = "backend" ]; then
    # For backend
    log_info "Building backend TypeScript project"
    npx tsc --build $BUILD_OPTS
  else
    # For web
    log_info "Building web TypeScript project"
    npx tsc --build $BUILD_OPTS
  fi
  
  return $?
}

function build_all_packages {
  log_step "Building all packages in $WORKSPACE"
  cd "$ROOT_DIR/$WORKSPACE"
  
  # Get the build order
  BUILD_ORDER=$(determine_build_order)
  
  if [ -z "$BUILD_ORDER" ]; then
    log_info "No packages to build"
    return 0
  fi
  
  # Build each package in order
  echo "$BUILD_ORDER" | while read package; do
    if [ -n "$package" ]; then
      build_package "$package"
      if [ $? -ne 0 ]; then
        log_error "Failed to build package: $package"
        return 1
      fi
    fi
  done
  
  return 0
}

function clean_build_cache {
  if [ "$CACHE" = false ]; then
    log_step "Cleaning build cache"
    cd "$ROOT_DIR/$WORKSPACE"
    
    # Check if build-cache-clean.sh exists and use it
    if [ -f "$SCRIPT_DIR/build-cache-clean.sh" ]; then
      log_info "Using build-cache-clean.sh script"
      "$SCRIPT_DIR/build-cache-clean.sh" --workspace="$WORKSPACE"
      return $?
    fi
    
    # Fallback to basic cache cleaning
    if [ "$WORKSPACE_TYPE" = "backend" ]; then
      # For backend
      find . -name "*.tsbuildinfo" -type f -delete
      find . -name "dist" -type d -exec rm -rf {} +
    else
      # For web
      find . -name ".turbo" -type d -exec rm -rf {} +
      find . -name "dist" -type d -exec rm -rf {} +
    fi
    
    log_info "Build cache cleaned"
  fi
  
  return 0
}

# ============================================================================
# Main script execution
# ============================================================================

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --workspace=*)
      WORKSPACE="${arg#*=}"
      shift
      ;;
    --incremental)
      INCREMENTAL=true
      shift
      ;;
    --cache=*)
      CACHE="${arg#*=}"
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --skip-deps-check)
      SKIP_DEPS_CHECK=true
      shift
      ;;
    --build-affected-only=*)
      BUILD_AFFECTED_ONLY="${arg#*=}"
      shift
      ;;
    --build-affected-only)
      BUILD_AFFECTED_ONLY=true
      shift
      ;;
    --help)
      print_help
      ;;
    *)
      # Unknown option
      log_error "Unknown option: $arg"
      print_help
      ;;
  esac
done

# Validate required arguments
if [ -z "$WORKSPACE" ]; then
  log_error "--workspace parameter is required"
  print_help
fi

# Check if workspace exists
if [ ! -d "$ROOT_DIR/$WORKSPACE" ]; then
  log_error "Workspace directory does not exist: $ROOT_DIR/$WORKSPACE"
  exit 1
fi

# Check required commands
check_command "node"
check_command "npm"
check_command "npx"

if [[ "$WORKSPACE" == *"/web"* ]]; then
  check_command "pnpm"
fi

# Determine workspace type
WORKSPACE_TYPE=$(check_workspace_type)
log_info "Detected workspace type: $WORKSPACE_TYPE"

# Start build process
log_info "Starting build process for workspace: $WORKSPACE"
log_info "Build configuration:"
log_info "  - Incremental: $INCREMENTAL"
log_info "  - Cache: $CACHE"
log_info "  - Verbose: $VERBOSE"
log_info "  - Skip deps check: $SKIP_DEPS_CHECK"
log_info "  - Build affected only: $BUILD_AFFECTED_ONLY"

# Clean build cache if needed
clean_build_cache

# Validate dependencies
validate_dependencies
if [ $? -ne 0 ]; then
  log_error "Dependency validation failed"
  exit 1
fi

# Build TypeScript project
build_typescript_project
if [ $? -ne 0 ]; then
  log_error "TypeScript build failed"
  exit 1
fi

# Build all packages
build_all_packages
if [ $? -ne 0 ]; then
  log_error "Package build failed"
  exit 1
fi

log_success "Build completed successfully for workspace: $WORKSPACE"
exit 0