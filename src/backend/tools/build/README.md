# AUSTA SuperApp Build Tools Suite

## Introduction

The AUSTA SuperApp Build Tools Suite is a collection of utilities designed to standardize, optimize, and troubleshoot the build process across the monorepo. These tools address critical build failures and architectural issues while ensuring consistent build processes across all services and packages.

### Key Features

- **Standardized TypeScript Configuration**: Ensures consistent compiler options and module resolution
- **Path Resolution**: Normalizes import paths and alias usage across the monorepo
- **Dependency Validation**: Identifies and resolves version conflicts and circular dependencies
- **Build Order Optimization**: Determines the correct build sequence based on package dependencies
- **Cache Optimization**: Configures caching strategies for faster builds in CI/CD pipelines
- **Unified CLI Interface**: Provides a consistent developer experience across all build tools

## Installation

The build tools are included in the monorepo and don't require separate installation. However, ensure you have the following prerequisites:

- Node.js 18.15.0 (exact version required)
- pnpm (for package management)
- TypeScript 5.3.3

## Tools Overview

### 1. TypeScript Configuration Manager (`typescript-config.js`)

Standardizes and validates tsconfig.json files across the monorepo to ensure consistent compiler options, proper project references, and compatible module resolution settings.

**Key Capabilities:**
- Generate or update tsconfig.json files based on project needs
- Validate existing configurations against best practices
- Fix common TypeScript configuration issues
- Implement proper project references for build ordering

### 2. Path Resolution Tool (`fix-paths.js`)

Ensures consistent import paths and alias usage across the monorepo by normalizing import statements according to the project's path alias conventions.

**Key Capabilities:**
- Standardize import paths using project aliases (@app/auth, @app/shared, @austa/*)
- Update tsconfig.json path mappings for proper resolution
- Validate import statements against defined path aliases
- Fix non-standard import paths automatically

### 3. Dependency Validator (`validate-deps.js`)

Analyzes dependency issues across the monorepo by scanning package.json files to identify version conflicts, missing dependencies, and circular references.

**Key Capabilities:**
- Detect version conflicts in core packages (minimatch, semver, ws)
- Identify circular dependencies that cause build failures
- Validate peer dependencies across packages
- Generate detailed reports with suggested fixes

### 4. Build Order Optimizer (`build-order.js`)

Determines the optimal build order of packages and services based on their interdependencies to prevent dependency-related build failures.

**Key Capabilities:**
- Analyze package.json files and TypeScript project references
- Generate a directed acyclic graph (DAG) of dependencies
- Validate the graph for cycles and suggest fixes
- Output a topologically sorted build sequence

### 5. Cache Optimizer (`optimize-cache.js`)

Configures and manages caching strategies for the CI/CD pipeline to reduce build times and ensure consistent, deterministic builds.

**Key Capabilities:**
- Generate cache keys based on lockfile hashes
- Set up workspace-specific dependency caching
- Configure Docker layer caching for container builds
- Implement cache invalidation rules based on dependency changes

### 6. Main CLI Interface (`index.js`)

Provides a unified interface for executing all build tools with consistent command-line arguments and output formatting.

**Key Capabilities:**
- Execute individual tools or complete build preparation workflow
- Parse command-line arguments for flexible tool usage
- Provide comprehensive logging and reporting
- Integrate with GitHub Actions workflows

## Usage Examples

### Running the Complete Build Preparation

To execute all build tools in the optimal sequence:

```bash
node tools/build/index.js --prepare-all
```

This command will:
1. Validate dependencies across all workspaces
2. Fix TypeScript configurations
3. Normalize import paths
4. Determine optimal build order
5. Configure caching for the current environment

### Running Individual Tools

#### TypeScript Configuration Manager

```bash
# Validate all tsconfig.json files
node tools/build/typescript-config.js --validate

# Fix TypeScript configurations
node tools/build/typescript-config.js --fix

# Generate a new tsconfig.json for a specific service
node tools/build/typescript-config.js --generate --service=auth-service
```

#### Path Resolution Tool

```bash
# Analyze import paths across the monorepo
node tools/build/fix-paths.js --analyze

# Fix import paths in a specific service
node tools/build/fix-paths.js --fix --service=health-service

# Update tsconfig.json path mappings
node tools/build/fix-paths.js --update-paths
```

#### Dependency Validator

```bash
# Validate dependencies across all workspaces
node tools/build/validate-deps.js --all

# Check for version conflicts in a specific service
node tools/build/validate-deps.js --service=gamification-engine

# Generate a dependency report
node tools/build/validate-deps.js --report --output=dependency-report.json
```

#### Build Order Optimizer

```bash
# Generate optimal build order for all packages
node tools/build/build-order.js --generate

# Check for circular dependencies
node tools/build/build-order.js --check-cycles

# Generate a build matrix for GitHub Actions
node tools/build/build-order.js --github-matrix --output=matrix.json
```

#### Cache Optimizer

```bash
# Configure caching for local development
node tools/build/optimize-cache.js --env=development

# Generate cache keys for CI/CD
node tools/build/optimize-cache.js --ci --generate-keys

# Configure Docker layer caching
node tools/build/optimize-cache.js --docker --service=api-gateway
```

## Troubleshooting Guide

### Common Build Issues

#### TypeScript Project Reference Errors

**Symptoms:**
- Error: "Project reference cycle detected"
- Error: "Cannot find referenced project"
- Error: "File is not listed within the 'include' patterns"

**Solution:**
```bash
# Reset TypeScript configurations to a clean state
node tools/build/typescript-config.js --reset

# Regenerate proper configurations
node tools/build/typescript-config.js --fix --all
```

#### Module Resolution Failures

**Symptoms:**
- Error: "Cannot find module '@app/auth'"
- Error: "Cannot find module '@austa/interfaces'"
- Import paths not resolving correctly

**Solution:**
```bash
# Fix path aliases in tsconfig.json
node tools/build/fix-paths.js --update-paths

# Normalize import statements
node tools/build/fix-paths.js --fix --all
```

#### Dependency Version Conflicts

**Symptoms:**
- Error: "Conflicting versions of 'minimatch' found"
- Error: "Peer dependency not satisfied"
- Multiple versions of the same package installed

**Solution:**
```bash
# Identify version conflicts
node tools/build/validate-deps.js --conflicts

# Apply resolutions to package.json
node tools/build/validate-deps.js --fix-conflicts
```

#### Circular Dependencies

**Symptoms:**
- Error: "Circular dependency detected"
- Build fails with cryptic import errors
- TypeScript compilation hangs

**Solution:**
```bash
# Identify circular dependencies
node tools/build/build-order.js --check-cycles

# Generate a dependency graph visualization
node tools/build/build-order.js --visualize --output=deps-graph.html
```

#### Build Cache Issues

**Symptoms:**
- Slow builds despite caching
- Cache not being used effectively
- Cache invalidation too frequent

**Solution:**
```bash
# Optimize cache configuration
node tools/build/optimize-cache.js --analyze

# Clear problematic caches
node tools/build/optimize-cache.js --clear-cache
```

### Specific Error Messages and Solutions

#### Error: "may not disable emit on a composite project"

**Solution:**
This occurs when a TypeScript project with references has `"noEmit": true` in its tsconfig.json.

```bash
node tools/build/typescript-config.js --fix-emit
```

#### Error: "File 'X' is not under 'rootDir'"

**Solution:**
This happens when files are outside the configured rootDir in tsconfig.json.

```bash
node tools/build/typescript-config.js --fix-rootdir
```

#### Error: "Cannot find name 'React'"

**Solution:**
This occurs when TypeScript cannot find React types.

```bash
# Ensure React types are installed
pnpm add -D @types/react

# Fix tsconfig.json to include types
node tools/build/typescript-config.js --fix-types
```

## CI/CD Integration

### GitHub Actions Integration

The build tools are designed to integrate seamlessly with GitHub Actions workflows. Here's an example configuration:

```yaml
name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  prepare-build:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.15.0'
      - uses: pnpm/action-setup@v2
        with:
          version: latest
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Validate dependencies
        run: node tools/build/validate-deps.js --all
      - name: Fix TypeScript configurations
        run: node tools/build/typescript-config.js --fix --all
      - name: Generate build matrix
        id: set-matrix
        run: node tools/build/build-order.js --github-matrix --output=matrix.json
      - name: Set matrix output
        run: echo "matrix=$(cat matrix.json)" >> $GITHUB_OUTPUT

  build:
    needs: prepare-build
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.prepare-build.outputs.matrix) }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.15.0'
      - uses: pnpm/action-setup@v2
        with:
          version: latest
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            **/node_modules
          key: ${{ runner.os }}-${{ matrix.workspace }}-${{ hashFiles(format('{0}/pnpm-lock.yaml', matrix.workspace)) }}
          restore-keys: |
            ${{ runner.os }}-${{ matrix.workspace }}-
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm --filter=${{ matrix.workspace }} build
```

### Optimizing CI/CD Performance

To optimize CI/CD performance with the build tools:

1. **Use the build matrix generator:**
   ```bash
   node tools/build/build-order.js --github-matrix --output=matrix.json
   ```

2. **Configure workspace-specific caching:**
   ```bash
   node tools/build/optimize-cache.js --ci --generate-keys > cache-keys.json
   ```

3. **Implement Docker layer caching:**
   ```bash
   node tools/build/optimize-cache.js --docker --all
   ```

4. **Set up incremental builds:**
   ```bash
   node tools/build/typescript-config.js --enable-incremental --all
   ```

## Configuration Reference

### TypeScript Configuration Options

The TypeScript configuration tool supports the following options in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "composite": true,
    "incremental": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
  "references": [
    { "path": "../shared" }
  ]
}
```

### Path Alias Configuration

Standard path aliases used across the monorepo:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/auth": ["src/backend/auth-service/src"],
      "@app/shared": ["src/backend/shared/src"],
      "@austa/interfaces": ["src/web/interfaces/src"],
      "@austa/design-system": ["src/web/design-system/src"],
      "@design-system/primitives": ["src/web/primitives/src"],
      "@austa/journey-context": ["src/web/journey-context/src"]
    }
  }
}
```

### Dependency Resolution Configuration

Example package.json configuration for dependency resolution:

```json
{
  "resolutions": {
    "minimatch": "3.0.5",
    "semver": "7.5.4",
    "ws": "8.14.2"
  },
  "overrides": {
    "minimatch": "3.0.5",
    "semver": "7.5.4",
    "ws": "8.14.2"
  }
}
```

## Development Workflow Examples

### New Developer Onboarding

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Prepare the build environment:
   ```bash
   node tools/build/index.js --prepare-all
   ```
4. Start development:
   ```bash
   pnpm dev
   ```

### Adding a New Package

1. Create the package structure
2. Initialize TypeScript configuration:
   ```bash
   node tools/build/typescript-config.js --generate --service=new-package
   ```
3. Update path aliases:
   ```bash
   node tools/build/fix-paths.js --update-paths
   ```
4. Validate dependencies:
   ```bash
   node tools/build/validate-deps.js --service=new-package
   ```
5. Update build order:
   ```bash
   node tools/build/build-order.js --update
   ```

### Resolving Build Failures

1. Identify the issue type:
   ```bash
   node tools/build/index.js --diagnose
   ```
2. Fix TypeScript configuration issues:
   ```bash
   node tools/build/typescript-config.js --fix --service=failing-service
   ```
3. Resolve path resolution problems:
   ```bash
   node tools/build/fix-paths.js --fix --service=failing-service
   ```
4. Address dependency conflicts:
   ```bash
   node tools/build/validate-deps.js --fix-conflicts --service=failing-service
   ```
5. Verify the build:
   ```bash
   pnpm --filter=failing-service build
   ```

## Contributing to the Build Tools

When contributing to the build tools, please follow these guidelines:

1. Add comprehensive documentation for any new features
2. Include usage examples in this README
3. Write tests for new functionality
4. Ensure backward compatibility with existing configurations
5. Update the troubleshooting guide with any new error scenarios

## License

This project is licensed under the proprietary license - see the LICENSE file for details.