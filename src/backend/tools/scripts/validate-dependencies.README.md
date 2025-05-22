# Dependency Validator

## Overview

The Dependency Validator is a comprehensive tool for identifying and resolving dependency issues across the AUSTA SuperApp monorepo. It helps prevent build failures, security vulnerabilities, and inconsistent behavior by ensuring that all packages use compatible dependency versions and follow proper workspace reference patterns.

## Features

- **Version Conflict Detection**: Identifies packages using different versions of the same dependency
- **Critical Package Monitoring**: Highlights conflicts in security-critical packages like axios, minimatch, semver, etc.
- **Workspace Reference Validation**: Ensures workspace packages are referenced correctly using workspace protocol
- **Missing Dependency Detection**: Finds imports that don't have corresponding dependencies in package.json
- **Circular Dependency Detection**: Identifies circular dependencies between workspace packages
- **TypeScript Project Reference Validation**: Verifies that TypeScript project references match package dependencies
- **Automatic Fixes**: Can automatically fix common issues like workspace references and add resolutions for critical conflicts
- **Comprehensive Reporting**: Provides detailed reports with suggestions for fixing issues

## Usage

### Basic Validation

```bash
npm run validate:deps
# or directly
node tools/scripts/validate-dependencies.js
```

### With Automatic Fixes

```bash
npm run validate:deps:fix
# or directly
node tools/scripts/validate-dependencies.js --fix
```

### Additional Options

- `--verbose`: Show detailed output including all steps and findings
- `--json`: Output results in JSON format for integration with other tools
- `--ignore-dev`: Ignore devDependencies in analysis
- `--scope=<package>`: Limit analysis to a specific package (e.g., `--scope=api-gateway`)

## Integration

The Dependency Validator is integrated into the monorepo's workflow in several ways:

1. **Post-Install Hook**: Runs automatically after `npm install` to catch issues early
2. **CI/CD Pipeline**: Can be added to CI/CD workflows to prevent merging code with dependency issues
3. **Pre-Commit Hook**: Can be added to pre-commit hooks to validate dependencies before committing

## Configuration

The validator is configured with several lists in the script itself:

- **ignoredPackages**: Packages that should be ignored in the analysis (e.g., typescript, eslint)
- **ignoredPaths**: Paths that should be skipped when searching for package.json files
- **criticalPackages**: Packages that are considered critical for security or build stability

## Example Output

```
=== AUSTA SuperApp Dependency Validation Results ===

Version Conflicts:

  axios [CRITICAL]
  Versions found: ^1.6.0, ^1.6.8, 1.6.8
  Used in:
    - api-gateway (^1.6.0)
    - auth-service (^1.6.8)
    - care-service (1.6.8)

Workspace Reference Issues:

  api-gateway references workspace package @austa/shared incorrectly
  Current: ^1.0.0
  Should be: workspace:*

Suggestions:

  Add resolutions or overrides field to the root package.json to enforce consistent versions
  Consider using yarn or npm workspaces to manage dependencies more effectively

  Add the following to your root package.json to resolve critical conflicts:
  "resolutions": {
    "axios": "1.6.8",
  }

  Use workspace: protocol for referencing workspace packages:
  In api-gateway, change "@austa/shared": "^1.0.0" to "@austa/shared": "workspace:*"

Summary:
  Total packages analyzed: 8
  Packages with issues: 3
  Total issues found: 2
  Critical issues: 1

Critical dependency issues found! Please fix them before proceeding.

=== End of Validation Results ===
```

## Troubleshooting

### False Positives

The validator may occasionally report false positives, especially for:

1. **Missing Dependencies**: If code uses dynamic imports or requires that can't be detected by static analysis
2. **Circular Dependencies**: Some circular dependencies might be intentional and handled properly at runtime

In these cases, you can:

- Use the `--ignore-dev` flag to ignore devDependencies
- Modify the `ignoredPackages` list in the script to ignore specific packages
- Update your code to avoid circular dependencies or make missing dependencies explicit

### Performance

For large monorepos, the validator may take some time to run. To improve performance:

- Use the `--scope` flag to limit analysis to specific packages
- Run with `--ignore-dev` to reduce the number of dependencies to analyze
- Consider running the validator only on changed packages in CI/CD pipelines

## Contributing

Contributions to improve the Dependency Validator are welcome! Some areas for improvement include:

- Adding more sophisticated detection of missing dependencies
- Improving performance for large monorepos
- Adding support for more package managers (pnpm, yarn berry)
- Enhancing the automatic fix capabilities

Please submit pull requests with improvements or bug fixes.