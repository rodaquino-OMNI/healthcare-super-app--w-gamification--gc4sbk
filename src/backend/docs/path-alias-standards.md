# TypeScript Path Alias Coding Standards

## Overview

This document establishes the coding standards for TypeScript path aliases in our AUSTA SuperApp monorepo. Consistent use of path aliases improves code readability, maintainability, and helps avoid path-related errors across our microservices architecture. Proper path alias configuration is critical for ensuring successful builds and cross-service module resolution.

## Path Alias Definitions

Our project uses the following standardized path aliases defined in the root `tsconfig.json` and extended by service-specific configurations:

| Path Alias | Directory Mapping | Purpose |
|------------|-------------------|---------|
| `@app/*` | `./src/*` | Service-specific modules within the current service |
| `@shared/*` | `../shared/src/*` | Common utilities, services, and DTOs shared across microservices |
| `@austa/interfaces/*` | `../../../web/interfaces/*` | Shared TypeScript interfaces for data models used by both frontend and backend |
| `@austa/design-system/*` | `../../../web/design-system/src/*` | UI component library with journey-specific theming |
| `@design-system/primitives/*` | `../../../web/primitives/src/*` | Fundamental design elements (colors, typography, spacing) |
| `@austa/journey-context/*` | `../../../web/journey-context/src/*` | Journey-specific state management context providers |
| `@gamification/*` | `../gamification-engine/src/*` | Gamification engine specific modules |
| `@health/*` | `../health-service/src/*` | Health journey service modules |
| `@care/*` | `../care-service/src/*` | Care journey service modules |
| `@plan/*` | `../plan-service/src/*` | Plan journey service modules |
| `@auth/*` | `../auth-service/src/*` | Authentication service modules |
| `@api-gateway/*` | `../api-gateway/src/*` | API Gateway service modules |
| `@notification/*` | `../notification-service/src/*` | Notification service modules |
| `@prisma/*` | `../shared/prisma/*` | Prisma schema and generated client code |

### Root tsconfig.json Configuration

The root `tsconfig.json` file in the monorepo defines the base path mappings that all services extend:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/src/*"],
      "@austa/interfaces/*": ["../web/interfaces/*"],
      "@austa/design-system/*": ["../web/design-system/src/*"],
      "@design-system/primitives/*": ["../web/primitives/src/*"],
      "@austa/journey-context/*": ["../web/journey-context/src/*"],
      "@gamification/*": ["gamification-engine/src/*"],
      "@health/*": ["health-service/src/*"],
      "@care/*": ["care-service/src/*"],
      "@plan/*": ["plan-service/src/*"],
      "@auth/*": ["auth-service/src/*"],
      "@api-gateway/*": ["api-gateway/src/*"],
      "@notification/*": ["notification-service/src/*"],
      "@prisma/*": ["shared/prisma/*"]
    }
  }
}
```

### Service-Specific tsconfig.json

Each service extends the root configuration and adds its own service-specific paths:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*": ["./src/*"]
    }
  }
}
```

## Usage Guidelines

### When to Use Path Aliases

1. **Always use path aliases for cross-module imports**
   ```typescript
   // CORRECT: Using path alias for importing from shared module
   import { LoggerService } from '@shared/logging/logger.service';
   
   // INCORRECT: Using relative path
   import { LoggerService } from '../../shared/src/logging/logger.service';
   ```

2. **Use relative imports only for files within the same directory or subdirectory**
   ```typescript
   // CORRECT: Using relative import within the same module
   import { AppConfig } from './config/app.config';
   ```

3. **Always use @app/* for imports within the same service**
   ```typescript
   // CORRECT: Using @app alias for service-specific imports
   import { UserDto } from '@app/users/dto/user.dto';
   
   // INCORRECT: Using deep relative paths
   import { UserDto } from '../../../users/dto/user.dto';
   ```

4. **Use journey-specific aliases for cross-service imports**
   ```typescript
   // CORRECT: Using journey-specific alias
   import { HealthMetricDto } from '@health/health/dto/health-metric.dto';
   
   // INCORRECT: Using relative path
   import { HealthMetricDto } from '../../../health-service/src/health/dto/health-metric.dto';
   ```

5. **Use @austa/* aliases for shared frontend packages**
   ```typescript
   // CORRECT: Using @austa alias for shared interfaces
   import { UserProfile } from '@austa/interfaces/common/user-profile.interface';
   
   // INCORRECT: Using relative path
   import { UserProfile } from '../../../web/interfaces/common/user-profile.interface';
   ```

### Path Alias Best Practices

1. **Keep imports organized by alias type**
   ```typescript
   // External libraries first
   import { Injectable } from '@nestjs/common';
   import { InjectRepository } from '@nestjs/typeorm';
   
   // Then shared modules
   import { LoggerService } from '@shared/logging/logger.service';
   import { BaseEntity } from '@shared/entities/base.entity';
   
   // Then cross-service imports
   import { HealthMetric } from '@health/health/entities/health-metric.entity';
   
   // Then service-specific imports
   import { AppConfig } from '@app/config/app.config';
   import { UserService } from '@app/users/user.service';
   
   // Then relative imports
   import { AuthGuard } from './guards/auth.guard';
   ```

2. **Create and use barrel files for related exports**
   ```typescript
   // Create barrel files (index.ts) in shared modules
   // In shared/src/logging/index.ts
   export * from './logger.service';
   export * from './log-level.enum';
   export * from './log-context.interface';
   
   // Then import multiple items with a single import
   import { LoggerService, LogLevel, LogContext } from '@shared/logging';
   ```

3. **Never use absolute paths starting with `src/`**
   ```typescript
   // INCORRECT: Using src-based paths
   import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
   ```

4. **Avoid deep nested imports when possible**
   ```typescript
   // PREFER: Use barrel files
   import { UserDto, CreateUserDto, UpdateUserDto } from '@app/users/dto';
   
   // INSTEAD OF:
   import { UserDto } from '@app/users/dto/user.dto';
   import { CreateUserDto } from '@app/users/dto/create-user.dto';
   import { UpdateUserDto } from '@app/users/dto/update-user.dto';
   ```

5. **Use consistent naming patterns for imports**
   ```typescript
   // CORRECT: Consistent naming
   import { HealthMetricDto } from '@health/health/dto/health-metric.dto';
   import { HealthGoalDto } from '@health/health/dto/health-goal.dto';
   
   // INCORRECT: Inconsistent naming
   import { HealthMetricDto } from '@health/health/dto/health-metric.dto';
   import { GoalDto } from '@health/health/dto/health-goal.dto'; // Inconsistent naming
   ```

## Runtime Path Resolution

For path aliases to work at runtime (not just during TypeScript compilation), we use the following approaches:

### During Development

Add `-r tsconfig-paths/register` to the Node.js command:

```json
// In package.json scripts
"scripts": {
  "start:dev": "nest start --watch -r tsconfig-paths/register",
  "start:debug": "nest start --debug --watch -r tsconfig-paths/register",
  "test": "jest --config ./jest.config.js -r tsconfig-paths/register"
}
```

### For Production

For production builds, we use one of the following approaches:

1. **NestJS with Webpack**

   Configure the Webpack build to resolve path aliases:

   ```javascript
   // webpack.config.js
   const { compilerOptions } = require('./tsconfig.json');
   const { pathsToModuleNameMapper } = require('ts-jest/utils');

   module.exports = {
     // ... other webpack configuration
     resolve: {
       extensions: ['.ts', '.js'],
       alias: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
     }
   };
   ```

2. **Using tsconfig-paths at Runtime**

   For services that don't use Webpack, register tsconfig-paths in the main entry point:

   ```typescript
   // src/main.ts
   import 'tsconfig-paths/register';
   // Rest of your application code
   ```

3. **Using Module Alias Package**

   For simpler services, use the module-alias package:

   ```typescript
   // src/main.ts
   import 'module-alias/register';
   // Rest of your application code
   ```

   With corresponding configuration in package.json:

   ```json
   {
     "_moduleAliases": {
       "@app": "dist/src",
       "@shared": "../shared/dist/src"
     }
   }
   ```

## Troubleshooting Path Resolution

If you encounter issues with path resolution, follow these steps to diagnose and resolve the problem:

### 1. Verify TypeScript Configuration

1. **Check tsconfig.json paths configuration**
   - Ensure the paths in your service's tsconfig.json are correctly defined
   - Verify that the paths are relative to the baseUrl setting
   - Check that the extends property correctly references the root tsconfig.json

2. **Validate file existence**
   Use the path verification script to check if files exist at the expected locations:
   ```bash
   node scripts/verify-paths.js
   ```

3. **Check for circular dependencies**
   Use the circular dependency detector to identify problematic imports:
   ```bash
   yarn circular-deps
   ```

### 2. Runtime Resolution Issues

1. **Verify tsconfig-paths is registered**
   - Check that `-r tsconfig-paths/register` is included in your start scripts
   - Ensure the tsconfig-paths package is installed as a dependency

2. **Check module resolution in Node.js**
   Use the module resolution debug flag to see how Node.js resolves imports:
   ```bash
   NODE_OPTIONS=--trace-module-resolution yarn start:dev
   ```

3. **Verify build output**
   - Check that compiled JavaScript files have correct relative paths
   - Ensure that path aliases are properly resolved during the build process

### 3. Common Path Resolution Errors and Solutions

| Error | Possible Cause | Solution |
|-------|---------------|----------|
| `Cannot find module '@app/...'` | Missing tsconfig-paths registration | Add `-r tsconfig-paths/register` to your start script |
| `Cannot find module '@shared/...'` | Incorrect path mapping | Check the path in tsconfig.json and verify the file exists |
| `Cannot find module '@austa/interfaces/...'` | Missing package or incorrect path | Verify the package is installed and the path is correct |
| `Error: Unexpected token 'export'` | ESM/CommonJS mismatch | Check module type in package.json and use appropriate import syntax |
| `TypeError: Cannot read property 'X' of undefined` | Module exists but exports are wrong | Check that the imported module exports the expected members |
| Build fails with no clear error | Path resolution in build config | Check webpack.config.js or nest-cli.json for path configuration |

### 4. Workspace-Specific Issues

1. **Lerna workspace issues**
   - Run `lerna clean && lerna bootstrap` to refresh node_modules
   - Check lerna.json for correct package paths

2. **Yarn workspace issues**
   - Run `yarn install --force` to rebuild the dependency tree
   - Check workspace definitions in root package.json

3. **NestJS specific issues**
   - Check nest-cli.json for correct path configurations
   - Verify webpack configuration if using webpack build

## Dependency Resolution Validation

To ensure path aliases are correctly resolved across workspaces, we've implemented validation steps in our development and build processes:

### 1. Automated Path Validation

The path validation script checks that all imports using path aliases can be resolved correctly:

```bash
# Run from the root of the monorepo
yarn validate-paths
```

This script:
- Scans all TypeScript files for import statements
- Verifies that each path alias resolves to an existing file
- Reports any unresolvable imports with detailed error messages

### 2. Dependency Graph Analysis

The dependency graph tool visualizes relationships between packages and helps identify potential issues:

```bash
# Generate a dependency graph visualization
yarn generate-dep-graph
```

This tool:
- Creates a visual representation of dependencies between services and packages
- Highlights circular dependencies and potential issues
- Helps identify unnecessary dependencies that can be removed

### 3. Build-Time Validation

Our CI/CD pipeline includes validation steps to catch path resolution issues before deployment:

1. **Pre-build validation**
   - Checks that all required packages are installed
   - Verifies that path aliases resolve correctly
   - Ensures TypeScript configuration is valid

2. **Build-time checks**
   - Validates that all imports can be resolved during compilation
   - Checks for missing dependencies in package.json
   - Ensures consistent versioning across packages

3. **Post-build validation**
   - Verifies that compiled JavaScript correctly resolves all imports
   - Checks for runtime path resolution issues
   - Validates that all required files are included in the build output

## Adding New Path Aliases

When adding new path aliases to the project, follow these steps to ensure consistency and compatibility:

1. **Update the root tsconfig.json file**
   - Add the new path alias to the paths configuration
   - Follow the established naming conventions
   - Document the purpose of the new alias

2. **Update service-specific tsconfig.json files if needed**
   - If the alias is specific to a service, add it to that service's tsconfig.json
   - Ensure the path is relative to the baseUrl setting

3. **Update this documentation**
   - Add the new alias to the Path Alias Definitions table
   - Document the purpose and usage guidelines for the new alias

4. **Run validation scripts**
   - Verify that the new alias resolves correctly
   - Check for any conflicts with existing aliases
   - Ensure all services can resolve the new alias

5. **Announce the addition to the team**
   - Communicate the new alias and its purpose
   - Provide examples of how to use it correctly
   - Update any relevant code examples or templates

## Enforcing These Standards

These standards are enforced through multiple mechanisms:

1. **Code reviews**
   - Reviewers should check for correct use of path aliases
   - Verify that imports follow the established patterns
   - Ensure no absolute or deep relative paths are used

2. **ESLint rules**
   - The `.eslintrc.js` file includes rules for import paths
   - The `import/no-unresolved` rule checks that imports can be resolved
   - Custom rules enforce the use of path aliases for cross-module imports

3. **Automated validation**
   - Pre-commit hooks check for path alias usage
   - CI/CD pipeline validates path resolution
   - Build process fails if path aliases cannot be resolved

4. **IDE integration**
   - VSCode settings are configured to highlight incorrect imports
   - TypeScript language server validates path resolution
   - Code completion suggests correct path aliases

By adhering to these path alias standards, we ensure consistent, maintainable, and error-free imports across our monorepo architecture, which is critical for the successful build and operation of the AUSTA SuperApp.