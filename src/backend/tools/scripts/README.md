# AUSTA SuperApp Build Tools

## Overview

This directory contains utility scripts for managing, optimizing, and maintaining the AUSTA SuperApp monorepo. These scripts are designed to improve developer experience, ensure consistent builds, and optimize CI/CD pipelines.

## Build Optimization

### optimize-build.js

The `optimize-build.js` script is a comprehensive build optimization tool that addresses several critical aspects of the monorepo build process:

#### Key Features

1. **Dependency-Aware Build Ordering**
   - Analyzes package.json files to determine inter-package dependencies
   - Creates an optimized build order using topological sorting
   - Ensures dependencies are built before dependent packages

2. **TypeScript Project References**
   - Configures TypeScript project references for incremental builds
   - Sets up composite project settings for faster rebuilds
   - Maintains proper references between packages

3. **Caching Strategies**
   - Implements intelligent caching based on dependency changes
   - Configures Turborepo caching for web packages
   - Optimizes node_modules caching for faster installs

4. **Incremental Builds**
   - Enables TypeScript's incremental compilation
   - Preserves build artifacts between runs
   - Minimizes rebuild time by only processing changed files

5. **Build Validation**
   - Verifies the integrity of the build output
   - Checks for TypeScript errors
   - Detects circular dependencies
   - Validates package imports

#### Usage

```bash
# Basic usage
node src/backend/tools/scripts/optimize-build.js

# With watch mode for development
node src/backend/tools/scripts/optimize-build.js --watch

# Clean cache and validate build
node src/backend/tools/scripts/optimize-build.js --clean --validate

# Show detailed output
node src/backend/tools/scripts/optimize-build.js --verbose

# Show help
node src/backend/tools/scripts/optimize-build.js --help
```

#### Options

- `--watch`: Enable watch mode for development
- `--clean`: Clean cache before building
- `--validate`: Run validation after build
- `--verbose`: Show detailed output
- `--help`: Show help message

#### Integration with CI/CD

The script is integrated into the CI/CD pipeline via the `.github/workflows/build-optimization.yml` workflow, which:

1. Runs on pushes to main/develop branches and pull requests
2. Sets up proper caching using GitHub Actions cache
3. Executes the build optimization with validation
4. Uploads build artifacts for deployment

## Other Utility Scripts

See [SCRIPTS.md](./SCRIPTS.md) for documentation on other utility scripts in this directory.

## Best Practices

### When to Use Build Optimization

- During local development to improve build times
- In CI/CD pipelines to ensure consistent builds
- After major dependency changes
- When experiencing TypeScript project reference issues

### Troubleshooting

If you encounter issues with the build process:

1. Try running with the `--clean` flag to reset the cache
2. Use `--verbose` to see detailed output
3. Check for circular dependencies in your code
4. Verify that your package.json files have correct dependencies
5. If TypeScript project references are causing issues, try running `rollback-tsconfig.js` first

## Contributing

When modifying build scripts:

1. Document all changes in comments and README files
2. Test thoroughly in both development and CI environments
3. Consider backward compatibility with existing workflows
4. Update integration points in CI/CD pipelines if necessary