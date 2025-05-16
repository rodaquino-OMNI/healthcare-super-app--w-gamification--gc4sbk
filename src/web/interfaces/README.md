# @austa/interfaces

## Overview

The `@austa/interfaces` package centralizes all TypeScript interfaces and type definitions used across the AUSTA SuperApp. It serves as the single source of truth for data structures, component props, API contracts, and other type definitions, ensuring consistency between frontend and backend implementations while maintaining type safety across all platforms.

This package is a critical part of the AUSTA SuperApp architecture, enabling:

- **Type Safety**: Ensures consistent data structures across all services and platforms
- **Cross-Platform Compatibility**: Provides shared types for both web (Next.js) and mobile (React Native) frontends
- **Journey-Centered Architecture**: Organizes interfaces according to the three main user journeys (Health, Care, Plan)
- **Developer Experience**: Improves code completion, documentation, and error detection

## Package Structure

The package is organized into domain-specific modules that reflect the journey-centered architecture of the AUSTA SuperApp:

```
@austa/interfaces/
├── api/                  # API request/response interfaces
├── auth/                 # Authentication and authorization types
├── care/                 # Care journey domain models
├── common/               # Shared utility types and common models
├── components/           # UI component prop interfaces
├── gamification/         # Gamification system interfaces
├── health/               # Health journey domain models
├── next/                 # Next.js specific type extensions
├── notification/         # Notification system interfaces
├── plan/                 # Plan journey domain models
├── themes/               # Design system and theming interfaces
├── index.ts              # Main barrel export file
├── package.json          # Package configuration
└── tsconfig.json         # TypeScript configuration
```

Each domain directory contains its own barrel file (`index.ts`) that re-exports all interfaces from that domain, allowing for granular imports while maintaining a clean import structure.

## Usage Patterns

### Basic Import Patterns

You can import interfaces in several ways depending on your needs:

#### 1. Import from the main package (includes all interfaces)

```typescript
import { HealthMetric, Appointment, Plan } from '@austa/interfaces';
```

#### 2. Import from a specific domain (recommended for better tree-shaking)

```typescript
import { HealthMetric } from '@austa/interfaces/health';
import { Appointment } from '@austa/interfaces/care';
import { Plan } from '@austa/interfaces/plan';
```

#### 3. Import from a specific file (for very targeted imports)

```typescript
import { HealthMetric } from '@austa/interfaces/health/metric';
import { Appointment } from '@austa/interfaces/care/appointment';
import { Plan } from '@austa/interfaces/plan/plans.types';
```

### Platform-Specific Usage

#### Web (Next.js)

In web applications, you can leverage path aliases configured in `tsconfig.json`:

```typescript
// Using path aliases
import { HealthMetric } from '@austa/interfaces/health';

// Component with typed props
const MetricCard: React.FC<MetricCardProps> = (props) => {
  // Implementation
};
```

#### Mobile (React Native)

In mobile applications, imports work the same way:

```typescript
// Using direct imports
import { HealthMetric } from '@austa/interfaces/health';
import { MetricCardProps } from '@austa/interfaces/components/health.types';

// Component with typed props
const MetricCard: React.FC<MetricCardProps> = (props) => {
  // Implementation
};
```

### Working with API Types

The package includes comprehensive API interface definitions for type-safe API calls:

```typescript
import { api } from '@austa/interfaces';

// Type-safe API request
const fetchHealthMetrics = async (userId: string): Promise<api.health.GetHealthMetricsResponse> => {
  const response = await fetch('/api/health/metrics', {
    method: 'POST',
    body: JSON.stringify({ userId } as api.health.GetHealthMetricsRequest),
  });
  
  return response.json();
};
```

### Using Validation Schemas

Many interfaces include Zod validation schemas for runtime type checking:

```typescript
import { HealthMetric, healthMetricSchema } from '@austa/interfaces/health';

// Validate data at runtime
function processHealthData(data: unknown): HealthMetric {
  // Will throw if validation fails
  return healthMetricSchema.parse(data);
}
```

## Journey-Specific Examples

### Health Journey

```typescript
import { HealthMetric, HealthGoal, DeviceConnection } from '@austa/interfaces/health';
import { DeviceCardProps } from '@austa/interfaces/components/health.types';

// Working with health metrics
const bloodPressure: HealthMetric = {
  id: '123',
  type: 'BLOOD_PRESSURE',
  value: '120/80',
  unit: 'mmHg',
  timestamp: new Date().toISOString(),
  userId: 'user-123',
  source: 'MANUAL_ENTRY'
};

// Working with health goals
const stepsGoal: HealthGoal = {
  id: '456',
  type: 'STEPS',
  target: 10000,
  current: 7500,
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  status: 'IN_PROGRESS',
  userId: 'user-123'
};

// Using component props
const DeviceCard: React.FC<DeviceCardProps> = ({ device, onSync }) => {
  // Component implementation
};
```

### Care Journey

```typescript
import { Appointment, Provider, TelemedicineSession } from '@austa/interfaces/care';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/care/types';

// Working with appointments
const doctorAppointment: Appointment = {
  id: '789',
  type: AppointmentType.IN_PERSON,
  status: AppointmentStatus.SCHEDULED,
  date: '2023-02-15T14:30:00Z',
  duration: 30,
  providerId: 'provider-456',
  userId: 'user-123',
  notes: 'Annual checkup',
  location: {
    address: '123 Medical Center Dr',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000'
  }
};

// Working with telemedicine sessions
const virtualConsultation: TelemedicineSession = {
  id: '101112',
  appointmentId: '789',
  status: 'SCHEDULED',
  connectionDetails: {
    url: 'https://meet.austa.health/session/101112',
    passcode: '123456'
  },
  participants: [
    { id: 'user-123', role: 'PATIENT' },
    { id: 'provider-456', role: 'DOCTOR' }
  ],
  scheduledStartTime: '2023-02-15T14:30:00Z',
  scheduledEndTime: '2023-02-15T15:00:00Z'
};
```

### Plan Journey

```typescript
import { Plan, Claim, Coverage, Benefit } from '@austa/interfaces/plan';
import { ClaimStatus, ClaimType } from '@austa/interfaces/plan/claims.types';

// Working with insurance plans
const healthPlan: Plan = {
  id: 'plan-123',
  name: 'Premium Health',
  type: 'HEALTH',
  policyNumber: 'POL-123456789',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  status: 'ACTIVE',
  coverages: [
    {
      id: 'coverage-1',
      type: 'MEDICAL_CONSULTATION',
      description: 'Doctor visits',
      coveragePercentage: 80,
      annualLimit: 5000,
      usedAmount: 1200
    }
  ],
  benefits: [
    {
      id: 'benefit-1',
      name: 'Gym Membership',
      description: '50% discount on partner gyms',
      type: 'WELLNESS',
      details: 'Valid at participating locations only'
    }
  ]
};

// Working with claims
const medicalClaim: Claim = {
  id: 'claim-456',
  planId: 'plan-123',
  type: ClaimType.MEDICAL,
  status: ClaimStatus.SUBMITTED,
  amount: 350.00,
  serviceDate: '2023-02-10',
  submissionDate: '2023-02-12',
  description: 'Specialist consultation',
  documents: [
    {
      id: 'doc-1',
      name: 'Receipt.pdf',
      path: '/uploads/claim-456/receipt.pdf',
      type: 'RECEIPT',
      uploadedAt: '2023-02-12T10:30:00Z'
    }
  ]
};
```

### Authentication

```typescript
import { AuthSession, AuthState, User } from '@austa/interfaces/auth';

// Working with authentication state
const authState: AuthState = {
  isAuthenticated: true,
  isLoading: false,
  session: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    tokenType: 'Bearer'
  },
  user: {
    id: 'user-123',
    email: 'user@example.com',
    name: 'John Doe',
    roles: ['USER'],
    preferences: {
      language: 'pt-BR',
      theme: 'light'
    }
  }
};
```

### Gamification

```typescript
import { Achievement, Quest, Reward, GameProfile } from '@austa/interfaces/gamification';

// Working with achievements
const achievement: Achievement = {
  id: 'achievement-123',
  title: 'Health Enthusiast',
  description: 'Record health metrics for 7 consecutive days',
  category: 'HEALTH',
  xpValue: 100,
  iconUrl: '/icons/achievements/health-enthusiast.svg',
  unlockedAt: '2023-02-15T10:30:00Z',
  progress: {
    current: 7,
    target: 7,
    isCompleted: true
  }
};

// Working with game profiles
const userProfile: GameProfile = {
  userId: 'user-123',
  level: 5,
  totalXp: 1250,
  currentLevelXp: 250,
  nextLevelXp: 500,
  achievements: ['achievement-123', 'achievement-456'],
  completedQuests: ['quest-789'],
  activeQuests: ['quest-101112'],
  streaks: {
    current: 7,
    longest: 15,
    lastActivity: '2023-02-15T10:30:00Z'
  }
};
```

## Guidelines for Extending and Maintaining Interfaces

### Adding New Interfaces

When adding new interfaces, follow these guidelines:

1. **Place in the correct domain**: Add interfaces to the appropriate domain directory based on their purpose
2. **Export from barrel files**: Ensure new interfaces are exported from the domain's `index.ts` file
3. **Add JSDoc comments**: Document the purpose and usage of each interface
4. **Include validation schemas**: For data models, include Zod validation schemas when applicable

Example of adding a new interface:

```typescript
// src/web/interfaces/health/insight.ts

/**
 * Represents a health insight generated from user health metrics
 */
export interface HealthInsight {
  id: string;
  userId: string;
  title: string;
  description: string;
  relatedMetrics: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  acknowledgedAt?: string;
}

// Add Zod validation schema
import { z } from 'zod';

export const healthInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  relatedMetrics: z.array(z.string()),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  createdAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional()
});

// Then update the barrel file (health/index.ts)
export * from './insight';
```

### Preventing Circular Dependencies

Circular dependencies can cause build issues and runtime errors. Follow these practices to avoid them:

1. **Use interface segregation**: Split large interfaces into smaller, focused ones
2. **Create utility types**: Extract shared properties into utility types
3. **Use type imports**: Use `import type` to avoid runtime dependencies
4. **Organize related types together**: Keep related types in the same file when they reference each other

Example of resolving circular dependencies:

```typescript
// Before (problematic circular dependency)
// file1.ts
import { TypeB } from './file2';
export interface TypeA {
  b: TypeB;
}

// file2.ts
import { TypeA } from './file1';
export interface TypeB {
  a: TypeA;
}

// After (resolved)
// types.ts
export interface TypeA {
  b: TypeB;
}

export interface TypeB {
  a: TypeA;
}

// Or using type imports
// file1.ts
import type { TypeB } from './file2';
export interface TypeA {
  b: TypeB;
}

// file2.ts
import type { TypeA } from './file1';
export interface TypeB {
  a: TypeA;
}
```

### Versioning and Backward Compatibility

When updating existing interfaces, maintain backward compatibility:

1. **Add optional properties**: Make new fields optional to avoid breaking existing code
2. **Use union types**: Extend enums with union types instead of changing existing values
3. **Create new interfaces**: For major changes, create new interfaces with version suffixes
4. **Deprecate carefully**: Mark deprecated fields with JSDoc `@deprecated` tags

Example of maintaining backward compatibility:

```typescript
// Before
export interface User {
  id: string;
  name: string;
  email: string;
}

// After (backward compatible)
export interface User {
  id: string;
  name: string;
  email: string;
  /** @deprecated Use `phoneNumbers` instead */
  phone?: string;
  phoneNumbers?: string[];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}
```

## Contributing

When contributing to the `@austa/interfaces` package, please follow these guidelines:

1. **Follow naming conventions**: Use PascalCase for interfaces and type aliases
2. **Be consistent**: Follow existing patterns for similar interfaces
3. **Add tests**: Include Jest tests for validation schemas
4. **Update documentation**: Add JSDoc comments and update this README if necessary
5. **Review dependencies**: Minimize dependencies to prevent bloat

## Build and Development

To build the package locally:

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

## License

This package is part of the AUSTA SuperApp and is subject to the same license terms as the main project.