# Scripts Documentation

This document provides an overview of the utility scripts available in the backend tooling.

## Active Scripts

### validate-dependencies.js

- **Purpose**: Performs comprehensive dependency validation across the monorepo to identify and resolve version conflicts, missing dependencies, and improper workspace references

- **When to use**: After dependency changes, before commits, and in CI/CD pipelines to ensure consistent dependencies

- **Usage**: 
  ```
  node tools/scripts/validate-dependencies.js [options]
  
  Options:
    --fix            Attempt to fix common issues automatically
    --verbose        Show detailed validation output
    --help           Show this help message
  ```

### optimize-build.js

- **Purpose**: Optimizes the build process for the AUSTA SuperApp monorepo by configuring proper caching strategies, determining efficient build order based on dependencies, and setting up incremental builds for better performance

- **When to use**: During development and CI/CD pipelines to improve build speed and reliability

- **Usage**: 
  ```
  node tools/scripts/optimize-build.js [options]
  
  Options:
    --watch          Enable watch mode for development
    --clean          Clean cache before building
    --validate       Run validation after build
    --verbose        Show detailed output
    --help           Show this help message
  ```

### patch-axios.js

- **Purpose**: Patches vulnerable axios instances in node_modules to prevent security vulnerabilities (SSRF and credential leakage)

- **When to use**: After npm install, or when axios vulnerabilities are reported

- **Usage**: `node tools/scripts/patch-axios.js`

### rollback-tsconfig.js

- **Purpose**: Restores TypeScript configurations to a clean, working state

- **When to use**: If TypeScript project reference errors occur

- **Usage**: `node tools/scripts/rollback-tsconfig.js`

### generate-api-docs.js

- **Purpose**: Generates a unified OpenAPI 3.0 YAML specification by combining GraphQL schema and REST endpoint definitions

- **When to use**: After changes to API contracts or when updating API documentation

- **Usage**: `node tools/scripts/generate-api-docs.js`

### generate-migration.js

- **Purpose**: Interactive Prisma migration generator that standardizes migration naming and directory structure

- **When to use**: When creating new database migrations

- **Usage**: `node tools/scripts/generate-migration.js`

### seed-database.js

- **Purpose**: Seeds development and testing databases with predefined roles, permissions, and a default administrator user

- **When to use**: When setting up new development environments or resetting test databases

- **Usage**: `node tools/scripts/seed-database.js`

## Deprecated Scripts

The following scripts have been deprecated due to issues they caused with TypeScript configurations:

- **fix-tsconfig.js** - DO NOT USE. Attempted to implement TypeScript project references.

- **fix-imports.js** - DO NOT USE. Attempted to update import paths for project references.

- **fix-emit.js** - DO NOT USE. Attempted to fix "may not disable emit" errors.

These scripts are kept for reference purposes only and should not be executed.