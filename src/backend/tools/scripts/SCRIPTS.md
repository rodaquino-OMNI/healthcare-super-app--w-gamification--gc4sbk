# Scripts Documentation

This document provides an overview of the utility scripts available in the backend tooling. These scripts are essential for maintaining the AUSTA SuperApp backend monorepo structure and resolving common development issues.

## Active Scripts

### validate-dependencies.js

- **Purpose**: Validates dependency resolution across all workspaces in the monorepo, identifying conflicts, missing packages, and circular dependencies

- **When to use**: Before submitting pull requests, after adding new dependencies, or when experiencing build failures related to dependencies

- **Usage**: `node tools/scripts/validate-dependencies.js [--workspace=<workspace-name>]`
  - Run without arguments to validate all workspaces
  - Use `--workspace` flag to target a specific workspace

- **Requirements**: Node.js 18.15.0+, TypeScript 5.3.3+

### optimize-build.js

- **Purpose**: Optimizes build configuration and caching for faster builds in CI/CD pipelines and local development

- **When to use**: Before running builds in CI/CD, when experiencing slow build times, or after significant changes to the project structure

- **Usage**: `node tools/scripts/optimize-build.js [--ci] [--cache-dir=<path>]`
  - Use `--ci` flag when running in CI environment for optimized CI-specific settings
  - Use `--cache-dir` to specify a custom cache directory

- **Requirements**: Node.js 18.15.0+, TypeScript 5.3.3+

### patch-axios.js

- **Purpose**: Patches vulnerable axios instances in node_modules to prevent security vulnerabilities (SSRF and credential leakage)

- **When to use**: After dependency installation (`pnpm install`), or when axios vulnerabilities are reported

- **Usage**: `node tools/scripts/patch-axios.js`

- **Requirements**: Node.js 18.15.0+

### rollback-tsconfig.js

- **Purpose**: Restores TypeScript configurations to a clean, working state across the monorepo

- **When to use**: If TypeScript project reference errors occur or after failed attempts to modify TypeScript configurations

- **Usage**: `node tools/scripts/rollback-tsconfig.js [--workspace=<workspace-name>]`
  - Run without arguments to restore all TypeScript configurations
  - Use `--workspace` flag to target a specific workspace

- **Requirements**: Node.js 18.15.0+, TypeScript 5.3.3+

## Deprecated Scripts

The following scripts have been deprecated and should not be used in the refactored monorepo structure:

### fix-tsconfig.js

- **⚠️ DEPRECATED - DO NOT USE ⚠️**
- **Issue**: Attempted to implement TypeScript project references but caused configuration conflicts and build failures
- **Alternative**: Use `rollback-tsconfig.js` to restore configurations and refer to the updated TypeScript configuration documentation

### fix-imports.js

- **⚠️ DEPRECATED - DO NOT USE ⚠️**
- **Issue**: Attempted to update import paths for project references but created circular dependencies and module resolution errors
- **Alternative**: Use the standardized path aliases defined in the root tsconfig.json and follow the import guidelines in the development documentation

### fix-emit.js

- **⚠️ DEPRECATED - DO NOT USE ⚠️**
- **Issue**: Attempted to fix "may not disable emit" errors but caused inconsistent build outputs and broken references
- **Alternative**: Use the `optimize-build.js` script which properly configures TypeScript emission settings

## Troubleshooting Common Issues

### Dependency Resolution Problems

If you encounter dependency resolution issues:

1. Run `validate-dependencies.js` to identify conflicts
2. Check for duplicate dependencies across workspaces
3. Verify that all packages use compatible versions
4. Ensure proper workspace references in package.json files

### Build Performance Issues

If builds are slow or failing:

1. Run `optimize-build.js` to improve build configuration
2. Ensure TypeScript incremental builds are enabled
3. Check for unnecessary type checking in build scripts
4. Verify that project references are correctly configured

### TypeScript Configuration Problems

If TypeScript configurations are causing issues:

1. Run `rollback-tsconfig.js` to restore to a known good state
2. Follow the standardized tsconfig.json structure
3. Avoid manual edits to generated TypeScript configuration files
4. Use the path aliases defined in the root configuration

## Adding New Scripts

When adding new utility scripts to this directory:

1. Follow the Node.js script pattern with clear command-line arguments
2. Add comprehensive error handling and logging
3. Include usage documentation in this file
4. Ensure compatibility with the current Node.js and TypeScript versions
5. Add appropriate tests in the `/test` directory