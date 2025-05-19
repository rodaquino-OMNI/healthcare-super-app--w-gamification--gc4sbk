# AUSTA SuperApp CI/CD Scripts

This directory contains the core scripts that power the AUSTA SuperApp CI/CD pipeline. These scripts are designed to work together to provide a comprehensive, reliable, and efficient continuous integration and deployment process across all environments.

## Overview

The AUSTA SuperApp CI/CD pipeline is built around a journey-centered architecture, with specialized scripts that handle different aspects of the build, test, and deployment process. The scripts in this directory are integrated with GitHub Actions workflows and provide the foundation for:

- Optimized monorepo builds with dependency-aware execution
- Intelligent caching strategies for faster builds
- Comprehensive dependency validation
- Robust deployment verification
- Automated rollback procedures
- Performance metrics collection and analysis

## Script Catalog

| Script | Purpose | Primary Integration Points |
|--------|---------|----------------------------|
| [build-workspace.sh](#build-workspacesh) | Builds monorepo packages in optimal order | GitHub Actions build jobs |
| [build-image.sh](#build-imagesh) | Builds and pushes Docker container images | GitHub Actions build jobs |
| [build-cache-clean.sh](#build-cache-cleansh) | Manages GitHub Actions build cache | GitHub Actions cache management |
| [detect-changes.sh](#detect-changessh) | Detects workspace changes for targeted rebuilds | GitHub Actions matrix strategy |
| [validate-dependencies.js](#validate-dependenciesjs) | Validates dependencies across the monorepo | Pre-build validation step |
| [publish-artifacts.sh](#publish-artifactssh) | Publishes build artifacts to registries | Post-build artifact management |
| [verify-deployment.sh](#verify-deploymentsh) | Verifies successful deployment | Post-deployment validation |
| [health-check.sh](#health-checksh) | Performs health checks on deployed services | Post-deployment validation |
| [rollback.sh](#rollbacksh) | Implements automated rollback procedures | Deployment failure handling |
| [pipeline-metrics.js](#pipeline-metricsjs) | Collects CI/CD pipeline performance metrics | Pipeline monitoring and optimization |

## Script Details

### build-workspace.sh

Builds monorepo packages in the optimal order based on their dependencies.

**Parameters:**

- `--workspace <workspace-path>`: Path to the workspace to build (e.g., src/web, src/backend)
- `--cache-key <key>`: Cache key for build artifacts
- `--incremental`: Enable incremental builds (default: true)
- `--verbose`: Enable verbose output (default: false)

**Usage Examples:**

```bash
# Build the web workspace with incremental builds
./build-workspace.sh --workspace src/web --incremental

# Build the backend workspace with verbose output
./build-workspace.sh --workspace src/backend --verbose

# Build a specific package with custom cache key
./build-workspace.sh --workspace src/web/design-system --cache-key design-system-$(git rev-parse HEAD)
```

**Integration with GitHub Actions:**

```yaml
- name: Build workspace
  run: |
    ./infrastructure/scripts/ci-cd/build-workspace.sh \
      --workspace ${{ matrix.workspace }} \
      --cache-key ${{ runner.os }}-${{ matrix.workspace }}-${{ hashFiles(format('{0}/pnpm-lock.yaml', matrix.workspace)) }}
```

### build-image.sh

Builds, tags, and pushes Docker container images for services with layer caching and multi-stage optimization.

**Parameters:**

- `--service <service-name>`: Name of the service to build (e.g., api-gateway, auth-service)
- `--tag <tag>`: Tag for the image (default: latest)
- `--registry <registry>`: Container registry URL
- `--cache-from <cache-path>`: Path to use for layer caching
- `--cache-to <cache-path>`: Path to store layer cache
- `--push`: Push the image to the registry (default: false)

**Usage Examples:**

```bash
# Build an image without pushing
./build-image.sh --service api-gateway --tag dev

# Build and push an image to the registry
./build-image.sh --service auth-service --tag v1.2.3 --registry ghcr.io/austa --push

# Build with layer caching
./build-image.sh --service health-service --cache-from /tmp/.buildx-cache --cache-to /tmp/.buildx-cache-new
```

**Integration with GitHub Actions:**

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v2
    
- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
      
- name: Build service image
  run: |
    ./infrastructure/scripts/ci-cd/build-image.sh \
      --service ${{ matrix.service }} \
      --tag ${{ github.sha }} \
      --registry ghcr.io/austa \
      --cache-from /tmp/.buildx-cache \
      --cache-to /tmp/.buildx-cache-new \
      --push
```

### build-cache-clean.sh

Manages the GitHub Actions build cache by implementing intelligent cleanup strategies and cache invalidation rules.

**Parameters:**

- `--cache-dir <directory>`: Directory containing cache files
- `--max-age <days>`: Maximum age of cache files in days (default: 7)
- `--min-size <size>`: Minimum size to keep in MB (default: 1024)
- `--dry-run`: Show what would be deleted without actually deleting (default: false)

**Usage Examples:**

```bash
# Clean cache files older than 7 days
./build-cache-clean.sh --cache-dir /tmp/.buildx-cache

# Clean cache files older than 3 days, keeping at least 2GB
./build-cache-clean.sh --cache-dir /tmp/.buildx-cache --max-age 3 --min-size 2048

# Dry run to see what would be deleted
./build-cache-clean.sh --cache-dir /tmp/.buildx-cache --dry-run
```

**Integration with GitHub Actions:**

```yaml
- name: Clean build cache
  run: |
    ./infrastructure/scripts/ci-cd/build-cache-clean.sh \
      --cache-dir /tmp/.buildx-cache \
      --max-age 7
```

### detect-changes.sh

Optimizes CI/CD pipeline execution by detecting changes in specific workspaces and generating a dynamic build matrix.

**Parameters:**

- `--base-ref <ref>`: Base reference for comparison (default: main)
- `--head-ref <ref>`: Head reference for comparison (default: current branch)
- `--output-file <file>`: File to write matrix JSON output (default: matrix.json)
- `--include-dependencies`: Include dependent workspaces (default: true)

**Usage Examples:**

```bash
# Detect changes between current branch and main
./detect-changes.sh

# Detect changes between specific refs
./detect-changes.sh --base-ref v1.0.0 --head-ref v1.1.0

# Detect changes without including dependencies
./detect-changes.sh --include-dependencies false
```

**Integration with GitHub Actions:**

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - id: set-matrix
        run: |
          ./infrastructure/scripts/ci-cd/detect-changes.sh --output-file matrix.json
          echo "matrix=$(cat matrix.json)" >> $GITHUB_OUTPUT
          
  build:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
    steps:
      # Build steps here
```

### validate-dependencies.js

Comprehensive dependency validation script that checks for missing packages, version conflicts, circular dependencies, and TypeScript project reference integrity.

**Parameters:**

- `--workspace <workspace-path>`: Path to the workspace to validate (default: all workspaces)
- `--check-circular`: Check for circular dependencies (default: true)
- `--check-typescript`: Validate TypeScript project references (default: true)
- `--check-versions`: Check for version conflicts (default: true)
- `--fail-on-warning`: Fail on warnings (default: false)

**Usage Examples:**

```bash
# Validate all dependencies
node validate-dependencies.js

# Validate dependencies for a specific workspace
node validate-dependencies.js --workspace src/web

# Validate only version conflicts
node validate-dependencies.js --check-circular false --check-typescript false

# Fail on warnings
node validate-dependencies.js --fail-on-warning
```

**Integration with GitHub Actions:**

```yaml
- name: Validate dependencies
  run: |
    node infrastructure/scripts/ci-cd/validate-dependencies.js \
      --workspace ${{ matrix.workspace }} \
      --fail-on-warning
```

### publish-artifacts.sh

Manages the publication of build artifacts to appropriate registries with versioning, signing, and promotion capabilities.

**Parameters:**

- `--artifact-type <type>`: Type of artifact (container, npm, terraform)
- `--artifact-path <path>`: Path to the artifact
- `--version <version>`: Version to publish (default: derived from package.json or git)
- `--registry <registry>`: Registry URL
- `--promote-to <environment>`: Environment to promote to (dev, staging, production)
- `--sign`: Sign the artifact (default: false)

**Usage Examples:**

```bash
# Publish a container image
./publish-artifacts.sh --artifact-type container --artifact-path api-gateway --version 1.2.3 --registry ghcr.io/austa

# Publish an npm package
./publish-artifacts.sh --artifact-type npm --artifact-path src/web/design-system

# Promote an artifact to production
./publish-artifacts.sh --artifact-type container --artifact-path auth-service --version 1.2.3 --promote-to production
```

**Integration with GitHub Actions:**

```yaml
- name: Publish container image
  run: |
    ./infrastructure/scripts/ci-cd/publish-artifacts.sh \
      --artifact-type container \
      --artifact-path ${{ matrix.service }} \
      --version ${{ github.sha }} \
      --registry ghcr.io/austa
```

### verify-deployment.sh

Performs comprehensive post-deployment verification including health checks, integration tests, and performance validation.

**Parameters:**

- `--environment <env>`: Environment to verify (dev, staging, production)
- `--service <service>`: Service to verify (default: all services)
- `--timeout <seconds>`: Timeout in seconds (default: 300)
- `--run-tests`: Run integration tests (default: true)
- `--check-performance`: Validate performance against baselines (default: true)

**Usage Examples:**

```bash
# Verify all services in staging
./verify-deployment.sh --environment staging

# Verify a specific service in production with a longer timeout
./verify-deployment.sh --environment production --service api-gateway --timeout 600

# Verify without running tests
./verify-deployment.sh --environment dev --run-tests false
```

**Integration with GitHub Actions:**

```yaml
- name: Verify deployment
  run: |
    ./infrastructure/scripts/ci-cd/verify-deployment.sh \
      --environment ${{ needs.deploy.outputs.environment }} \
      --timeout 300
```

### health-check.sh

Performs comprehensive health checks on deployed services to verify correct operation.

**Parameters:**

- `--environment <env>`: Environment to check (dev, staging, production)
- `--service <service>`: Service to check (default: all services)
- `--check-dependencies`: Check service dependencies (default: true)
- `--check-resources`: Verify resource utilization (default: true)
- `--check-integrations`: Test integration points (default: true)

**Usage Examples:**

```bash
# Check all services in staging
./health-check.sh --environment staging

# Check a specific service in production
./health-check.sh --environment production --service api-gateway

# Check only endpoints without dependencies or integrations
./health-check.sh --environment dev --check-dependencies false --check-integrations false
```

**Integration with GitHub Actions:**

```yaml
- name: Health check
  run: |
    ./infrastructure/scripts/ci-cd/health-check.sh \
      --environment ${{ needs.deploy.outputs.environment }} \
      --service ${{ matrix.service }}
```

### rollback.sh

Implements automated rollback procedures for failed deployments, including container revision rollback, database migration reversal, and configuration restoration.

**Parameters:**

- `--environment <env>`: Environment to rollback (dev, staging, production)
- `--service <service>`: Service to rollback (default: all services)
- `--rollback-type <type>`: Type of rollback (container, database, config, all)
- `--revision <rev>`: Revision to rollback to (default: previous)
- `--notify`: Send notification on rollback (default: true)

**Usage Examples:**

```bash
# Rollback all services in staging
./rollback.sh --environment staging

# Rollback a specific service in production
./rollback.sh --environment production --service api-gateway

# Rollback only container deployments
./rollback.sh --environment dev --rollback-type container

# Rollback to a specific revision
./rollback.sh --environment production --service auth-service --revision auth-service-v1.2.3
```

**Integration with GitHub Actions:**

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    ./infrastructure/scripts/ci-cd/rollback.sh \
      --environment ${{ needs.deploy.outputs.environment }} \
      --service ${{ matrix.service }}
```

### pipeline-metrics.js

Collects, analyzes, and reports on CI/CD pipeline performance metrics including build times, success rates, and resource usage.

**Parameters:**

- `--period <days>`: Time period to analyze in days (default: 7)
- `--output-format <format>`: Output format (json, csv, html) (default: json)
- `--output-file <file>`: File to write output (default: pipeline-metrics.json)
- `--compare-to <period>`: Compare to previous period (default: false)

**Usage Examples:**

```bash
# Generate metrics for the last 7 days
node pipeline-metrics.js

# Generate metrics for the last 30 days in HTML format
node pipeline-metrics.js --period 30 --output-format html --output-file pipeline-metrics.html

# Compare current metrics to previous period
node pipeline-metrics.js --compare-to previous
```

**Integration with GitHub Actions:**

```yaml
- name: Collect pipeline metrics
  run: |
    node infrastructure/scripts/ci-cd/pipeline-metrics.js \
      --period 7 \
      --output-format json \
      --output-file pipeline-metrics.json
      
- name: Upload metrics
  uses: actions/upload-artifact@v3
  with:
    name: pipeline-metrics
    path: pipeline-metrics.json
```

## Environment-Specific Execution

The CI/CD scripts support different execution modes based on the target environment:

### Development Environment

- **Trigger**: Automatic on feature branch pushes
- **Deployment Strategy**: Rolling updates
- **Validation Level**: Basic health checks
- **Rollback**: Automatic on failure

```bash
# Example development deployment verification
./verify-deployment.sh --environment dev --run-tests true --check-performance false
```

### Staging Environment

- **Trigger**: Automatic on main branch merges
- **Deployment Strategy**: Rolling updates with zero downtime
- **Validation Level**: Comprehensive testing
- **Rollback**: Automatic on failure

```bash
# Example staging deployment verification
./verify-deployment.sh --environment staging --run-tests true --check-performance true
```

### Production Environment

- **Trigger**: Manual approval after staging validation
- **Deployment Strategy**: Service-specific (Blue/Green for API Gateway, Canary for Journey Services)
- **Validation Level**: Full suite with performance validation
- **Rollback**: Automatic on failure with notification

```bash
# Example production deployment verification
./verify-deployment.sh --environment production --run-tests true --check-performance true
```

## Rollback Procedures

The AUSTA SuperApp implements comprehensive rollback capabilities through the `rollback.sh` script:

### Container Rollback

Rolls back Kubernetes deployments to previous revisions:

```bash
# Rollback container deployment
./rollback.sh --environment production --service api-gateway --rollback-type container
```

This executes:
1. Identification of the previous stable deployment revision
2. Execution of `kubectl rollout undo` command
3. Verification of rollback success through health checks
4. Notification of rollback status

### Database Rollback

Reverts database migrations to previous states:

```bash
# Rollback database migration
./rollback.sh --environment production --service health-service --rollback-type database
```

This executes:
1. Identification of the current migration version
2. Execution of migration downgrade scripts
3. Verification of database integrity
4. Notification of rollback status

### Configuration Rollback

Restores previous configuration versions:

```bash
# Rollback configuration
./rollback.sh --environment production --service auth-service --rollback-type config
```

This executes:
1. Retrieval of previous ConfigMap and Secret versions
2. Application of previous configurations
3. Verification of configuration application
4. Notification of rollback status

### Emergency Rollback Procedure

For critical failures requiring immediate action:

```bash
# Emergency rollback of all services
./rollback.sh --environment production --rollback-type all --notify true
```

This executes a comprehensive rollback of all deployment aspects with priority on service restoration.

## Integration with GitHub Actions

The CI/CD scripts are designed to integrate seamlessly with GitHub Actions workflows. Here's how they fit into the overall CI/CD pipeline:

### Build Workflow

```yaml
name: Build

on:
  push:
    branches: [main, feature/**]
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - id: set-matrix
        run: |
          ./infrastructure/scripts/ci-cd/detect-changes.sh --output-file matrix.json
          echo "matrix=$(cat matrix.json)" >> $GITHUB_OUTPUT
          
  validate-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.15.0'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Validate dependencies
        run: node infrastructure/scripts/ci-cd/validate-dependencies.js --fail-on-warning
          
  build:
    needs: [detect-changes, validate-dependencies]
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.15.0'
      - name: Cache workspace dependencies
        uses: actions/cache@v3
        with:
          path: |
            **/node_modules
          key: ${{ runner.os }}-${{ matrix.workspace }}-${{ hashFiles(format('{0}/pnpm-lock.yaml', matrix.workspace)) }}
          restore-keys: |
            ${{ runner.os }}-${{ matrix.workspace }}-
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Build workspace
        run: ./infrastructure/scripts/ci-cd/build-workspace.sh --workspace ${{ matrix.workspace }}
      - name: Build container image
        if: matrix.service != ''
        run: |
          ./infrastructure/scripts/ci-cd/build-image.sh \
            --service ${{ matrix.service }} \
            --tag ${{ github.sha }} \
            --registry ghcr.io/austa \
            --push
```

### Deployment Workflow

```yaml
name: Deploy

on:
  workflow_run:
    workflows: ["Build"]
    branches: [main]
    types: [completed]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - dev
          - staging
          - production

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    outputs:
      environment: ${{ github.event.inputs.environment || 'staging' }}
    steps:
      - uses: actions/checkout@v3
      # Deployment steps here
      
  verify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Verify deployment
        run: |
          ./infrastructure/scripts/ci-cd/verify-deployment.sh \
            --environment ${{ needs.deploy.outputs.environment }}
      - name: Health check
        run: |
          ./infrastructure/scripts/ci-cd/health-check.sh \
            --environment ${{ needs.deploy.outputs.environment }}
            
  rollback:
    needs: [deploy, verify]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Rollback deployment
        run: |
          ./infrastructure/scripts/ci-cd/rollback.sh \
            --environment ${{ needs.deploy.outputs.environment }} \
            --notify true
```

## Maintenance and Troubleshooting

### Common Issues

1. **Build Cache Corruption**
   - Symptom: Inconsistent or failing builds
   - Solution: Clear the build cache
   ```bash
   ./build-cache-clean.sh --cache-dir /tmp/.buildx-cache --max-age 0
   ```

2. **Dependency Resolution Failures**
   - Symptom: Package not found or version conflict errors
   - Solution: Run dependency validation with verbose output
   ```bash
   node validate-dependencies.js --verbose
   ```

3. **Deployment Verification Timeouts**
   - Symptom: Deployment verification fails with timeout
   - Solution: Increase timeout and check service logs
   ```bash
   ./verify-deployment.sh --environment staging --timeout 600
   ```

4. **Rollback Failures**
   - Symptom: Rollback script fails to restore previous state
   - Solution: Check rollback logs and manually verify service state
   ```bash
   ./rollback.sh --environment production --service api-gateway --verbose
   ```

### Regular Maintenance Tasks

1. **Pipeline Metrics Review**
   - Frequency: Weekly
   - Command: `node pipeline-metrics.js --period 7 --compare-to previous`
   - Action: Identify and address performance trends

2. **Build Cache Cleanup**
   - Frequency: Daily (automated)
   - Command: `./build-cache-clean.sh --cache-dir /tmp/.buildx-cache --max-age 7`
   - Action: Prevent excessive storage usage

3. **Dependency Validation**
   - Frequency: On every PR (automated)
   - Command: `node validate-dependencies.js`
   - Action: Prevent dependency conflicts

4. **Script Updates**
   - Frequency: Monthly
   - Action: Review and update scripts for improvements

## Contributing

When contributing to the CI/CD scripts, please follow these guidelines:

1. Add comprehensive documentation for any new parameters
2. Include usage examples for common scenarios
3. Update this README.md with details of changes
4. Test scripts in all environments before merging
5. Ensure backward compatibility or provide migration path

## License

These scripts are proprietary and confidential to AUSTA SuperApp.