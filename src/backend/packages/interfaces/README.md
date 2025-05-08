# @austa/interfaces

A centralized repository of TypeScript interfaces for shared data models across the AUSTA SuperApp ecosystem, ensuring type safety and consistency between frontend and backend services.

## Overview

The `@austa/interfaces` package serves as the single source of truth for TypeScript interfaces used throughout the AUSTA SuperApp. By centralizing interface definitions, it ensures consistent data structures across all services, prevents type inconsistencies, and improves the development experience through better tooling and standardized module resolution.

This package is a critical component of the journey-centered architecture, providing type definitions that span across all three user journeys ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios") while maintaining clear domain boundaries.

## Key Features

### Cross-Journey Interfaces

Provides standardized interfaces for data models that are shared across multiple journeys:

- Common data transfer objects (DTOs) for filtering, pagination, and sorting
- Repository patterns and data access interfaces
- Shared entity interfaces used by multiple services

### Journey-Specific Interfaces

Organizes domain-specific interfaces by journey:

- **Health Journey**: Health metrics, goals, medical events, and device connections
- **Care Journey**: Appointments, providers, medications, telemedicine sessions, and treatment plans
- **Plan Journey**: Insurance plans, benefits, coverage, claims, and documents

### Authentication & Authorization

Defines interfaces for the authentication and authorization system:

- User, role, and permission interfaces
- Authentication request and response DTOs
- JWT payload and session interfaces

### Gamification Engine

Provides interfaces for the cross-journey gamification system:

- Achievement, quest, and reward interfaces
- Game profile and leaderboard interfaces
- Event schemas for gamification triggers
- Rule definitions for point calculation and achievement unlocking

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

Interfaces can be imported directly from their domain path or from the main package:

```typescript
// Import from main package
import { IHealthMetric, MetricType } from '@austa/interfaces';

// Import from specific domain
import { IAppointment, AppointmentStatus } from '@austa/interfaces/journey/care';
import { IClaim, ClaimStatus } from '@austa/interfaces/journey/plan';
import { IUser, IRole } from '@austa/interfaces/auth';
import { FilterDto, PaginationDto } from '@austa/interfaces/common/dto';
import { Achievement, GameProfile } from '@austa/interfaces/gamification';
```

### Using with Path Aliases

The package is designed to work with TypeScript path aliases for cleaner imports:

```typescript
// In your tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@austa/interfaces": ["./node_modules/@austa/interfaces"],
      "@austa/interfaces/*": ["./node_modules/@austa/interfaces/*"]
    }
  }
}

// In your code
import { IHealthMetric } from '@austa/interfaces';
import { IAppointment } from '@austa/interfaces/journey/care';
```

### Example: Health Metrics Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@austa/database';
import { IHealthMetric, MetricType } from '@austa/interfaces/journey/health';
import { FilterDto, PaginationDto } from '@austa/interfaces/common/dto';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMetricsByUser(
    userId: string,
    filter?: FilterDto,
    pagination?: PaginationDto
  ): Promise<IHealthMetric[]> {
    return this.prisma.healthMetric.findMany({
      where: {
        userId,
        ...(filter?.where || {})
      },
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: filter?.orderBy
    });
  }

  async recordMetric(metric: Omit<IHealthMetric, 'id' | 'createdAt' | 'updatedAt'>): Promise<IHealthMetric> {
    return this.prisma.healthMetric.create({
      data: metric
    });
  }
}
```

### Example: Appointment Component

```typescript
import React from 'react';
import { IAppointment, AppointmentStatus } from '@austa/interfaces/journey/care';
import { AppointmentCard } from '@austa/design-system/care';

interface AppointmentListProps {
  appointments: IAppointment[];
  onCancel: (appointmentId: string) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ 
  appointments, 
  onCancel 
}) => {
  return (
    <div className="appointment-list">
      {appointments.map(appointment => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onCancel={appointment.status === AppointmentStatus.SCHEDULED ? 
            () => onCancel(appointment.id) : undefined}
        />
      ))}
    </div>
  );
};
```

## Package Structure

The package is organized by domain to maintain clear boundaries between different parts of the system:

```
@austa/interfaces/
├── index.ts                # Main barrel export
├── auth/                   # Authentication interfaces
│   ├── index.ts
│   ├── user.interface.ts
│   ├── role.interface.ts
│   ├── permission.interface.ts
│   ├── auth.interface.ts
│   ├── request.interface.ts
│   └── response.interface.ts
├── common/                 # Shared utilities and DTOs
│   ├── index.ts
│   ├── repository.interface.ts
│   └── dto/
│       ├── index.ts
│       ├── filter.dto.ts
│       ├── pagination.dto.ts
│       └── sort.dto.ts
├── gamification/           # Gamification engine interfaces
│   ├── index.ts
│   ├── achievements.ts
│   ├── events.ts
│   ├── leaderboard.ts
│   ├── profiles.ts
│   ├── quests.ts
│   ├── rewards.ts
│   └── rules.ts
└── journey/                # Journey-specific interfaces
    ├── index.ts
    ├── health/             # Health journey
    │   ├── index.ts
    │   ├── health-goal.interface.ts
    │   ├── health-metric.interface.ts
    │   ├── medical-event.interface.ts
    │   └── device-connection.interface.ts
    ├── care/               # Care journey
    │   ├── index.ts
    │   ├── appointment.interface.ts
    │   ├── provider.interface.ts
    │   ├── medication.interface.ts
    │   ├── telemedicine-session.interface.ts
    │   └── treatment-plan.interface.ts
    └── plan/               # Plan journey
        ├── index.ts
        ├── plan.interface.ts
        ├── benefit.interface.ts
        ├── coverage.interface.ts
        ├── claim.interface.ts
        └── document.interface.ts
```

## Guidelines for Maintaining Interfaces

### Adding New Interfaces

When adding new interfaces to the package:

1. Place the interface in the appropriate domain directory
2. Use the `I` prefix for entity interfaces (e.g., `IHealthMetric`)
3. Use descriptive suffixes for DTOs (e.g., `CreateUserDto`, `UserResponseDto`)
4. Add comprehensive JSDoc comments for all properties
5. Export the interface from the domain's `index.ts` barrel file
6. Update the main `index.ts` if needed

### Modifying Existing Interfaces

When modifying existing interfaces:

1. Consider backward compatibility to avoid breaking changes
2. Use optional properties (`?`) for new fields when possible
3. Document changes in comments for other developers
4. Update related interfaces that may be affected by the changes
5. Consider versioning for significant changes (e.g., `UserV2Interface`)

### Best Practices

- Keep interfaces focused on data structure, not behavior
- Avoid circular dependencies between interface files
- Use TypeScript's utility types (Omit, Pick, Partial) for derived interfaces
- Maintain consistency with database schemas and API contracts
- Use enums for fixed sets of values rather than string literals
- Prefer composition over inheritance for interface reuse

## Troubleshooting

### Common Import Issues

#### "Cannot find module '@austa/interfaces'"

Ensure that:

1. The package is installed in your project
2. Your `tsconfig.json` has proper path aliases configured
3. The import path is correct (check for typos)

#### "Property 'X' does not exist on type 'Y'"

This usually means:

1. You're using an outdated version of the interfaces package
2. The property was renamed or removed
3. You're trying to access a property that exists in the entity but not in the interface

#### Type Resolution Issues

If TypeScript is not correctly resolving types:

1. Check that your `tsconfig.json` includes the correct paths
2. Ensure you're using the correct import syntax
3. Try clearing your TypeScript server cache
4. Verify that you're not mixing different versions of the package

## Technologies

- TypeScript 5.3.3
- Node.js ≥18.0.0

## Contributing

When contributing to the interfaces package:

1. Follow the established naming conventions
2. Ensure backward compatibility when possible
3. Add comprehensive documentation
4. Consider the impact on all consuming services
5. Maintain journey-specific boundaries