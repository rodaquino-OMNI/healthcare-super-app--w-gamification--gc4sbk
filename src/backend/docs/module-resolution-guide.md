# Module Resolution Guide for AUSTA SuperApp

## Table of Contents

1. [Introduction](#introduction)
2. [Path Aliases](#path-aliases)
   - [Backend Path Aliases](#backend-path-aliases)
   - [Frontend Path Aliases](#frontend-path-aliases)
   - [Best Practices](#path-alias-best-practices)
3. [TypeScript Project References](#typescript-project-references)
   - [Configuration](#project-references-configuration)
   - [Build Order](#build-order)
   - [Benefits](#project-references-benefits)
4. [Export Barrels and Public APIs](#export-barrels-and-public-apis)
   - [Backend Barrels](#backend-barrels)
   - [Frontend Barrels](#frontend-barrels)
   - [Best Practices](#barrel-best-practices)
5. [Circular Dependencies](#circular-dependencies)
   - [Detection](#detecting-circular-dependencies)
   - [Prevention](#preventing-circular-dependencies)
   - [Resolution](#resolving-circular-dependencies)
6. [Build System Configuration](#build-system-configuration)
   - [NestJS Configuration](#nestjs-configuration)
   - [Next.js Configuration](#nextjs-configuration)
   - [React Native/Metro Configuration](#react-nativemetro-configuration)
7. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Verification Tools](#verification-tools)

## Introduction

This guide provides comprehensive documentation on module resolution across the AUSTA SuperApp monorepo. It covers TypeScript path aliases, project references, export patterns, circular dependency management, and build system configuration for both backend (NestJS) and frontend (Next.js and React Native) applications.

The AUSTA SuperApp monorepo is structured with two primary directories:

- `/src/backend`: NestJS-based microservices monorepo managed with Lerna
- `/src/web`: Next.js and React Native applications managed with Turborepo

Proper module resolution is critical for maintaining a clean architecture, enabling efficient development workflows, and preventing build failures across the monorepo.

## Path Aliases

Path aliases provide a way to reference modules using short, consistent paths instead of complex relative paths. They improve code readability, maintainability, and help avoid path-related errors.

### Backend Path Aliases

Backend path aliases are defined in the root `tsconfig.json` at `/src/backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/shared": ["shared/src"],
      "@app/shared/*": ["shared/src/*"],
      "@app/auth": ["auth-service/src"],
      "@app/auth/*": ["auth-service/src/*"],
      "@app/health": ["health-service/src"],
      "@app/health/*": ["health-service/src/*"],
      "@app/care": ["care-service/src"],
      "@app/care/*": ["care-service/src/*"],
      "@app/plan": ["plan-service/src"],
      "@app/plan/*": ["plan-service/src/*"],
      "@app/gamification": ["gamification-engine/src"],
      "@app/gamification/*": ["gamification-engine/src/*"],
      "@app/notifications": ["notification-service/src"],
      "@app/notifications/*": ["notification-service/src/*"],
      "@prisma/*": ["shared/prisma/*"],
      "@austa/*": ["packages/*"]
    }
  }
}
```

These aliases allow you to import modules from other services using consistent paths:

```typescript
// CORRECT: Using path alias for importing from shared module
import { LoggerService } from '@app/shared/logging/logger.service';

// INCORRECT: Using relative path
import { LoggerService } from '../../shared/src/logging/logger.service';
```

### Frontend Path Aliases

Frontend path aliases are defined in multiple `tsconfig.json` files:

1. Root web `tsconfig.json` at `/src/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "design-system/*": ["../design-system/src/*"],
      "shared/*": ["../shared/src/*"]
    }
  }
}
```

2. Web application `tsconfig.json` at `/src/web/web/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../shared/src/*"],
      "@design-system/*": ["../design-system/src/*"],
      "@journey-context/*": ["../journey-context/src/*"]
    }
  }
}
```

3. Mobile application `tsconfig.json` at `/src/web/mobile/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@navigation/*": ["src/navigation/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@api/*": ["src/api/*"],
      "@context/*": ["src/context/*"],
      "@assets/*": ["src/assets/*"],
      "@constants/*": ["src/constants/*"],
      "@i18n/*": ["src/i18n/*"],
      "@shared/*": ["../shared/src/*"],
      "@design-system/*": ["../design-system/src/*"],
      "@journey-context/*": ["../journey-context/src/*"]
    }
  }
}
```

These aliases allow you to import modules using consistent paths across the frontend applications:

```typescript
// CORRECT: Using path alias for importing from shared module
import { formatDate } from '@shared/utils/date';

// CORRECT: Using path alias for importing from design system
import { Button } from '@design-system/components/Button';

// CORRECT: Using path alias for importing from journey context
import { useJourney } from '@journey-context/hooks';

// INCORRECT: Using relative path
import { formatDate } from '../../shared/src/utils/date';
```

### Path Alias Best Practices

1. **Always use path aliases for cross-module imports**
   ```typescript
   // CORRECT: Using path alias for importing from another service
   import { AuthService } from '@app/auth/auth.service';
   
   // INCORRECT: Using relative path
   import { AuthService } from '../../auth-service/src/auth.service';
   ```

2. **Use relative imports only for files within the same module**
   ```typescript
   // CORRECT: Using relative import within the same module
   import { AppConfig } from './config/app.config';
   ```

3. **Keep imports organized by alias type**
   ```typescript
   // External libraries first
   import { Injectable } from '@nestjs/common';
   
   // Then shared modules
   import { LoggerService } from '@app/shared/logging/logger.service';
   
   // Then service-specific imports
   import { AppConfig } from './config/app.config';
   ```

4. **Use barrel exports when possible**
   ```typescript
   // PREFER: Import from barrel files
   import { LoggerService, KafkaService } from '@app/shared/services';
   
   // INSTEAD OF:
   import { LoggerService } from '@app/shared/logging/logger.service';
   import { KafkaService } from '@app/shared/kafka/kafka.service';
   ```

5. **Never use absolute paths starting with `src/`**
   ```typescript
   // INCORRECT: Using src-based paths
   import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
   ```

## TypeScript Project References

TypeScript project references enable proper build order and incremental compilation across the monorepo. They ensure that dependencies are built before the modules that depend on them.

### Project References Configuration

Project references are configured in `tsconfig.json` files using the `references` property:

1. Backend root `tsconfig.json`:

```json
{
  "references": [
    { "path": "./shared" },
    { "path": "./packages/interfaces" },
    { "path": "./packages/database" },
    { "path": "./packages/errors" },
    { "path": "./packages/events" },
    { "path": "./packages/logging" },
    { "path": "./packages/tracing" },
    { "path": "./packages/utils" },
    { "path": "./packages/auth" },
    { "path": "./auth-service" },
    { "path": "./health-service" },
    { "path": "./care-service" },
    { "path": "./plan-service" },
    { "path": "./gamification-engine" },
    { "path": "./notification-service" },
    { "path": "./api-gateway" }
  ]
}
```

2. Service-specific `tsconfig.json` (example from auth-service):

```json
{
  "extends": "../tsconfig.json",
  "references": [
    { "path": "../shared" },
    { "path": "../packages/interfaces" },
    { "path": "../packages/database" },
    { "path": "../packages/errors" },
    { "path": "../packages/events" },
    { "path": "../packages/logging" },
    { "path": "../packages/tracing" },
    { "path": "../packages/utils" },
    { "path": "../packages/auth" }
  ]
}
```

3. Frontend package `tsconfig.json` (example from journey-context):

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "references": [
    { "path": "../shared" },
    { "path": "../design-system" }
  ]
}
```

### Build Order

With project references configured, TypeScript will automatically build dependencies in the correct order when using the `--build` flag:

```bash
# Build the entire backend with proper order
tsc --build src/backend/tsconfig.json

# Build a specific service and its dependencies
tsc --build src/backend/auth-service/tsconfig.json
```

In the frontend, Turborepo handles the build order based on the dependencies defined in `turbo.json`:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```

### Project References Benefits

1. **Proper Build Order**: Dependencies are built before the modules that depend on them.
2. **Incremental Compilation**: Only rebuild what's changed, significantly improving build times.
3. **Type Safety**: Ensures consistent types across the monorepo.
4. **Editor Support**: Enables better IDE features like "Go to Definition" across project boundaries.

## Export Barrels and Public APIs

Export barrels provide a clean, organized way to expose public APIs from modules. They simplify imports and help maintain a clear boundary between internal and external module interfaces.

### Backend Barrels

Backend barrels typically follow this pattern:

```typescript
// src/backend/shared/src/index.ts
export * from './logging/logger.service';
export * from './kafka/kafka.service';
export * from './redis/redis.service';
export * from './tracing/tracing.service';
// ... other exports
```

Service modules should also have their own barrel exports:

```typescript
// src/backend/auth-service/src/auth/index.ts
export * from './auth.service';
export * from './auth.controller';
export * from './dto/login.dto';
export * from './dto/register.dto';
// ... other exports
```

### Frontend Barrels

Frontend barrels follow a similar pattern:

```typescript
// src/web/shared/src/utils/index.ts
export * from './date';
export * from './format';
export * from './validation';
// ... other exports
```

Component libraries should export components through barrels:

```typescript
// src/web/design-system/src/components/index.ts
export * from './Button';
export * from './Card';
export * from './Input';
// ... other exports
```

### Barrel Best Practices

1. **Create index.ts files at each directory level**
   ```typescript
   // src/backend/shared/src/logging/index.ts
   export * from './logger.service';
   export * from './logger.module';
   export * from './logger.interface';
   ```

2. **Use named exports instead of default exports**
   ```typescript
   // CORRECT: Named export
   export class LoggerService {}
   
   // INCORRECT: Default export
   export default class LoggerService {}
   ```

3. **Re-export from barrels to create a clear public API**
   ```typescript
   // src/backend/shared/src/index.ts
   export * from './logging';
   export * from './kafka';
   export * from './redis';
   ```

4. **Avoid exporting internal implementation details**
   ```typescript
   // CORRECT: Export only the public API
   export { LoggerService } from './logger.service';
   
   // INCORRECT: Export everything including internals
   export * from './logger.service';
   ```

5. **Document public APIs with JSDoc comments**
   ```typescript
   /**
    * Provides logging functionality with context and severity levels.
    */
   export class LoggerService {
     // implementation
   }
   ```

## Circular Dependencies

Circular dependencies occur when two or more modules depend on each other, either directly or indirectly. They can cause runtime errors, initialization issues, and make code harder to understand and maintain.

### Detecting Circular Dependencies

1. **TypeScript Compiler Warning**: The TypeScript compiler will emit warnings about circular dependencies when they're detected.

2. **NestJS Circular Dependency Warning**: NestJS will log warnings about circular dependencies at runtime.

3. **Madge Tool**: Use the `madge` tool to visualize and detect circular dependencies:

   ```bash
   # Install madge
   npm install -g madge
   
   # Detect circular dependencies in backend
   madge --circular --ts-config=src/backend/tsconfig.json src/backend
   
   # Detect circular dependencies in frontend
   madge --circular --ts-config=src/web/tsconfig.json src/web
   ```

### Preventing Circular Dependencies

1. **Use interfaces for contracts between modules**
   ```typescript
   // src/backend/shared/src/interfaces/logger.interface.ts
   export interface ILogger {
     log(message: string, context?: string): void;
     error(message: string, trace?: string, context?: string): void;
     warn(message: string, context?: string): void;
     debug(message: string, context?: string): void;
   }
   ```

2. **Apply the Dependency Inversion Principle**
   - Depend on abstractions, not concrete implementations
   - Use interfaces to define contracts between modules

3. **Restructure modules to follow a clear hierarchy**
   - Core modules should not depend on feature modules
   - Shared utilities should not depend on application logic

4. **Use event-based communication**
   - Instead of direct dependencies, use events to communicate between modules
   - Implement the Observer pattern or use an event bus

### Resolving Circular Dependencies

1. **Extract shared code to a separate module**
   - Identify the code that's causing the circular dependency
   - Move it to a new module that both original modules can depend on

2. **Use forward references in NestJS**
   ```typescript
   @Injectable()
   export class AuthService {
     constructor(
       @Inject(forwardRef(() => UsersService))
       private usersService: UsersService,
     ) {}
   }
   ```

3. **Use lazy loading for imports**
   ```typescript
   // Instead of importing directly
   import { UserService } from './user.service';
   
   // Use a function to get the service when needed
   const getUserService = () => require('./user.service').UserService;
   ```

4. **Refactor to use a mediator pattern**
   - Create a mediator service that coordinates between modules
   - Both modules depend on the mediator, not on each other

## Build System Configuration

Proper build system configuration is essential for correct module resolution at runtime.

### NestJS Configuration

1. **nest-cli.json**

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "monorepo": true,
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "tsconfig.build.json",
    "deleteOutDir": true,
    "assets": ["**/*.graphql", "**/*.proto"]
  },
  "projects": {
    "shared": {
      "type": "library",
      "root": "shared",
      "entryFile": "index",
      "sourceRoot": "shared/src",
      "compilerOptions": {
        "tsConfigPath": "shared/tsconfig.json"
      }
    },
    "api-gateway": {
      "type": "application",
      "root": "api-gateway",
      "entryFile": "main",
      "sourceRoot": "api-gateway/src",
      "compilerOptions": {
        "tsConfigPath": "api-gateway/tsconfig.json"
      }
    }
    // ... other projects
  }
}
```

2. **Runtime Path Resolution**

For path aliases to work at runtime, use `tsconfig-paths/register`:

```json
// In package.json scripts
"scripts": {
  "start:dev": "nest start --watch -r tsconfig-paths/register",
  "start:debug": "nest start --debug --watch -r tsconfig-paths/register"
}
```

3. **Webpack Configuration**

NestJS uses webpack for bundling. You can customize the webpack configuration in `webpack.config.js`:

```javascript
const path = require('path');

module.exports = (options, webpack) => {
  const config = options;

  config.resolve.alias = {
    '@app/shared': path.resolve(__dirname, 'shared/src'),
    '@app/auth': path.resolve(__dirname, 'auth-service/src'),
    // ... other aliases
  };

  return config;
};
```

### Next.js Configuration

1. **next.config.js**

```javascript
const path = require('path');

module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@design-system': path.resolve(__dirname, '../design-system/src'),
      '@journey-context': path.resolve(__dirname, '../journey-context/src'),
    };
    return config;
  },
};
```

2. **Module Resolution in Next.js**

Next.js automatically resolves path aliases defined in `tsconfig.json`. For custom aliases, use the webpack configuration above.

### React Native/Metro Configuration

1. **metro.config.js**

```javascript
const path = require('path');
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
      assetPlugins: ['react-native-asset-plugin'],
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      extraNodeModules: {
        '@shared': path.resolve(__dirname, '../shared/src'),
        '@design-system': path.resolve(__dirname, '../design-system/src'),
        '@journey-context': path.resolve(__dirname, '../journey-context/src'),
      },
      assetExts: [...assetExts, 'svg'],
      sourceExts: [...sourceExts, 'svg'],
    },
    watchFolders: [
      path.resolve(__dirname, '../shared'),
      path.resolve(__dirname, '../design-system'),
      path.resolve(__dirname, '../journey-context'),
      path.resolve(__dirname, '../node_modules'),
    ],
  };
})();
```

2. **babel.config.js**

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@api': './src/api',
          '@context': './src/context',
          '@assets': './src/assets',
          '@constants': './src/constants',
          '@i18n': './src/i18n',
          '@shared': '../shared/src',
          '@design-system': '../design-system/src',
          '@journey-context': '../journey-context/src',
        },
      },
    ],
  ],
};
```

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**

   - Verify that the path alias is correctly defined in `tsconfig.json`
   - Check that the file exists at the expected location
   - Ensure that the build system is configured to resolve the alias
   - Restart the TypeScript server in your IDE (F1 > TypeScript: Restart TS Server in VS Code)

2. **Circular Dependency Warnings**

   - Use the techniques described in the [Circular Dependencies](#circular-dependencies) section
   - Check for indirect circular dependencies using the `madge` tool
   - Consider refactoring to use dependency injection or a mediator pattern

3. **Runtime Path Resolution Failures**

   - Ensure that `tsconfig-paths/register` is included in your start scripts
   - Verify that webpack is configured to resolve aliases
   - Check that Metro config includes the correct `extraNodeModules` and `watchFolders`

4. **Build Order Issues**

   - Verify that TypeScript project references are correctly configured
   - Use the `--build` flag with `tsc` to ensure proper build order
   - Check that Turborepo pipeline dependencies are correctly defined

### Verification Tools

1. **verify-paths-simple.js**

This script verifies that files referenced by path aliases actually exist:

```javascript
const fs = require('fs');
const path = require('path');

const tsconfig = require('./tsconfig.json');
const paths = tsconfig.compilerOptions.paths;

let success = true;

for (const alias in paths) {
  const aliasPath = paths[alias][0];
  const resolvedPath = path.resolve(__dirname, aliasPath);
  
  try {
    fs.accessSync(resolvedPath, fs.constants.F_OK);
    console.log(`✅ ${alias} -> ${aliasPath} (${resolvedPath}) exists`);
  } catch (err) {
    console.error(`❌ ${alias} -> ${aliasPath} (${resolvedPath}) does not exist`);
    success = false;
  }
}

if (!success) {
  process.exit(1);
}
```

Run this script to verify path aliases:

```bash
node verify-paths-simple.js
```

2. **verify-ts-paths.ts**

This script verifies that TypeScript can resolve path aliases at runtime:

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('PathVerifier');

try {
  logger.log('Verifying @app/shared/logging/logger.service...');
  require('@app/shared/logging/logger.service');
  logger.log('✅ @app/shared/logging/logger.service verified');
} catch (err) {
  logger.error(`❌ @app/shared/logging/logger.service failed: ${err.message}`);
  process.exit(1);
}

// Add more verifications as needed
```

Run this script with ts-node:

```bash
ts-node -r tsconfig-paths/register verify-ts-paths.ts
```

3. **Madge for Circular Dependencies**

Install and use madge to detect circular dependencies:

```bash
npm install -g madge

# Detect circular dependencies in backend
madge --circular --ts-config=src/backend/tsconfig.json src/backend

# Detect circular dependencies in frontend
madge --circular --ts-config=src/web/tsconfig.json src/web

# Generate a dependency graph visualization
madge --image=deps.png --ts-config=src/backend/tsconfig.json src/backend
```

4. **TypeScript --traceResolution Flag**

Use the `--traceResolution` flag to debug module resolution issues:

```bash
tsc --traceResolution
```

This will output detailed information about how TypeScript resolves each import.