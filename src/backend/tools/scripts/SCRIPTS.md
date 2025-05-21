# Scripts Documentation

This document provides an overview of the utility scripts available in the backend tooling.

## Active Scripts

### validate-dependencies.js

- **Purpose**: Performs comprehensive dependency validation across the monorepo to identify and resolve version conflicts, missing dependencies, and improper workspace references

- **When to use**: Before submitting PRs, after adding new dependencies, or when experiencing build failures related to dependencies

- **Usage**: 
  - Basic validation: `node tools/scripts/validate-dependencies.js`
  - With automatic fixes: `node tools/scripts/validate-dependencies.js --fix`
  - Detailed output: `node tools/scripts/validate-dependencies.js --verbose`
  - JSON output: `node tools/scripts/validate-dependencies.js --json`
  - Scope to specific package: `node tools/scripts/validate-dependencies.js --scope=api-gateway`

### patch-axios.js

- **Purpose**: Patches vulnerable axios instances in node_modules to prevent security vulnerabilities (SSRF and credential leakage)

- **When to use**: After npm install, or when axios vulnerabilities are reported

- **Usage**: `node tools/scripts/patch-axios.js`

### rollback-tsconfig.js

- **Purpose**: Restores TypeScript configurations to a clean, working state

- **When to use**: If TypeScript project reference errors occur

- **Usage**: `node tools/scripts/rollback-tsconfig.js`

## Deprecated Scripts

The following scripts have been deprecated due to issues they caused with TypeScript configurations:

- **fix-tsconfig.js** - DO NOT USE. Attempted to implement TypeScript project references.

- **fix-imports.js** - DO NOT USE. Attempted to update import paths for project references.

- **fix-emit.js** - DO NOT USE. Attempted to fix "may not disable emit" errors.

These scripts are kept for reference purposes only and should not be executed.