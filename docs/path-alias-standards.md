# TypeScript Path Alias Standards

## Overview

This document establishes the coding standards for TypeScript path aliases in the AUSTA SuperApp monorepo. Consistent use of path aliases improves code readability, maintainability, and helps avoid path-related errors across our journey-centered microservices architecture. These standards apply to both backend (NestJS) and frontend (Next.js, React Native) components of the platform.

## Path Alias Definitions

### Backend Path Aliases

The following path aliases are defined in the backend services' `tsconfig.json` files:

| Path Alias | Directory Mapping | Purpose |
|------------|-------------------|---------|
| `@shared/*` | `shared/src/*` | Common utilities, services, and DTOs shared across microservices |
| `@app/auth/*` | `auth-service/src/*` | Authentication service modules |
| `@app/shared/*` | `shared/src/*` | Shared utilities and services |
| `@gamification/*` | `gamification-engine/src/*` | Gamification engine specific modules |
| `@prisma/*` | `shared/prisma/*` | Prisma schema and generated client code |

### Frontend Path Aliases

The following path aliases are defined in the frontend applications' `tsconfig.json` files:

| Path Alias | Directory Mapping | Purpose |
|------------|-------------------|---------|
| `@austa/design-system` | `src/web/design-system/src` | Journey-specific UI components and theming |
| `@design-system/primitives` | `src/web/primitives/src` | Atomic design elements (colors, typography, spacing) |
| `@austa/interfaces` | `src/web/interfaces` | Shared TypeScript interfaces for cross-journey data models |
| `@austa/journey-context` | `src/web/journey-context/src` | Journey-specific state management |

## TypeScript Project References

To ensure proper build order and type checking across the monorepo, we use TypeScript project references. This approach enables incremental builds and ensures dependencies are built in the correct order.

### Project Reference Structure

```json
// Root tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./src/web/primitives" },
    { "path": "./src/web/interfaces" },
    { "path": "./src/web/design-system" },
    { "path": "./src/web/journey-context" },
    { "path": "./src/web/shared" },
    { "path": "./src/web/mobile" },
    { "path": "./src/web/web" }
  ]
}
```

### Service-Specific References

Each service should include references to its dependencies in its `tsconfig.json`:

```json
// Example: src/web/mobile/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../primitives" },
    { "path": "../interfaces" },
    { "path": "../design-system" },
    { "path": "../journey-context" },
    { "path": "../shared" }
  ]
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

2. **Use relative imports only for files within the same module**
   ```typescript
   // CORRECT: Using relative import within the same module
   import { AppConfig } from './config/app.config';
   ```

3. **Use journey-specific aliases for UI components**
   ```typescript
   // CORRECT: Using design system alias for journey-specific components
   import { HealthMetricCard } from '@austa/design-system/health';
   import { AppointmentCard } from '@austa/design-system/care';
   ```

### Path Alias Best Practices

1. **Keep imports organized by alias type**
   ```typescript
   // External libraries first
   import { Injectable } from '@nestjs/common';
   import { useQuery } from '@tanstack/react-query';
   
   // Then shared interfaces and types
   import { HealthMetric } from '@austa/interfaces/health';
   
   // Then design system and journey context
   import { MetricCard } from '@austa/design-system/health';
   import { useHealthJourney } from '@austa/journey-context/hooks';
   
   // Then shared modules
   import { LoggerService } from '@shared/logging/logger.service';
   
   // Then service-specific imports
   import { AppConfig } from './config/app.config';
   ```

2. **Use barrel files for cleaner imports**
   ```typescript
   // PREFER: Create barrel files in shared modules
   import { LoggerService, KafkaService } from '@shared/services';
   
   // INSTEAD OF:
   import { LoggerService } from '@shared/logging/logger.service';
   import { KafkaService } from '@shared/kafka/kafka.service';
   ```

3. **Never use absolute paths starting with `src/`**
   ```typescript
   // INCORRECT: Using src-based paths
   import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
   ```

4. **Avoid circular dependencies**
   - Ensure that modules don't import from each other in a circular manner
   - Use interfaces and dependency injection to break circular dependencies
   - Consider extracting shared code to a common module

## Runtime Path Resolution

For path aliases to work at runtime (not just during TypeScript compilation), we use the following approaches:

### Backend (NestJS) Development

Add `-r tsconfig-paths/register` to the Node.js command:

```json
// In package.json scripts
"scripts": {
  "start:dev": "nest start --watch -r tsconfig-paths/register",
  "start:debug": "nest start --debug --watch -r tsconfig-paths/register"
}
```

### Frontend (Next.js) Development

Next.js automatically resolves path aliases defined in `tsconfig.json`. No additional configuration is needed.

### Frontend (React Native) Development

For React Native, use the `babel-plugin-module-resolver` in your Babel configuration:

```javascript
// babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@austa/design-system': '../design-system/src',
          '@design-system/primitives': '../primitives/src',
          '@austa/interfaces': '../interfaces',
          '@austa/journey-context': '../journey-context/src'
        }
      }
    ]
  ]
};
```

### For Production

For production builds:

1. **Backend Services**: Paths are resolved during compilation to JavaScript with proper relative paths.

2. **Next.js**: Path aliases are automatically handled by the Next.js build process.

3. **React Native**: The Babel plugin handles path resolution during the Metro bundling process.

## Troubleshooting Path Resolution

If you encounter issues with path resolution:

1. Verify file existence using the verification script:
   ```bash
   node scripts/verify-paths.js
   ```

2. Check that your IDE's TypeScript server has reloaded the configuration

3. For runtime errors, verify that the appropriate path resolution mechanism is configured:
   - Backend: `tsconfig-paths/register` in start scripts
   - React Native: `babel-plugin-module-resolver` in Babel config
   - Next.js: Check `tsconfig.json` paths configuration

4. If adding new shared modules, ensure they follow the established directory structure

## Adding New Path Aliases

When adding new path aliases:

1. Update the appropriate `tsconfig.json` files:
   - Root `tsconfig.json` for project references
   - Service-specific `tsconfig.json` for path mappings

2. For React Native, update the Babel configuration

3. Document the new alias in this guide

4. Announce the addition to the team

5. Run the verification script to ensure the paths are correctly configured

6. Update any CI/CD configurations that might be affected

## Enforcing These Standards

These standards are enforced through:

1. Code reviews

2. ESLint rules (see `.eslintrc.js` for import path rules):
   ```javascript
   // Example ESLint rule for enforcing path alias usage
   rules: {
     'no-restricted-imports': [
       'error',
       {
         patterns: [
           {
             group: ['src/*'],
             message: 'Use path aliases instead of src-based imports'
           },
           {
             group: ['../../*'],
             message: 'Use path aliases instead of deep relative imports'
           }
         ]
       }
     ]
   }
   ```

3. Automated verification during CI/CD pipeline

4. TypeScript project references for build-time validation

## Journey-Specific Import Guidelines

For journey-specific imports, use the appropriate path alias to maintain clear boundaries:

```typescript
// Health Journey Components
import { MetricCard, HealthChart, GoalCard } from '@austa/design-system/health';

// Care Journey Components
import { AppointmentCard, ProviderList } from '@austa/design-system/care';

// Plan Journey Components
import { ClaimCard, BenefitCard } from '@austa/design-system/plan';

// Gamification Components
import { AchievementBadge, QuestCard } from '@austa/design-system/gamification';
```

By adhering to these path alias standards, we ensure consistent, maintainable, and error-free imports across our monorepo architecture, supporting the journey-centered approach of the AUSTA SuperApp.