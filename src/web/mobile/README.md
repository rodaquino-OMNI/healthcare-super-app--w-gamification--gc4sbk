# AUSTA SuperApp - Mobile Application

This directory contains the source code for the AUSTA SuperApp's mobile application, built using React Native. The mobile app is part of the AUSTA SuperApp ecosystem, providing a journey-centered healthcare experience with cross-journey gamification features.

## Technology Stack

- **React Native**: v0.73.4 - Cross-platform mobile development framework
- **TypeScript**: v5.3.3 - Strongly-typed programming language
- **Expo (EAS)**: Latest - Managed workflow for React Native development and deployment
- **TanStack Query**: v5.25.0 - Data fetching and caching library
- **Redux Toolkit**: v2.1.0 - State management library
- **React Navigation**: v6.x - Navigation library for React Native

## Design System Integration

The mobile application integrates with the following design system packages:

- **@austa/design-system**: Main component library with journey-specific theming
- **@design-system/primitives**: Foundational design tokens and primitive components
- **@austa/interfaces**: Shared TypeScript interfaces for type safety
- **@austa/journey-context**: Context providers for journey-specific state management

These packages ensure consistent UI/UX across both web and mobile platforms while maintaining platform-specific optimizations.

## Getting Started

### Prerequisites

- Node.js ≥18.0.0
- npm, yarn, or pnpm (pnpm recommended for workspace compatibility)
- Expo CLI: `npm install -g expo-cli` or `yarn global add expo-cli`
- iOS: XCode and CocoaPods (for iOS development)
- Android: Android Studio and Android SDK (for Android development)

### Installation

1. Clone the repository
2. Navigate to the root directory of the monorepo
3. Install dependencies using the workspace package manager:
   ```bash
   pnpm install
   ```
   This will install dependencies for all packages in the monorepo, including the design system packages.

4. Navigate to the mobile app directory:
   ```bash
   cd src/web/mobile
   ```

5. Start the Expo development server:
   ```bash
   pnpm start
   ```

6. Follow the Expo CLI instructions to run the app on a simulator or physical device.

## Directory Structure

```
src/web/mobile/
├── android/                # Android-specific files
├── ios/                    # iOS-specific files
├── src/
│   ├── api/                # API client and service integration
│   ├── assets/             # Static assets (images, fonts, animations)
│   │   ├── animations/     # Lottie animation files
│   │   ├── fonts/          # Custom font files
│   │   └── images/         # Image assets
│   │       ├── achievements/  # Gamification achievement images
│   │       ├── app/           # App-wide images
│   │       └── journey/       # Journey-specific images
│   ├── components/         # Reusable UI components
│   │   ├── forms/          # Form components
│   │   ├── lists/          # List and item components
│   │   ├── modals/         # Modal components
│   │   └── shared/         # Shared components across journeys
│   ├── constants/          # Application constants
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Application screens
│   │   ├── auth/           # Authentication screens
│   │   ├── care/           # Care journey screens
│   │   ├── health/         # Health journey screens
│   │   ├── home/           # Home and dashboard screens
│   │   └── plan/           # Plan journey screens
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── .env.development        # Development environment variables
├── .env.production         # Production environment variables
├── app.config.js           # Expo configuration
├── App.tsx                 # Application entry point
├── babel.config.js         # Babel configuration
├── metro.config.js         # Metro bundler configuration
├── package.json            # Package dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Environment Configuration

The application uses environment variables for configuration. Create the following files in the root directory:

- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

Required environment variables:

```
API_URL=https://api.austa.health
GRAPHQL_URL=https://api.austa.health/graphql
AUTH_URL=https://auth.austa.health
APP_ENV=development
```

The application uses `@env` package to access environment variables in the code:

```typescript
import { API_URL, APP_ENV } from '@env';
```

## Using the Design System

### Importing Components

```typescript
// Import design system components
import { Button, Card, ProgressCircle } from '@austa/design-system';

// Import primitive components
import { Box, Text, Stack } from '@design-system/primitives';

// Import journey context
import { useHealthContext } from '@austa/journey-context';

// Import shared interfaces
import { HealthMetric } from '@austa/interfaces';
```

### Theming

The application uses journey-specific theming. To apply a theme:

```typescript
import { ThemeProvider, healthTheme } from '@austa/design-system';

const MyComponent = () => (
  <ThemeProvider theme={healthTheme}>
    {/* Your components here */}
  </ThemeProvider>
);
```

## Testing

The application uses Jest and React Testing Library for testing. Tests are located alongside the components they test.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Test Structure

Tests follow a component-based structure:

```
src/components/Button/
├── Button.tsx
├── Button.test.tsx
└── index.ts
```

### Component Testing

Components should be tested for:

1. Rendering correctly with default props
2. Handling user interactions
3. Applying correct styles based on props
4. Journey-specific theming
5. Accessibility compliance

## Troubleshooting

### Common Issues

#### Design System Package Resolution

If you encounter issues with resolving design system packages, ensure:

1. The workspace is properly configured in the root `package.json`
2. Metro config includes the correct `extraNodeModules` and `watchFolders`
3. TypeScript paths are correctly configured in `tsconfig.json`

#### Metro Bundler Errors

If Metro bundler fails to resolve dependencies:

1. Clear Metro cache: `expo start --clear`
2. Ensure all workspace packages are built: `pnpm build:packages`
3. Check for circular dependencies between packages

#### React Native Version Conflicts

If you encounter React Native version conflicts:

1. Check the `resolutions` field in the root `package.json`
2. Ensure all packages use compatible React Native versions
3. Run `pnpm why react-native` to identify version conflicts

## Deployment

The mobile application is deployed using Expo Application Services (EAS).

### Build Configuration

The `eas.json` file contains build profiles for different environments:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

### Building for App Stores

```bash
# Build for iOS App Store
pnpm build:ios

# Build for Google Play Store
pnpm build:android

# Build for internal testing
pnpm build:preview
```

### Over-the-Air Updates

The application supports Expo OTA updates for quick deployment of JavaScript changes:

```bash
# Publish an update to the preview channel
pnpm publish:preview

# Publish an update to the production channel
pnpm publish:production
```

## Contributing

Please follow the project's coding standards and contribution guidelines when making changes to the mobile application.

1. Create a feature branch from `develop`
2. Make your changes
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## License

This project is proprietary and confidential. Unauthorized copying, transfer, or reproduction of the contents of this repository is prohibited.