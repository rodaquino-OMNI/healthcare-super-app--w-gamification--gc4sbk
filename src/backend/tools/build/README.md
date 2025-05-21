# AUSTA SuperApp Build Tools

## Overview

This directory contains a suite of build tools designed to standardize and optimize the build process across the AUSTA SuperApp monorepo. These tools address critical build failures and architectural issues while ensuring consistent development experiences across all services and packages.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Tool Documentation](#tool-documentation)
  - [TypeScript Configuration Manager](#typescript-configuration-manager)
  - [Path Resolution Standardizer](#path-resolution-standardizer)
  - [Dependency Validator](#dependency-validator)
  - [Build Order Generator](#build-order-generator)
  - [Cache Optimizer](#cache-optimizer)
- [Common Workflows](#common-workflows)
- [Troubleshooting Guide](#troubleshooting-guide)
- [CI/CD Integration](#cicd-integration)
- [Contributing](#contributing)

## Installation

The build tools are included in the monorepo and don't require separate installation. However, ensure you have the following prerequisites:

- Node.js 18.15.0 (exact version required)
- pnpm (for monorepo package management)
- TypeScript 5.3.3

## Quick Start

To run the complete build preparation workflow:

```bash
node src/backend/tools/build/index.js --prepare-all
```

To run a specific tool:

```bash
node src/backend/tools/build/index.js --validate-deps
node src/backend/tools/build/index.js --fix-paths
node src/backend/tools/build/index.js --ts-config
node src/backend/tools/build/index.js --build-order
node src/backend/tools/build/index.js --optimize-cache
```

## Tool Documentation

### TypeScript Configuration Manager

**Purpose**: Standardizes and validates tsconfig.json files across the monorepo to ensure consistent compiler options, proper project references, and compatible module resolution settings.

**Usage**:

```bash
node src/backend/tools/build/typescript-config.js [options]
```

**Options**:

- `--validate`: Validates all tsconfig.json files without making changes
- `--fix`: Automatically fixes common TypeScript configuration issues
- `--generate`: Generates missing tsconfig.json files based on project templates
- `--rollback`: Restores TypeScript configurations to a clean, working state
- `--verbose`: Enables detailed logging

**Example - Validate TypeScript Configurations**:

```bash
node src/backend/tools/build/typescript-config.js --validate
```

**Example - Fix TypeScript Configuration Issues**:

```bash
node src/backend/tools/build/typescript-config.js --fix
```

**Configuration**:

The tool uses a standard TypeScript configuration template defined in the script. You can customize this template by modifying the `baseConfig` object in the script.

### Path Resolution Standardizer

**Purpose**: Ensures consistent import paths and alias usage across the monorepo by normalizing import statements according to the project's path alias conventions.

**Usage**:

```bash
node src/backend/tools/build/fix-paths.js [options]
```

**Options**:

- `--scan`: Scans for non-standard import paths without making changes
- `--fix`: Automatically normalizes import paths
- `--update-tsconfig`: Updates tsconfig.json path mappings
- `--validate`: Validates that changes result in successful TypeScript compilation
- `--verbose`: Enables detailed logging

**Example - Scan for Path Issues**:

```bash
node src/backend/tools/build/fix-paths.js --scan
```

**Example - Fix Path Issues**:

```bash
node src/backend/tools/build/fix-paths.js --fix --update-tsconfig
```

**Path Alias Conventions**:

- `@app/*`: Internal service modules (e.g., `@app/auth`, `@app/shared`)
- `@austa/*`: Shared packages (e.g., `@austa/design-system`, `@austa/interfaces`)

### Dependency Validator

**Purpose**: Analyzes dependency issues across the monorepo by scanning all package.json files to identify version conflicts, missing dependencies, and circular references.

**Usage**:

```bash
node src/backend/tools/build/validate-deps.js [options]
```

**Options**:

- `--scan`: Scans for dependency issues without making changes
- `--fix`: Attempts to automatically resolve dependency issues
- `--report`: Generates a detailed report of dependency issues
- `--check-circular`: Specifically checks for circular dependencies
- `--verbose`: Enables detailed logging

**Example - Scan for Dependency Issues**:

```bash
node src/backend/tools/build/validate-deps.js --scan --report
```

**Example - Fix Dependency Issues**:

```bash
node src/backend/tools/build/validate-deps.js --fix
```

**Common Dependency Issues**:

- Version conflicts in core packages (minimatch, semver, ws)
- Missing peer dependencies
- Circular dependencies between packages
- Inconsistent dependency declarations across workspaces

### Build Order Generator

**Purpose**: Determines the optimal build order of packages and services across the monorepo based on their interdependencies to ensure packages are built in the correct sequence.

**Usage**:

```bash
node src/backend/tools/build/build-order.js [options]
```

**Options**:

- `--generate`: Generates a build order sequence
- `--check-cycles`: Checks for circular dependencies
- `--output-json`: Outputs the build order as JSON
- `--create-matrix`: Creates a build matrix for GitHub Actions
- `--visualize`: Generates a visualization of the dependency graph
- `--verbose`: Enables detailed logging

**Example - Generate Build Order**:

```bash
node src/backend/tools/build/build-order.js --generate
```

**Example - Create GitHub Actions Build Matrix**:

```bash
node src/backend/tools/build/build-order.js --create-matrix --output-json
```

**Build Order Visualization**:

The `--visualize` option generates a dependency graph visualization that can be viewed in any browser. This helps identify complex dependency relationships and potential issues.

### Cache Optimizer

**Purpose**: Configures and manages caching strategies for the CI/CD pipeline to reduce build times and ensure consistent, deterministic builds across environments.

**Usage**:

```bash
node src/backend/tools/build/optimize-cache.js [options]
```

**Options**:

- `--generate-keys`: Generates cache keys based on lockfile hashes
- `--configure-docker`: Sets up Docker layer caching
- `--configure-deps`: Sets up workspace-specific dependency caching
- `--output-github-actions`: Outputs GitHub Actions cache configuration
- `--verbose`: Enables detailed logging

**Example - Generate Cache Keys**:

```bash
node src/backend/tools/build/optimize-cache.js --generate-keys
```

**Example - Configure GitHub Actions Caching**:

```bash
node src/backend/tools/build/optimize-cache.js --output-github-actions
```

**Cache Configuration Example**:

```yaml
# Example GitHub Actions cache configuration
steps:
  - name: Cache workspace dependencies
    uses: actions/cache@v3
    with:
      path: |
        **/node_modules
      key: ${{ runner.os }}-${{ matrix.workspace }}-${{ hashFiles(format('{0}/pnpm-lock.yaml', matrix.workspace)) }}
      restore-keys: |
        ${{ runner.os }}-${{ matrix.workspace }}-
```

## Common Workflows

### Setting Up a New Service

1. Create the service directory structure
2. Run TypeScript Configuration Manager to generate a tsconfig.json:
   ```bash
   node src/backend/tools/build/typescript-config.js --generate --target=path/to/new-service
   ```
3. Validate dependencies:
   ```bash
   node src/backend/tools/build/validate-deps.js --scan
   ```
4. Update the build order:
   ```bash
   node src/backend/tools/build/build-order.js --generate --output-json
   ```

### Resolving Build Failures

1. Validate TypeScript configurations:
   ```bash
   node src/backend/tools/build/typescript-config.js --validate
   ```
2. Fix path resolution issues:
   ```bash
   node src/backend/tools/build/fix-paths.js --fix --update-tsconfig
   ```
3. Check for dependency issues:
   ```bash
   node src/backend/tools/build/validate-deps.js --scan --report
   ```
4. Resolve any identified issues
5. Verify the build order:
   ```bash
   node src/backend/tools/build/build-order.js --generate --check-cycles
   ```

### Optimizing CI/CD Pipeline

1. Generate cache configuration:
   ```bash
   node src/backend/tools/build/optimize-cache.js --output-github-actions
   ```
2. Create a build matrix:
   ```bash
   node src/backend/tools/build/build-order.js --create-matrix --output-json
   ```
3. Update GitHub Actions workflows with the generated configurations

## Troubleshooting Guide

### TypeScript Project Reference Errors

**Symptoms**:
- Error: "Project reference cycle detected"
- Error: "Cannot find module or its corresponding type declarations"

**Solution**:
1. Restore TypeScript configurations to a clean state:
   ```bash
   node src/backend/tools/build/typescript-config.js --rollback
   ```
2. Regenerate TypeScript configurations:
   ```bash
   node src/backend/tools/build/typescript-config.js --generate
   ```

### Module Resolution Failures

**Symptoms**:
- Error: "Cannot find module '@app/auth'"
- Error: "Cannot find module '@austa/interfaces'"

**Solution**:
1. Fix path resolution issues:
   ```bash
   node src/backend/tools/build/fix-paths.js --fix --update-tsconfig
   ```
2. Validate TypeScript configurations:
   ```bash
   node src/backend/tools/build/typescript-config.js --validate
   ```

### Dependency Conflicts

**Symptoms**:
- Error: "Conflicting peer dependency"
- Error: "Found incompatible module"

**Solution**:
1. Scan for dependency issues:
   ```bash
   node src/backend/tools/build/validate-deps.js --scan --report
   ```
2. Fix identified issues:
   ```bash
   node src/backend/tools/build/validate-deps.js --fix
   ```

### Circular Dependencies

**Symptoms**:
- Error: "Circular dependency detected"
- Build hangs or fails without clear error

**Solution**:
1. Check for circular dependencies:
   ```bash
   node src/backend/tools/build/build-order.js --check-cycles
   ```
2. Visualize the dependency graph to identify issues:
   ```bash
   node src/backend/tools/build/build-order.js --visualize
   ```
3. Refactor code to break circular dependencies

### Build Order Issues

**Symptoms**:
- Error: "Cannot find module" for a package that should be built first
- TypeScript errors related to missing declarations

**Solution**:
1. Generate the correct build order:
   ```bash
   node src/backend/tools/build/build-order.js --generate
   ```
2. Build packages in the specified order

## CI/CD Integration

### GitHub Actions Integration

The build tools can be integrated into GitHub Actions workflows to automate build preparation and validation:

```yaml
# Example GitHub Actions workflow step
jobs:
  dependency-resolution:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.15.0'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Validate dependencies
        run: node src/backend/tools/build/validate-deps.js --scan --report
      - name: Validate TypeScript configurations
        run: node src/backend/tools/build/typescript-config.js --validate
      - name: Generate build order
        run: node src/backend/tools/build/build-order.js --generate --output-json
      - name: Optimize cache configuration
        run: node src/backend/tools/build/optimize-cache.js --output-github-actions
```

### Build Matrix Generation

The Build Order Generator can create a build matrix for GitHub Actions to optimize parallel builds:

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v3
      - id: set-matrix
        run: |
          MATRIX=$(node src/backend/tools/build/build-order.js --create-matrix --output-json)
          echo "matrix=$MATRIX" >> $GITHUB_OUTPUT
          
  build:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
    steps:
      # Build steps here
```

### Cache Optimization

The Cache Optimizer can generate cache configurations for GitHub Actions:

```yaml
steps:
  - name: Cache workspace dependencies
    uses: actions/cache@v3
    with:
      path: |
        **/node_modules
      key: ${{ runner.os }}-${{ matrix.workspace }}-${{ hashFiles(format('{0}/pnpm-lock.yaml', matrix.workspace)) }}
      restore-keys: |
        ${{ runner.os }}-${{ matrix.workspace }}-
```

## Contributing

### Adding New Build Tools

1. Create a new JavaScript file in the `src/backend/tools/build` directory
2. Implement the tool following the existing patterns
3. Add the tool to the main entry point (`index.js`)
4. Update this README with documentation for the new tool

### Updating Existing Tools

1. Make the necessary changes to the tool
2. Update the documentation in this README if the interface or behavior changes
3. Test the changes thoroughly

### Testing Build Tools

Before submitting changes, test the build tools in various scenarios:

1. Run the tools on a clean repository
2. Run the tools on a repository with known issues
3. Verify that the tools correctly identify and fix issues
4. Test integration with GitHub Actions workflows