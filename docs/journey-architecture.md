# AUSTA SuperApp Journey-Centered Architecture

## Table of Contents

- [Overview](#overview)
- [Architectural Principles](#architectural-principles)
- [Journey-Centered Design](#journey-centered-design)
  - [Health Journey ("Minha Saúde")](#health-journey-minha-saúde)
  - [Care Journey ("Cuidar-me Agora")](#care-journey-cuidar-me-agora)
  - [Plan Journey ("Meu Plano--benefícios")](#plan-journey-meu-plano--benefícios)
- [Cross-Journey Gamification](#cross-journey-gamification)
  - [Event-Driven Architecture](#event-driven-architecture)
  - [Gamification Engine](#gamification-engine)
  - [Achievement System](#achievement-system)
- [Technical Implementation](#technical-implementation)
  - [Microservices Architecture](#microservices-architecture)
  - [API-First Development](#api-first-development)
  - [Cross-Platform Frontend](#cross-platform-frontend)
- [Data Flow](#data-flow)
- [Integration Points](#integration-points)

## Overview

The AUSTA SuperApp implements a **journey-centered microservices architecture** that aligns technical boundaries with user mental models rather than traditional technical functions. This approach enables independent development, deployment, and scaling of each journey while maintaining a cohesive user experience.

The architecture is built around three distinct user journeys:

1. **Health Journey ("Minha Saúde")**: Focused on personal health monitoring and wellness tracking
2. **Care Journey ("Cuidar-me Agora")**: Centered on healthcare access and appointment management
3. **Plan Journey ("Meu Plano & Benefícios")**: Dedicated to insurance management and claims

These journeys are integrated through a cross-cutting **gamification engine** that processes events from all journeys to drive user engagement through achievements, challenges, and rewards.

## Architectural Principles

The AUSTA SuperApp architecture follows several key principles:

### Domain-Driven Design

Services are bounded around user journeys (Health, Care, Plan) instead of technical capabilities, allowing teams to focus on specific user needs. This approach:

- Aligns technical boundaries with user mental models
- Enables independent development and deployment of each journey
- Facilitates domain-specific optimization and scaling
- Promotes team autonomy and ownership

### API-First Development

All services expose well-defined interfaces with GraphQL as the primary contract, enabling frontend flexibility. This approach:

- Ensures clear contracts between services
- Facilitates independent evolution of frontend and backend
- Enables efficient data fetching with precise queries
- Provides strong typing and schema validation

### Event-Driven Architecture

The gamification engine listens to events from all journeys, providing a cross-cutting engagement layer. This approach:

- Decouples journey services from gamification logic
- Enables asynchronous processing of user actions
- Facilitates real-time updates and notifications
- Supports extensibility through new event types

### Polyglot Persistence

Different data storage technologies are employed for different types of data:

- **PostgreSQL**: For structured relational data across all journeys
- **TimescaleDB**: For time-series health metrics in the Health journey
- **Redis**: For caching, session management, and real-time leaderboards
- **Kafka**: For event streaming between services
- **S3**: For document storage (medical records, insurance cards, etc.)

### Cross-Platform Frontend

Shared codebase between web and mobile applications through React Native and Next.js, using a unified design system that ensures consistent user experience across platforms.

## Journey-Centered Design

The AUSTA SuperApp organizes its functionality around three primary user journeys, each with its own dedicated microservice, database schema, and UI components.

### Health Journey ("Minha Saúde")

The Health Journey focuses on personal health monitoring and wellness tracking.

#### Key Features

- Health metrics tracking (weight, blood pressure, glucose, etc.)
- Health goals setting and monitoring
- Medical history and records management
- Wearable device integration
- Health insights and trends analysis

#### Technical Components

- **Health Service**: Backend microservice for health data management
- **TimescaleDB**: Time-series database for health metrics
- **FHIR Integration**: Standards-based medical data exchange
- **Device Connectors**: Integration with wearable health devices
- **Health-specific UI Components**: Specialized visualization and input components

#### User Flow

```
Health Dashboard → View Metric → Metric Detail
                 → Add Metric → Add Health Metric
                 → View Goals → Health Goals → Add Goal
                 → View History → Medical History
                 → Connect Device → Device Connection → Device Pairing Flow
```

### Care Journey ("Cuidar-me Agora")

The Care Journey focuses on healthcare access and appointment management.

#### Key Features

- Provider search and selection
- Appointment scheduling and management
- Telemedicine consultations
- Symptom checking and triage
- Treatment plan tracking
- Medication management

#### Technical Components

- **Care Service**: Backend microservice for care management
- **Provider Integration**: API connections to healthcare provider systems
- **Telemedicine Platform**: Real-time video consultation capabilities
- **Appointment Scheduling Engine**: Availability and booking management
- **Care-specific UI Components**: Appointment, provider, and telemedicine interfaces

#### User Flow

```
Care Dashboard → View Appointment → Appointment Detail → Start Telemedicine
               → Find Provider → Provider Search → Book Appointment → Appointment Detail
               → Check Symptoms → Symptom Checker → Book Appointment
               → View Treatment → Treatment Plan
```

### Plan Journey ("Meu Plano & Benefícios")

The Plan Journey focuses on insurance management and claims.

#### Key Features

- Insurance plan details and coverage information
- Digital insurance card
- Claims submission and tracking
- Benefits exploration and utilization
- Cost estimation for procedures

#### Technical Components

- **Plan Service**: Backend microservice for insurance management
- **Insurance Integration**: API connections to insurance systems
- **Claims Processing Engine**: Validation and submission workflow
- **Document Management**: Storage and retrieval of insurance documents
- **Plan-specific UI Components**: Coverage, claims, and benefit interfaces

#### User Flow

```
Plan Dashboard → View Coverage → Coverage Details
               → View Digital Card → Digital Insurance Card
               → View Claims → Claim History → View Claim → Claim Detail
                                              → Submit New → Claim Submission
               → Estimate Costs → Cost Simulator
               → View Benefits → Plan Benefits
```

## Cross-Journey Gamification

A key architectural feature of the AUSTA SuperApp is its cross-journey gamification system, which processes events from all journeys to drive user engagement.

### Event-Driven Architecture

The gamification system is built on an event-driven architecture:

1. **Event Generation**: User actions across all journeys generate events
2. **Event Publishing**: Events are published to Kafka topics
3. **Event Consumption**: The Gamification Engine consumes and processes events
4. **Rule Evaluation**: Events are evaluated against gamification rules
5. **State Updates**: User achievements, points, and levels are updated
6. **Notification**: Users are notified of achievements and rewards

### Gamification Engine

The Gamification Engine is a dedicated microservice that processes events from all journeys:

#### Components

- **Event Processor**: Consumes and validates events from Kafka
- **Rule Engine**: Evaluates events against configurable rules
- **Achievement Manager**: Tracks and awards achievements
- **Quest System**: Manages multi-step challenges across journeys
- **Reward Manager**: Handles reward distribution and redemption
- **Leaderboard Service**: Maintains real-time user rankings

#### Event Schema

Events follow a standardized schema with journey-specific payloads:

```typescript
interface BaseEvent {
  eventType: string;
  userId: string;
  timestamp: string;
  journeyType: 'health' | 'care' | 'plan';
  payload: HealthEventPayload | CareEventPayload | PlanEventPayload;
  metadata?: Record<string, any>;
  version: string;
}
```

Journey-specific event types include:

- **Health Journey**: `health.metric.recorded`, `health.goal.achieved`, `health.device.connected`
- **Care Journey**: `care.appointment.booked`, `care.medication.taken`, `care.telemedicine.completed`
- **Plan Journey**: `plan.claim.submitted`, `plan.benefit.used`, `plan.coverage.viewed`

### Achievement System

The achievement system spans all journeys, encouraging users to engage with different aspects of the application:

#### Achievement Types

- **Journey-Specific Achievements**: Tied to specific actions within a single journey
- **Cross-Journey Achievements**: Require actions across multiple journeys
- **Progressive Achievements**: Multi-level achievements with increasing requirements
- **Time-Bound Achievements**: Available only during specific periods

#### Reward Mechanisms

- **XP Points**: Accumulated for all qualifying actions
- **Levels**: Achieved by earning XP points
- **Badges**: Visual representations of achievements
- **Tangible Rewards**: Discounts, premium features, or physical rewards

## Technical Implementation

### Microservices Architecture

The AUSTA SuperApp is implemented as a microservices architecture with the following components:

#### Core Components

| Component | Primary Responsibility | Key Dependencies | Integration Points |
|-----------|--------------------------|-------------------|-------------------|
| API Gateway | Route requests, authenticate users, manage rate limits | Auth Service, Journey Services | All client applications |
| Auth Service | User authentication, authorization, profile management | PostgreSQL, Redis | All other services |
| Health Service | Health metrics, medical history, device integration | PostgreSQL, TimescaleDB, Redis | EHR systems, Wearable devices |
| Care Service | Appointments, telemedicine, treatment plans | PostgreSQL, Redis | Provider systems, Telemedicine platform |
| Plan Service | Insurance coverage, claims, benefits | PostgreSQL, Redis | Insurance systems, Payment processors |
| Gamification Engine | Process events, track achievements, manage rewards | PostgreSQL, Redis, Kafka | All journey services |
| Notification Service | Deliver notifications across channels | Redis, Kafka | SMS gateway, Email service, Push notification services |

#### Service Communication

Services communicate through two primary mechanisms:

1. **Synchronous API Calls**: For direct request-response interactions
   - GraphQL for frontend-to-backend communication
   - REST for service-to-service communication

2. **Asynchronous Event Streaming**: For event-based communication
   - Kafka for reliable event delivery
   - Event schemas defined in `@austa/interfaces` package

### API-First Development

The AUSTA SuperApp follows an API-first development approach:

#### GraphQL API

The primary API contract is defined using GraphQL:

- **Schema-First Design**: API contracts are defined before implementation
- **Journey-Specific Schemas**: Each journey has its own GraphQL schema
- **API Gateway**: Combines journey schemas into a unified API
- **Type Safety**: Strong typing from API to database

#### REST APIs

Internal service-to-service communication uses REST APIs:

- **Standardized Endpoints**: Consistent URL structure and response formats
- **Versioned APIs**: Explicit versioning for backward compatibility
- **Error Handling**: Standardized error responses across services

### Cross-Platform Frontend

The frontend implementation spans web and mobile platforms:

#### Shared Design System

The design system is organized into four discrete workspace packages:

- **@austa/design-system**: The main package that exports all components, themes, and utilities
- **@design-system/primitives**: Contains design tokens, atomic UI building blocks, and primitive components
- **@austa/interfaces**: Houses shared TypeScript definitions and type contracts
- **@austa/journey-context**: Provides context providers and hooks for journey-specific state management

#### Platform-Specific Implementation

- **Mobile Application**: React Native with platform-specific optimizations
- **Web Application**: Next.js with server-side rendering and SEO optimization
- **Shared Logic**: Common business logic, data fetching, and state management

## Data Flow

The AUSTA SuperApp implements several key data flows:

### Authentication Flow

1. Users authenticate through the Auth Service
2. JWT tokens are issued and cached in Redis
3. Subsequent requests include the JWT token for validation
4. Token refresh occurs when access tokens expire

### Journey Data Flows

#### Health Journey

1. Health metrics from wearables and user inputs flow through the Health Service
2. Historical medical data is retrieved from EHR systems via FHIR APIs
3. Time-sensitive health metrics are analyzed for anomalies and trends

#### Care Journey

1. Appointment requests flow through the Care Service to provider systems
2. Telemedicine sessions establish direct WebRTC connections
3. Care plans are stored and tracked for adherence

#### Plan Journey

1. Insurance coverage details are synchronized from external systems
2. Claims submissions flow through validation before transmission
3. Status updates are returned asynchronously

### Gamification Flow

1. User actions generate events published to Kafka
2. The Gamification Engine consumes events and processes them against rules
3. User achievements and points are updated in Redis and PostgreSQL
4. Leaderboards and achievement notifications are generated

### Notification Flow

1. Services send notification requests to the Notification Service
2. The service determines appropriate delivery channels
3. Notifications are delivered via push notifications, SMS, or email
4. Delivery status is tracked and retried as needed

## Integration Points

The AUSTA SuperApp integrates with several external systems:

| System | Integration Type | Data Exchange Pattern | Protocol/Format |
|--------|------------------|------------------------|------------------|
| EHR Systems | API | Request/Response | HL7 FHIR/REST/JSON |
| Insurance Platforms | API | Request/Response, Webhooks | REST/JSON, SOAP/XML |
| Payment Processors | API | Request/Response | REST/JSON |
| Telemedicine Platform | SDK, API | Real-time, Request/Response | WebRTC, REST/JSON |
| Wearable Devices | SDK, API | Batch, Streaming | BLE, REST/JSON |
| Communication Services | API | Asynchronous | REST/JSON |

These integration points are managed through dedicated adapters in each journey service, ensuring proper data transformation, error handling, and retry mechanisms.