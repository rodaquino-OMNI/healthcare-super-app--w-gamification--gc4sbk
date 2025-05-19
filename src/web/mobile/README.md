# AUSTA SuperApp - Mobile Application

This directory contains the source code for the AUSTA SuperApp's mobile application, built using React Native. The mobile app is part of the AUSTA SuperApp ecosystem, providing a journey-centered approach with gamification features across health, care, and plan journeys.

## Technology Stack

- **React Native**: Cross-platform mobile development framework (version 0.73.4)
- **TypeScript**: Type-safe programming language
- **Expo**: Managed workflow for React Native development and deployment
- **@austa/design-system**: UI component library with journey-specific theming
- **@design-system/primitives**: Design tokens and primitive components
- **@austa/interfaces**: Shared TypeScript interfaces
- **@austa/journey-context**: Journey-specific state management

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later, yarn 1.22.x or later, or pnpm 8.x or later
- Expo CLI: `npm install -g expo-cli` or `yarn global add expo-cli`
- iOS: Xcode 14 or later (for iOS development)
- Android: Android Studio with SDK 33 or later (for Android development)

### Installation

1. Clone the repository
2. Navigate to the root of the monorepo
3. Install dependencies using the workspace package manager:
   ```bash
   # Using yarn
   yarn install
   
   # Using npm
   npm install
   
   # Using pnpm
   pnpm install
   ```
4. Navigate to the mobile app directory:
   ```bash
   cd src/web/mobile
   ```
5. Start the Expo development server:
   ```bash
   yarn start
   # or
   npm run start
   # or
   expo start
   ```
6. Follow the Expo CLI instructions to run the app on a simulator or physical device

## Directory Structure

```
src/web/mobile/
├── android/                # Android-specific native code
├── ios/                    # iOS-specific native code
├── src/
│   ├── api/                # API client and service integration
│   ├── assets/             # Static assets (images, fonts, animations)
│   │   ├── animations/     # Lottie animation files
│   │   ├── fonts/          # Custom font files
│   │   └── images/         # Image assets
│   │       ├── achievements/  # Achievement badge images
│   │       ├── app/           # App-wide images
│   │       └── journey/       # Journey-specific images
│   ├── components/         # Reusable UI components
│   │   ├── forms/          # Form components
│   │   ├── lists/          # List and item components
│   │   ├── modals/         # Modal components
│   │   └── shared/         # Shared utility components
│   ├── constants/          # Application constants
│   ├── context/            # Context providers (uses @austa/journey-context)
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Application screens
│   │   ├── auth/           # Authentication screens
│   │   ├── care/           # Care journey screens
│   │   ├── health/         # Health journey screens
│   │   ├── home/           # Home and dashboard screens
│   │   └── plan/           # Plan journey screens
│   ├── types/              # TypeScript type definitions (uses @austa/interfaces)
│   └── utils/              # Utility functions
├── .env.example           # Example environment variables
├── app.config.js          # Expo configuration
├── App.tsx                # Application entry point
├── babel.config.js        # Babel configuration
├── metro.config.js        # Metro bundler configuration
├── package.json           # Package dependencies
└── tsconfig.json          # TypeScript configuration
```

## Design System Integration

The mobile app integrates with the AUSTA design system through the following packages:

### @austa/design-system

Provides journey-specific UI components with consistent theming across the application. Import components directly:

```typescript
import { Button, Card, ProgressCircle } from '@austa/design-system';
import { HealthMetricCard } from '@austa/design-system/health';
import { AppointmentCard } from '@austa/design-system/care';
import { BenefitCard } from '@austa/design-system/plan';
```

### @design-system/primitives

Contains foundational design tokens and primitive components:

```typescript
import { Box, Text, Stack, Icon, Touchable } from '@design-system/primitives';
import { colors, spacing, typography } from '@design-system/primitives/tokens';
```

### @austa/interfaces

Provides shared TypeScript interfaces for consistent data models:

```typescript
import { HealthMetric } from '@austa/interfaces/health';
import { Appointment } from '@austa/interfaces/care';
import { InsuranceClaim } from '@austa/interfaces/plan';
```

### @austa/journey-context

Manages journey-specific state with React context providers:

```typescript
import { useHealthContext } from '@austa/journey-context/health';
import { useCareContext } from '@austa/journey-context/care';
import { usePlanContext } from '@austa/journey-context/plan';
```

## Environment Configuration

The application's configuration is managed through environment variables. Create a `.env` file in the root directory based on the `.env.example` template.

### Required Environment Variables

```
# API Configuration
API_URL=https://api.austa.example.com
GRAPHQL_URL=https://api.austa.example.com/graphql

# Authentication
AUTH_CLIENT_ID=mobile_client
AUTH_REDIRECT_URI=com.austa.superapp:/callback

# Feature Flags
ENABLE_HEALTH_JOURNEY=true
ENABLE_CARE_JOURNEY=true
ENABLE_PLAN_JOURNEY=true

# Design System
DESIGN_SYSTEM_VERSION=1.0.0
```

### Package Resolution

The Metro bundler is configured to resolve the design system packages correctly. If you encounter module resolution issues, verify that the `metro.config.js` includes the proper workspace package resolution:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

// Add workspace packages to resolver
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

## Testing

The mobile application uses Jest and React Native Testing Library for unit and component testing.

### Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```

### Testing Components with Design System

When testing components that use the design system, you'll need to wrap them in the appropriate providers:

```typescript
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@austa/design-system';
import { JourneyProvider } from '@austa/journey-context';

const renderWithProviders = (ui, options = {}) => {
  return render(
    <ThemeProvider>
      <JourneyProvider>
        {ui}
      </JourneyProvider>
    </ThemeProvider>,
    options
  );
};

test('renders correctly', () => {
  const { getByText } = renderWithProviders(<YourComponent />);
  expect(getByText('Expected Text')).toBeTruthy();
});
```

## Troubleshooting

### Common Issues

#### Module Resolution Errors

If you encounter errors like `Unable to resolve module '@austa/design-system'`, try the following:

1. Verify that all workspace packages are installed:
   ```bash
   cd ../../.. # Navigate to monorepo root
   yarn install # Reinstall all dependencies
   ```

2. Clear Metro bundler cache:
   ```bash
   yarn start --clear
   # or
   expo start -c
   ```

3. Check that your `tsconfig.json` includes the proper path aliases:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "paths": {
         "@austa/design-system": ["../design-system/src"],
         "@design-system/primitives": ["../primitives/src"],
         "@austa/interfaces": ["../interfaces"],
         "@austa/journey-context": ["../journey-context/src"]
       }
     }
   }
   ```

#### Version Conflicts

If you encounter React Native version conflicts, ensure that all packages use the same React Native version (0.73.4):

1. Check for duplicate React Native installations:
   ```bash
   yarn why react-native
   # or
   npm ls react-native
   ```

2. Update the `resolutions` field in your `package.json`:
   ```json
   {
     "resolutions": {
       "react-native": "0.73.4",
       "react": "18.2.0"
     }
   }
   ```

3. Reinstall dependencies:
   ```bash
   yarn install
   ```

## Deployment

The mobile application is deployed using Expo Application Services (EAS).

### Prerequisites

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   # or
   yarn global add eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

### Building for App Stores

1. Configure your app in `app.config.js`:
   ```javascript
   export default {
     expo: {
       name: "AUSTA SuperApp",
       slug: "austa-superapp",
       version: "1.0.0",
       // Other configuration...
     }
   };
   ```

2. Configure EAS builds in `eas.json`:
   ```json
   {
     "build": {
       "production": {
         "distribution": "store",
         "android": {
           "buildType": "app-bundle"
         },
         "ios": {
           "distribution": "app-store"
         }
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         },
         "ios": {
           "simulator": true
         }
       }
     }
   }
   ```

3. Build for production:
   ```bash
   # Build for both platforms
   eas build --platform all --profile production
   
   # Build for iOS only
   eas build --platform ios --profile production
   
   # Build for Android only
   eas build --platform android --profile production
   ```

4. Submit to app stores:
   ```bash
   # Submit to Apple App Store
   eas submit --platform ios
   
   # Submit to Google Play Store
   eas submit --platform android
   ```

### Over-the-Air Updates

EAS Update allows you to push updates to your app without going through the app store review process:

```bash
# Create and publish an update
eas update --branch production --message "Fix: resolved login issue"
```

## Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/react-native-testing-library/intro)