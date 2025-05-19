# AUSTA SuperApp Dependency Management Guide

## Introduction

This document serves as the authoritative reference for dependency management in the AUSTA SuperApp project. It catalogs all dependency-related fixes, workarounds, and resolutions applied during the comprehensive refactoring effort. This guide helps developers understand why specific versions or configurations are used and provides strategies for handling common dependency issues.

**Purpose:** To prevent the reintroduction of resolved dependency problems and maintain a consistent, stable development environment across all journeys and platforms.

## Standardized Dependency Version Guidelines

### Core Language & Runtime

| Dependency | Version | Notes |
|------------|---------|-------|
| TypeScript | 5.3.3 | Required for all packages; do not use mismatched versions |
| Node.js | ≥18.0.0 | Minimum version for all development and deployment |
| JavaScript | ES2022 | Target compilation for all TypeScript code |

### Backend Frameworks

| Dependency | Version | Notes |
|------------|---------|-------|
| NestJS | 10.3.0 | Core framework for all microservices |
| Express | 4.18.2 | Web server underlying NestJS |
| GraphQL | 16.9.0 | Query language with Apollo Server 4.9.5 |
| Prisma ORM | 5.10.2 | Database access with type safety |
| kafkajs | 2.2.4 | Event streaming between services |
| ioredis | 5.3.2 | Redis client for caching and pub/sub |

### Frontend Frameworks

| Dependency | Version | Notes |
|------------|---------|-------|
| React | 18.2.0 | Core UI library for web and mobile |
| Next.js | 14.2.0 | React framework for web application |
| React Native | 0.73.4 | Cross-platform mobile framework |
| Redux Toolkit | 2.1.0 | State management |
| TanStack Query | 5.25.0 | Data fetching and caching |
| Apollo Client | 3.8.10 | GraphQL client |

### UI & Design

| Dependency | Version | Notes |
|------------|---------|-------|
| Styled Components | 6.1.8 | CSS-in-JS styling |
| Material UI | 5.15.12 | Component library |
| Framer Motion | 11.0.8 | Animation library |

### Internal Packages

| Package | Version | Purpose |
|---------|---------|--------|
| @design-system/primitives | 1.0.0 | Design tokens (colors, typography, spacing) |
| @austa/design-system | 1.0.0 | Journey-specific UI components |
| @austa/interfaces | 1.0.0 | Shared TypeScript interfaces |
| @austa/journey-context | 1.0.0 | Journey state management |

## New Workspace Package Dependencies

### @design-system/primitives

This package provides the atomic design elements that form the foundation of the design system:

```typescript
// Example usage
import { colors, typography, spacing } from '@design-system/primitives';

// Colors with journey-specific palettes
const primaryColor = colors.health.primary;

// Typography with predefined text styles
const headingStyle = typography.heading1;

// Spacing with consistent scale
const padding = spacing.md;
```

**Dependencies:**
- No external dependencies
- Used by @austa/design-system and directly by UI components

### @austa/design-system

Implements journey-specific UI components built on primitives:

```typescript
// Example usage
import { Button, Card } from '@austa/design-system';
import { useJourneyTheme } from '@austa/journey-context';

const MyComponent = () => {
  const { theme } = useJourneyTheme();
  return (
    <Card variant={theme}>
      <Button variant="primary">Action</Button>
    </Card>
  );
};
```

**Dependencies:**
- @design-system/primitives
- styled-components
- react
- react-native (for mobile compatibility)

### @austa/interfaces

Provides shared TypeScript interfaces for cross-journey data models:

```typescript
// Example usage
import { User, HealthMetric } from '@austa/interfaces';

const processUserData = (user: User) => {
  // Type-safe operations on user data
};

const trackMetric = (metric: HealthMetric) => {
  // Type-safe operations on health metrics
};
```

**Dependencies:**
- No runtime dependencies (TypeScript only)

### @austa/journey-context

Manages journey-specific state and context:

```typescript
// Example usage
import { useJourney, JourneyProvider } from '@austa/journey-context';

const App = () => (
  <JourneyProvider>
    <MainContent />
  </JourneyProvider>
);

const MainContent = () => {
  const { currentJourney, switchJourney } = useJourney();
  return (
    <div>
      <p>Current journey: {currentJourney}</p>
      <button onClick={() => switchJourney('health')}>Switch to Health</button>
    </div>
  );
};
```

**Dependencies:**
- react
- @austa/interfaces

## Dependency Management Strategy

The AUSTA SuperApp uses a structured approach to dependency management:

### Monorepo Structure

1. **Backend (Lerna)**: `/src/backend/` uses Lerna for managing microservices and shared packages
2. **Frontend (Turborepo)**: `/src/web/` uses Turborepo for managing web and mobile applications

### Version Control

1. **Explicit Versioning**: All dependencies must specify exact versions or appropriate version ranges
2. **No "latest"**: Never use "latest" as a version specifier
3. **Peer Dependencies**: Properly declare peer dependencies to avoid duplicate installations

### Package Manager

1. **Yarn**: Standardized on Yarn 1.22.19 for all package management
2. **Workspaces**: Utilize Yarn workspaces for local package linking
3. **Resolution Strategy**: Use resolutions field in root package.json for version conflicts

## Package Resolution Approach

### Resolution Strategy

The project uses a centralized resolution strategy to handle dependency conflicts:

```json
// Example from root package.json
{
  "resolutions": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@types/react": "18.2.0",
    "minimatch": "5.1.6",
    "semver": "7.5.4",
    "ws": "8.16.0"
  }
}
```

### Hoisting

1. **Yarn Workspaces**: Automatically hoists common dependencies to the root
2. **Selective Hoisting**: Some packages are kept at their respective package level when version conflicts cannot be resolved

### Duplicate Prevention

1. **Dependency Deduplication**: Regular audits to identify and remove duplicate dependencies
2. **Bundle Analysis**: Webpack Bundle Analyzer to identify duplicate packages in bundles

## Resolving Version Conflicts

### Common Conflict Patterns

1. **React Ecosystem**: React, React DOM, and @types/react must be aligned
2. **Transitive Dependencies**: Conflicts in dependencies of dependencies
3. **Native Dependencies**: React Native specific version requirements

### Resolution Workflow

1. **Identify**: Use `yarn why <package>` to identify all instances of a package
2. **Analyze**: Determine which version is required by each dependent package
3. **Resolve**: Add to resolutions field in root package.json
4. **Verify**: Run `yarn install` and check for warnings
5. **Test**: Ensure all affected components still function correctly

### Example Resolution

```bash
# Identify all instances of a package
yarn why minimatch

# Add resolution to root package.json
"resolutions": {
  "minimatch": "5.1.6"
}

# Reinstall dependencies
yarn install

# Verify no dependency warnings
yarn check
```

## Journey-Specific Dependency Requirements

### Health Journey

**Specific Dependencies:**
- Victory/Recharts for health data visualization
- Integration with wearable device SDKs
- FHIR client libraries for healthcare data

**Version Requirements:**
- React Native SVG: 13.10.0 (required for health charts)
- React Native Reanimated: 3.3.0 (required for health animations)

### Care Journey

**Specific Dependencies:**
- Video conferencing libraries for telemedicine
- Calendar integration for appointments
- Medication reminder utilities

**Version Requirements:**
- React Native WebRTC: 111.0.6 (required for telemedicine)
- React Native Calendars: 1.1300.0 (required for appointment scheduling)

### Plan Journey

**Specific Dependencies:**
- PDF generation and viewing
- Payment processing integration
- Document upload and management

**Version Requirements:**
- React Native PDF: 6.7.4 (required for insurance documents)
- React Native Document Picker: 9.1.0 (required for claim uploads)

## Troubleshooting Common Dependency Conflicts

### React Native Dependency Issues

#### Problem: Incompatible React Native Versions

```
Error: The package at "node_modules/react-native-gesture-handler" depends on "react-native@0.71.0" but 0.73.4 is installed
```

**Solution:**

1. Check compatibility matrix at [React Native Directory](https://reactnative.directory/)
2. Use patch-package to apply temporary fixes:

```bash
yarn add patch-package postinstall-postinstall --dev

# Create patches directory
mkdir -p patches

# After manually fixing the file in node_modules
yarn patch-package react-native-gesture-handler
```

3. Add to package.json:

```json
"scripts": {
  "postinstall": "patch-package"
}
```

#### Problem: Native Module Linking Errors

```
Error: Unable to resolve module `@react-native-community/cli-platform-ios`
```

**Solution:**

1. Ensure correct installation of pods (iOS) or proper linking (Android)
2. For iOS:

```bash
cd ios && pod install && cd ..
```

3. For Android, check `android/settings.gradle` and `android/app/build.gradle`

### Web Dependencies

#### Problem: Multiple React Versions

```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Solution:**

1. Add React resolution to root package.json
2. Force single React instance:

```json
"resolutions": {
  "react": "18.2.0",
  "react-dom": "18.2.0"
}
```

#### Problem: CSS-in-JS Conflicts

```
Error: Cannot find module 'styled-components/macro'
```

**Solution:**

1. Standardize on styled-components version 6.1.8
2. Update imports to use correct path
3. Add babel plugin if needed:

```json
// .babelrc
{
  "plugins": ["babel-plugin-styled-components"]
}
```

### Backend Dependencies

#### Problem: NestJS Version Conflicts

```
Error: Unknown decorator @Controller()
```

**Solution:**

1. Ensure consistent NestJS core packages:

```bash
yarn add @nestjs/common@10.3.0 @nestjs/core@10.3.0 @nestjs/platform-express@10.3.0
```

2. Check for mismatched peer dependencies

#### Problem: Prisma Client Generation Failures

```
Error: Error occurred during query engine generation
```

**Solution:**

1. Clear Prisma cache:

```bash
rm -rf node_modules/.prisma
```

2. Regenerate Prisma client:

```bash
yarn prisma generate
```

3. Ensure consistent Prisma packages:

```bash
yarn add prisma@5.10.2 @prisma/client@5.10.2
```

## Scaling Solution for Refactored Architecture

The dependency management approach supports scaling in the following ways:

### Horizontal Scaling

- **Microservices Independence**: Each service has clearly defined dependencies
- **Containerization**: Docker containers with explicit dependency versions
- **Kubernetes Deployment**: Scalable deployment with proper resource allocation

### Development Scaling

- **Team Isolation**: Journey teams can work independently with consistent dependencies
- **Parallel Development**: Shared packages with stable interfaces enable parallel work
- **Consistent Environments**: Dependency lockfiles ensure consistent development environments

### Performance Scaling

- **Optimized Bundles**: Proper dependency management reduces bundle sizes
- **Caching Strategy**: Consistent versions enable better caching
- **Selective Loading**: Journey-specific dependencies loaded only when needed

### Configuration

To run the application in development mode with optimized dependencies:

```bash
./scripts/start-services.sh development
```

To run the application in production mode with scaling:

```bash
./scripts/start-services.sh production --scale-factor=3
```

## References

This document is based on the following sections of the Technical Specification:

- Section 0.2.4: Dependency Decisions
- Section 3.1: Programming Languages
- Section 3.2: Frameworks & Libraries
- Section 3.3: Open Source Dependencies
- Section 3.6: Development & Deployment
- Section 3.7: Technology Stack Architecture

For additional context on the overall architecture and journey-specific requirements, refer to:

- Section 0.1: Technical Scope
- Section 5.1: High-Level Architecture
- Section 7.1: Design System Architecture

## Changelog

### 2023-06-15
- Initial documentation of dependency fixes

### 2023-09-22
- Added scaling solution documentation

### 2024-03-10
- Updated with standardized dependency version guidelines
- Added documentation for new workspace package dependencies
- Enhanced troubleshooting section for common dependency conflicts
- Added sections for each journey's specific dependency requirements
- Updated scaling solution documentation for the refactored architecture
- Added references to the technical specification for context