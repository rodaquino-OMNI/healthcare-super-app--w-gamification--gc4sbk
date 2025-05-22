# @austa/interfaces

A centralized repository of TypeScript interfaces and type definitions for the AUSTA SuperApp ecosystem, ensuring type safety and consistency across both frontend and backend services.

## Overview

The `@austa/interfaces` package serves as the single source of truth for data models and type definitions across the AUSTA SuperApp. By centralizing interfaces, it ensures consistency between frontend and backend implementations, reduces duplication, and provides a robust foundation for type-safe development across all three user journeys ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").

## Key Features

### Cross-Journey Interfaces

Provides standardized interfaces for data shared across multiple journeys:

- User profiles and authentication data
- Shared configuration types
- Common data structures and enums
- Event payload definitions

### Journey-Specific Interfaces

Organized by domain to support the unique requirements of each journey:

- **Health Journey**: Health metrics, goals, device connections, and medical events
- **Care Journey**: Appointments, providers, medications, and telemedicine sessions
- **Plan Journey**: Insurance plans, benefits, coverage details, and claims

### Design System Types

Provides type definitions that support the design system:

- Theme interfaces and contracts
- Component prop types
- Style property interfaces
- Design token type definitions

### API Contract Types

Defines the shape of data exchanged between services:

- Request and response DTOs
- GraphQL input and output types
- API parameter types
- Validation schemas

## Package Structure

```
@austa/interfaces/
├── common/           # Shared interfaces used across all journeys
│   ├── dto/          # Data transfer objects for common entities
│   └── ...           # Other common interfaces
├── auth/             # Authentication and authorization interfaces
├── journey/          # Journey-specific interfaces
│   ├── health/       # Health journey interfaces
│   ├── care/         # Care journey interfaces
│   └── plan/         # Plan journey interfaces
├── gamification/     # Gamification system interfaces
├── index.ts          # Main entry point with exports
└── README.md         # This documentation file
```

## Installation

```bash
# npm
npm install @austa/interfaces

# yarn
yarn add @austa/interfaces

# pnpm
pnpm add @austa/interfaces
```

## Usage

### Importing Interfaces

Import interfaces using the path alias pattern for better organization and clarity:

```typescript
// Using path aliases (recommended)
import { UserProfile } from '@austa/interfaces/common';
import { HealthMetric } from '@austa/interfaces/journey/health';
import { Appointment } from '@austa/interfaces/journey/care';
import { InsuranceClaim } from '@austa/interfaces/journey/plan';
import { Achievement } from '@austa/interfaces/gamification';

// Alternatively, import from the main entry point
import { UserProfile, HealthMetric, Appointment } from '@austa/interfaces';
```

### Using Interfaces in Services

```typescript
import { Injectable } from '@nestjs/common';
import { HealthMetric, HealthGoal } from '@austa/interfaces/journey/health';

@Injectable()
export class HealthMetricsService {
  async recordMetric(userId: string, metric: HealthMetric): Promise<void> {
    // Implementation
  }

  async createGoal(userId: string, goal: HealthGoal): Promise<HealthGoal> {
    // Implementation
    return createdGoal;
  }
}
```

### Using Interfaces with GraphQL

```typescript
import { Field, ObjectType } from '@nestjs/graphql';
import { HealthMetricType } from '@austa/interfaces/journey/health';

@ObjectType()
export class HealthMetricDTO implements HealthMetricType {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  type: string;

  @Field()
  value: number;

  @Field()
  unit: string;

  @Field()
  timestamp: Date;
}
```

### Using Interfaces with React Components

```typescript
import React from 'react';
import { HealthMetric } from '@austa/interfaces/journey/health';

interface MetricCardProps {
  metric: HealthMetric;
  onUpdate?: (updatedMetric: HealthMetric) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onUpdate }) => {
  // Component implementation
  return (
    <div>
      <h3>{metric.type}</h3>
      <p>{metric.value} {metric.unit}</p>
      {/* Additional rendering */}
    </div>
  );
};
```

## Guidelines for Maintaining Interfaces

### Adding New Interfaces

1. Place interfaces in the appropriate domain directory
2. Follow naming conventions (PascalCase for interfaces, camelCase for properties)
3. Include JSDoc comments for all interfaces and properties
4. Export new interfaces from the relevant barrel file (index.ts)
5. Avoid circular dependencies between interface files

### Updating Existing Interfaces

1. Consider backward compatibility when modifying interfaces
2. Use optional properties for new fields when possible
3. Document breaking changes clearly in commit messages
4. Update all implementations when making breaking changes
5. Consider versioning for major interface changes

### Best Practices

1. Keep interfaces focused and cohesive
2. Use composition over inheritance for interface reuse
3. Leverage TypeScript utility types for variations (Partial, Pick, Omit)
4. Include validation constraints as comments or decorators
5. Maintain consistency with database schemas and API contracts

## Troubleshooting

### Common Import Issues

**Problem**: Path aliases not resolving correctly

**Solution**: Ensure your `tsconfig.json` includes the proper path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@austa/interfaces": ["./src/backend/packages/interfaces"],
      "@austa/interfaces/*": ["./src/backend/packages/interfaces/*"]
    }
  }
}
```

**Problem**: Type errors with imported interfaces

**Solution**: Check for version mismatches between packages or missing properties in your implementation.

### Type Resolution Issues

**Problem**: "Cannot find module" or "Cannot find type definition" errors

**Solution**: 
1. Verify the import path is correct
2. Check that TypeScript is properly configured
3. Rebuild the interfaces package with `yarn build` or equivalent
4. Clear TypeScript cache with `yarn tsc --build --clean`

## Technologies

- TypeScript 5.3.3
- Node.js ≥18.0.0

## Contributing

When extending the interfaces package:

1. Follow the established directory structure
2. Maintain backward compatibility when possible
3. Include comprehensive JSDoc comments
4. Add appropriate index exports
5. Consider cross-journey implications of changes