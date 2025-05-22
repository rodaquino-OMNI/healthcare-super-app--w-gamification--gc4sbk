# Scripts Documentation

This document provides an overview of the utility scripts available in the backend tooling for the AUSTA SuperApp. These scripts help maintain the monorepo structure, resolve dependency issues, and ensure build consistency across services.

## Active Scripts

### validate-dependencies.js

- **Purpose**: Validates dependency consistency across all workspaces in the monorepo, detecting version conflicts, missing dependencies, and circular references

- **When to use**: Before commits, after dependency changes, or when experiencing build failures related to dependencies

- **Usage**: `node tools/scripts/validate-dependencies.js [--fix]`
  - The optional `--fix` flag attempts to automatically resolve common dependency issues
  - Requires Node.js ≥18.0.0 and TypeScript 5.3.3

### optimize-build.js

- **Purpose**: Optimizes the build process by analyzing the dependency graph and creating an efficient build order for all packages in the monorepo

- **When to use**: Before running a full build of the monorepo or when experiencing slow build times

- **Usage**: `node tools/scripts/optimize-build.js [--cache]`
  - The optional `--cache` flag enables build caching for faster subsequent builds
  - Integrates with both Lerna (backend) and Turborepo (frontend) build systems
  - Requires Node.js ≥18.0.0

### patch-axios.js

- **Purpose**: Patches vulnerable axios instances in node_modules to prevent security vulnerabilities (SSRF and credential leakage)

- **When to use**: After dependency installation, or when axios vulnerabilities are reported

- **Usage**: `node tools/scripts/patch-axios.js`
  - Compatible with both npm and pnpm package managers
  - Requires Node.js ≥18.0.0

### rollback-tsconfig.js

- **Purpose**: Restores TypeScript configurations to a clean, working state across all services and packages

- **When to use**: If TypeScript project reference errors occur or after failed build attempts

- **Usage**: `node tools/scripts/rollback-tsconfig.js [--service=<service-name>]`
  - The optional `--service` parameter allows targeting a specific service
  - Requires Node.js ≥18.0.0 and TypeScript 5.3.3

## Deprecated Scripts

The following scripts have been deprecated and should not be used under any circumstances. They are kept for reference purposes only.

### fix-tsconfig.js

- **⚠️ DEPRECATED - DO NOT USE ⚠️**
- **Issue**: Causes TypeScript project reference corruption and build failures
- **Alternative**: Use `rollback-tsconfig.js` followed by proper TypeScript configuration updates

### fix-imports.js

- **⚠️ DEPRECATED - DO NOT USE ⚠️**
- **Issue**: Creates invalid import paths that break module resolution
- **Alternative**: Use `validate-dependencies.js --fix` to address import-related issues

### fix-emit.js

- **⚠️ DEPRECATED - DO NOT USE ⚠️**
- **Issue**: Incorrectly modifies TypeScript emit settings, causing compilation errors
- **Alternative**: Use `rollback-tsconfig.js` to restore proper TypeScript configuration

## Troubleshooting Common Issues

### Dependency Resolution Failures

If you encounter dependency resolution failures during build:

1. Run `node tools/scripts/validate-dependencies.js` to identify conflicts
2. Check for circular dependencies in your import statements
3. Verify that all workspace packages are properly referenced in package.json files
4. Ensure consistent versions of shared dependencies across all packages

### TypeScript Configuration Issues

For TypeScript configuration problems:

1. Run `node tools/scripts/rollback-tsconfig.js` to reset configurations
2. Verify that path aliases in tsconfig.json match your project structure
3. Check that TypeScript project references are correctly configured
4. Ensure all required types packages are installed

### Build Performance Optimization

To improve build performance:

1. Run `node tools/scripts/optimize-build.js --cache` before building
2. Use incremental TypeScript compilation where possible
3. Consider using the `--skipLibCheck` flag for development builds
4. Leverage workspace-aware package managers (pnpm or Yarn) for faster installations

## Adding New Scripts

When adding new utility scripts to this directory:

1. Follow the established naming convention
2. Include comprehensive error handling and logging
3. Support both interactive and CI/CD usage patterns
4. Document the script in this file with purpose, usage, and examples
5. Add appropriate TypeScript types for maintainability