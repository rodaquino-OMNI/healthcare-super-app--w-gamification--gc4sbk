# AUSTA SuperApp Monorepo Structure

## Overview

The AUSTA SuperApp is organized as a comprehensive monorepo that houses both backend microservices and frontend applications. This architecture enables code sharing, consistent versioning, and simplified dependency management while maintaining clear boundaries between services and components.

The monorepo is divided into two primary sections:

1. **Backend (`/src/backend`)**: A Lerna-managed collection of microservices built with NestJS
2. **Frontend (`/src/web`)**: A Turborepo-managed workspace containing web and mobile applications

This document provides a detailed overview of the monorepo structure, workspace configuration, module resolution strategies, and dependency management approaches.

## Repository Root Structure

```
/
├── .github/            # GitHub workflows and templates
├── docs/               # Project documentation
├── infrastructure/     # Deployment and infrastructure code
├── scripts/            # Utility scripts for the monorepo
├── src/                # Source code root
│   ├── backend/        # Backend microservices (Lerna)
│   └── web/            # Frontend applications (Turborepo)
└── package.json        # Root package configuration
```

## Backend Structure (`/src/backend`)

The backend is organized as a Lerna-managed monorepo with NestJS microservices, each implementing a specific domain or cross-cutting concern.

```
/src/backend/
├── api-gateway/                # API Gateway service (entry point)
├── auth-service/               # Authentication and authorization
├── health-service/             # Health journey service
├── care-service/               # Care journey service
├── plan-service/               # Plan journey service
├── gamification-engine/        # Cross-journey gamification
├── notification-service/       # Notification delivery
├── shared/                     # Shared utilities and models
├── packages/                   # Internal packages
│   ├── auth/                   # Authentication utilities
│   ├── database/               # Database access layer
│   ├── errors/                 # Error handling framework
│   ├── events/                 # Event processing
│   ├── interfaces/             # Shared TypeScript interfaces
│   │   ├── auth/               # Auth interfaces
│   │   ├── common/             # Common interfaces
│   │   ├── gamification/       # Gamification interfaces
│   │   └── journey/            # Journey-specific interfaces
│   ├── logging/                # Logging infrastructure
│   ├── tracing/                # Distributed tracing
│   └── utils/                  # Utility functions
├── tools/                      # Development tools
├── package.json                # Backend workspace configuration
├── tsconfig.json               # TypeScript configuration
└── lerna.json                  # Lerna configuration
```

### Backend Workspace Configuration

The backend uses Lerna for workspace management with the following configuration in `package.json`:

```json
{
  "name": "austa-superapp-backend",
  "private": true,
  "workspaces": [
    "shared",
    "api-gateway",
    "auth-service",
    "health-service",
    "care-service",
    "plan-service",
    "gamification-engine",
    "notification-service",
    "packages/*"
  ]
}
```

### Backend Module Resolution

The backend uses TypeScript path aliases for consistent module imports across services:

```json
{
  "compilerOptions": {
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

## Frontend Structure (`/src/web`)

The frontend is organized as a Turborepo-managed workspace containing the web application (Next.js), mobile application (React Native), and shared packages.

```
/src/web/
├── design-system/            # UI component library
│   ├── src/                  # Source code
│   │   ├── themes/           # Journey-specific themes
│   │   ├── components/       # Shared UI components
│   │   ├── charts/           # Data visualization
│   │   ├── health/           # Health journey components
│   │   ├── care/             # Care journey components
│   │   ├── plan/             # Plan journey components
│   │   └── gamification/     # Gamification components
│   └── package.json          # Package configuration
├── interfaces/               # Shared TypeScript interfaces
│   ├── auth/                 # Authentication interfaces
│   ├── common/               # Common interfaces
│   ├── components/           # Component props interfaces
│   ├── gamification/         # Gamification interfaces
│   ├── health/               # Health journey interfaces
│   ├── care/                 # Care journey interfaces
│   ├── plan/                 # Plan journey interfaces
│   └── package.json          # Package configuration
├── journey-context/          # Journey state management
│   ├── src/                  # Source code
│   │   ├── providers/        # Context providers
│   │   ├── hooks/            # Custom hooks
│   │   ├── adapters/         # Platform adapters
│   │   │   ├── web/          # Web-specific adapters
│   │   │   └── mobile/       # Mobile-specific adapters
│   │   ├── types/            # TypeScript types
│   │   ├── constants/        # Shared constants
│   │   ├── utils/            # Utility functions
│   │   └── storage/          # Storage abstractions
│   └── package.json          # Package configuration
├── primitives/               # Design system primitives
│   ├── src/                  # Source code
│   │   ├── tokens/           # Design tokens
│   │   └── components/       # Primitive components
│   └── package.json          # Package configuration
├── shared/                   # Shared utilities
│   ├── api/                  # API clients
│   ├── config/               # Configuration
│   ├── constants/            # Constants
│   ├── graphql/              # GraphQL queries
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   └── package.json          # Package configuration
├── mobile/                   # React Native mobile app
│   ├── src/                  # Source code
│   │   ├── screens/          # Screen components
│   │   │   ├── auth/         # Authentication screens
│   │   │   ├── health/       # Health journey screens
│   │   │   ├── care/         # Care journey screens
│   │   │   └── plan/         # Plan journey screens
│   │   ├── navigation/       # Navigation configuration
│   │   └── components/       # Mobile-specific components
│   └── package.json          # Package configuration
├── web/                      # Next.js web application
│   ├── src/                  # Source code
│   │   ├── pages/            # Next.js pages
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── health/       # Health journey pages
│   │   │   ├── care/         # Care journey pages
│   │   │   └── plan/         # Plan journey pages
│   │   ├── components/       # Web-specific components
│   │   └── layouts/          # Page layouts
│   └── package.json          # Package configuration
├── package.json              # Frontend workspace configuration
└── turbo.json                # Turborepo configuration
```

### Frontend Workspace Configuration

The frontend uses Yarn workspaces and Turborepo for workspace management with the following configuration in `package.json`:

```json
{
  "name": "web",
  "private": true,
  "workspaces": [
    "design-system",
    "shared",
    "mobile",
    "web",
    "primitives",
    "interfaces",
    "journey-context"
  ]
}
```

### Frontend Module Resolution

The frontend uses TypeScript path aliases for consistent module imports across applications:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "design-system/*": ["../design-system/src/*"],
      "shared/*": ["../shared/src/*"],
      "@austa/design-system": ["../design-system/src"],
      "@austa/interfaces": ["../interfaces"],
      "@austa/journey-context": ["../journey-context/src"],
      "@design-system/primitives": ["../primitives/src"]
    }
  }
}
```

## Journey-Centered Architecture

The AUSTA SuperApp is built around three core user journeys:

1. **Health Journey ("Minha Saúde")**: Health metrics, medical history, device integration
2. **Care Journey ("Cuidar-me Agora")**: Appointments, telemedicine, treatments
3. **Plan Journey ("Meu Plano & Benefícios")**: Insurance coverage, claims, benefits

Each journey has dedicated backend services and frontend components, with cross-cutting concerns like authentication, gamification, and notifications shared across journeys.

### Journey-Specific Backend Services

- **Health Service**: Manages health metrics, medical history, device connections
- **Care Service**: Handles appointments, providers, telemedicine, treatments
- **Plan Service**: Manages insurance plans, claims, benefits, documents

### Journey-Specific Frontend Components

- **Journey Context**: Manages the active journey state across the application
- **Journey-Specific UI Components**: Components tailored to each journey's needs
- **Journey-Specific Screens/Pages**: User interfaces for each journey

## Shared Packages and Internal Libraries

### Backend Shared Packages

- **@app/shared**: Common utilities, DTOs, and interfaces
- **@austa/auth**: Authentication utilities and middleware
- **@austa/database**: Database access layer with Prisma integration
- **@austa/errors**: Error handling framework with journey-specific error types
- **@austa/events**: Event processing with Kafka integration
- **@austa/interfaces**: Shared TypeScript interfaces for cross-service communication
- **@austa/logging**: Structured logging with context tracking
- **@austa/tracing**: Distributed tracing with OpenTelemetry
- **@austa/utils**: Utility functions for validation, date handling, etc.

### Frontend Shared Packages

- **@austa/design-system**: UI component library with journey-specific theming
- **@design-system/primitives**: Atomic design tokens and primitive components
- **@austa/interfaces**: Shared TypeScript interfaces for data models
- **@austa/journey-context**: Journey state management with React context
- **@austa/web-shared**: Shared utilities, API clients, and constants

## Workspace Configuration and Module Resolution

### Backend (Lerna)

The backend uses Lerna for workspace management with the following key configurations:

1. **package.json**: Defines workspaces and shared dependencies
2. **lerna.json**: Configures version management and package publishing
3. **tsconfig.json**: Sets up TypeScript path aliases for module resolution
4. **nest-cli.json**: Configures NestJS monorepo settings

### Frontend (Turborepo)

The frontend uses Turborepo for workspace management with the following key configurations:

1. **package.json**: Defines workspaces and shared dependencies
2. **turbo.json**: Configures build pipelines and caching
3. **tsconfig.json**: Sets up TypeScript path aliases for module resolution
4. **.yarnrc.yml**: Configures Yarn workspace behavior

## Build and Dependency Management

### Backend Build Process

1. **TypeScript Compilation**: Each service compiles TypeScript to JavaScript
2. **NestJS Bundling**: NestJS CLI bundles services for production
3. **Prisma Client Generation**: Generates Prisma clients for database access
4. **Docker Image Building**: Creates Docker images for deployment

### Frontend Build Process

1. **TypeScript Compilation**: Compiles TypeScript to JavaScript
2. **Next.js Build**: Builds the web application with Next.js
3. **React Native Bundle**: Creates bundles for iOS and Android
4. **Design System Build**: Builds the design system for consumption

### Dependency Management

#### Backend Dependencies

- **NestJS**: Server framework for microservices
- **Prisma**: Database ORM for PostgreSQL
- **TypeORM**: Alternative ORM for specific use cases
- **Kafka.js**: Event streaming for inter-service communication
- **ioredis**: Redis client for caching and pub/sub
- **OpenTelemetry**: Distributed tracing and metrics

#### Frontend Dependencies

- **React**: UI library for components
- **Next.js**: React framework for web application
- **React Native**: Cross-platform mobile framework
- **Apollo Client**: GraphQL client for data fetching
- **TanStack Query**: Data fetching and caching
- **Styled Components**: CSS-in-JS styling

## Module Resolution Strategy

The monorepo uses a consistent module resolution strategy across both backend and frontend:

1. **TypeScript Path Aliases**: Define aliases in tsconfig.json for clean imports
2. **Barrel Exports**: Use index.ts files to create clean public APIs
3. **Workspace References**: Leverage workspace package references for dependencies
4. **Absolute Imports**: Use absolute imports with aliases instead of relative paths

### Example Import Patterns

#### Backend

```typescript
// Import from another service
import { UserDto } from '@app/auth/dto/user.dto';

// Import from shared package
import { LoggerService } from '@app/shared/logging/logger.service';

// Import from internal package
import { AppException } from '@austa/errors';
```

#### Frontend

```typescript
// Import from design system
import { Button } from '@austa/design-system';

// Import from journey context
import { useJourney } from '@austa/journey-context';

// Import from interfaces
import { HealthMetric } from '@austa/interfaces/health';

// Import from primitives
import { colors } from '@design-system/primitives';
```

## Conclusion

The AUSTA SuperApp monorepo structure provides a scalable, maintainable architecture that enables code sharing while maintaining clear boundaries between services and components. The journey-centered approach aligns technical boundaries with user mental models, creating a cohesive user experience across all platforms.

This document serves as a guide for navigating the codebase, understanding component relationships, and maintaining consistent structural patterns across the repository.