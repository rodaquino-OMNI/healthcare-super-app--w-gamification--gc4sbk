# AUSTA SuperApp Web Component

This directory contains the source code for the web component of the AUSTA SuperApp, including both the web application (Next.js) and mobile application (React Native) with shared code and design system.

## Architecture

The web component follows a journey-centered architecture with the following key components:

- **Shared**: Common code, types, and utilities shared between web and mobile

- **Design System**: Unified component library with journey-specific theming
  - **@austa/design-system**: Main UI component library with journey-specific theming
  - **@design-system/primitives**: Design tokens and atomic UI building blocks

- **Interfaces**: Shared TypeScript definitions and type contracts
  - **@austa/interfaces**: Cross-journey TypeScript interfaces for data models

- **Journey Context**: Context providers for journey-specific state management
  - **@austa/journey-context**: React context providers for journey state

- **Mobile**: React Native application for iOS and Android

- **Web**: Next.js application for browser-based access

This architecture enables code reuse while maintaining platform-specific optimizations and a consistent user experience across all platforms.

## Directory Structure

```markdown
src/web/
├── shared/            # Shared code between web and mobile
│   ├── types/         # TypeScript type definitions
│   ├── constants/     # Shared constants
│   ├── utils/         # Utility functions
│   ├── graphql/       # GraphQL queries and mutations
│   └── config/        # Shared configuration
├── design-system/     # UI component library
│   ├── src/           # Component source code
│   ├── storybook/     # Component documentation
│   └── tests/         # Component tests
├── primitives/        # Design system primitives
│   ├── src/           # Primitive components and tokens
│   ├── tokens/        # Design tokens (colors, typography, spacing)
│   └── components/    # Atomic UI components (Box, Text, Stack)
├── interfaces/        # Shared TypeScript interfaces
│   ├── common/        # Common interfaces
│   ├── auth/          # Authentication interfaces
│   ├── health/        # Health journey interfaces
│   ├── care/          # Care journey interfaces
│   ├── plan/          # Plan journey interfaces
│   └── gamification/  # Gamification interfaces
├── journey-context/   # Journey state management
│   ├── src/           # Context providers and hooks
│   ├── providers/     # Journey-specific providers
│   └── hooks/         # Custom hooks for journey state
├── mobile/            # React Native mobile application
│   ├── src/           # Application source code
│   ├── android/       # Android-specific code
│   └── ios/           # iOS-specific code
├── web/               # Next.js web application
│   ├── src/           # Application source code
│   ├── public/        # Static assets
│   └── pages/         # Next.js pages
├── package.json       # Root package.json for workspace
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 1.22.19+
- For mobile development: Android Studio and/or Xcode

### Installation

```bash
# Install dependencies
cd src/web
yarn install

# Set up environment variables
cp .env.example .env.local

# Build shared packages in the correct order
yarn build:packages
```

### Development

```bash
# Start the web application
cd src/web
yarn web:dev

# Start the mobile application
cd src/web
yarn mobile:start

# Run the design system storybook
cd src/web
yarn design-system:storybook
```

## Package Structure

The AUSTA SuperApp uses a monorepo structure with the following key packages:

### @design-system/primitives

Contains all design tokens, atomic UI building blocks, and primitive components that form the foundation of the design system:

- **Design Tokens**: Colors, typography, spacing, shadows, animation, breakpoints
- **UI Primitives**: Box, Text, Stack, Icon, Touchable

### @austa/design-system

The main package that exports all components, themes, and utilities for application consumption:

- **Core Components**: Button, Input, Card, Modal, etc.
- **Journey Components**: Health, Care, and Plan specific components
- **Data Visualization**: Charts and graphs for health metrics
- **Gamification Elements**: Achievement badges, leaderboards, etc.

### @austa/interfaces

Houses all shared TypeScript definitions and type contracts used across the design system and applications:

- **Theme Interfaces**: Type definitions for theme objects
- **Component Props**: Type definitions for component props
- **Data Models**: Interfaces for API responses and requests
- **Journey Types**: Type definitions for journey-specific data

### @austa/journey-context

Provides context providers and hooks for journey-specific state management across components:

- **Health Context**: Manages health data, goals, devices, and metrics state
- **Care Context**: Handles appointment scheduling, medication tracking, and provider information
- **Plan Context**: Manages insurance benefits, claims status, and coverage details
- **Cross-Journey State**: Facilitates data sharing between journeys when needed

## Journey Implementation

The AUSTA SuperApp implements three core user journeys across both web and mobile platforms:

1. **My Health (Minha Saúde)**

   - Health metrics dashboard with visualization
   - Medical history timeline
   - Health goals tracking
   - Device connections management

2. **Care Now (Cuidar-me Agora)**

   - Symptom checker
   - Appointment booking
   - Telemedicine sessions
   - Medication tracking

3. **My Plan & Benefits (Meu Plano & Benefícios)**

   - Coverage information
   - Digital insurance card
   - Claims submission and tracking
   - Cost simulator

Each journey has a distinct visual identity while maintaining consistency through the shared design system.

## Gamification Integration

The gamification engine is integrated across all journeys to enhance user engagement:

- Achievement badges and notifications
- Progress tracking for health goals
- XP and level system
- Rewards for completing actions

Gamification components are part of the design system and can be used in both web and mobile applications.

## Internationalization

The application supports multiple languages, with Brazilian Portuguese as the primary language:

- Translation files are stored in the `src/web/shared/i18n` directory
- The `i18next` library is used for translation management
- Date, number, and currency formatting is handled through locale-specific formatters

## Testing

The project uses the following testing approach:

- **Unit Tests**: Jest and React Testing Library
- **Component Tests**: Storybook and Chromatic
- **E2E Tests**: Cypress (web) and Detox (mobile)

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage
```

## Deployment

The applications are deployed using CI/CD pipelines:

- **Web**: Containerized with Docker and deployed to AWS ECS
- **Mobile**: Built using Expo EAS and deployed to app stores

Deployment configurations are managed in the `.github/workflows` directory.

## Troubleshooting

### Common Dependency Issues

#### Module Resolution Errors

If you encounter module resolution errors, check the following:

1. Ensure your `tsconfig.json` has the correct path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@austa/design-system": ["./design-system/src"],
      "@design-system/primitives": ["./primitives/src"],
      "@austa/interfaces": ["./interfaces"],
      "@austa/journey-context": ["./journey-context/src"],
      "@app/*": ["./*/src"]  
    }
  }
}
```

2. For Next.js, verify that your `next.config.js` includes the proper module resolution:

```js
module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@austa/design-system': path.resolve(__dirname, '../design-system/src'),
      '@design-system/primitives': path.resolve(__dirname, '../primitives/src'),
      '@austa/interfaces': path.resolve(__dirname, '../interfaces'),
      '@austa/journey-context': path.resolve(__dirname, '../journey-context/src'),
    };
    return config;
  },
};
```

3. For React Native, check your `metro.config.js` configuration:

```js
module.exports = {
  resolver: {
    extraNodeModules: {
      '@austa/design-system': path.resolve(__dirname, '../design-system/src'),
      '@design-system/primitives': path.resolve(__dirname, '../primitives/src'),
      '@austa/interfaces': path.resolve(__dirname, '../interfaces'),
      '@austa/journey-context': path.resolve(__dirname, '../journey-context/src'),
    },
  },
};
```

#### Version Conflicts

If you encounter version conflicts between packages:

1. Check the root `package.json` for resolutions field:

```json
{
  "resolutions": {
    "react": "18.2.0",
    "react-native": "0.71.8",
    "minimatch": "5.1.0",
    "semver": "7.5.4",
    "ws": "8.16.0"
  }
}
```

2. Run `yarn why <package-name>` to identify dependency paths causing conflicts

3. Clear your cache and reinstall dependencies:

```bash
rm -rf node_modules
rm -rf .yarn/cache
yarn cache clean
yarn install
```

#### Build Failures

If you encounter build failures:

1. Ensure packages are built in the correct order:

```bash
yarn build:primitives
yarn build:interfaces
yarn build:journey-context
yarn build:design-system
```

2. Check for TypeScript errors in each package:

```bash
yarn workspace @design-system/primitives tsc --noEmit
yarn workspace @austa/interfaces tsc --noEmit
yarn workspace @austa/journey-context tsc --noEmit
yarn workspace @austa/design-system tsc --noEmit
```

## Contributing

Please refer to the project's `CONTRIBUTING.md` file for guidelines on contributing to the web component.

## License

This project is licensed under the MIT License - see the LICENSE file for details.