# Module Resolution Architecture

## Overview

This document outlines the standardized approach to module resolution in the AUSTA SuperApp monorepo. It addresses critical module resolution issues that were causing build failures and provides clear guidelines for proper import patterns, export organization, and dependency declaration.

## Table of Contents

1. [TypeScript Configuration](#typescript-configuration)
2. [Path Aliases](#path-aliases)
3. [Export Patterns](#export-patterns)
4. [Build System Configuration](#build-system-configuration)
5. [Import Guidelines](#import-guidelines)
6. [Troubleshooting](#troubleshooting)

## Path Aliases

Path aliases provide a consistent way to reference modules across the monorepo, eliminating relative path complexity and improving code readability.

### Standard Alias Patterns

The following path alias patterns are used throughout the monorepo:

| Alias Pattern | Purpose | Example Usage |
|--------------|---------|---------------|
| `@app/*` | References modules within the current service/application | `import { UserService } from '@app/users/user.service';` |
| `@austa/*` | References shared packages in the monorepo | `import { HealthMetric } from '@austa/interfaces';` |
| `@backend/*` | References backend services (used in API Gateway) | `import { AuthClient } from '@backend/auth-service';` |
| `@test/*` | References test utilities and fixtures | `import { createTestUser } from '@test/fixtures';` |

### Backend Service Aliases

Backend services use the following alias structure:

```typescript
// In tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/*"],
      "@austa/*": ["../../packages/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

### Frontend Application Aliases

Frontend applications use a slightly different alias structure to accommodate their build systems:

```typescript
// In tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/*"],
      "@austa/*": ["../*/src"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### Build System Integration

Path aliases must be configured in both TypeScript and the build system:

#### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@austa/design-system',
    '@design-system/primitives',
    '@austa/interfaces',
    '@austa/journey-context'
  ]
};
```

#### React Native Configuration

```javascript
// metro.config.js
module.exports = {
  resolver: {
    extraNodeModules: {
      '@app': path.resolve(__dirname, 'src'),
      '@austa': path.resolve(__dirname, '../')
    }
  },
  watchFolders: [
    path.resolve(__dirname, '../design-system/src'),
    path.resolve(__dirname, '../primitives/src'),
    path.resolve(__dirname, '../interfaces'),
    path.resolve(__dirname, '../journey-context/src')
  ]
};
```

#### NestJS Configuration

```javascript
// nest-cli.json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "tsconfig.build.json",
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ],
    "webpackConfigPath": "webpack.config.js"
  }
}
```

```javascript
// webpack.config.js
module.exports = (options, webpack) => {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        '@app': path.resolve(__dirname, 'src'),
        '@austa': path.resolve(__dirname, '../../packages')
      }
    }
  };
};
```

## TypeScript Configuration

The AUSTA SuperApp uses TypeScript 5.3.3 across all services and applications. To ensure consistent module resolution, we've implemented a standardized TypeScript configuration approach.

### Root Configuration

A root `tsconfig.json` file is located at the repository root and contains shared configuration that all other TypeScript configurations extend. This ensures consistency across the monorepo.

```json
// Root tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "composite": true,
    "incremental": true
  },
  "exclude": ["**/node_modules", "**/dist"]
}
```

### Service-Specific Configuration

Each service and package has its own `tsconfig.json` that extends the root configuration and adds service-specific settings:

```json
// Example service tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@app/*": ["src/*"],
      "@austa/*": ["../../packages/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../../packages/interfaces" },
    { "path": "../../packages/utils" }
  ]
}
```

### Project References

TypeScript project references are used to establish build dependencies between packages. This ensures that dependent packages are built in the correct order and enables incremental builds.

```json
"references": [
  { "path": "../../packages/interfaces" },
  { "path": "../../packages/utils" }
]
```

### Frontend Configuration

Frontend applications (Next.js and React Native) have specific TypeScript configurations to accommodate their build systems:

```json
// Web application tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "baseUrl": "./",
    "paths": {
      "@app/*": ["src/*"],
      "@austa/*": ["../*/src"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*"],
  "exclude": ["node_modules"]
}
```

```json
// Mobile application tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-native",
    "lib": ["es2022"],
    "allowJs": true,
    "baseUrl": "./",
    "paths": {
      "@app/*": ["src/*"],
      "@austa/*": ["../*/src"]
    }
  },
  "include": ["src/**/*", "index.js"],
  "exclude": ["node_modules"]
}
```

## Export Patterns

Proper export patterns are essential for creating clean, maintainable code with clear public APIs. The AUSTA SuperApp uses barrel exports to organize and expose modules.

### Barrel Files

Barrel files (typically named `index.ts`) consolidate and re-export the public API of a module. This approach simplifies imports and creates a clear boundary between internal and external APIs.

```typescript
// src/users/index.ts (barrel file)
export * from './user.service';
export * from './user.controller';
export * from './dto/create-user.dto';
export * from './dto/update-user.dto';
// Do NOT export internal implementation details
```

### Module Structure

Each module should follow this structure:

```
src/module-name/
├── index.ts                 # Barrel file exporting the public API
├── module-name.module.ts    # NestJS module definition
├── module-name.service.ts   # Service implementation
├── module-name.controller.ts # Controller implementation
├── dto/                     # Data Transfer Objects
│   ├── index.ts             # Barrel file for DTOs
│   ├── create-entity.dto.ts # DTO for creation
│   └── update-entity.dto.ts # DTO for updates
├── entities/                # Entity definitions
│   ├── index.ts             # Barrel file for entities
│   └── entity.entity.ts     # Entity implementation
└── interfaces/              # Interfaces and types
    ├── index.ts             # Barrel file for interfaces
    └── entity.interface.ts  # Interface definitions
```

### Package Exports

Shared packages should have a clear export structure in their `package.json`:

```json
{
  "name": "@austa/interfaces",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./health": {
      "import": "./dist/health/index.js",
      "require": "./dist/health/index.js",
      "types": "./dist/health/index.d.ts"
    },
    "./care": {
      "import": "./dist/care/index.js",
      "require": "./dist/care/index.js",
      "types": "./dist/care/index.d.ts"
    },
    "./plan": {
      "import": "./dist/plan/index.js",
      "require": "./dist/plan/index.js",
      "types": "./dist/plan/index.d.ts"
    }
  }
}
```

### Best Practices

1. **Explicit Exports**: Always be explicit about what you're exporting. Avoid `export * from './internal-file'` when you only need specific exports.

2. **Avoid Circular Dependencies**: Structure your exports to prevent circular dependencies. If modules A and B depend on each other, extract the shared functionality into a separate module C.

3. **Consistent Naming**: Use consistent naming conventions for files and exports:
   - Services: `user.service.ts`
   - Controllers: `user.controller.ts`
   - DTOs: `create-user.dto.ts`
   - Entities: `user.entity.ts`
   - Interfaces: `user.interface.ts`

4. **Journey-Specific Organization**: For journey-specific modules, organize exports by journey:

```typescript
// src/index.ts
export * from './health';
export * from './care';
export * from './plan';

// src/health/index.ts
export * from './metrics';
export * from './goals';
export * from './devices';
```

## Build System Configuration

Proper build system configuration is essential for ensuring that module resolution works correctly across different environments.

### NestJS Backend Services

Backend services use NestJS with webpack for building and bundling:

```javascript
// webpack.config.js
const path = require('path');

module.exports = (options, webpack) => {
  return {
    ...options,
    mode: 'production',
    devtool: 'source-map',
    entry: options.entry,
    externals: [],
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    module: {
      ...options.module,
      rules: [
        ...options.module.rules,
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: 'tsconfig.build.json',
              },
            },
          ],
        },
      ],
    },
    resolve: {
      ...options.resolve,
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@app': path.resolve(__dirname, 'src'),
        '@austa': path.resolve(__dirname, '../../packages'),
      },
    },
    plugins: [
      ...options.plugins,
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
    ],
  };
};
```

### Next.js Web Application

The web application uses Next.js with its built-in webpack configuration:

```javascript
// next.config.js
const withTM = require('next-transpile-modules')([  
  '@austa/design-system',
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context'
]);

module.exports = withTM({
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Add TypeScript path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@app': path.resolve(__dirname, 'src'),
    };
    
    return config;
  },
});
```

### React Native Mobile Application

The mobile application uses Metro bundler with specific configuration for monorepo support:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [
  path.resolve(workspaceRoot, 'design-system/src'),
  path.resolve(workspaceRoot, 'primitives/src'),
  path.resolve(workspaceRoot, 'interfaces'),
  path.resolve(workspaceRoot, 'journey-context/src'),
];

// 2. Set up resolver for monorepo packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Set up module resolution aliases
config.resolver.extraNodeModules = {
  '@app': path.resolve(projectRoot, 'src'),
  '@austa': path.resolve(workspaceRoot),
};

module.exports = config;
```

### Shared Package Build Configuration

Shared packages use TypeScript's `tsc` for building:

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "**/*.spec.ts", "**/*.test.ts"],
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true
  }
}
```

```json
// package.json build script
{
  "scripts": {
    "build": "rimraf dist && tsc -p tsconfig.build.json",
    "watch": "tsc -p tsconfig.build.json --watch"
  }
}
```

### Monorepo Build Orchestration

The monorepo uses Lerna and Turborepo for build orchestration:

```json
// lerna.json (backend)
{
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "packages": ["packages/*", "*/"],
  "command": {
    "bootstrap": {
      "hoist": true
    },
    "version": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    },
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    }
  }
}
```

```json
// turbo.json (frontend)
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false
    }
  }
}
```

## Import Guidelines

Consistent import patterns are essential for maintainable code. Follow these guidelines for all imports in the AUSTA SuperApp.

### Import Order

Organize imports in the following order:

1. External libraries and frameworks
2. Shared packages from the monorepo
3. Internal modules from the current service/application
4. Relative imports from the current directory

```typescript
// 1. External libraries and frameworks
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 2. Shared packages from the monorepo
import { HealthMetric } from '@austa/interfaces';
import { JourneyError } from '@austa/errors';

// 3. Internal modules from the current service/application
import { ConfigService } from '@app/config/config.service';
import { LoggerService } from '@app/logger/logger.service';

// 4. Relative imports from the current directory
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
```

### Import Patterns

Use the following import patterns consistently:

1. **Always use path aliases** instead of relative paths when importing from outside the current directory:

```typescript
// Good
import { UserService } from '@app/users/user.service';

// Avoid
import { UserService } from '../../users/user.service';
```

2. **Use relative paths** only for imports within the same directory:

```typescript
// Good
import { User } from './entities/user.entity';

// Avoid
import { User } from '@app/users/entities/user.entity';
```

3. **Use named imports** instead of default imports when possible:

```typescript
// Good
import { UserService } from '@app/users/user.service';

// Avoid
import UserService from '@app/users/user.service';
```

4. **Use barrel imports** when importing multiple items from the same module:

```typescript
// Good
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '@app/users/dto';

// Avoid
import { CreateUserDto } from '@app/users/dto/create-user.dto';
import { UpdateUserDto } from '@app/users/dto/update-user.dto';
import { UserResponseDto } from '@app/users/dto/user-response.dto';
```

### Journey-Specific Imports

When importing from journey-specific packages, use the appropriate subpath exports:

```typescript
// Good
import { HealthMetric } from '@austa/interfaces/health';
import { CareProvider } from '@austa/interfaces/care';
import { PlanBenefit } from '@austa/interfaces/plan';

// Avoid
import { HealthMetric, CareProvider, PlanBenefit } from '@austa/interfaces';
```

### Type Imports

Use the `type` keyword when importing only for type annotations:

```typescript
// Good - only used for type annotations
import type { User } from './entities/user.entity';

// Good - used in runtime code
import { User } from './entities/user.entity';
```

## Troubleshooting

Common module resolution issues and their solutions:

### Cannot Find Module

**Issue**: TypeScript cannot find a module that you're importing.

```
TS2307: Cannot find module '@app/users/user.service' or its corresponding type declarations.
```

**Solutions**:

1. Check that the path alias is correctly configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/*"]
    }
  }
}
```

2. Verify that the path alias is also configured in the build system (webpack, Metro, etc.).

3. Ensure that the module exists at the expected path.

4. Run a clean build to regenerate TypeScript declaration files.

### Circular Dependencies

**Issue**: Two or more modules depend on each other, creating a circular dependency.

```
Warning: Circular dependency detected:
  src/users/user.service.ts -> src/auth/auth.service.ts -> src/users/user.service.ts
```

**Solutions**:

1. Extract the shared functionality into a separate module.

2. Use interfaces to break the dependency cycle:

```typescript
// user.service.ts
import type { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  private authService: AuthService;

  setAuthService(authService: AuthService) {
    this.authService = authService;
  }
}
```

3. Use NestJS's `forwardRef()` for circular dependencies in NestJS services:

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}
}
```

### Missing Type Declarations

**Issue**: TypeScript cannot find type declarations for a module.

```
TS7016: Could not find a declaration file for module 'some-module'.
```

**Solutions**:

1. Install the corresponding `@types` package:

```bash
yarn add -D @types/some-module
```

2. Create a declaration file in your project:

```typescript
// src/types/some-module.d.ts
declare module 'some-module' {
  export function someFunction(): void;
  // Add other type definitions as needed
}
```

### Build Errors in Monorepo

**Issue**: Build fails due to missing dependencies or incorrect build order.

**Solutions**:

1. Ensure that project references are correctly configured in `tsconfig.json`:

```json
{
  "references": [
    { "path": "../../packages/interfaces" }
  ]
}
```

2. Use the correct build command that respects project references:

```bash
tsc -b
```

3. Configure the build pipeline in Lerna or Turborepo to respect dependencies:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Runtime Module Resolution Errors

**Issue**: TypeScript compiles successfully, but the application fails at runtime with module resolution errors.

**Solutions**:

1. Ensure that the build system (webpack, Metro, etc.) is correctly configured to resolve path aliases.

2. Check that all required dependencies are included in the final bundle.

3. Verify that the module resolution strategy in TypeScript matches the runtime environment:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

4. For Node.js applications, ensure that the `package.json` has the correct `type` field:

```json
{
  "type": "module" // For ESM
  // or omit for CommonJS
}
```
