# AUSTA SuperApp

AUSTA SuperApp is a unified digital health platform designed to transform healthcare delivery through a journey-centered approach with gamification at its core. The platform consolidates multiple healthcare functions into three intuitive user journeys: "Minha Saúde" (My Health), "Cuidar-me Agora" (Care Now), and "Meu Plano & Benefícios" (My Plan & Benefits).

## Introduction

The AUSTA SuperApp addresses the fragmentation and complexity in current healthcare digital experiences by providing a cohesive platform that aligns with how users naturally think about their healthcare needs.

### Business Problems Addressed

- Fragmented healthcare digital experiences
- Low digital adoption and adherence
- Complex user interfaces causing friction
- Disconnected health data

### Solution Approach

- Journey-centered design with gamification
- Simplified architecture with consistent UX
- Unified design system with journey color-coding
- Integrated data architecture

### Value Proposition

- Improved user engagement and health outcomes
- Reduced operational costs and improved efficiency
- Enhanced user satisfaction and retention
- Better clinical decision-making

The AUSTA SuperApp is built with a simplified technology stack centered around React Native, Next.js, Node.js, and PostgreSQL. The system architecture follows a modular microservices approach organized around the three core user journeys.

## Technical Specifications

For comprehensive technical details, refer to the [Technical Specifications](./docs/technical-specifications.md) document, which includes:

- Detailed system architecture
- Feature catalog and functional requirements
- API design and integration patterns
- Database schema and data flow
- Frontend component library
- Security architecture and compliance considerations
- Infrastructure and deployment strategy
- Testing approach and quality metrics

## Journey-Centered Architecture

The AUSTA SuperApp is built around three distinct user journeys, each with its own dedicated microservice and UI components:

1. **Minha Saúde (My Health)**: Focuses on health tracking, medical history, and wellness goals
   - Health metrics monitoring
   - Medical history and records
   - Wellness goals and tracking
   - Device integration (wearables)

2. **Cuidar-me Agora (Care Now)**: Addresses immediate healthcare needs
   - Appointment scheduling
   - Telemedicine sessions
   - Medication management
   - Symptom checking

3. **Meu Plano & Benefícios (My Plan & Benefits)**: Manages insurance and financial aspects
   - Insurance coverage details
   - Claims submission and tracking
   - Benefits exploration
   - Document management

These journeys are unified by a cross-cutting **Gamification Engine** that processes events from all journeys to drive user engagement through achievements, challenges, and rewards.

## Repository Structure

This repository follows a dual-monorepo architecture:

```
healthcare-super-app/
├── src/
│   ├── backend/       # Backend Lerna monorepo with NestJS microservices
│   └── web/           # Frontend Turbo monorepo with Next.js and React Native
├── infrastructure/    # Kubernetes and Terraform configurations
└── docker-compose.dev.yml  # Development Docker Compose configuration
```

### Backend Structure

The backend is a Lerna monorepo with several NestJS microservices:

```
src/backend/
├── api-gateway/        # API Gateway service
├── auth-service/       # Authentication service
├── health-service/     # My Health journey service
├── care-service/       # Care Now journey service
├── plan-service/       # My Plan & Benefits journey service
├── gamification-engine/ # Gamification Engine service
├── notification-service/ # Notification service
├── shared/             # Shared code, utilities, and Prisma schema
└── packages/           # Internal shared packages
    ├── auth/           # Authentication utilities
    ├── database/       # Database connection and utilities
    ├── errors/         # Error handling framework
    ├── events/         # Event processing utilities
    ├── interfaces/     # Shared TypeScript interfaces
    ├── logging/        # Logging utilities
    ├── tracing/        # Distributed tracing
    └── utils/          # General utilities
```

### Frontend Structure

The frontend is a Turbo monorepo with shared code between web and mobile:

```
src/web/
├── design-system/      # Shared component library with journey-specific theming
├── primitives/         # Design system primitives (colors, typography, spacing)
├── interfaces/         # Shared TypeScript interfaces
├── journey-context/    # Journey-specific context providers
├── shared/             # Shared utilities and types
├── mobile/             # React Native mobile application
└── web/                # Next.js web application
```

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- Yarn package manager (v1.22.x or later)
- Docker and Docker Compose
- AWS CLI (for deployment)

### Package Management

This project uses Yarn as the official package manager. Please do not use npm to avoid dependency resolution issues.

```bash
# Install dependencies (correct)
yarn install

# DO NOT use npm (incorrect)
# npm install
```

For detailed guidance on dependency management, refer to the [Package Manager Standardization](./docs/package-manager-standardization.md) document.

### Dependency Management

The project uses standardized versions for all dependencies to ensure consistency across services:

| Dependency | Version | Usage |
|------------|---------|-------|
| TypeScript | 5.3.3 | All services and applications |
| NestJS | 10.3.0 | Backend services |
| React | 18.2.0 | Web and mobile applications |
| React Native | 0.73.4 | Mobile application |
| Next.js | 14.2.0 | Web application |

All workspace packages use proper path aliases for module resolution:

```typescript
// Example of standardized imports
import { Button } from '@austa/design-system';
import { Colors } from '@design-system/primitives';
import { UserProfile } from '@austa/interfaces';
import { useHealthContext } from '@austa/journey-context';
```

For details about dependency fixes and the scaling solution, see [Dependency Fixes](./DEPENDENCY_FIXES.md).

### Development Environment Setup

Each part of the application can be run independently. You can choose to start with either the backend services, the web application, or the mobile application depending on your development focus.

#### Starting the Infrastructure Services

First, start the infrastructure services (database, Redis, Kafka):

```bash
docker-compose -f docker-compose.dev.yml up -d db redis kafka zookeeper
```

#### Running the Backend Services

You can run all backend services or just specific ones:

1. Navigate to the backend directory:
   ```bash
   cd src/backend
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start all backend services:
   ```bash
   yarn start:dev
   ```

4. Or start a specific service (e.g., gamification-engine):
   ```bash
   yarn start:gamification-engine
   ```

#### Running the Web Application

1. Navigate to the web directory:
   ```bash
   cd src/web
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the web application:
   ```bash
   yarn web:dev
   ```

4. Access the web application at <http://localhost:3000>

#### Running the Mobile Application

1. From the web directory:
   ```bash
   cd src/web
   ```

2. Start the mobile application:
   ```bash
   yarn dev --filter=mobile
   ```

3. Follow the instructions to open the app in Expo or an emulator

### Working with Journey-Specific Development

When developing features for specific journeys, you'll need to work with the corresponding services and UI components:

#### Health Journey Development

1. Start the health-service backend:
   ```bash
   cd src/backend
   yarn start:health-service
   ```

2. Import the health journey context in your components:
   ```typescript
   import { useHealthContext } from '@austa/journey-context';
   import { HealthTheme } from '@austa/design-system/themes';
   import { MetricCard } from '@austa/design-system/health';
   ```

#### Care Journey Development

1. Start the care-service backend:
   ```bash
   cd src/backend
   yarn start:care-service
   ```

2. Import the care journey context in your components:
   ```typescript
   import { useCareContext } from '@austa/journey-context';
   import { CareTheme } from '@austa/design-system/themes';
   import { AppointmentCard } from '@austa/design-system/care';
   ```

#### Plan Journey Development

1. Start the plan-service backend:
   ```bash
   cd src/backend
   yarn start:plan-service
   ```

2. Import the plan journey context in your components:
   ```typescript
   import { usePlanContext } from '@austa/journey-context';
   import { PlanTheme } from '@austa/design-system/themes';
   import { BenefitCard } from '@austa/design-system/plan';
   ```

### Working with the Gamification Engine

The gamification engine can be run independently for development and testing:

1. Navigate to the gamification engine directory:
   ```bash
   cd src/backend/gamification-engine
   ```

2. Make sure you have set up the environment variables:
   ```bash
   cp .env.example .env
   # Edit the .env file as needed
   ```

3. Start the gamification engine:
   ```bash
   yarn start:dev
   ```

4. The gamification engine will be available at <http://localhost:3005>

## Building for Production

1. Build all components:
   ```bash
   # For backend
   cd src/backend
   yarn build
   
   # For web and mobile
   cd src/web
   yarn build
   ```

2. Deploy using the provided infrastructure configurations:
   ```bash
   # Using the Makefile
   make deploy-staging
   # OR
   make deploy-production
   ```

## Troubleshooting

### Common Dependency Issues

#### Module Resolution Errors

If you encounter module resolution errors, check the following:

1. Ensure you're using the correct path aliases in imports:
   ```typescript
   // Correct
   import { Button } from '@austa/design-system';
   
   // Incorrect
   import { Button } from '../../design-system';
   ```

2. Verify that tsconfig.json has the proper path mappings:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@austa/*": ["../*/src"],
         "@design-system/*": ["../design-system/src/*"],
         "@app/*": ["./src/*"]
       }
     }
   }
   ```

#### Version Conflicts

If you encounter version conflicts, check the following:

1. Ensure you're using Yarn as the package manager
2. Check for resolutions in the root package.json
3. Run `yarn why <package-name>` to see why a package is installed
4. Use the standardized versions listed in the Dependency Management section

#### Build Failures

If you encounter build failures, try the following:

1. Clean the build cache:
   ```bash
   yarn clean
   ```

2. Rebuild with verbose logging:
   ```bash
   yarn build --verbose
   ```

3. Check for circular dependencies:
   ```bash
   yarn madge --circular --extensions ts,tsx src
   ```

## Contributing

We welcome contributions to the AUSTA SuperApp project! Please follow these guidelines:

### Code Style

- Follow the project's coding standards
- Use TypeScript for type safety
- Follow the journey-centered architecture
- Write tests for new features

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a new Pull Request

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the user experience and journey-centered design
- Consider security and privacy in all contributions

## License

This project is licensed under the [MIT License](LICENSE).