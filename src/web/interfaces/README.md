# @austa/interfaces

## Overview

The `@austa/interfaces` package is a central repository for all shared TypeScript interfaces, types, and schemas used across the AUSTA SuperApp. It serves as the single source of truth for type definitions, ensuring consistency between frontend and backend, web and mobile platforms, and across all user journeys.

This package is a critical foundation of the AUSTA SuperApp architecture, providing:

- **Type Safety**: Ensures consistent data structures across the entire application
- **Cross-Platform Compatibility**: Shared types between web (Next.js) and mobile (React Native)
- **Journey-Specific Interfaces**: Specialized types for each user journey (Health, Care, Plan)
- **Design System Integration**: Type definitions for themes, components, and style props
- **API Contract Enforcement**: Consistent interfaces for requests and responses

## Directory Structure

The `@austa/interfaces` package is organized into domain-specific directories:

```
src/web/interfaces/
├── auth/               # Authentication-related interfaces
├── care/               # Care journey interfaces
├── common/             # Shared utility interfaces
├── components/         # UI component interfaces
├── gamification/       # Gamification system interfaces
├── health/             # Health journey interfaces
├── plan/               # Plan journey interfaces
├── themes/             # Design system theme interfaces
├── index.ts            # Main barrel file
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This documentation
```

Each domain directory contains:

- Specialized interface files for that domain
- An `index.ts` barrel file that re-exports all interfaces from that domain

## Usage Patterns

### Basic Import Pattern

The package supports multiple import patterns to suit different use cases:

```typescript
// Import everything from a specific domain
import * as HealthInterfaces from '@austa/interfaces/health';

// Import specific interfaces from a domain
import { HealthMetric, HealthGoal } from '@austa/interfaces/health';

// Import from the root for cross-domain interfaces
import { AuthSession, HealthMetric, PlanCoverage } from '@austa/interfaces';
```

### Journey-Specific Imports

For journey-specific components, import the relevant interfaces directly from their domain:

```typescript
// Health Journey
import { HealthMetric, HealthMetricType, HealthGoal } from '@austa/interfaces/health';

// Care Journey
import { Appointment, Provider, TelemedicineSession } from '@austa/interfaces/care';

// Plan Journey
import { Plan, Coverage, Claim, ClaimStatus } from '@austa/interfaces/plan';
```

### Cross-Cutting Concerns

For cross-cutting concerns, import from their specialized domains:

```typescript
// Authentication
import { AuthSession, UserProfile } from '@austa/interfaces/auth';

// Gamification
import { Achievement, Quest, Reward } from '@austa/interfaces/gamification';

// Common Utilities
import { ApiResponse, PaginatedResponse } from '@austa/interfaces/common';
```

### Design System Integration

For UI components and theming, use the specialized theme and component interfaces:

```typescript
// Theme interfaces
import { Theme, HealthTheme, CareTheme, PlanTheme } from '@austa/interfaces/themes';

// Component interfaces
import { ButtonProps, CardProps } from '@austa/interfaces/components/core';
import { HealthChartProps } from '@austa/interfaces/components/health';
```

## Examples

### Health Journey Example

```typescript
import { HealthMetric, HealthMetricType } from '@austa/interfaces/health';
import { HealthChartProps } from '@austa/interfaces/components/health';

// Using the interfaces to create a typed component
const BloodPressureChart: React.FC<HealthChartProps> = (props) => {
  // Type-safe access to health metrics
  const bloodPressureData: HealthMetric[] = props.data.filter(
    metric => metric.type === HealthMetricType.BLOOD_PRESSURE
  );
  
  // Component implementation...
};
```

### Care Journey Example

```typescript
import { Appointment, AppointmentStatus } from '@austa/interfaces/care';
import { AppointmentCardProps } from '@austa/interfaces/components/care';

// Using the interfaces to create a typed component
const UpcomingAppointments: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
  // Type-safe filtering of appointments
  const upcoming = appointments.filter(
    apt => apt.status === AppointmentStatus.SCHEDULED
  );
  
  return (
    <div>
      {upcoming.map(appointment => (
        <AppointmentCard 
          key={appointment.id}
          appointment={appointment}
          onReschedule={(id) => console.log(`Reschedule appointment ${id}`)}
        />
      ))}
    </div>
  );
};
```

### Plan Journey Example

```typescript
import { Claim, ClaimStatus } from '@austa/interfaces/plan';
import { ClaimCardProps } from '@austa/interfaces/components/plan';

// Using the interfaces to create a typed component
const ClaimsList: React.FC<{ claims: Claim[] }> = ({ claims }) => {
  // Type-safe grouping of claims by status
  const pendingClaims = claims.filter(claim => claim.status === ClaimStatus.PENDING);
  const approvedClaims = claims.filter(claim => claim.status === ClaimStatus.APPROVED);
  
  // Component implementation...
};
```

### Authentication Example

```typescript
import { AuthSession, UserProfile } from '@austa/interfaces/auth';

// Type-safe authentication hook
function useAuth(): { 
  session: AuthSession | null; 
  user: UserProfile | null; 
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
} {
  // Hook implementation...
}
```

### Gamification Example

```typescript
import { Achievement, Quest } from '@austa/interfaces/gamification';
import { AchievementBadgeProps } from '@austa/interfaces/components/gamification';

// Using the interfaces to create a typed component
const UserAchievements: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
  // Type-safe rendering of achievements
  return (
    <div>
      {achievements.map(achievement => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size="medium"
          showProgress
        />
      ))}
    </div>
  );
};
```

## Guidelines for Extending Interfaces

### Adding New Properties

When extending existing interfaces, follow these guidelines:

1. **Backward Compatibility**: Ensure new properties are optional or have default values
2. **Documentation**: Add JSDoc comments explaining the purpose and usage of new properties
3. **Validation**: If using Zod schemas, update the corresponding validation schema
4. **Cross-Platform**: Ensure properties work across both web and mobile platforms

Example:

```typescript
/**
 * Represents a health goal set by a user
 */
export interface HealthGoal {
  id: string;
  userId: string;
  type: HealthGoalType;
  target: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  
  // New property with documentation
  /**
   * Indicates whether this goal contributes to gamification achievements
   * @default true
   */
  gamificationEnabled?: boolean;
}
```

### Creating New Interfaces

When creating new interfaces:

1. **Placement**: Add to the appropriate domain directory
2. **Naming**: Follow the established naming conventions
3. **Exports**: Update the domain's barrel file to export the new interface
4. **Documentation**: Include comprehensive JSDoc comments
5. **Validation**: Create corresponding Zod schemas when applicable

Example:

```typescript
// health/workout.ts
import { z } from 'zod';
import { HealthMetricType } from './types';

/**
 * Represents a user's workout session
 */
export interface Workout {
  id: string;
  userId: string;
  type: WorkoutType;
  duration: number; // in minutes
  caloriesBurned: number;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  metrics: HealthMetric[];
}

/**
 * Types of workouts supported by the application
 */
export enum WorkoutType {
  RUNNING = 'running',
  WALKING = 'walking',
  CYCLING = 'cycling',
  SWIMMING = 'swimming',
  STRENGTH = 'strength',
  YOGA = 'yoga',
  OTHER = 'other'
}

/**
 * Zod schema for validating Workout objects
 */
export const WorkoutSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(WorkoutType),
  duration: z.number().positive(),
  caloriesBurned: z.number().nonnegative(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  metrics: z.array(z.lazy(() => import('./metric').HealthMetricSchema))
});

// Then update health/index.ts to export these new types
```

## Avoiding Circular Dependencies

Circular dependencies can cause build errors and runtime issues. Follow these practices to avoid them:

1. **Interface Segregation**: Split large interfaces into smaller, focused ones
2. **Unidirectional Dependencies**: Establish a clear hierarchy of imports
3. **Type-Only Imports**: Use TypeScript's `import type` for type references
4. **Interface References**: Use string literals for self-referential types

Example of avoiding circular dependencies:

```typescript
// Instead of direct imports that might create cycles
// import { User } from '../auth/user.types';

// Use type-only imports
import type { User } from '../auth/user.types';

// Or use interface references with string literals
export interface Comment {
  id: string;
  text: string;
  author: string; // Just store the ID
  authorRef?: User; // Optional reference to the full object
}
```

## Platform-Specific Considerations

### Web (Next.js) Imports

For web applications, you can use path aliases configured in tsconfig.json:

```typescript
// Using path aliases
import { HealthMetric } from '@austa/interfaces/health';
import { Theme } from '@austa/interfaces/themes';
```

### Mobile (React Native) Imports

For mobile applications, ensure Metro bundler is configured to resolve the interfaces package:

```typescript
// In metro.config.js, ensure proper resolution of the interfaces package
module.exports = {
  resolver: {
    extraNodeModules: {
      '@austa/interfaces': path.resolve(__dirname, '../interfaces'),
    },
  },
  // ...
};

// Then import normally in your React Native components
import { HealthMetric } from '@austa/interfaces/health';
```

## Contributing

When contributing to the `@austa/interfaces` package:

1. **Consistency**: Follow existing patterns and naming conventions
2. **Documentation**: Add comprehensive JSDoc comments to all interfaces
3. **Testing**: Ensure your changes don't break existing type compatibility
4. **Validation**: Update or create Zod schemas for runtime validation
5. **Cross-Platform**: Test your changes on both web and mobile platforms

## Related Packages

The `@austa/interfaces` package works closely with these related packages:

- **@austa/design-system**: Consumes these interfaces for component props
- **@design-system/primitives**: Provides the foundation for UI component interfaces
- **@austa/journey-context**: Uses these interfaces for state management types