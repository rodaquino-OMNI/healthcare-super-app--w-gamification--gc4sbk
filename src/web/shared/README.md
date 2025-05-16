# AUSTA SuperApp Shared Code

## Overview

The `src/web/shared` directory is a central repository for code, constants, utilities, configurations, and GraphQL operations that are shared between the web (Next.js) and mobile (React Native) frontends of the AUSTA SuperApp. This approach promotes code reuse, reduces redundancy, and ensures a consistent experience across different platforms.

## Integration with Package Structure

The shared code works in conjunction with the following packages in the monorepo:

- **@austa/interfaces**: Contains all shared TypeScript definitions and type contracts previously located in the local `types` directory. All type imports should now reference this package.

- **@design-system/primitives**: Provides design tokens and primitive UI components that form the foundation of the design system.

- **@austa/design-system**: The main UI component library that exports all components, themes, and utilities for application consumption.

- **@austa/journey-context**: Provides context providers and hooks for journey-specific state management across components.

## Directory Structure

The `src/web/shared` directory is organized as follows:

- `constants`: JavaScript constants used across both web and mobile applications.

- `utils`: Utility functions for data formatting, validation, and other common tasks.

- `graphql`: GraphQL queries, mutations, and fragments used to interact with the backend API.

- `config`: Configuration settings for the shared code, such as API endpoints and internationalization settings.

- `api`: Shared API client configurations and request utilities.

## Key Components

The following are key components within the `src/web/shared` directory:

- `constants/index.ts`: Exports constants related to API endpoints, journeys, and routes.

- `utils/index.ts`: Exports utility functions for formatting data, handling dates, and validating user input.

- `graphql/index.ts`: Exports GraphQL queries, mutations, and fragments for fetching and manipulating data.

- `config/index.ts`: Exports configuration settings for the shared code, such as API endpoints and internationalization settings.

- `api/index.ts`: Exports API client configurations and request utilities.

## Usage

### Importing Shared Code

To use the shared code in a web or mobile component, import the desired module or function from the appropriate file within the `src/web/shared` directory using path aliases:

```typescript
// Import utilities from shared directory
import { formatCurrency } from '@app/shared/utils';
import { API_BASE_URL } from '@app/shared/constants';

// Import types from @austa/interfaces package
import { HealthMetric } from '@austa/interfaces/health';
import { UserProfile } from '@austa/interfaces/common';

// Import UI components from design system
import { Button } from '@austa/design-system/components';
import { Box, Text } from '@design-system/primitives';

// Import journey context
import { useHealthContext } from '@austa/journey-context/health';
```

### Path Aliases

The monorepo is configured with the following path aliases to simplify imports:

- `@app/shared/*`: Points to `src/web/shared/*`
- `@austa/interfaces/*`: Points to the interfaces package
- `@austa/design-system/*`: Points to the design system package
- `@design-system/primitives/*`: Points to the primitives package
- `@austa/journey-context/*`: Points to the journey context package

Always use these path aliases instead of relative imports to ensure consistency across the codebase.

### Working with Types

All shared TypeScript interfaces and types have been moved from the local `types` directory to the `@austa/interfaces` package. When working with shared code, import types from this package instead of the local directory:

```typescript
// CORRECT: Import from @austa/interfaces
import { HealthMetric } from '@austa/interfaces/health';

// INCORRECT: Do not import from local types directory
// import { HealthMetric } from 'src/web/shared/types';
```

## Benefits

The `src/web/shared` directory provides several benefits:

- **Code Reuse**: Reduces code duplication by sharing common code between the web and mobile frontends.

- **Consistency**: Ensures a consistent user experience across platforms by using the same utilities, constants, and configurations.

- **Maintainability**: Simplifies maintenance by centralizing code in a single location.

- **Testability**: Improves testability by providing a clear separation of concerns.

- **Type Safety**: Leverages the `@austa/interfaces` package to ensure type consistency across the application.

## Best Practices

1. **Keep Shared Code Platform-Agnostic**: Ensure that code in the shared directory works on both web and mobile platforms.

2. **Use Type Definitions from @austa/interfaces**: Always import types from the `@austa/interfaces` package instead of defining them locally.

3. **Follow Path Alias Conventions**: Use the established path aliases for imports to maintain consistency.

4. **Maintain Clear Module Boundaries**: Export only what is necessary from each module to avoid circular dependencies.

5. **Document Public APIs**: Add JSDoc comments to exported functions and constants to improve developer experience.

6. **Write Platform-Specific Code Carefully**: If platform-specific code is necessary, use conditional exports or platform detection utilities.