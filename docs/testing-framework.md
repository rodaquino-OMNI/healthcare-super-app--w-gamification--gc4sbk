# AUSTA SuperApp Testing Framework

## Table of Contents

1. [Introduction](#introduction)
2. [Testing Principles](#testing-principles)
3. [Testing Levels](#testing-levels)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [End-to-End Testing](#end-to-end-testing)
   - [Performance Testing](#performance-testing)
4. [Testing Tools](#testing-tools)
5. [Test Factories](#test-factories)
6. [Mock Services](#mock-services)
7. [Database Testing](#database-testing)
8. [UI Component Testing](#ui-component-testing)
9. [Cross-Journey Testing](#cross-journey-testing)
10. [Continuous Integration](#continuous-integration)
11. [Test Coverage Requirements](#test-coverage-requirements)
12. [Best Practices](#best-practices)

## Introduction

This document outlines the comprehensive testing strategy for the AUSTA SuperApp, a journey-centered platform with cross-journey gamification capabilities. The testing framework is designed to ensure high-quality, reliable software across all services and components, while supporting the specific needs of each journey ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").

The AUSTA SuperApp testing framework addresses the unique challenges of testing a complex, multi-journey application with shared components and cross-cutting concerns like gamification. It provides standardized approaches, tools, and utilities to facilitate effective testing at all levels of the application.

## Testing Principles

The AUSTA SuperApp testing strategy is guided by the following principles:

1. **Journey-Centric Testing**: Tests should be organized around user journeys to ensure that each journey functions correctly both independently and as part of the integrated application.

2. **Shift-Left Testing**: Testing begins early in the development process, with developers responsible for writing unit and integration tests alongside their code.

3. **Automation First**: Automated testing is prioritized at all levels to enable continuous integration and delivery.

4. **Test Isolation**: Tests should be independent and not rely on the state created by other tests.

5. **Realistic Data**: Test data should reflect real-world scenarios while remaining manageable and reproducible.

6. **Cross-Journey Validation**: Testing must verify that interactions between journeys work correctly, particularly for gamification events.

7. **Platform Independence**: Tests must validate that functionality works consistently across web (Next.js) and mobile (React Native) platforms.

## Testing Levels

### Unit Testing

Unit tests verify the functionality of individual components, functions, or classes in isolation from their dependencies.

**Framework**: Jest (29.7.0)

**Key Characteristics**:
- Fast execution (< 100ms per test)
- No external dependencies (databases, APIs, etc.)
- Dependencies are mocked or stubbed
- High coverage (target: 80%+)

**Organization**:
- Tests are co-located with the code they test (`__tests__` directories)
- Naming convention: `[filename].test.ts` or `[filename].spec.ts`
- Journey-specific tests are organized in journey-specific directories

**Example**:

```typescript
// src/backend/health-service/src/health/services/metric.service.test.ts
import { MetricService } from './metric.service';
import { mockMetricRepository } from '../../test/mocks/repositories';
import { createHealthMetricDto } from '../../test/factories/health';

describe('MetricService', () => {
  let service: MetricService;
  
  beforeEach(() => {
    service = new MetricService(mockMetricRepository);
  });
  
  describe('recordMetric', () => {
    it('should save a new health metric', async () => {
      const dto = createHealthMetricDto();
      await service.recordMetric(dto);
      expect(mockMetricRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: dto.userId,
        type: dto.type,
        value: dto.value
      }));
    });
    
    it('should emit a metric recorded event', async () => {
      const dto = createHealthMetricDto();
      await service.recordMetric(dto);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'health.metric.recorded',
        expect.objectContaining({
          userId: dto.userId,
          metricType: dto.type
        })
      );
    });
  });
});
```

### Integration Testing

Integration tests verify that different components work together correctly, focusing on the interactions between services, modules, or layers.

**Framework**: Jest with supertest for API testing

**Key Characteristics**:
- Tests interactions between components
- May involve external dependencies (often containerized)
- Slower than unit tests but faster than E2E tests
- Medium coverage (target: 60%+)

**Organization**:
- Located in `test/integration` directories
- Grouped by feature or service boundary
- Journey-specific integration tests focus on journey service boundaries

**Example**:

```typescript
// src/backend/health-service/test/integration/health-metrics.test.ts
import { Test } from '@nestjs/testing';
import { HealthModule } from '../../src/health/health.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestUser } from '../factories/user.factory';
import { createHealthMetricDto } from '../factories/health.factory';

describe('Health Metrics Integration', () => {
  let app;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();
    
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get<PrismaService>(PrismaService);
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  beforeEach(async () => {
    await prisma.healthMetric.deleteMany();
  });
  
  it('should record a health metric and store it in the database', async () => {
    const user = await createTestUser(prisma);
    const dto = createHealthMetricDto({ userId: user.id });
    
    await request(app.getHttpServer())
      .post('/health/metrics')
      .send(dto)
      .expect(201);
    
    const savedMetric = await prisma.healthMetric.findFirst({
      where: { userId: user.id, type: dto.type }
    });
    
    expect(savedMetric).toBeDefined();
    expect(savedMetric.value).toBe(dto.value);
  });
});
```

### End-to-End Testing

End-to-end tests verify that the entire application works correctly from the user's perspective, testing complete user flows across multiple services.

**Frameworks**:
- Web: Cypress (5+)
- Mobile: Detox

**Key Characteristics**:
- Tests complete user journeys
- Runs against a fully deployed application
- Slowest test type but highest confidence
- Focused coverage (target: key user flows)

**Organization**:
- Located in `test/e2e` directories
- Organized by user journey and feature
- Separate test suites for web and mobile platforms

**Example (Web)**:

```typescript
// src/web/web/cypress/integration/health/record-metric.spec.ts
describe('Health Metric Recording', () => {
  beforeEach(() => {
    cy.login('test-user@example.com', 'password123');
    cy.visit('/health/metrics');
  });
  
  it('should allow a user to record a blood pressure reading', () => {
    cy.get('[data-testid=metric-type-selector]').click();
    cy.get('[data-testid=blood-pressure-option]').click();
    
    cy.get('[data-testid=systolic-input]').type('120');
    cy.get('[data-testid=diastolic-input]').type('80');
    
    cy.get('[data-testid=save-metric-button]').click();
    
    cy.get('[data-testid=success-message]').should('be.visible');
    cy.get('[data-testid=metric-history]').should('contain', '120/80');
    
    // Verify gamification notification appears
    cy.get('[data-testid=achievement-notification]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'First Blood Pressure Reading');
  });
});
```

**Example (Mobile)**:

```typescript
// src/web/mobile/e2e/health/record-metric.e2e.js
describe('Health Metric Recording', () => {
  beforeAll(async () => {
    await device.launchApp();
    await element(by.id('email-input')).typeText('test-user@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('health-tab')).tap();
    await element(by.id('record-metric-button')).tap();
  });
  
  it('should allow a user to record a blood pressure reading', async () => {
    await element(by.id('metric-type-selector')).tap();
    await element(by.text('Blood Pressure')).tap();
    
    await element(by.id('systolic-input')).typeText('120');
    await element(by.id('diastolic-input')).typeText('80');
    
    await element(by.id('save-metric-button')).tap();
    
    await expect(element(by.id('success-message'))).toBeVisible();
    await expect(element(by.id('metric-history'))).toHaveText(/120\/80/);
    
    // Verify gamification notification appears
    await expect(element(by.id('achievement-notification'))).toBeVisible();
    await expect(element(by.id('achievement-title'))).toHaveText('First Blood Pressure Reading');
  });
});
```

### Performance Testing

Performance tests verify that the application meets performance requirements under various conditions.

**Frameworks**:
- k6 for API load testing
- Lighthouse for web performance
- React Native Performance Monitor for mobile performance

**Key Characteristics**:
- Tests system behavior under load
- Measures response times, throughput, and resource utilization
- Identifies performance bottlenecks
- Validates performance requirements

**Organization**:
- Located in `test/performance` directories
- Organized by service or feature
- Separate test suites for different performance aspects

**Example**:

```javascript
// src/backend/gamification-engine/test/performance/event-processing.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'], // 95% of requests must complete within 200ms
    'http_req_failed': ['rate<0.01'],    // Less than 1% of requests should fail
  },
};

export default function() {
  const payload = JSON.stringify({
    userId: `user-${__VU}-${__ITER}`,
    eventType: 'health.metric.recorded',
    journeyType: 'health',
    metadata: {
      metricType: 'blood_pressure',
      value: { systolic: 120, diastolic: 80 }
    }
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`
    },
  };
  
  const res = http.post('http://api.austa.local/gamification/events', payload, params);
  
  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
}
```

## Testing Tools

The AUSTA SuperApp uses the following testing tools:

| Tool | Version | Purpose |
|------|---------|--------|
| Jest | 29.7.0 | JavaScript testing framework for unit and integration testing |
| Testing Library | Latest | Component testing with a user-centric approach |
| Cypress | 5+ | End-to-end testing for web applications |
| Detox | Latest | End-to-end testing for React Native mobile applications |
| Supertest | Latest | HTTP assertions for API testing |
| k6 | Latest | Load and performance testing |
| Lighthouse | Latest | Web performance testing |
| Storybook | 7.0.27 | UI component development and visual testing |
| MSW (Mock Service Worker) | Latest | API mocking for frontend tests |
| Faker.js | Latest | Generating realistic test data |
| ts-mockito | Latest | Mocking library for TypeScript |

## Test Factories

Test factories provide a standardized way to create test data for different entities across the application. They ensure consistency, reduce duplication, and make tests more maintainable.

### Factory Organization

Test factories are organized by journey and entity type:

```
src/backend/packages/database/test/factories/
├── common/
│   ├── user.factory.ts
│   └── address.factory.ts
├── health/
│   ├── health-metric.factory.ts
│   ├── health-goal.factory.ts
│   └── device-connection.factory.ts
├── care/
│   ├── appointment.factory.ts
│   ├── provider.factory.ts
│   └── medication.factory.ts
├── plan/
│   ├── insurance-plan.factory.ts
│   ├── benefit.factory.ts
│   └── claim.factory.ts
└── gamification/
    ├── achievement.factory.ts
    ├── quest.factory.ts
    ├── reward.factory.ts
    └── event.factory.ts
```

### Factory Implementation

Factories use a builder pattern to create entities with sensible defaults that can be overridden as needed.

**Example Factory**:

```typescript
// src/backend/packages/database/test/factories/health/health-metric.factory.ts
import { faker } from '@faker-js/faker';
import { PrismaClient, HealthMetric, HealthMetricType } from '@prisma/client';
import { CreateHealthMetricDto } from '@austa/interfaces/journey/health';

export const createHealthMetricDto = (overrides: Partial<CreateHealthMetricDto> = {}): CreateHealthMetricDto => {
  return {
    userId: faker.string.uuid(),
    type: faker.helpers.arrayElement(Object.values(HealthMetricType)),
    value: faker.number.float({ min: 60, max: 200, precision: 0.1 }),
    timestamp: faker.date.recent(),
    source: 'manual',
    ...overrides
  };
};

export const createHealthMetric = async (
  prisma: PrismaClient,
  overrides: Partial<Omit<HealthMetric, 'id'>> = {}
): Promise<HealthMetric> => {
  const data = {
    userId: faker.string.uuid(),
    type: faker.helpers.arrayElement(Object.values(HealthMetricType)),
    value: faker.number.float({ min: 60, max: 200, precision: 0.1 }),
    timestamp: faker.date.recent(),
    source: 'manual',
    ...overrides
  };
  
  return prisma.healthMetric.create({ data });
};

// Specialized factories for specific metric types
export const createBloodPressureMetric = async (
  prisma: PrismaClient,
  overrides: Partial<Omit<HealthMetric, 'id'>> = {}
): Promise<HealthMetric> => {
  return createHealthMetric(prisma, {
    type: HealthMetricType.BLOOD_PRESSURE,
    value: JSON.stringify({
      systolic: faker.number.int({ min: 90, max: 180 }),
      diastolic: faker.number.int({ min: 60, max: 120 })
    }),
    ...overrides
  });
};
```

### Journey-Specific Factories

Each journey has specialized factories for its domain entities:

**Health Journey Factories**:
- Health metrics (blood pressure, weight, glucose, etc.)
- Health goals and targets
- Device connections and synchronization records
- Medical events and conditions

**Care Journey Factories**:
- Appointments and scheduling
- Healthcare providers and facilities
- Medications and treatments
- Telemedicine sessions
- Symptom checks

**Plan Journey Factories**:
- Insurance plans and coverage
- Benefits and eligibility
- Claims and reimbursements
- Documents and cards

**Gamification Factories**:
- User profiles and progress
- Achievements and badges
- Quests and challenges
- Rewards and redemptions
- Events and triggers

### Factory Usage Guidelines

1. Always use factories to create test data instead of direct object creation
2. Override only the properties needed for the specific test case
3. Use specialized factories for complex entity types
4. Maintain realistic relationships between entities
5. Clean up created data after tests when using real databases

## Mock Services

Mock services provide controlled implementations of external dependencies to isolate the system under test and create predictable test conditions.

### Mock Service Organization

Mock services are organized by external dependency type:

```
src/backend/packages/
├── test/
│   └── mocks/
│       ├── external/
│       │   ├── fhir.mock.ts
│       │   ├── payment-gateway.mock.ts
│       │   └── notification.mock.ts
│       ├── internal/
│       │   ├── auth-service.mock.ts
│       │   ├── gamification-engine.mock.ts
│       │   └── notification-service.mock.ts
│       └── infrastructure/
│           ├── kafka.mock.ts
│           ├── redis.mock.ts
│           └── s3.mock.ts
```

### Mock Implementation Approaches

**1. Interface-Based Mocks**:

```typescript
// src/backend/packages/test/mocks/external/fhir.mock.ts
import { FHIRService, PatientResource, ObservationResource } from '@austa/interfaces/journey/health';

export class MockFHIRService implements FHIRService {
  private patients: Map<string, PatientResource> = new Map();
  private observations: Map<string, ObservationResource[]> = new Map();
  
  async getPatient(patientId: string): Promise<PatientResource> {
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }
    return patient;
  }
  
  async createPatient(data: Partial<PatientResource>): Promise<PatientResource> {
    const id = data.id || `patient-${Date.now()}`;
    const patient = { id, ...data } as PatientResource;
    this.patients.set(id, patient);
    return patient;
  }
  
  async getObservations(patientId: string): Promise<ObservationResource[]> {
    return this.observations.get(patientId) || [];
  }
  
  async createObservation(patientId: string, data: Partial<ObservationResource>): Promise<ObservationResource> {
    const id = data.id || `observation-${Date.now()}`;
    const observation = { id, subject: { reference: `Patient/${patientId}` }, ...data } as ObservationResource;
    
    const patientObservations = this.observations.get(patientId) || [];
    patientObservations.push(observation);
    this.observations.set(patientId, patientObservations);
    
    return observation;
  }
  
  // Reset the mock state between tests
  reset(): void {
    this.patients.clear();
    this.observations.clear();
  }
}
```

**2. Jest Mock Functions**:

```typescript
// src/backend/packages/test/mocks/internal/notification-service.mock.ts
import { NotificationService, NotificationPayload } from '@austa/interfaces/notification';

export const createMockNotificationService = (): jest.Mocked<NotificationService> => ({
  sendNotification: jest.fn().mockImplementation(async (payload: NotificationPayload) => {
    return { id: `notification-${Date.now()}`, status: 'sent', payload };
  }),
  
  getNotificationStatus: jest.fn().mockImplementation(async (notificationId: string) => {
    return { id: notificationId, status: 'delivered' };
  }),
  
  cancelNotification: jest.fn().mockImplementation(async (notificationId: string) => {
    return { id: notificationId, status: 'cancelled' };
  }),
});
```

**3. MSW for API Mocking**:

```typescript
// src/web/shared/test/mocks/api/health-service.mock.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { faker } from '@faker-js/faker';
import { HealthMetricType } from '@austa/interfaces/journey/health';

export const healthServiceHandlers = [
  rest.get('/api/health/metrics', (req, res, ctx) => {
    const userId = req.url.searchParams.get('userId');
    const type = req.url.searchParams.get('type');
    
    return res(
      ctx.status(200),
      ctx.json({
        metrics: Array(5).fill(null).map(() => ({
          id: faker.string.uuid(),
          userId: userId || faker.string.uuid(),
          type: type || faker.helpers.arrayElement(Object.values(HealthMetricType)),
          value: faker.number.float({ min: 60, max: 200, precision: 0.1 }),
          timestamp: faker.date.recent().toISOString(),
          source: 'manual'
        }))
      })
    );
  }),
  
  rest.post('/api/health/metrics', (req, res, ctx) => {
    const { userId, type, value } = req.body;
    
    return res(
      ctx.status(201),
      ctx.json({
        id: faker.string.uuid(),
        userId,
        type,
        value,
        timestamp: new Date().toISOString(),
        source: 'manual'
      })
    );
  }),
];

export const server = setupServer(...healthServiceHandlers);
```

### External Dependencies Mocked

**Healthcare Systems**:
- FHIR API for medical records
- Laboratory systems for test results
- Pharmacy systems for medication information

**Payment and Insurance**:
- Payment gateways for transactions
- Insurance verification systems
- Claims processing systems

**Device Integration**:
- Wearable device APIs (Fitbit, Apple Health, etc.)
- Medical device connections
- Bluetooth device simulators

**Communication Services**:
- Email delivery services
- SMS gateways
- Push notification services

**Infrastructure Services**:
- Kafka for event streaming
- Redis for caching and pub/sub
- S3 for file storage

### Mock Service Usage Guidelines

1. Use interface-based mocks for complex external systems
2. Use Jest mock functions for simple dependencies
3. Use MSW for API mocking in frontend tests
4. Reset mock state between tests to ensure isolation
5. Configure mocks to simulate both success and error scenarios
6. Document expected behavior of mock implementations

## Database Testing

Database testing utilities provide tools for setting up, interacting with, and cleaning up databases during tests.

### Database Testing Approaches

**1. In-Memory Database**:

For unit and some integration tests, an in-memory SQLite database is used to provide fast, isolated testing without external dependencies.

```typescript
// src/backend/packages/database/test/utils/in-memory-db.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';

export async function createInMemoryDatabase(): Promise<PrismaClient> {
  // Set environment variable to use SQLite in-memory database
  process.env.DATABASE_URL = 'file::memory:?cache=shared';
  
  // Generate Prisma client for SQLite
  execSync('npx prisma generate --schema=./prisma/sqlite.schema.prisma', {
    stdio: 'inherit',
  });
  
  // Create new PrismaClient instance
  const prisma = new PrismaClient();
  
  // Run migrations to set up schema
  execSync('npx prisma migrate deploy --schema=./prisma/sqlite.schema.prisma', {
    stdio: 'inherit',
  });
  
  return prisma;
}

export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  const models = Reflect.ownKeys(prisma).filter(
    (key) => typeof key === 'string' && !key.startsWith('_') && key !== 'disconnect'
  );
  
  for (const modelKey of models) {
    await prisma[modelKey as string].deleteMany();
  }
}
```

**2. Test Containers**:

For integration and E2E tests, Docker containers with PostgreSQL and TimescaleDB are used to provide a realistic database environment.

```typescript
// src/backend/packages/database/test/utils/test-containers.ts
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export async function startPostgresContainer(): Promise<{
  container: StartedTestContainer;
  prisma: PrismaClient;
}> {
  const container = await new GenericContainer('postgres:14')
    .withExposedPorts(5432)
    .withEnv('POSTGRES_USER', 'test')
    .withEnv('POSTGRES_PASSWORD', 'test')
    .withEnv('POSTGRES_DB', 'testdb')
    .start();
  
  const dbUrl = `postgresql://test:test@localhost:${container.getMappedPort(5432)}/testdb`;
  process.env.DATABASE_URL = dbUrl;
  
  // Generate Prisma client
  execSync('npx prisma generate', {
    stdio: 'inherit',
  });
  
  // Run migrations
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
  });
  
  const prisma = new PrismaClient();
  
  return { container, prisma };
}

export async function stopPostgresContainer(
  container: StartedTestContainer,
  prisma: PrismaClient
): Promise<void> {
  await prisma.$disconnect();
  await container.stop();
}
```

**3. Database Seeding**:

Utilities for seeding test databases with realistic data for testing.

```typescript
// src/backend/packages/database/test/seed/seed-database.ts
import { PrismaClient } from '@prisma/client';
import { createUser } from '../factories/common/user.factory';
import { createHealthMetric } from '../factories/health/health-metric.factory';
import { createAppointment } from '../factories/care/appointment.factory';
import { createInsurancePlan } from '../factories/plan/insurance-plan.factory';
import { createAchievement } from '../factories/gamification/achievement.factory';

export async function seedDatabase(prisma: PrismaClient): Promise<{
  users: any[];
  metrics: any[];
  appointments: any[];
  plans: any[];
  achievements: any[];
}> {
  // Create test users
  const users = [];
  for (let i = 0; i < 5; i++) {
    users.push(await createUser(prisma));
  }
  
  // Create health metrics for each user
  const metrics = [];
  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      metrics.push(await createHealthMetric(prisma, { userId: user.id }));
    }
  }
  
  // Create appointments for each user
  const appointments = [];
  for (const user of users) {
    appointments.push(await createAppointment(prisma, { userId: user.id }));
  }
  
  // Create insurance plans for each user
  const plans = [];
  for (const user of users) {
    plans.push(await createInsurancePlan(prisma, { userId: user.id }));
  }
  
  // Create achievements for each user
  const achievements = [];
  for (const user of users) {
    achievements.push(await createAchievement(prisma, { userId: user.id }));
  }
  
  return { users, metrics, appointments, plans, achievements };
}
```

**4. Transaction Helpers**:

Utilities for managing database transactions in tests.

```typescript
// src/backend/packages/database/test/utils/transaction-helpers.ts
import { PrismaClient } from '@prisma/client';

export async function withTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const result = await callback(tx);
    return result;
  });
}

export async function rollbackTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: any) => Promise<T>
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await callback(tx);
      // Force rollback by throwing an error
      throw new Error('ROLLBACK_TRANSACTION');
    });
  } catch (error) {
    if (error.message !== 'ROLLBACK_TRANSACTION') {
      throw error;
    }
  }
}
```

### Journey-Specific Database Utilities

Each journey has specialized database utilities for its domain:

**Health Journey**:
- Time-series data utilities for health metrics
- Reference range validation
- Trend analysis helpers

**Care Journey**:
- Appointment scheduling utilities
- Provider availability checking
- Medication interaction testing

**Plan Journey**:
- Coverage calculation utilities
- Benefit eligibility checking
- Claim processing simulation

**Gamification**:
- Progress tracking utilities
- Achievement validation
- Leaderboard calculation

### Database Testing Guidelines

1. Use in-memory databases for unit and simple integration tests
2. Use test containers for complex integration and E2E tests
3. Seed databases with realistic but deterministic data
4. Clean up test data after each test
5. Use transactions to isolate tests when possible
6. Test database error scenarios and edge cases

## UI Component Testing

UI component testing verifies that UI components render correctly and behave as expected in response to user interactions.

### Component Testing Approaches

**1. Unit Testing with Testing Library**:

```typescript
// src/web/design-system/src/components/Button/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with the correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
  
  it('applies the correct variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('btn-primary');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toHaveClass('btn-secondary');
  });
});
```

**2. Visual Testing with Storybook**:

```typescript
// src/web/design-system/src/components/Button/Button.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
    size: 'medium',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
    size: 'medium',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    size: 'medium',
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    variant: 'primary',
    children: 'Small Button',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    variant: 'primary',
    children: 'Large Button',
    size: 'large',
  },
};
```

**3. Snapshot Testing**:

```typescript
// src/web/design-system/src/components/Card/Card.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders correctly with title and content', () => {
    const { container } = render(
      <Card title="Test Card">
        <p>Card content</p>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });
  
  it('renders correctly with custom styles', () => {
    const { container } = render(
      <Card 
        title="Custom Card" 
        elevation={3}
        borderRadius="lg"
        backgroundColor="secondary.light"
      >
        <p>Custom card content</p>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });
});
```

**4. Cross-Platform Component Testing**:

```typescript
// src/web/primitives/src/components/Text/Text.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('renders correctly on web platform', () => {
    // Mock platform as web
    jest.mock('../../utils/platform', () => ({
      isWeb: true,
      isNative: false,
    }));
    
    render(<Text>Hello World</Text>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Hello World').tagName).toBe('SPAN');
  });
  
  it('applies correct styles based on variant', () => {
    render(<Text variant="heading1">Heading</Text>);
    const element = screen.getByText('Heading');
    expect(element).toHaveStyle({
      fontSize: '2rem',
      fontWeight: 'bold',
    });
  });
});
```

### Journey-Specific UI Testing

Each journey has specialized UI component tests:

**Health Journey**:
- Health metric visualization components
- Goal progress indicators
- Device connection interfaces

**Care Journey**:
- Appointment scheduling components
- Provider search and filtering
- Telemedicine interface elements

**Plan Journey**:
- Plan comparison tools
- Benefit visualization components
- Claim submission forms

**Gamification**:
- Achievement displays
- Progress indicators
- Reward redemption interfaces

### UI Component Testing Guidelines

1. Test both appearance and behavior of components
2. Verify accessibility compliance (WCAG standards)
3. Test components across different screen sizes
4. Ensure consistent behavior across platforms (web and mobile)
5. Use snapshot testing judiciously for stable components
6. Test component interactions and state changes

## Cross-Journey Testing

Cross-journey testing verifies that interactions between different journeys work correctly, particularly for features like gamification that span multiple journeys.

### Cross-Journey Testing Approaches

**1. Integration Testing for Journey Interactions**:

```typescript
// src/backend/gamification-engine/test/integration/cross-journey-events.test.ts
import { Test } from '@nestjs/testing';
import { EventsModule } from '../../src/events/events.module';
import { AchievementsModule } from '../../src/achievements/achievements.module';
import { EventsService } from '../../src/events/services/events.service';
import { AchievementsService } from '../../src/achievements/services/achievements.service';
import { createHealthMetricEventDto } from '../factories/events.factory';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Cross-Journey Events', () => {
  let eventsService: EventsService;
  let achievementsService: AchievementsService;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EventsModule, AchievementsModule],
    }).compile();
    
    eventsService = moduleRef.get<EventsService>(EventsService);
    achievementsService = moduleRef.get<AchievementsService>(AchievementsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });
  
  beforeEach(async () => {
    await prisma.event.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.userAchievement.deleteMany();
  });
  
  it('should process health journey events and trigger achievements', async () => {
    // Create a health metric event
    const userId = 'test-user-123';
    const eventDto = createHealthMetricEventDto({ userId });
    
    // Process the event
    await eventsService.processEvent(eventDto);
    
    // Verify that the event was recorded
    const event = await prisma.event.findFirst({
      where: { userId, journeyType: 'health' }
    });
    expect(event).toBeDefined();
    
    // Verify that the achievement was triggered
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    });
    
    expect(userAchievements.length).toBeGreaterThan(0);
    expect(userAchievements[0].achievement.triggerEvent).toBe('health.metric.recorded');
  });
  
  it('should process events from multiple journeys for the same user', async () => {
    const userId = 'test-user-456';
    
    // Create events from different journeys
    const healthEvent = createHealthMetricEventDto({ userId });
    const careEvent = createCareAppointmentEventDto({ userId });
    const planEvent = createPlanClaimEventDto({ userId });
    
    // Process all events
    await eventsService.processEvent(healthEvent);
    await eventsService.processEvent(careEvent);
    await eventsService.processEvent(planEvent);
    
    // Verify events from all journeys were recorded
    const events = await prisma.event.findMany({
      where: { userId }
    });
    
    expect(events.length).toBe(3);
    expect(events.map(e => e.journeyType).sort()).toEqual(['care', 'health', 'plan']);
    
    // Verify cross-journey achievements were triggered
    const crossJourneyAchievements = await prisma.userAchievement.findMany({
      where: { 
        userId,
        achievement: { isCrossJourney: true }
      },
      include: { achievement: true }
    });
    
    expect(crossJourneyAchievements.length).toBeGreaterThan(0);
  });
});
```

**2. End-to-End Testing for User Flows Across Journeys**:

```typescript
// src/web/web/cypress/integration/cross-journey/gamification-flow.spec.ts
describe('Cross-Journey Gamification', () => {
  beforeEach(() => {
    cy.login('test-user@example.com', 'password123');
  });
  
  it('should earn achievements across multiple journeys', () => {
    // Complete an action in the Health journey
    cy.visit('/health/metrics');
    cy.get('[data-testid=metric-type-selector]').click();
    cy.get('[data-testid=blood-pressure-option]').click();
    cy.get('[data-testid=systolic-input]').type('120');
    cy.get('[data-testid=diastolic-input]').type('80');
    cy.get('[data-testid=save-metric-button]').click();
    cy.get('[data-testid=success-message]').should('be.visible');
    
    // Verify achievement notification
    cy.get('[data-testid=achievement-notification]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'First Blood Pressure Reading');
    
    // Complete an action in the Care journey
    cy.visit('/care/appointments');
    cy.get('[data-testid=new-appointment-button]').click();
    cy.get('[data-testid=provider-search]').type('Dr. Smith');
    cy.get('[data-testid=provider-result]').first().click();
    cy.get('[data-testid=appointment-date]').click();
    cy.get('[data-testid=date-picker-tomorrow]').click();
    cy.get('[data-testid=appointment-time]').click();
    cy.get('[data-testid=time-option-10-00]').click();
    cy.get('[data-testid=book-appointment-button]').click();
    cy.get('[data-testid=appointment-confirmation]').should('be.visible');
    
    // Verify achievement notification
    cy.get('[data-testid=achievement-notification]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'First Appointment Booked');
    
    // Check gamification profile for cross-journey achievement
    cy.visit('/achievements');
    cy.get('[data-testid=achievement-list]').should('contain', 'Health Explorer');
    cy.get('[data-testid=achievement-list]').should('contain', 'Care Seeker');
    
    // Verify cross-journey achievement is unlocked
    cy.get('[data-testid=achievement-list]').should('contain', 'Journey Pioneer');
    cy.get('[data-testid=achievement-badge-Journey-Pioneer]').should('have.class', 'unlocked');
  });
});
```

**3. Event Processing Testing**:

```typescript
// src/backend/gamification-engine/test/integration/event-processing.test.ts
import { Test } from '@nestjs/testing';
import { EventsModule } from '../../src/events/events.module';
import { KafkaService } from '../../src/events/kafka/kafka.service';
import { EventsService } from '../../src/events/services/events.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createEventDto } from '../factories/events.factory';

describe('Event Processing', () => {
  let kafkaService: KafkaService;
  let eventsService: EventsService;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EventsModule],
    }).compile();
    
    kafkaService = moduleRef.get<KafkaService>(KafkaService);
    eventsService = moduleRef.get<EventsService>(EventsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });
  
  beforeEach(async () => {
    await prisma.event.deleteMany();
    jest.clearAllMocks();
  });
  
  it('should process events from all journey types', async () => {
    // Create events for each journey type
    const healthEvent = createEventDto({ journeyType: 'health', eventType: 'health.metric.recorded' });
    const careEvent = createEventDto({ journeyType: 'care', eventType: 'care.appointment.booked' });
    const planEvent = createEventDto({ journeyType: 'plan', eventType: 'plan.claim.submitted' });
    
    // Mock Kafka consumer to emit these events
    const mockConsume = jest.spyOn(kafkaService, 'consume');
    mockConsume.mockImplementation(async (topic, callback) => {
      await callback(healthEvent);
      await callback(careEvent);
      await callback(planEvent);
      return { id: 'consumer-1' };
    });
    
    // Start the consumer
    await kafkaService.startConsumers();
    
    // Verify all events were processed and stored
    const events = await prisma.event.findMany();
    expect(events.length).toBe(3);
    
    const journeyTypes = events.map(e => e.journeyType).sort();
    expect(journeyTypes).toEqual(['care', 'health', 'plan']);
  });
});
```

### Cross-Journey Testing Scenarios

1. **Health to Gamification Flow**:
   - Record health metrics
   - Verify gamification events are triggered
   - Check achievement unlocking
   - Validate XP accumulation

2. **Care to Gamification Flow**:
   - Book appointments
   - Complete telemedicine sessions
   - Verify gamification events are triggered
   - Check quest progress

3. **Plan to Gamification Flow**:
   - Submit claims
   - Update insurance information
   - Verify gamification events are triggered
   - Check reward eligibility

4. **Multi-Journey User Flows**:
   - Complete actions across all three journeys
   - Verify cross-journey achievements
   - Check leaderboard position updates
   - Validate reward accumulation

### Cross-Journey Testing Guidelines

1. Test complete user flows that span multiple journeys
2. Verify that events from all journeys are processed correctly
3. Test cross-journey achievements and rewards
4. Validate data consistency across journey boundaries
5. Test error handling for cross-journey operations
6. Verify performance of cross-journey operations

## Continuous Integration

Continuous Integration (CI) ensures that tests are run automatically on code changes to catch issues early.

### CI Pipeline Configuration

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'yarn'
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Run unit tests
        run: yarn test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info
          flags: unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js 18.x
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'yarn'
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Run migrations
        run: yarn prisma:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
      - name: Run integration tests
        run: yarn test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info
          flags: integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js 18.x
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'yarn'
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Build application
        run: yarn build
      - name: Start application
        run: yarn start:e2e &
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          browser: chrome
          record: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}

  mobile-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js 18.x
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'yarn'
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Install Detox dependencies
        run: brew tap wix/brew && brew install applesimutils
      - name: Build iOS app
        run: yarn mobile:build:ios
      - name: Run Detox tests
        run: yarn mobile:test:e2e
```

### Test Execution Strategy

1. **Unit Tests**: Run on every push and pull request
2. **Integration Tests**: Run on every push and pull request
3. **E2E Tests**: Run on pull requests to main branches
4. **Performance Tests**: Run on a schedule and before releases

### Test Reporting

1. **Coverage Reports**: Generated and uploaded to Codecov
2. **Test Results**: Published as GitHub Actions artifacts
3. **Test Summaries**: Added as comments to pull requests
4. **Performance Metrics**: Tracked over time in Grafana dashboards

## Test Coverage Requirements

The AUSTA SuperApp enforces minimum test coverage requirements to ensure code quality:

| Test Type | Coverage Target | Critical Areas |
|-----------|-----------------|----------------|
| Unit Tests | 80% overall | 90% for core business logic |
| Integration Tests | 60% overall | 80% for service boundaries |
| E2E Tests | Key user flows | All journeys covered |

### Journey-Specific Coverage Requirements

**Health Journey**:
- 90% coverage for health metric processing
- 85% coverage for goal tracking
- 80% coverage for device integration

**Care Journey**:
- 90% coverage for appointment booking
- 85% coverage for provider search
- 80% coverage for telemedicine

**Plan Journey**:
- 90% coverage for claim submission
- 85% coverage for benefit calculation
- 80% coverage for document management

**Gamification**:
- 95% coverage for event processing
- 90% coverage for achievement unlocking
- 85% coverage for reward distribution

## Best Practices

### General Testing Best Practices

1. **Write Tests First**: Follow Test-Driven Development (TDD) when possible
2. **Keep Tests Fast**: Optimize test execution time to maintain developer productivity
3. **One Assertion Per Test**: Focus each test on a single behavior
4. **Use Descriptive Names**: Test names should describe the expected behavior
5. **Isolate Tests**: Tests should not depend on each other
6. **Clean Up**: Tests should clean up after themselves

### Journey-Specific Best Practices

**Health Journey**:
- Mock time-series data realistically
- Test boundary conditions for health metrics
- Validate trend calculations

**Care Journey**:
- Test appointment scheduling edge cases
- Validate provider availability logic
- Test telemedicine connection scenarios

**Plan Journey**:
- Test complex coverage calculations
- Validate document upload and processing
- Test claim status transitions

**Gamification**:
- Test complex achievement conditions
- Validate point calculations
- Test leaderboard edge cases

### Code Quality Gates

1. **Pull Request Checks**:
   - All tests must pass
   - Coverage requirements must be met
   - No new code smells or vulnerabilities

2. **Pre-Merge Validation**:
   - Integration tests with real dependencies
   - Performance tests for critical paths
   - Security scans for vulnerabilities

3. **Release Validation**:
   - Full E2E test suite
   - Load testing for production scenarios
   - Cross-browser and cross-device testing