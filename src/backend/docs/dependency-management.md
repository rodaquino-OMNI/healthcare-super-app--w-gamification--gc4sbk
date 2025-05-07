# Dependency Management in the AUSTA SuperApp Monorepo

## Table of Contents

1. [Introduction](#introduction)
2. [Version Pinning Strategy](#version-pinning-strategy)
3. [Workspace Configuration](#workspace-configuration)
4. [Dependency Resolution Validation](#dependency-resolution-validation)
5. [Transitive Dependencies](#transitive-dependencies)
6. [Build Caching Strategies](#build-caching-strategies)
7. [Troubleshooting](#troubleshooting)

## Introduction

The AUSTA SuperApp is structured as a monorepo containing multiple packages and services that share dependencies. Proper dependency management is critical to ensure consistent builds, prevent version conflicts, and maintain a healthy dependency graph across the entire application.

This guide outlines the strategies and best practices for managing dependencies in the AUSTA SuperApp monorepo, addressing common issues such as version conflicts, workspace configuration, dependency resolution, and build optimization.

### Monorepo Structure

The AUSTA SuperApp monorepo is organized into two main sections:

- **Backend (`/src/backend/`)**: A Lerna-managed microservices monorepo with NestJS services
- **Frontend (`/src/web/`)**: A Turborepo-managed frontend monorepo with Next.js and React Native applications

Each section has its own workspace configuration, package management, and build processes, but they share common principles for dependency management.

## Version Pinning Strategy

To prevent version conflicts and ensure consistent builds across all environments, the AUSTA SuperApp employs a strict version pinning strategy for all dependencies.

### Core Principles

1. **Exact Version Pinning**: All dependencies must use exact version numbers (e.g., `"typescript": "5.3.3"` instead of `"typescript": "^5.3.3"`).
2. **Centralized Version Control**: Core dependency versions are defined in the root `package.json` files for both backend and frontend.
3. **Version Synchronization**: Shared dependencies across packages must use the same version.
4. **Regular Updates**: Dependencies are updated through coordinated PRs that update all affected packages simultaneously.

### Implementation

#### Backend (NestJS)

In the backend monorepo, versions are pinned in the root `package.json` file:

```json
{
  "dependencies": {
    "@nestjs/common": "10.3.0",
    "@nestjs/core": "10.3.0",
    "@nestjs/platform-express": "10.3.0",
    "@prisma/client": "5.10.2",
    "kafkajs": "2.2.4",
    "ioredis": "5.3.2"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "jest": "29.7.0",
    "eslint": "8.57.0"
  }
}
```

Individual service `package.json` files should reference the same versions:

```json
{
  "dependencies": {
    "@nestjs/common": "10.3.0",
    "@nestjs/core": "10.3.0"
  }
}
```

#### Frontend (Next.js/React Native)

In the frontend monorepo, versions are pinned in the root `package.json` file:

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "next": "14.2.0",
    "react-native": "0.73.4"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "eslint": "8.57.0"
  }
}
```

### Critical Dependencies

The following dependencies have been identified as critical and must be carefully managed to prevent version conflicts:

| Dependency | Pinned Version | Used By | Notes |
|------------|----------------|---------|-------|
| TypeScript | 5.3.3 | All packages | Core language for all services |
| React | 18.2.0 | Web, Mobile, Design System | Core UI library |
| React Native | 0.73.4 | Mobile | Mobile framework |
| Next.js | 14.2.0 | Web | Web framework |
| NestJS | 10.3.0 | All backend services | Backend framework |
| Prisma | 5.10.2 | Backend services | Database ORM |
| GraphQL | 16.9.0 | API Gateway, Frontend | API query language |
| minimatch | 9.0.3 | Build tools | Required by multiple packages |
| semver | 7.5.4 | Build tools | Required by multiple packages |
| ws | 8.16.0 | WebSockets | Required by multiple packages |

## Workspace Configuration

Proper workspace configuration is essential for managing dependencies in a monorepo. The AUSTA SuperApp uses different workspace tools for backend and frontend.

### Backend (Lerna)

The backend uses Lerna for workspace management. The workspace configuration is defined in the root `package.json` file:

```json
{
  "name": "austa-superapp-backend",
  "private": true,
  "workspaces": [
    "shared",
    "api-gateway",
    "auth-service",
    "health-service",
    "care-service",
    "plan-service",
    "gamification-engine",
    "notification-service",
    "packages/*"
  ]
}
```

And in `lerna.json`:

```json
{
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "packages": [
    "shared",
    "api-gateway",
    "auth-service",
    "health-service",
    "care-service",
    "plan-service",
    "gamification-engine",
    "notification-service",
    "packages/*"
  ]
}
```

#### Best Practices

1. **Consistent Package Names**: Use the `@austa/` namespace for all internal packages (e.g., `@austa/shared`, `@austa/auth-service`).
2. **Explicit Dependencies**: Each package must explicitly declare all dependencies, even if they're available through other packages.
3. **Local References**: Use `workspace:*` or `workspace:^` for local package references.

### Frontend (Turborepo)

The frontend uses Turborepo for workspace management. The workspace configuration is defined in the root `package.json` file:

```json
{
  "name": "web",
  "private": true,
  "workspaces": [
    "design-system",
    "primitives",
    "interfaces",
    "journey-context",
    "shared",
    "mobile",
    "web"
  ]
}
```

And in `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "storybook": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

#### Best Practices

1. **Dependency Order**: Ensure packages are listed in dependency order (e.g., primitives before design-system).
2. **Pipeline Configuration**: Define clear build dependencies using `dependsOn` to ensure correct build order.
3. **Output Caching**: Specify `outputs` for each task to enable proper caching.

## Dependency Resolution Validation

To ensure consistent dependency resolution across the monorepo, the AUSTA SuperApp implements several validation mechanisms.

### Path Alias Validation

TypeScript path aliases are validated using the `verify-paths-simple.js` script in the backend and similar mechanisms in the frontend. This ensures that all imports using path aliases resolve correctly.

```javascript
// Example from verify-paths-simple.js
const tsconfig = require('./tsconfig.json');
const paths = tsconfig.compilerOptions.paths;

// Check if files exist for each path alias
for (const [alias, targets] of Object.entries(paths)) {
  for (const target of targets) {
    const resolvedPath = path.resolve(process.cwd(), target.replace('/*', '/index.ts'));
    try {
      fs.accessSync(resolvedPath, fs.constants.F_OK);
      console.log(`✅ ${alias} -> ${resolvedPath} exists`);
    } catch (err) {
      console.error(`❌ ${alias} -> ${resolvedPath} does not exist`);
      process.exit(1);
    }
  }
}
```

### Dependency Graph Analysis

Regular dependency graph analysis is performed to identify potential issues:

```bash
# For backend
npm run analyze-deps

# For frontend
yarn workspace web analyze-deps
```

This generates a dependency graph visualization and reports on circular dependencies, duplicate packages, and version conflicts.

### CI Validation

Continuous Integration pipelines include dependency validation steps:

1. **Dependency Installation Check**: Ensures all dependencies can be installed without conflicts.
2. **Lockfile Validation**: Verifies that lockfiles are up-to-date and consistent.
3. **Build Validation**: Confirms that all packages can be built with the current dependency graph.

## Transitive Dependencies

Transitive dependencies (dependencies of dependencies) can cause version conflicts and other issues. The AUSTA SuperApp uses several strategies to manage transitive dependencies effectively.

### Resolutions and Overrides

Both Yarn and npm support mechanisms to override transitive dependencies:

#### Yarn Resolutions

In the root `package.json` file:

```json
{
  "resolutions": {
    "minimatch": "9.0.3",
    "semver": "7.5.4",
    "ws": "8.16.0",
    "@babel/traverse": "7.23.2"
  }
}
```

#### npm Overrides

In the root `package.json` file:

```json
{
  "overrides": {
    "minimatch": "9.0.3",
    "semver": "7.5.4",
    "ws": "8.16.0",
    "@babel/traverse": "7.23.2"
  }
}
```

### Critical Transitive Dependencies

The following transitive dependencies have been identified as critical and are explicitly overridden:

| Dependency | Overridden Version | Reason |
|------------|-------------------|--------|
| minimatch | 9.0.3 | Security vulnerabilities in older versions |
| semver | 7.5.4 | Security vulnerabilities in older versions |
| ws | 8.16.0 | Compatibility issues with WebSocket implementations |
| @babel/traverse | 7.23.2 | Security vulnerabilities in older versions |
| follow-redirects | 1.15.4 | Security vulnerabilities in older versions |
| postcss | 8.4.31 | Compatibility issues with CSS processing |

### Package Extension Configuration

For Yarn 2+, package extensions can be used to modify the dependencies of specific packages:

```yaml
# .yarnrc.yml
packageExtensions:
  "@testing-library/jest-native@*":
    peerDependencies:
      "react-test-renderer": "18.2.0"
  "react-test-renderer@*":
    peerDependencies:
      "react": "18.2.0"
```

## Build Caching Strategies

Efficient build caching is essential for optimizing development and CI/CD workflows in a monorepo. The AUSTA SuperApp implements different caching strategies for backend and frontend.

### Backend (NestJS)

The backend uses a combination of TypeScript's incremental builds and custom caching mechanisms:

1. **TypeScript Incremental Builds**: Enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

2. **Dependency-Aware Build Order**: Services are built in dependency order to avoid unnecessary rebuilds:

```bash
lerna run build --stream --sort
```

3. **CI Caching**: GitHub Actions workflows cache `node_modules` and build artifacts:

```yaml
- uses: actions/cache@v3
  with:
    path: |
      **/node_modules
      **/dist
      **/.tsbuildinfo
    key: ${{ runner.os }}-modules-${{ hashFiles('**/yarn.lock') }}
```

### Frontend (Turborepo)

The frontend uses Turborepo's built-in caching mechanisms:

1. **Task Caching**: Turborepo caches task outputs based on input hashes:

```json
{
  "pipeline": {
    "build": {
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```

2. **Remote Caching**: For CI/CD, remote caching can be enabled:

```bash
turbo build --remote-only
```

3. **Dependency-Based Caching**: Tasks are cached based on their dependencies:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Best Practices

1. **Clear Cache Outputs**: Specify exact output directories for caching.
2. **Deterministic Builds**: Ensure builds are deterministic to maximize cache hits.
3. **Cache Invalidation**: Properly invalidate caches when dependencies change.
4. **CI Integration**: Configure CI systems to reuse caches between runs.

## Troubleshooting

This section provides solutions for common dependency issues in the AUSTA SuperApp monorepo.

### Version Conflicts

**Symptom**: Build fails with errors about incompatible dependency versions.

**Solution**:

1. Identify the conflicting packages:

```bash
# For Yarn
yarn why package-name

# For npm
npm ls package-name
```

2. Add a resolution/override in the root `package.json`:

```json
{
  "resolutions": {
    "package-name": "x.y.z"
  }
}
```

3. Reinstall dependencies:

```bash
yarn install
```

### Missing Peer Dependencies

**Symptom**: Warnings about missing peer dependencies.

**Solution**:

1. Add the missing peer dependencies to the package:

```bash
yarn add -P peer-dependency@version
```

2. Or use package extensions (Yarn 2+):

```yaml
# .yarnrc.yml
packageExtensions:
  "package-name@*":
    peerDependencies:
      "peer-dependency": "version"
```

### Circular Dependencies

**Symptom**: Build fails with circular dependency errors.

**Solution**:

1. Identify the circular dependency:

```bash
# For backend
npm run analyze-deps

# For frontend
yarn workspace web analyze-deps
```

2. Refactor the code to break the circular dependency:
   - Extract shared code to a common module
   - Use dependency injection
   - Implement the mediator pattern

### Workspace Resolution Issues

**Symptom**: Package cannot be found or wrong version is used.

**Solution**:

1. Verify workspace configuration:

```bash
# For Yarn
yarn workspaces info

# For npm
npm ls -w
```

2. Ensure the package is correctly referenced:

```json
{
  "dependencies": {
    "@austa/shared": "workspace:*"
  }
}
```

3. Clean and reinstall:

```bash
rm -rf node_modules
yarn install
```

### Build Cache Issues

**Symptom**: Changes are not reflected in builds or incorrect builds are produced.

**Solution**:

1. Clear the cache:

```bash
# For Turborepo
turbo clean

# For TypeScript
find . -name ".tsbuildinfo" -delete
find . -name "dist" -type d -exec rm -rf {} +
```

2. Rebuild from scratch:

```bash
yarn clean
yarn build
```

### Path Alias Resolution Failures

**Symptom**: Imports using path aliases fail to resolve.

**Solution**:

1. Verify path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["./src/*"],
      "@shared/*": ["../shared/src/*"]
    }
  }
}
```

2. Run the path validation script:

```bash
node verify-paths-simple.js
```

3. Update module resolution in build tools (webpack, babel, etc.).

---

By following these guidelines and best practices, the AUSTA SuperApp monorepo can maintain a healthy dependency graph, prevent version conflicts, and ensure consistent builds across all environments.