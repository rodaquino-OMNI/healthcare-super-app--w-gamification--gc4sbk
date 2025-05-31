# @austa/interfaces

Shared TypeScript interfaces for the AUSTA SuperApp.

## Overview

This package centralizes TypeScript interface definitions across the AUSTA SuperApp. It provides shared types for both web and mobile applications to ensure type consistency across platforms.

## Installation

```bash
npm install @austa/interfaces
```

Or if you're using yarn:

```bash
yarn add @austa/interfaces
```

## Usage

```typescript
import { UserProfile, ApiResponse } from '@austa/interfaces';

// Use the imported interfaces
const fetchUserProfile = async (userId: string): Promise<ApiResponse<UserProfile>> => {
  // Implementation
};
```

## Features

- Shared TypeScript interfaces for data models
- Type definitions for API responses and requests
- Component prop interfaces for the design system
- Theme interfaces for consistent styling
- Journey-specific interfaces for health, care, and plan journeys

## Structure

The package is organized into the following modules:

- `common`: Base interfaces used across the application
- `auth`: Authentication and authorization interfaces
- `components`: Component prop interfaces for the design system
- `themes`: Theme interfaces for styling
- `gamification`: Interfaces for the gamification system
- `health`: Health journey specific interfaces
- `care`: Care journey specific interfaces
- `plan`: Plan journey specific interfaces
- `notification`: Notification system interfaces
- `api`: API request and response interfaces

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

Private - AUSTA Health Tech