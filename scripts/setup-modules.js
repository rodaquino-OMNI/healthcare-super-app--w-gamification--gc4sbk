#!/usr/bin/env node

/**
 * setup-modules.js
 * 
 * This script orchestrates the setup and configuration of modules across the monorepo.
 * It creates directory structures, generates stub implementation files, creates export files,
 * and adjusts package configurations.
 * 
 * Key responsibilities:
 * 1. Scaffold missing packages (@austa/design-system, @design-system/primitives, @austa/interfaces, @austa/journey-context)
 * 2. Create necessary directory structures and stub files
 * 3. Update package.json files with correct dependencies and configurations
 * 4. Set up proper exports and imports for journey-specific modules
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Root directory of the project
const rootDir = process.cwd();

// Utility functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFileIfNotExists(filePath, content) {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating file: ${filePath}`);
    fs.writeFileSync(filePath, content);
  }
}

function updatePackageJson(packagePath, updateFn) {
  if (fs.existsSync(packagePath)) {
    console.log(`Updating package.json: ${packagePath}`);
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const updatedPackageJson = updateFn(packageJson);
    fs.writeFileSync(packagePath, JSON.stringify(updatedPackageJson, null, 2));
  } else {
    console.log(`Warning: ${packagePath} does not exist. Skipping update.`);
  }
}

// 1. Scaffold Backend Shared Services (keeping existing functionality)
function setupBackendSharedServices() {
  console.log('\n=== Setting up Backend Shared Services ===');
  
  const sharedSrcDir = path.join(rootDir, 'src', 'backend', 'shared', 'src');
  ensureDirectoryExists(sharedSrcDir);
  
  // Create shared service directories
  const sharedServices = ['database', 'redis', 'logging', 'kafka', 'exceptions', 'tracing'];
  
  sharedServices.forEach(service => {
    const serviceDir = path.join(sharedSrcDir, service);
    ensureDirectoryExists(serviceDir);
    
    // Create index.ts for each service
    const indexPath = path.join(serviceDir, 'index.ts');
    writeFileIfNotExists(indexPath, `// Export all ${service} related modules\n`);
    
    // Create stub implementation files based on service type
    if (service === 'database') {
      writeFileIfNotExists(
        path.join(serviceDir, 'prisma.service.ts'),
        `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';\nimport { PrismaClient } from '@prisma/client';\n\n@Injectable()\nexport class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {\n  constructor() {\n    super({\n      log: ['error', 'warn'],\n    });\n  }\n\n  async onModuleInit() {\n    await this.$connect();\n  }\n\n  async onModuleDestroy() {\n    await this.$disconnect();\n  }\n}\n`
      );
    } else if (service === 'redis') {
      writeFileIfNotExists(
        path.join(serviceDir, 'redis.service.ts'),
        `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';\nimport { createClient } from 'redis';\n\n@Injectable()\nexport class RedisService implements OnModuleInit, OnModuleDestroy {\n  private client: any;\n\n  constructor() {\n    this.client = createClient({\n      url: process.env.REDIS_URL || 'redis://localhost:6379',\n    });\n\n    this.client.on('error', (err) => console.error('Redis Client Error', err));\n  }\n\n  async onModuleInit() {\n    await this.client.connect();\n  }\n\n  async onModuleDestroy() {\n    await this.client.disconnect();\n  }\n\n  getClient() {\n    return this.client;\n  }\n}\n`
      );
    } else if (service === 'logging') {
      writeFileIfNotExists(
        path.join(serviceDir, 'logger.service.ts'),
        `import { Injectable, LoggerService } from '@nestjs/common';\n\n@Injectable()\nexport class AppLoggerService implements LoggerService {\n  log(message: string, context?: string) {\n    console.log(\`[${context || 'Application'}] ${message}\`);\n  }\n\n  error(message: string, trace?: string, context?: string) {\n    console.error(\`[${context || 'Application'}] ${message}\`, trace || '');\n  }\n\n  warn(message: string, context?: string) {\n    console.warn(\`[${context || 'Application'}] ${message}\`);\n  }\n\n  debug(message: string, context?: string) {\n    if (process.env.NODE_ENV !== 'production') {\n      console.debug(\`[${context || 'Application'}] ${message}\`);\n    }\n  }\n\n  verbose(message: string, context?: string) {\n    if (process.env.LOG_LEVEL === 'verbose') {\n      console.log(\`[${context || 'Application'}] ${message}\`);\n    }\n  }\n}\n`
      );
    } else if (service === 'kafka') {
      writeFileIfNotExists(
        path.join(serviceDir, 'kafka.service.ts'),
        `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';\nimport { Kafka, Producer, Consumer } from 'kafkajs';\n\n@Injectable()\nexport class KafkaService implements OnModuleInit, OnModuleDestroy {\n  private kafka: Kafka;\n  private producer: Producer;\n  private consumers: Map<string, Consumer> = new Map();\n\n  constructor() {\n    this.kafka = new Kafka({\n      clientId: process.env.KAFKA_CLIENT_ID || 'austa-service',\n      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),\n    });\n\n    this.producer = this.kafka.producer();\n  }\n\n  async onModuleInit() {\n    await this.producer.connect();\n  }\n\n  async onModuleDestroy() {\n    await this.producer.disconnect();\n    for (const consumer of this.consumers.values()) {\n      await consumer.disconnect();\n    }\n  }\n\n  async sendMessage(topic: string, message: any) {\n    return this.producer.send({\n      topic,\n      messages: [{ value: JSON.stringify(message) }],\n    });\n  }\n\n  async createConsumer(groupId: string) {\n    if (this.consumers.has(groupId)) {\n      return this.consumers.get(groupId);\n    }\n\n    const consumer = this.kafka.consumer({ groupId });\n    await consumer.connect();\n    this.consumers.set(groupId, consumer);\n    return consumer;\n  }\n}\n`
      );
    } else if (service === 'exceptions') {
      writeFileIfNotExists(
        path.join(serviceDir, 'business-error.ts'),
        `export class BusinessError extends Error {\n  constructor(message: string, public readonly code: string) {\n    super(message);\n    this.name = 'BusinessError';\n  }\n}\n`
      );
      
      writeFileIfNotExists(
        path.join(serviceDir, 'validation-error.ts'),
        `export class ValidationError extends Error {\n  constructor(message: string, public readonly errors: Record<string, string[]>) {\n    super(message);\n    this.name = 'ValidationError';\n  }\n}\n`
      );
    }
  });
  
  // Create main index.ts in shared/src
  const mainIndexPath = path.join(sharedSrcDir, 'index.ts');
  const mainIndexContent = sharedServices.map(service => 
    `export * from './${service}';`
  ).join('\n') + '\n';
  
  writeFileIfNotExists(mainIndexPath, mainIndexContent);
}

// 2. Scaffold Gamification Engine (keeping existing functionality)
function setupGamificationEngine() {
  console.log('\n=== Setting up Gamification Engine ===');
  
  const gamificationSrcDir = path.join(rootDir, 'src', 'backend', 'gamification-engine', 'src');
  ensureDirectoryExists(gamificationSrcDir);
  
  // Create gamification module directories
  const gamificationModules = ['profiles', 'achievements', 'events', 'rewards'];
  
  gamificationModules.forEach(module => {
    const moduleDir = path.join(gamificationSrcDir, module);
    ensureDirectoryExists(moduleDir);
    
    // Create stub implementation files for profiles
    if (module === 'profiles') {
      writeFileIfNotExists(
        path.join(moduleDir, 'game-profile.entity.ts'),
        `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';\n\n@Entity('game_profiles')\nexport class GameProfile {\n  @PrimaryGeneratedColumn('uuid')\n  id: string;\n\n  @Column()\n  userId: string;\n\n  @Column({ default: 0 })\n  xp: number;\n\n  @Column({ default: 1 })\n  level: number;\n\n  @Column({ type: 'json', default: '[]' })\n  achievements: string[];\n\n  @Column({ type: 'json', default: '[]' })\n  activeQuests: string[];\n\n  @Column({ type: 'json', default: '[]' })\n  completedQuests: string[];\n\n  @Column({ type: 'json', default: '[]' })\n  rewards: string[];\n\n  @CreateDateColumn()\n  createdAt: Date;\n\n  @UpdateDateColumn()\n  updatedAt: Date;\n\n  // Calculate XP needed for next level\n  getNextLevelXP(): number {\n    return Math.floor(100 * Math.pow(1.5, this.level - 1));\n  }\n\n  // Add XP and handle level up\n  addXP(amount: number): { newXP: number; leveledUp: boolean; newLevel?: number } {\n    const oldLevel = this.level;\n    this.xp += amount;\n    \n    // Check for level up\n    let leveledUp = false;\n    while (this.xp >= this.getNextLevelXP()) {\n      this.level += 1;\n      leveledUp = true;\n    }\n    \n    return {\n      newXP: this.xp,\n      leveledUp,\n      newLevel: leveledUp ? this.level : undefined,\n    };\n  }\n}\n`
      );
    }
  });
}

// 3. Scaffold Web Packages (new functionality)
function setupWebPackages() {
  console.log('\n=== Setting up Web Packages ===');
  
  // Define the packages to create
  const packages = [
    {
      name: 'primitives',
      path: path.join(rootDir, 'src', 'web', 'primitives'),
      folders: ['src/tokens', 'src/components/Box', 'src/components/Text', 'src/components/Stack', 'src/components/Icon', 'src/components/Touchable']
    },
    {
      name: 'interfaces',
      path: path.join(rootDir, 'src', 'web', 'interfaces'),
      folders: ['auth', 'common', 'components', 'gamification', 'health', 'care', 'plan', 'themes', 'api', 'next', 'notification']
    },
    {
      name: 'journey-context',
      path: path.join(rootDir, 'src', 'web', 'journey-context'),
      folders: ['src/providers', 'src/hooks', 'src/utils', 'src/types', 'src/constants', 'src/storage', 'src/adapters/web', 'src/adapters/mobile']
    }
  ];
  
  // Create package directories and basic files
  packages.forEach(pkg => {
    console.log(`Setting up ${pkg.name} package...`);
    ensureDirectoryExists(pkg.path);
    
    // Create package folders
    pkg.folders.forEach(folder => {
      ensureDirectoryExists(path.join(pkg.path, folder));
    });
    
    // Create package.json
    createPackageJson(pkg);
    
    // Create tsconfig.json
    createTsConfig(pkg);
    
    // Create README.md
    createReadme(pkg);
    
    // Create index files
    createIndexFiles(pkg);
  });
  
  // Create stub implementation files for each package
  createPrimitivesStubs();
  createInterfacesStubs();
  createJourneyContextStubs();
}

function createPackageJson(pkg) {
  const packageJsonPath = path.join(pkg.path, 'package.json');
  
  let packageJson = {};
  
  if (pkg.name === 'primitives') {
    packageJson = {
      "name": "@design-system/primitives",
      "version": "1.0.0",
      "description": "Design system primitives for the AUSTA SuperApp",
      "main": "dist/index.js",
      "module": "dist/index.esm.js",
      "types": "dist/index.d.ts",
      "sideEffects": false,
      "scripts": {
        "build": "rollup -c",
        "dev": "rollup -c -w",
        "clean": "rimraf dist",
        "lint": "eslint 'src/**/*.{ts,tsx}'",
        "test": "jest",
        "test:watch": "jest --watch",
        "typecheck": "tsc --noEmit"
      },
      "dependencies": {
        "@emotion/is-prop-valid": "^1.2.1",
        "@emotion/styled": "^11.11.0",
        "polished": "^4.2.2"
      },
      "peerDependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-native": ">=0.71.0",
        "styled-components": "^6.1.0"
      },
      "devDependencies": {
        "@babel/core": "^7.23.0",
        "@babel/preset-env": "^7.22.20",
        "@babel/preset-react": "^7.22.15",
        "@babel/preset-typescript": "^7.23.0",
        "@rollup/plugin-babel": "^6.0.4",
        "@rollup/plugin-commonjs": "^25.0.5",
        "@rollup/plugin-node-resolve": "^15.2.3",
        "@testing-library/jest-dom": "^6.1.3",
        "@testing-library/react": "^14.0.0",
        "@types/jest": "^29.5.5",
        "@types/react": "^18.2.25",
        "@types/react-dom": "^18.2.10",
        "@types/react-native": "^0.72.3",
        "@types/styled-components": "^5.1.28",
        "eslint": "^8.51.0",
        "jest": "^29.7.0",
        "jest-environment-jsdom": "^29.7.0",
        "rimraf": "^5.0.5",
        "rollup": "^4.0.2",
        "rollup-plugin-dts": "^6.1.0",
        "rollup-plugin-peer-deps-external": "^2.2.4",
        "rollup-plugin-terser": "^7.0.2",
        "rollup-plugin-typescript2": "^0.36.0",
        "typescript": "^5.3.3"
      }
    };
  } else if (pkg.name === 'interfaces') {
    packageJson = {
      "name": "@austa/interfaces",
      "version": "1.0.0",
      "description": "Shared TypeScript interfaces for the AUSTA SuperApp",
      "main": "dist/index.js",
      "module": "dist/index.esm.js",
      "types": "dist/index.d.ts",
      "scripts": {
        "build": "tsc",
        "dev": "tsc --watch",
        "clean": "rimraf dist",
        "lint": "eslint 'src/**/*.{ts,tsx}'",
        "typecheck": "tsc --noEmit"
      },
      "dependencies": {
        "zod": "^3.22.4"
      },
      "peerDependencies": {
        "@types/react": "^18.2.0"
      },
      "devDependencies": {
        "@types/react": "^18.2.25",
        "eslint": "^8.51.0",
        "rimraf": "^5.0.5",
        "typescript": "^5.3.3"
      }
    };
  } else if (pkg.name === 'journey-context') {
    packageJson = {
      "name": "@austa/journey-context",
      "version": "1.0.0",
      "description": "Journey-specific context providers for the AUSTA SuperApp",
      "main": "dist/index.js",
      "module": "dist/index.esm.js",
      "types": "dist/index.d.ts",
      "scripts": {
        "build": "rollup -c",
        "dev": "rollup -c -w",
        "clean": "rimraf dist",
        "lint": "eslint 'src/**/*.{ts,tsx}'",
        "test": "jest",
        "test:watch": "jest --watch",
        "typecheck": "tsc --noEmit"
      },
      "dependencies": {
        "@austa/interfaces": "^1.0.0",
        "zustand": "^4.4.3"
      },
      "peerDependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-native": ">=0.71.0"
      },
      "devDependencies": {
        "@babel/core": "^7.23.0",
        "@babel/preset-env": "^7.22.20",
        "@babel/preset-react": "^7.22.15",
        "@babel/preset-typescript": "^7.23.0",
        "@rollup/plugin-babel": "^6.0.4",
        "@rollup/plugin-commonjs": "^25.0.5",
        "@rollup/plugin-node-resolve": "^15.2.3",
        "@testing-library/jest-dom": "^6.1.3",
        "@testing-library/react": "^14.0.0",
        "@testing-library/react-hooks": "^8.0.1",
        "@types/jest": "^29.5.5",
        "@types/react": "^18.2.25",
        "@types/react-dom": "^18.2.10",
        "@types/react-native": "^0.72.3",
        "eslint": "^8.51.0",
        "jest": "^29.7.0",
        "jest-environment-jsdom": "^29.7.0",
        "rimraf": "^5.0.5",
        "rollup": "^4.0.2",
        "rollup-plugin-dts": "^6.1.0",
        "rollup-plugin-peer-deps-external": "^2.2.4",
        "rollup-plugin-terser": "^7.0.2",
        "rollup-plugin-typescript2": "^0.36.0",
        "typescript": "^5.3.3"
      }
    };
  }
  
  writeFileIfNotExists(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function createTsConfig(pkg) {
  const tsConfigPath = path.join(pkg.path, 'tsconfig.json');
  
  let tsConfig = {};
  
  if (pkg.name === 'primitives') {
    tsConfig = {
      "extends": "../../tsconfig.json",
      "compilerOptions": {
        "target": "ES2018",
        "module": "ESNext",
        "lib": ["DOM", "ESNext"],
        "jsx": "react",
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "moduleResolution": "node",
        "baseUrl": ".",
        "paths": {
          "@tokens/*": ["src/tokens/*"],
          "@components/*": ["src/components/*"]
        },
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "composite": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx"]
    };
  } else if (pkg.name === 'interfaces') {
    tsConfig = {
      "extends": "../../tsconfig.json",
      "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "lib": ["DOM", "ESNext"],
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": ".",
        "strict": true,
        "moduleResolution": "node",
        "baseUrl": ".",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "composite": true
      },
      "include": ["**/*.ts", "**/*.tsx"],
      "exclude": ["node_modules", "dist"]
    };
  } else if (pkg.name === 'journey-context') {
    tsConfig = {
      "extends": "../../tsconfig.json",
      "compilerOptions": {
        "target": "ES2018",
        "module": "ESNext",
        "lib": ["DOM", "ESNext"],
        "jsx": "react",
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "moduleResolution": "node",
        "baseUrl": ".",
        "paths": {
          "@providers/*": ["src/providers/*"],
          "@hooks/*": ["src/hooks/*"],
          "@utils/*": ["src/utils/*"],
          "@types/*": ["src/types/*"],
          "@constants/*": ["src/constants/*"],
          "@storage/*": ["src/storage/*"],
          "@adapters/*": ["src/adapters/*"]
        },
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "composite": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
    };
  }
  
  writeFileIfNotExists(tsConfigPath, JSON.stringify(tsConfig, null, 2));
}

function createReadme(pkg) {
  const readmePath = path.join(pkg.path, 'README.md');
  
  let readmeContent = '';
  
  if (pkg.name === 'primitives') {
    readmeContent = `# @design-system/primitives

This package provides the foundational design tokens and primitive components for the AUSTA SuperApp design system.

## Installation

\`\`\`bash
yarn add @design-system/primitives
\`\`\`

## Design Tokens

The package exports the following design tokens:

- **Colors**: Brand colors, journey-specific themes (health: green, care: orange, plan: blue), semantic states, and neutral grayscale.
- **Typography**: Font families, sizes, weights, line heights, and letter spacing.
- **Spacing**: 8-point grid system for consistent layout spacing.
- **Shadows**: Elevation tokens (sm, md, lg, xl) with precise RGBA values.
- **Animation**: Standardized animation durations and easing curves.
- **Breakpoints**: Responsive breakpoints for adapting layouts across device sizes.

## Primitive Components

The package exports the following primitive components:

- **Box**: Layout component with comprehensive styling props.
- **Text**: Typography component with text styling props.
- **Stack**: Flex container with spacing and alignment props.
- **Icon**: SVG icon component with size and color props.
- **Touchable**: Cross-platform pressable component with interaction states.

## Usage

### Web

\`\`\`tsx
import { Box, Text, Stack } from '@design-system/primitives';
import { colors, spacing } from '@design-system/primitives/tokens';

const MyComponent = () => (
  <Box padding={spacing.md} backgroundColor={colors.background.primary}>
    <Stack direction="column" spacing={spacing.sm}>
      <Text variant="heading1">Hello World</Text>
      <Text variant="body">This is a primitive component example.</Text>
    </Stack>
  </Box>
);
\`\`\`

### React Native

\`\`\`tsx
import { Box, Text, Stack } from '@design-system/primitives';
import { colors, spacing } from '@design-system/primitives/tokens';

const MyComponent = () => (
  <Box padding={spacing.md} backgroundColor={colors.background.primary}>
    <Stack direction="column" spacing={spacing.sm}>
      <Text variant="heading1">Hello World</Text>
      <Text variant="body">This is a primitive component example.</Text>
    </Stack>
  </Box>
);
\`\`\`

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) file for guidelines.

## License

This package is part of the AUSTA SuperApp and is covered by its license.
`;
  } else if (pkg.name === 'interfaces') {
    readmeContent = `# @austa/interfaces

This package provides shared TypeScript interfaces for the AUSTA SuperApp, ensuring type consistency across both frontend and backend components.

## Installation

\`\`\`bash
yarn add @austa/interfaces
\`\`\`

## Usage

### Importing Interfaces

You can import interfaces for specific journeys or cross-cutting concerns:

\`\`\`typescript
// Import health journey interfaces
import { HealthMetric, HealthGoal, DeviceConnection } from '@austa/interfaces/health';

// Import care journey interfaces
import { Appointment, Provider, Medication } from '@austa/interfaces/care';

// Import plan journey interfaces
import { InsurancePlan, Claim, Benefit } from '@austa/interfaces/plan';

// Import auth interfaces
import { User, AuthSession } from '@austa/interfaces/auth';

// Import gamification interfaces
import { GameProfile, Achievement, Quest } from '@austa/interfaces/gamification';
\`\`\`

### Using with Zod Schemas

Many interfaces have corresponding Zod schemas for runtime validation:

\`\`\`typescript
import { User, userSchema } from '@austa/interfaces/auth';

// Type-safe parsing and validation
const parseUser = (data: unknown): User => {
  return userSchema.parse(data);
};
\`\`\`

## Available Interface Modules

- **auth**: Authentication and user-related interfaces
- **common**: Shared utility interfaces used across the application
- **components**: UI component prop interfaces
- **gamification**: Gamification system interfaces
- **health**: Health journey interfaces
- **care**: Care journey interfaces
- **plan**: Plan journey interfaces
- **themes**: Theme configuration interfaces
- **api**: API request/response interfaces
- **next**: Next.js specific interfaces
- **notification**: Notification system interfaces

## Extending Interfaces

When extending interfaces, follow these guidelines:

1. Maintain backward compatibility
2. Add new properties as optional when possible
3. Use union types for extensibility
4. Document changes thoroughly

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) file for guidelines.

## License

This package is part of the AUSTA SuperApp and is covered by its license.
`;
  } else if (pkg.name === 'journey-context') {
    readmeContent = `# @austa/journey-context

This package provides React context providers and hooks for journey-specific state management across the AUSTA SuperApp.

## Installation

\`\`\`bash
yarn add @austa/journey-context
\`\`\`

## Features

- Journey-specific context providers (Health, Care, Plan)
- Cross-journey state management
- Platform-specific adapters (Web, Mobile)
- Persistent storage integration
- Type-safe hooks for accessing journey state

## Usage

### Web Example

\`\`\`tsx
import { HealthProvider, useHealthContext } from '@austa/journey-context';

// Wrap your application or journey with the provider
const App = () => (
  <HealthProvider>
    <HealthDashboard />
  </HealthProvider>
);

// Use the context in components
const HealthDashboard = () => {
  const { metrics, goals, isLoading, fetchMetrics } = useHealthContext();
  
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      <MetricsList metrics={metrics} />
      <GoalsList goals={goals} />
    </div>
  );
};
\`\`\`

### Mobile Example

\`\`\`tsx
import { CareProvider, useCareContext } from '@austa/journey-context';

// Wrap your screen or navigator with the provider
const CareNavigator = () => (
  <CareProvider>
    <Stack.Navigator>
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="Providers" component={ProvidersScreen} />
    </Stack.Navigator>
  </CareProvider>
);

// Use the context in screens
const AppointmentsScreen = () => {
  const { appointments, isLoading, fetchAppointments } = useCareContext();
  
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  
  if (isLoading) return <LoadingIndicator />;
  
  return (
    <FlatList
      data={appointments}
      renderItem={({ item }) => <AppointmentCard appointment={item} />}
      keyExtractor={item => item.id}
    />
  );
};
\`\`\`

## Available Contexts

### Health Context

Manages health data, goals, devices, and metrics state.

### Care Context

Handles appointment scheduling, medication tracking, and provider information.

### Plan Context

Manages insurance benefits, claims status, and coverage details.

### Cross-Journey Context

Facilitates data sharing between journeys when needed.

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) file for guidelines.

## License

This package is part of the AUSTA SuperApp and is covered by its license.
`;
  }
  
  writeFileIfNotExists(readmePath, readmeContent);
}

function createIndexFiles(pkg) {
  if (pkg.name === 'primitives') {
    // Create main index.ts
    const mainIndexPath = path.join(pkg.path, 'src', 'index.ts');
    const mainIndexContent = `// Re-export all components and tokens
export * from './components/Box';
export * from './components/Text';
export * from './components/Stack';
export * from './components/Icon';
export * from './components/Touchable';

// Export tokens namespace
import * as tokens from './tokens';
export { tokens };
`;
    writeFileIfNotExists(mainIndexPath, mainIndexContent);
    
    // Create tokens index.ts
    const tokensIndexPath = path.join(pkg.path, 'src', 'tokens', 'index.ts');
    const tokensIndexContent = `export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './animation';
export * from './breakpoints';
`;
    writeFileIfNotExists(tokensIndexPath, tokensIndexContent);
    
    // Create component index files
    const components = ['Box', 'Text', 'Stack', 'Icon', 'Touchable'];
    components.forEach(component => {
      const componentIndexPath = path.join(pkg.path, 'src', 'components', component, 'index.ts');
      const componentIndexContent = `export * from './${component}';
`;
      writeFileIfNotExists(componentIndexPath, componentIndexContent);
    });
  } else if (pkg.name === 'interfaces') {
    // Create main index.ts
    const mainIndexPath = path.join(pkg.path, 'index.ts');
    const mainIndexContent = `// Re-export all interfaces
export * from './auth';
export * from './common';
export * from './components';
export * from './gamification';
export * from './health';
export * from './care';
export * from './plan';
export * from './themes';
export * from './api';
export * from './next';
export * from './notification';
`;
    writeFileIfNotExists(mainIndexPath, mainIndexContent);
    
    // Create module index files
    const modules = ['auth', 'common', 'components', 'gamification', 'health', 'care', 'plan', 'themes', 'api', 'next', 'notification'];
    modules.forEach(module => {
      const moduleIndexPath = path.join(pkg.path, module, 'index.ts');
      const moduleIndexContent = `// ${module} interfaces
`;
      writeFileIfNotExists(moduleIndexPath, moduleIndexContent);
    });
  } else if (pkg.name === 'journey-context') {
    // Create main index.ts
    const mainIndexPath = path.join(pkg.path, 'src', 'index.ts');
    const mainIndexContent = `// Re-export all providers and hooks
export * from './providers';
export * from './hooks';
export * from './types';

// Export utilities
export * as utils from './utils';
export * as storage from './storage';
export * as constants from './constants';
`;
    writeFileIfNotExists(mainIndexPath, mainIndexContent);
    
    // Create module index files
    const modules = ['providers', 'hooks', 'utils', 'types', 'constants', 'storage', 'adapters'];
    modules.forEach(module => {
      const moduleIndexPath = path.join(pkg.path, 'src', module, 'index.ts');
      const moduleIndexContent = `// ${module} exports
`;
      writeFileIfNotExists(moduleIndexPath, moduleIndexContent);
    });
    
    // Create adapters index files
    const adapters = ['web', 'mobile'];
    adapters.forEach(adapter => {
      const adapterIndexPath = path.join(pkg.path, 'src', 'adapters', adapter, 'index.ts');
      const adapterIndexContent = `// ${adapter} adapter exports
`;
      writeFileIfNotExists(adapterIndexPath, adapterIndexContent);
    });
  }
}

function createPrimitivesStubs() {
  const primitivesPath = path.join(rootDir, 'src', 'web', 'primitives');
  
  // Create token files
  const tokenFiles = [
    {
      name: 'colors.ts',
      content: `/**
 * Design system color tokens
 */

// Base palette
export const palette = {
  // Brand colors
  brand: {
    primary: '#5B39F3',
    secondary: '#8E79F8',
    tertiary: '#C0B5FB',
  },
  
  // Journey-specific colors
  journey: {
    health: {
      primary: '#2E7D32',
      secondary: '#4CAF50',
      tertiary: '#A5D6A7',
    },
    care: {
      primary: '#E65100',
      secondary: '#FF9800',
      tertiary: '#FFCC80',
    },
    plan: {
      primary: '#0D47A1',
      secondary: '#2196F3',
      tertiary: '#90CAF9',
    },
  },
  
  // Semantic colors
  semantic: {
    success: '#43A047',
    warning: '#FFA000',
    error: '#D32F2F',
    info: '#1976D2',
  },
  
  // Neutral colors
  neutral: {
    black: '#000000',
    white: '#FFFFFF',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },
};

// Functional color assignments
export const colors = {
  // Text colors
  text: {
    primary: palette.neutral.gray900,
    secondary: palette.neutral.gray700,
    tertiary: palette.neutral.gray500,
    inverse: palette.neutral.white,
    brand: palette.brand.primary,
    success: palette.semantic.success,
    warning: palette.semantic.warning,
    error: palette.semantic.error,
    info: palette.semantic.info,
  },
  
  // Background colors
  background: {
    primary: palette.neutral.white,
    secondary: palette.neutral.gray100,
    tertiary: palette.neutral.gray200,
    brand: palette.brand.primary,
    brandLight: palette.brand.tertiary,
    success: palette.semantic.success,
    warning: palette.semantic.warning,
    error: palette.semantic.error,
    info: palette.semantic.info,
  },
  
  // Border colors
  border: {
    primary: palette.neutral.gray300,
    secondary: palette.neutral.gray200,
    focus: palette.brand.primary,
    error: palette.semantic.error,
  },
  
  // Journey-specific color themes
  health: {
    primary: palette.journey.health.primary,
    secondary: palette.journey.health.secondary,
    tertiary: palette.journey.health.tertiary,
    background: '#F1F8E9',
    text: palette.journey.health.primary,
  },
  
  care: {
    primary: palette.journey.care.primary,
    secondary: palette.journey.care.secondary,
    tertiary: palette.journey.care.tertiary,
    background: '#FFF3E0',
    text: palette.journey.care.primary,
  },
  
  plan: {
    primary: palette.journey.plan.primary,
    secondary: palette.journey.plan.secondary,
    tertiary: palette.journey.plan.tertiary,
    background: '#E3F2FD',
    text: palette.journey.plan.primary,
  },
};
`
    },
    {
      name: 'typography.ts',
      content: `/**
 * Typography tokens for the design system
 */

// Font families
export const fontFamilies = {
  primary: 'Inter, system-ui, sans-serif',
  secondary: '"Roboto Slab", serif',
  mono: '"Roboto Mono", monospace',
};

// Font sizes (in pixels)
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display1: 36,
  display2: 48,
  display3: 60,
};

// Font weights
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// Line heights (unitless multipliers)
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  loose: 1.8,
};

// Letter spacing (in em)
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// Text variants
export const textVariants = {
  heading1: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  heading2: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  heading3: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.normal,
  },
  heading4: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  body: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  caption: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.wide,
  },
  button: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.wide,
  },
  buttonSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.wide,
  },
};
`
    },
    {
      name: 'spacing.ts',
      content: `/**
 * Spacing tokens based on 8-point grid system
 */

// Base unit in pixels
const baseUnit = 8;

// Spacing scale
export const spacing = {
  // Named values
  none: 0,
  xs: baseUnit / 2, // 4px
  sm: baseUnit, // 8px
  md: baseUnit * 2, // 16px
  lg: baseUnit * 3, // 24px
  xl: baseUnit * 4, // 32px
  xxl: baseUnit * 6, // 48px
  xxxl: baseUnit * 8, // 64px
  
  // Numeric values (for direct multiplication)
  0: 0,
  0.5: baseUnit / 2, // 4px
  1: baseUnit, // 8px
  2: baseUnit * 2, // 16px
  3: baseUnit * 3, // 24px
  4: baseUnit * 4, // 32px
  5: baseUnit * 5, // 40px
  6: baseUnit * 6, // 48px
  8: baseUnit * 8, // 64px
  10: baseUnit * 10, // 80px
  12: baseUnit * 12, // 96px
  16: baseUnit * 16, // 128px
  20: baseUnit * 20, // 160px
  24: baseUnit * 24, // 192px
};

// Layout-specific spacing
export const layout = {
  // Page margins
  pagePadding: {
    mobile: spacing.md,
    tablet: spacing.lg,
    desktop: spacing.xl,
  },
  
  // Content widths
  contentWidth: {
    small: '640px',
    medium: '768px',
    large: '1024px',
    xlarge: '1280px',
  },
  
  // Component spacing
  componentMargin: spacing.lg,
  sectionMargin: spacing.xxl,
};
`
    },
    {
      name: 'shadows.ts',
      content: `/**
 * Shadow tokens for elevation
 */

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Journey-specific shadows
  health: {
    primary: '0 4px 6px -1px rgba(46, 125, 50, 0.2), 0 2px 4px -1px rgba(46, 125, 50, 0.12)',
  },
  care: {
    primary: '0 4px 6px -1px rgba(230, 81, 0, 0.2), 0 2px 4px -1px rgba(230, 81, 0, 0.12)',
  },
  plan: {
    primary: '0 4px 6px -1px rgba(13, 71, 161, 0.2), 0 2px 4px -1px rgba(13, 71, 161, 0.12)',
  },
  
  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Elevation levels
export const elevation = {
  0: shadows.none,
  1: shadows.sm,
  2: shadows.md,
  3: shadows.lg,
  4: shadows.xl,
  5: shadows.xxl,
};
`
    },
    {
      name: 'animation.ts',
      content: `/**
 * Animation tokens for the design system
 */

// Duration in milliseconds
export const durations = {
  instant: 0,
  fastest: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slowest: 800,
};

// Easing functions
export const easings = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Custom easings
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  energetic: 'cubic-bezier(0.4, 0, 0.6, 1)',
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Transition presets
export const transitions = {
  default: `${durations.normal}ms ${easings.easeInOut}`,
  fast: `${durations.fast}ms ${easings.easeInOut}`,
  slow: `${durations.slow}ms ${easings.easeInOut}`,
  
  // Property-specific transitions
  opacity: `opacity ${durations.fast}ms ${easings.easeInOut}`,
  transform: `transform ${durations.normal}ms ${easings.emphasized}`,
  color: `color ${durations.fast}ms ${easings.easeOut}`,
  background: `background-color ${durations.normal}ms ${easings.easeOut}`,
  shadow: `box-shadow ${durations.normal}ms ${easings.easeOut}`,
  border: `border-color ${durations.fast}ms ${easings.easeOut}`,
  
  // Interactive transitions
  hover: `all ${durations.fast}ms ${easings.easeOut}`,
  press: `all ${durations.fastest}ms ${easings.easeOut}`,
  focus: `all ${durations.fast}ms ${easings.easeOut}`,
};
`
    },
    {
      name: 'breakpoints.ts',
      content: `/**
 * Breakpoint tokens for responsive design
 */

// Breakpoint values in pixels
export const breakpointValues = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// Media query strings
export const breakpoints = {
  xs: `@media (min-width: ${breakpointValues.xs}px)`,
  sm: `@media (min-width: ${breakpointValues.sm}px)`,
  md: `@media (min-width: ${breakpointValues.md}px)`,
  lg: `@media (min-width: ${breakpointValues.lg}px)`,
  xl: `@media (min-width: ${breakpointValues.xl}px)`,
  
  // Max-width queries
  xsOnly: `@media (max-width: ${breakpointValues.sm - 1}px)`,
  smOnly: `@media (min-width: ${breakpointValues.sm}px) and (max-width: ${breakpointValues.md - 1}px)`,
  mdOnly: `@media (min-width: ${breakpointValues.md}px) and (max-width: ${breakpointValues.lg - 1}px)`,
  lgOnly: `@media (min-width: ${breakpointValues.lg}px) and (max-width: ${breakpointValues.xl - 1}px)`,
  xlOnly: `@media (min-width: ${breakpointValues.xl}px)`,
  
  // Range queries
  smDown: `@media (max-width: ${breakpointValues.md - 1}px)`,
  mdDown: `@media (max-width: ${breakpointValues.lg - 1}px)`,
  lgDown: `@media (max-width: ${breakpointValues.xl - 1}px)`,
  
  smUp: `@media (min-width: ${breakpointValues.sm}px)`,
  mdUp: `@media (min-width: ${breakpointValues.md}px)`,
  lgUp: `@media (min-width: ${breakpointValues.lg}px)`,
};

// Device-specific breakpoints
export const devices = {
  mobile: breakpoints.xsOnly,
  tablet: breakpoints.smOnly,
  desktop: breakpoints.mdUp,
};
`
    }
  ];
  
  tokenFiles.forEach(file => {
    const filePath = path.join(primitivesPath, 'src', 'tokens', file.name);
    writeFileIfNotExists(filePath, file.content);
  });
  
  // Create component stub files
  const componentStubs = [
    {
      component: 'Box',
      files: [
        {
          name: 'Box.tsx',
          content: `import React from 'react';
import styled from 'styled-components';
import { space, layout, color, border, position, shadow, flexbox } from 'styled-system';
import type { SpaceProps, LayoutProps, ColorProps, BorderProps, PositionProps, ShadowProps, FlexboxProps } from 'styled-system';

// Define the props interface
export interface BoxProps extends 
  SpaceProps, 
  LayoutProps, 
  ColorProps, 
  BorderProps, 
  PositionProps, 
  ShadowProps,
  FlexboxProps,
  React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  children?: React.ReactNode;
}

/**
 * Box is a primitive layout component that serves as the foundation for all layout components.
 * It provides a wide range of styling props through styled-system.
 */
export const Box = styled.div<BoxProps>`
  box-sizing: border-box;
  min-width: 0;
  
  /* Styled System props */
  ${space}
  ${layout}
  ${color}
  ${border}
  ${position}
  ${shadow}
  ${flexbox}
`;

Box.displayName = 'Box';

export default Box;
`
        }
      ]
    },
    {
      component: 'Text',
      files: [
        {
          name: 'Text.tsx',
          content: `import React from 'react';
import styled from 'styled-components';
import { space, color, typography, variant } from 'styled-system';
import type { SpaceProps, ColorProps, TypographyProps } from 'styled-system';
import { textVariants } from '../../tokens/typography';

// Define the props interface
export interface TextProps extends 
  SpaceProps, 
  ColorProps, 
  TypographyProps,
  React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  children?: React.ReactNode;
  variant?: keyof typeof textVariants | string;
  truncate?: boolean;
  ellipsis?: boolean;
}

/**
 * Text is a primitive component for displaying text with typography styles.
 * It supports all typography-related styled-system props and text variants.
 */
export const Text = styled.span<TextProps>`
  margin: 0;
  
  /* Truncate text with ellipsis if specified */
  ${props => props.truncate || props.ellipsis ? `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  ` : ''}
  
  /* Styled System props */
  ${space}
  ${color}
  ${typography}
  
  /* Variant styles based on typography tokens */
  ${variant({
    variants: textVariants,
  })}
`;

Text.defaultProps = {
  variant: 'body',
};

Text.displayName = 'Text';

export default Text;
`
        }
      ]
    },
    {
      component: 'Stack',
      files: [
        {
          name: 'Stack.tsx',
          content: `import React from 'react';
import styled from 'styled-components';
import { space, layout, flexbox } from 'styled-system';
import type { SpaceProps, LayoutProps, FlexboxProps } from 'styled-system';
import Box from '../Box';

// Define the props interface
export interface StackProps extends 
  SpaceProps, 
  LayoutProps, 
  FlexboxProps,
  React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  spacing?: number | string;
  align?: string;
  justify?: string;
  wrap?: string | boolean;
  children?: React.ReactNode;
}

/**
 * Stack is a layout component that arranges its children in a horizontal or vertical stack.
 * It provides spacing between children and alignment options.
 */
const StackContainer = styled(Box)<StackProps>`
  display: flex;
  flex-direction: ${props => props.direction || 'column'};
  align-items: ${props => props.align || 'stretch'};
  justify-content: ${props => props.justify || 'flex-start'};
  flex-wrap: ${props => {
    if (typeof props.wrap === 'boolean') {
      return props.wrap ? 'wrap' : 'nowrap';
    }
    return props.wrap || 'nowrap';
  }};
  
  /* Styled System props */
  ${space}
  ${layout}
  ${flexbox}
`;

export const Stack: React.FC<StackProps> = ({ children, spacing = 0, direction = 'column', ...rest }) => {
  // Filter out null or undefined children
  const validChildren = React.Children.toArray(children).filter(Boolean);
  
  // If no spacing or only one child, render without adding margins
  if (spacing === 0 || validChildren.length <= 1) {
    return <StackContainer direction={direction} {...rest}>{children}</StackContainer>;
  }
  
  // Add margins to children based on direction
  const isHorizontal = direction === 'row' || direction === 'row-reverse';
  const marginProp = isHorizontal ? 'marginLeft' : 'marginTop';
  
  const childrenWithSpacing = validChildren.map((child, index) => {
    // Skip margin for the first child
    if (index === 0) return child;
    
    // Add margin to subsequent children
    return React.isValidElement(child)
      ? React.cloneElement(child, {
          ...child.props,
          style: {
            ...child.props.style,
            [marginProp]: spacing,
          },
        })
      : child;
  });
  
  return (
    <StackContainer direction={direction} {...rest}>
      {childrenWithSpacing}
    </StackContainer>
  );
};

Stack.displayName = 'Stack';

export default Stack;
`
        }
      ]
    },
    {
      component: 'Icon',
      files: [
        {
          name: 'Icon.tsx',
          content: `import React from 'react';
import styled from 'styled-components';
import { space, color, layout } from 'styled-system';
import type { SpaceProps, ColorProps, LayoutProps } from 'styled-system';

// Define the props interface
export interface IconProps extends 
  SpaceProps, 
  ColorProps, 
  LayoutProps,
  React.SVGAttributes<SVGElement> {
  name?: string;
  size?: number | string;
  color?: string;
  viewBox?: string;
  children?: React.ReactNode;
}

/**
 * Icon is a primitive component for displaying SVG icons.
 * It supports size, color, and other styling props.
 */
const IconWrapper = styled.svg<IconProps>`
  flex-shrink: 0;
  backface-visibility: hidden;
  fill: currentColor;
  
  /* Styled System props */
  ${space}
  ${color}
  ${layout}
`;

export const Icon: React.FC<IconProps> = ({ 
  name,
  size = 24, 
  color = 'currentColor', 
  viewBox = '0 0 24 24',
  children,
  ...rest 
}) => {
  // If children are provided, render them directly
  if (children) {
    return (
      <IconWrapper 
        width={size} 
        height={size} 
        viewBox={viewBox} 
        color={color}
        {...rest}
      >
        {children}
      </IconWrapper>
    );
  }
  
  // Otherwise, this is a placeholder for a real icon implementation
  // In a real implementation, you would import icons from a library or use a sprite
  return (
    <IconWrapper 
      width={size} 
      height={size} 
      viewBox={viewBox} 
      color={color}
      {...rest}
    >
      <rect x="0" y="0" width="24" height="24" fill="none" />
      <text x="12" y="14" fontSize="10" textAnchor="middle" fill={color}>
        {name || 'icon'}
      </text>
    </IconWrapper>
  );
};

Icon.displayName = 'Icon';

export default Icon;
`
        }
      ]
    },
    {
      component: 'Touchable',
      files: [
        {
          name: 'Touchable.tsx',
          content: `import React from 'react';
import styled from 'styled-components';
import { space, layout, color, border, position, variant } from 'styled-system';
import type { SpaceProps, LayoutProps, ColorProps, BorderProps, PositionProps } from 'styled-system';
import { transitions } from '../../tokens/animation';

// Define the props interface
export interface TouchableProps extends 
  SpaceProps, 
  LayoutProps, 
  ColorProps, 
  BorderProps, 
  PositionProps,
  React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'link';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

// Variant styles
const touchableVariants = {
  variants: {
    default: {
      bg: 'transparent',
      color: 'text.primary',
      border: '1px solid',
      borderColor: 'border.primary',
      '&:hover': {
        bg: 'background.secondary',
      },
      '&:active': {
        bg: 'background.tertiary',
      },
    },
    primary: {
      bg: 'brand.primary',
      color: 'text.inverse',
      border: 'none',
      '&:hover': {
        bg: 'brand.secondary',
      },
      '&:active': {
        bg: 'brand.primary',
      },
    },
    secondary: {
      bg: 'background.secondary',
      color: 'text.primary',
      border: 'none',
      '&:hover': {
        bg: 'background.tertiary',
      },
      '&:active': {
        bg: 'background.secondary',
      },
    },
    tertiary: {
      bg: 'transparent',
      color: 'text.primary',
      border: 'none',
      '&:hover': {
        bg: 'background.secondary',
      },
      '&:active': {
        bg: 'background.tertiary',
      },
    },
    link: {
      bg: 'transparent',
      color: 'brand.primary',
      border: 'none',
      padding: 0,
      '&:hover': {
        textDecoration: 'underline',
      },
      '&:active': {
        color: 'brand.secondary',
      },
    },
  },
  // Size variants
  sizes: {
    small: {
      fontSize: 'sm',
      padding: '6px 12px',
      borderRadius: '4px',
    },
    medium: {
      fontSize: 'md',
      padding: '8px 16px',
      borderRadius: '4px',
    },
    large: {
      fontSize: 'lg',
      padding: '12px 24px',
      borderRadius: '6px',
    },
  },
};

/**
 * Touchable is a primitive component for interactive elements.
 * It provides consistent styling for buttons and other clickable elements.
 */
export const Touchable = styled.button<TouchableProps>`
  /* Base styles */
  display: ${props => props.fullWidth ? 'block' : 'inline-block'};
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  text-align: center;
  text-decoration: none;
  line-height: 1.5;
  font-weight: 500;
  transition: ${transitions.hover};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  /* Remove default button styles */
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  
  /* Focus styles */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(91, 57, 243, 0.4);
  }
  
  /* Styled System props */
  ${space}
  ${layout}
  ${color}
  ${border}
  ${position}
  
  /* Variant styles */
  ${variant(touchableVariants)}
`;

Touchable.defaultProps = {
  variant: 'default',
  size: 'medium',
  type: 'button',
};

Touchable.displayName = 'Touchable';

export default Touchable;
`
        }
      ]
    }
  ];
  
  componentStubs.forEach(({ component, files }) => {
    files.forEach(file => {
      const filePath = path.join(primitivesPath, 'src', 'components', component, file.name);
      writeFileIfNotExists(filePath, file.content);
    });
  });
  
  // Create rollup.config.js
  const rollupConfigPath = path.join(primitivesPath, 'rollup.config.js');
  const rollupConfigContent = `import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          '@babel/preset-env',
          '@babel/preset-react',
          '@babel/preset-typescript',
        ],
      }),
      terser(),
    ],
    external: ['react', 'react-dom', 'styled-components'],
  },
  {
    input: 'dist/esm/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
];
`;
  writeFileIfNotExists(rollupConfigPath, rollupConfigContent);
  
  // Create jest.config.js
  const jestConfigPath = path.join(primitivesPath, 'jest.config.js');
  const jestConfigContent = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tokens/(.*)$': '<rootDir>/src/tokens/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
`;
  writeFileIfNotExists(jestConfigPath, jestConfigContent);
  
  // Create jest.setup.js
  const jestSetupPath = path.join(primitivesPath, 'jest.setup.js');
  const jestSetupContent = `import '@testing-library/jest-dom';
`;
  writeFileIfNotExists(jestSetupPath, jestSetupContent);
  
  // Create .gitignore
  const gitignorePath = path.join(primitivesPath, '.gitignore');
  const gitignoreContent = `# Dependencies
node_modules

# Build
dist

# Testing
coverage
.nyc_output

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db
`;
  writeFileIfNotExists(gitignorePath, gitignoreContent);
}

function createInterfacesStubs() {
  const interfacesPath = path.join(rootDir, 'src', 'web', 'interfaces');
  
  // Create basic interface files for each module
  const interfaceModules = [
    {
      name: 'auth',
      content: `/**
 * Authentication interfaces
 */

import { z } from 'zod';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// User role enum
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Authentication session
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
}

// Zod schemas for validation
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum([UserRole.USER, UserRole.ADMIN]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const authSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  user: userSchema,
});

export const loginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registrationDataSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});
`
    },
    {
      name: 'health',
      content: `/**
 * Health journey interfaces
 */

import { z } from 'zod';

// Health metric types
export enum HealthMetricType {
  WEIGHT = 'WEIGHT',
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  SLEEP = 'SLEEP',
  WATER = 'WATER',
  CALORIES = 'CALORIES',
}

// Health metric interface
export interface HealthMetric {
  id: string;
  userId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

// Health goal interface
export interface HealthGoal {
  id: string;
  userId: string;
  metricType: HealthMetricType;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  progress: number;
}

// Device connection interface
export interface DeviceConnection {
  id: string;
  userId: string;
  deviceType: string;
  deviceId: string;
  name: string;
  connected: boolean;
  lastSyncDate: string;
  permissions: string[];
}

// Medical event interface
export interface MedicalEvent {
  id: string;
  userId: string;
  type: string;
  description: string;
  date: string;
  provider?: string;
  location?: string;
  notes?: string;
  attachments?: string[];
}

// Zod schemas for validation
export const healthMetricSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(HealthMetricType),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  source: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const healthGoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  metricType: z.nativeEnum(HealthMetricType),
  targetValue: z.number(),
  currentValue: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  completed: z.boolean(),
  progress: z.number().min(0).max(100),
});

export const deviceConnectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceType: z.string(),
  deviceId: z.string(),
  name: z.string(),
  connected: z.boolean(),
  lastSyncDate: z.string().datetime(),
  permissions: z.array(z.string()),
});
`
    },
    {
      name: 'care',
      content: `/**
 * Care journey interfaces
 */

import { z } from 'zod';

// Appointment status enum
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  MISSED = 'MISSED',
}

// Appointment type enum
export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  VIDEO = 'VIDEO',
  PHONE = 'PHONE',
}

// Appointment interface
export interface Appointment {
  id: string;
  userId: string;
  providerId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  notes?: string;
  location?: string;
  reason?: string;
}

// Provider interface
export interface Provider {
  id: string;
  name: string;
  specialty: string;
  photo?: string;
  bio?: string;
  location?: string;
  availableDays?: string[];
  rating?: number;
  reviewCount?: number;
}

// Medication frequency enum
export enum MedicationFrequency {
  ONCE_DAILY = 'ONCE_DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY',
  FOUR_TIMES_DAILY = 'FOUR_TIMES_DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  AS_NEEDED = 'AS_NEEDED',
}

// Medication interface
export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  startDate: string;
  endDate?: string;
  instructions?: string;
  prescribedBy?: string;
  active: boolean;
  reminders: boolean;
}

// Telemedicine session interface
export interface TelemedicineSession {
  id: string;
  appointmentId: string;
  userId: string;
  providerId: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  channelName: string;
  token: string;
}

// Zod schemas for validation
export const appointmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  providerId: z.string().uuid(),
  type: z.nativeEnum(AppointmentType),
  status: z.nativeEnum(AppointmentStatus),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
  location: z.string().optional(),
  reason: z.string().optional(),
});

export const providerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  specialty: z.string(),
  photo: z.string().url().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  availableDays: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().optional(),
});

export const medicationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  dosage: z.string(),
  frequency: z.nativeEnum(MedicationFrequency),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  instructions: z.string().optional(),
  prescribedBy: z.string().optional(),
  active: z.boolean(),
  reminders: z.boolean(),
});
`
    },
    {
      name: 'plan',
      content: `/**
 * Plan journey interfaces
 */

import { z } from 'zod';

// Plan type enum
export enum PlanType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  FAMILY = 'FAMILY',
  SENIOR = 'SENIOR',
}

// Coverage type enum
export enum CoverageType {
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  PHARMACY = 'PHARMACY',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
}

// Claim status enum
export enum ClaimStatus {
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED',
}

// Claim type enum
export enum ClaimType {
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  PHARMACY = 'PHARMACY',
  OTHER = 'OTHER',
}

// Insurance plan interface
export interface InsurancePlan {
  id: string;
  userId: string;
  type: PlanType;
  name: string;
  provider: string;
  memberNumber: string;
  groupNumber?: string;
  startDate: string;
  endDate: string;
  isPrimary: boolean;
  coverageTypes: CoverageType[];
}

// Benefit interface
export interface Benefit {
  id: string;
  planId: string;
  name: string;
  description: string;
  coverageType: CoverageType;
  coveragePercentage: number;
  annualLimit?: number;
  remainingLimit?: number;
  waitingPeriod?: number;
  notes?: string;
}

// Claim interface
export interface Claim {
  id: string;
  userId: string;
  planId: string;
  type: ClaimType;
  status: ClaimStatus;
  providerName: string;
  serviceDate: string;
  submissionDate: string;
  amount: number;
  approvedAmount?: number;
  description: string;
  documents?: string[];
  notes?: string;
}

// Coverage interface
export interface Coverage {
  id: string;
  planId: string;
  type: CoverageType;
  inNetworkCoverage: number;
  outNetworkCoverage: number;
  deductible: number;
  remainingDeductible: number;
  outOfPocketMax: number;
  remainingOutOfPocket: number;
  startDate: string;
  endDate: string;
}

// Zod schemas for validation
export const insurancePlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(PlanType),
  name: z.string(),
  provider: z.string(),
  memberNumber: z.string(),
  groupNumber: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isPrimary: z.boolean(),
  coverageTypes: z.array(z.nativeEnum(CoverageType)),
});

export const benefitSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  coverageType: z.nativeEnum(CoverageType),
  coveragePercentage: z.number().min(0).max(100),
  annualLimit: z.number().optional(),
  remainingLimit: z.number().optional(),
  waitingPeriod: z.number().optional(),
  notes: z.string().optional(),
});

export const claimSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  type: z.nativeEnum(ClaimType),
  status: z.nativeEnum(ClaimStatus),
  providerName: z.string(),
  serviceDate: z.string().datetime(),
  submissionDate: z.string().datetime(),
  amount: z.number(),
  approvedAmount: z.number().optional(),
  description: z.string(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
`
    },
    {
      name: 'gamification',
      content: `/**
 * Gamification interfaces
 */

import { z } from 'zod';

// Achievement interface
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  isSecret?: boolean;
}

// Quest interface
export interface Quest {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted: boolean;
  progress: number;
  maxProgress: number;
  steps?: QuestStep[];
}

// Quest step interface
export interface QuestStep {
  id: string;
  questId: string;
  name: string;
  description: string;
  order: number;
  isCompleted: boolean;
  xpReward: number;
}

// Reward interface
export interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  cost: number;
  isAvailable: boolean;
  expiresAt?: string;
  redeemedAt?: string;
  code?: string;
}

// Game profile interface
export interface GameProfile {
  id: string;
  userId: string;
  xp: number;
  level: number;
  achievements: string[];
  activeQuests: string[];
  completedQuests: string[];
  rewards: string[];
  createdAt: string;
  updatedAt: string;
}

// Gamification event interface
export interface GamificationEvent {
  id: string;
  userId: string;
  type: string;
  journey: 'health' | 'care' | 'plan';
  action: string;
  metadata: Record<string, any>;
  timestamp: string;
}

// Zod schemas for validation
export const achievementSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  icon: z.string(),
  xpReward: z.number().int(),
  unlockedAt: z.string().datetime().optional(),
  progress: z.number().optional(),
  maxProgress: z.number().optional(),
  isSecret: z.boolean().optional(),
});

export const questStepSchema = z.object({
  id: z.string().uuid(),
  questId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  order: z.number().int(),
  isCompleted: z.boolean(),
  xpReward: z.number().int(),
});

export const questSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  icon: z.string(),
  xpReward: z.number().int(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean(),
  isCompleted: z.boolean(),
  progress: z.number(),
  maxProgress: z.number(),
  steps: z.array(questStepSchema).optional(),
});

export const gameProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  xp: z.number().int(),
  level: z.number().int(),
  achievements: z.array(z.string()),
  activeQuests: z.array(z.string()),
  completedQuests: z.array(z.string()),
  rewards: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
`
    },
    {
      name: 'themes',
      content: `/**
 * Theme interfaces
 */

// Theme interface
export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  breakpoints: ThemeBreakpoints;
  animation: ThemeAnimation;
}

// Colors interface
export interface ThemeColors {
  brand: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  journey: {
    health: {
      primary: string;
      secondary: string;
      tertiary: string;
      background: string;
      text: string;
    };
    care: {
      primary: string;
      secondary: string;
      tertiary: string;
      background: string;
      text: string;
    };
    plan: {
      primary: string;
      secondary: string;
      tertiary: string;
      background: string;
      text: string;
    };
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    brand: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    brand: string;
    brandLight: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
}

// Typography interface
export interface ThemeTypography {
  fontFamilies: {
    primary: string;
    secondary: string;
    mono: string;
  };
  fontSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    display1: number;
    display2: number;
    display3: number;
  };
  fontWeights: {
    light: number;
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    loose: number;
  };
  letterSpacings: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

// Spacing interface
export interface ThemeSpacing {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  0: number;
  0.5: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  8: number;
  10: number;
  12: number;
  16: number;
  20: number;
  24: number;
}

// Shadows interface
export interface ThemeShadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  inner: string;
  health: {
    primary: string;
  };
  care: {
    primary: string;
  };
  plan: {
    primary: string;
  };
}

// Breakpoints interface
export interface ThemeBreakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xsOnly: string;
  smOnly: string;
  mdOnly: string;
  lgOnly: string;
  xlOnly: string;
  smDown: string;
  mdDown: string;
  lgDown: string;
  smUp: string;
  mdUp: string;
  lgUp: string;
}

// Animation interface
export interface ThemeAnimation {
  durations: {
    instant: number;
    fastest: number;
    fast: number;
    normal: number;
    slow: number;
    slowest: number;
  };
  easings: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    emphasized: string;
    energetic: string;
    bounce: string;
  };
  transitions: {
    default: string;
    fast: string;
    slow: string;
    opacity: string;
    transform: string;
    color: string;
    background: string;
    shadow: string;
    border: string;
    hover: string;
    press: string;
    focus: string;
  };
}
`
    }
  ];
  
  interfaceModules.forEach(module => {
    const filePath = path.join(interfacesPath, module.name, 'index.ts');
    writeFileIfNotExists(filePath, module.content);
  });
}

function createJourneyContextStubs() {
  const journeyContextPath = path.join(rootDir, 'src', 'web', 'journey-context');
  
  // Create provider files
  const providerFiles = [
    {
      name: 'HealthProvider.tsx',
      content: `import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { HealthMetric, HealthGoal, DeviceConnection } from '@austa/interfaces/health';
import { useStorage } from '../storage';
import { getPlatformAdapter } from '../adapters';

// Define the context state interface
interface HealthContextState {
  metrics: HealthMetric[];
  goals: HealthGoal[];
  devices: DeviceConnection[];
  isLoading: boolean;
  error: Error | null;
  fetchMetrics: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  addMetric: (metric: Omit<HealthMetric, 'id'>) => Promise<void>;
  updateGoal: (goalId: string, progress: number) => Promise<void>;
  connectDevice: (deviceType: string, deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
}

// Create the context with default values
const HealthContext = createContext<HealthContextState>({} as HealthContextState);

// Provider component props
interface HealthProviderProps {
  children: React.ReactNode;
}

/**
 * HealthProvider component that manages health-related state and provides
 * it to child components via context.
 */
export const HealthProvider: React.FC<HealthProviderProps> = ({ children }) => {
  // State for health data
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [devices, setDevices] = useState<DeviceConnection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get platform-specific adapter and storage
  const adapter = getPlatformAdapter();
  const storage = useStorage();
  
  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedMetrics = await storage.getItem('health_metrics');
        const cachedGoals = await storage.getItem('health_goals');
        const cachedDevices = await storage.getItem('health_devices');
        
        if (cachedMetrics) setMetrics(JSON.parse(cachedMetrics));
        if (cachedGoals) setGoals(JSON.parse(cachedGoals));
        if (cachedDevices) setDevices(JSON.parse(cachedDevices));
      } catch (err) {
        console.error('Error loading cached health data:', err);
      }
    };
    
    loadCachedData();
  }, [storage]);
  
  // Fetch metrics from API
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.health.fetchMetrics();
      setMetrics(response);
      
      // Cache the data
      await storage.setItem('health_metrics', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
      console.error('Error fetching health metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.health, storage]);
  
  // Fetch goals from API
  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.health.fetchGoals();
      setGoals(response);
      
      // Cache the data
      await storage.setItem('health_goals', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch goals'));
      console.error('Error fetching health goals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.health, storage]);
  
  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.health.fetchDevices();
      setDevices(response);
      
      // Cache the data
      await storage.setItem('health_devices', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch devices'));
      console.error('Error fetching health devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.health, storage]);
  
  // Add a new metric
  const addMetric = useCallback(async (metric: Omit<HealthMetric, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to add metric
      const newMetric = await adapter.health.addMetric(metric);
      setMetrics(prev => [...prev, newMetric]);
      
      // Update cache
      await storage.setItem('health_metrics', JSON.stringify([...metrics, newMetric]));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add metric'));
      console.error('Error adding health metric:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.health, metrics, storage]);
  
  // Update goal progress
  const updateGoal = useCallback(async (goalId: string, progress: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to update goal
      const updatedGoal = await adapter.health.updateGoalProgress(goalId, progress);
      setGoals(prev => prev.map(goal => goal.id === goalId ? updatedGoal : goal));
      
      // Update cache
      const updatedGoals = goals.map(goal => goal.id === goalId ? updatedGoal : goal);
      await storage.setItem('health_goals', JSON.stringify(updatedGoals));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update goal'));
      console.error('Error updating health goal:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.health, goals, storage]);
  
  // Connect a device
  const connectDevice = useCallback(async (deviceType: string, deviceId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to connect device
      const newDevice = await adapter.health.connectDevice(deviceType, deviceId);
      setDevices(prev => [...prev, newDevice]);
      
      // Update cache
      await storage.setItem('health_devices', JSON.stringify([...devices, newDevice]));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect device'));
      console.error('Error connecting health device:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.health, devices, storage]);
  
  // Disconnect a device
  const disconnectDevice = useCallback(async (deviceId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to disconnect device
      await adapter.health.disconnectDevice(deviceId);
      setDevices(prev => prev.filter(device => device.deviceId !== deviceId));
      
      // Update cache
      const updatedDevices = devices.filter(device => device.deviceId !== deviceId);
      await storage.setItem('health_devices', JSON.stringify(updatedDevices));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect device'));
      console.error('Error disconnecting health device:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.health, devices, storage]);
  
  // Context value
  const value: HealthContextState = {
    metrics,
    goals,
    devices,
    isLoading,
    error,
    fetchMetrics,
    fetchGoals,
    fetchDevices,
    addMetric,
    updateGoal,
    connectDevice,
    disconnectDevice,
  };
  
  return (
    <HealthContext.Provider value={value}>
      {children}
    </HealthContext.Provider>
  );
};

/**
 * Custom hook to use the health context.
 * @returns The health context state and methods.
 */
export const useHealthContext = () => {
  const context = useContext(HealthContext);
  
  if (!context) {
    throw new Error('useHealthContext must be used within a HealthProvider');
  }
  
  return context;
};
`
    },
    {
      name: 'CareProvider.tsx',
      content: `import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Appointment, Provider, Medication, TelemedicineSession } from '@austa/interfaces/care';
import { useStorage } from '../storage';
import { getPlatformAdapter } from '../adapters';

// Define the context state interface
interface CareContextState {
  appointments: Appointment[];
  providers: Provider[];
  medications: Medication[];
  activeSession: TelemedicineSession | null;
  isLoading: boolean;
  error: Error | null;
  fetchAppointments: () => Promise<void>;
  fetchProviders: () => Promise<void>;
  fetchMedications: () => Promise<void>;
  scheduleAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  startTelemedicineSession: (appointmentId: string) => Promise<TelemedicineSession>;
  endTelemedicineSession: () => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id'>) => Promise<void>;
  updateMedication: (medicationId: string, updates: Partial<Medication>) => Promise<void>;
}

// Create the context with default values
const CareContext = createContext<CareContextState>({} as CareContextState);

// Provider component props
interface CareProviderProps {
  children: React.ReactNode;
}

/**
 * CareProvider component that manages care-related state and provides
 * it to child components via context.
 */
export const CareProvider: React.FC<CareProviderProps> = ({ children }) => {
  // State for care data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activeSession, setActiveSession] = useState<TelemedicineSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get platform-specific adapter and storage
  const adapter = getPlatformAdapter();
  const storage = useStorage();
  
  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedAppointments = await storage.getItem('care_appointments');
        const cachedProviders = await storage.getItem('care_providers');
        const cachedMedications = await storage.getItem('care_medications');
        const cachedSession = await storage.getItem('care_active_session');
        
        if (cachedAppointments) setAppointments(JSON.parse(cachedAppointments));
        if (cachedProviders) setProviders(JSON.parse(cachedProviders));
        if (cachedMedications) setMedications(JSON.parse(cachedMedications));
        if (cachedSession) setActiveSession(JSON.parse(cachedSession));
      } catch (err) {
        console.error('Error loading cached care data:', err);
      }
    };
    
    loadCachedData();
  }, [storage]);
  
  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.care.fetchAppointments();
      setAppointments(response);
      
      // Cache the data
      await storage.setItem('care_appointments', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
      console.error('Error fetching care appointments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, storage]);
  
  // Fetch providers from API
  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.care.fetchProviders();
      setProviders(response);
      
      // Cache the data
      await storage.setItem('care_providers', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch providers'));
      console.error('Error fetching care providers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, storage]);
  
  // Fetch medications from API
  const fetchMedications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.care.fetchMedications();
      setMedications(response);
      
      // Cache the data
      await storage.setItem('care_medications', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch medications'));
      console.error('Error fetching care medications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, storage]);
  
  // Schedule a new appointment
  const scheduleAppointment = useCallback(async (appointment: Omit<Appointment, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to schedule appointment
      const newAppointment = await adapter.care.scheduleAppointment(appointment);
      setAppointments(prev => [...prev, newAppointment]);
      
      // Update cache
      await storage.setItem('care_appointments', JSON.stringify([...appointments, newAppointment]));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to schedule appointment'));
      console.error('Error scheduling care appointment:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, appointments, storage]);
  
  // Cancel an appointment
  const cancelAppointment = useCallback(async (appointmentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to cancel appointment
      await adapter.care.cancelAppointment(appointmentId);
      
      // Update local state
      const updatedAppointments = appointments.map(appointment => {
        if (appointment.id === appointmentId) {
          return { ...appointment, status: 'CANCELLED' as const };
        }
        return appointment;
      });
      
      setAppointments(updatedAppointments);
      
      // Update cache
      await storage.setItem('care_appointments', JSON.stringify(updatedAppointments));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel appointment'));
      console.error('Error cancelling care appointment:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, appointments, storage]);
  
  // Start a telemedicine session
  const startTelemedicineSession = useCallback(async (appointmentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to start session
      const session = await adapter.care.startTelemedicineSession(appointmentId);
      setActiveSession(session);
      
      // Cache the session
      await storage.setItem('care_active_session', JSON.stringify(session));
      
      return session;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start telemedicine session'));
      console.error('Error starting telemedicine session:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, storage]);
  
  // End the active telemedicine session
  const endTelemedicineSession = useCallback(async () => {
    if (!activeSession) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to end session
      await adapter.care.endTelemedicineSession(activeSession.id);
      setActiveSession(null);
      
      // Remove from cache
      await storage.removeItem('care_active_session');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to end telemedicine session'));
      console.error('Error ending telemedicine session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, activeSession, storage]);
  
  // Add a new medication
  const addMedication = useCallback(async (medication: Omit<Medication, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to add medication
      const newMedication = await adapter.care.addMedication(medication);
      setMedications(prev => [...prev, newMedication]);
      
      // Update cache
      await storage.setItem('care_medications', JSON.stringify([...medications, newMedication]));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add medication'));
      console.error('Error adding care medication:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, medications, storage]);
  
  // Update a medication
  const updateMedication = useCallback(async (medicationId: string, updates: Partial<Medication>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to update medication
      const updatedMedication = await adapter.care.updateMedication(medicationId, updates);
      
      // Update local state
      const updatedMedications = medications.map(medication => {
        if (medication.id === medicationId) {
          return updatedMedication;
        }
        return medication;
      });
      
      setMedications(updatedMedications);
      
      // Update cache
      await storage.setItem('care_medications', JSON.stringify(updatedMedications));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update medication'));
      console.error('Error updating care medication:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.care, medications, storage]);
  
  // Context value
  const value: CareContextState = {
    appointments,
    providers,
    medications,
    activeSession,
    isLoading,
    error,
    fetchAppointments,
    fetchProviders,
    fetchMedications,
    scheduleAppointment,
    cancelAppointment,
    startTelemedicineSession,
    endTelemedicineSession,
    addMedication,
    updateMedication,
  };
  
  return (
    <CareContext.Provider value={value}>
      {children}
    </CareContext.Provider>
  );
};

/**
 * Custom hook to use the care context.
 * @returns The care context state and methods.
 */
export const useCareContext = () => {
  const context = useContext(CareContext);
  
  if (!context) {
    throw new Error('useCareContext must be used within a CareProvider');
  }
  
  return context;
};
`
    },
    {
      name: 'PlanProvider.tsx',
      content: `import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { InsurancePlan, Benefit, Claim, Coverage } from '@austa/interfaces/plan';
import { useStorage } from '../storage';
import { getPlatformAdapter } from '../adapters';

// Define the context state interface
interface PlanContextState {
  plans: InsurancePlan[];
  benefits: Benefit[];
  claims: Claim[];
  coverages: Coverage[];
  isLoading: boolean;
  error: Error | null;
  fetchPlans: () => Promise<void>;
  fetchBenefits: (planId: string) => Promise<void>;
  fetchClaims: () => Promise<void>;
  fetchCoverages: (planId: string) => Promise<void>;
  submitClaim: (claim: Omit<Claim, 'id' | 'status' | 'submissionDate' | 'approvedAmount'>) => Promise<void>;
  uploadClaimDocument: (claimId: string, file: File) => Promise<void>;
  cancelClaim: (claimId: string) => Promise<void>;
}

// Create the context with default values
const PlanContext = createContext<PlanContextState>({} as PlanContextState);

// Provider component props
interface PlanProviderProps {
  children: React.ReactNode;
}

/**
 * PlanProvider component that manages plan-related state and provides
 * it to child components via context.
 */
export const PlanProvider: React.FC<PlanProviderProps> = ({ children }) => {
  // State for plan data
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get platform-specific adapter and storage
  const adapter = getPlatformAdapter();
  const storage = useStorage();
  
  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedPlans = await storage.getItem('plan_plans');
        const cachedBenefits = await storage.getItem('plan_benefits');
        const cachedClaims = await storage.getItem('plan_claims');
        const cachedCoverages = await storage.getItem('plan_coverages');
        
        if (cachedPlans) setPlans(JSON.parse(cachedPlans));
        if (cachedBenefits) setBenefits(JSON.parse(cachedBenefits));
        if (cachedClaims) setClaims(JSON.parse(cachedClaims));
        if (cachedCoverages) setCoverages(JSON.parse(cachedCoverages));
      } catch (err) {
        console.error('Error loading cached plan data:', err);
      }
    };
    
    loadCachedData();
  }, [storage]);
  
  // Fetch plans from API
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.plan.fetchPlans();
      setPlans(response);
      
      // Cache the data
      await storage.setItem('plan_plans', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
      console.error('Error fetching insurance plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.plan, storage]);
  
  // Fetch benefits for a specific plan
  const fetchBenefits = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.plan.fetchBenefits(planId);
      setBenefits(prev => {
        // Filter out benefits for this plan and add new ones
        const filtered = prev.filter(benefit => benefit.planId !== planId);
        return [...filtered, ...response];
      });
      
      // Cache the data
      await storage.setItem('plan_benefits', JSON.stringify(benefits));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch benefits'));
      console.error('Error fetching plan benefits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.plan, benefits, storage]);
  
  // Fetch claims from API
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.plan.fetchClaims();
      setClaims(response);
      
      // Cache the data
      await storage.setItem('plan_claims', JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch claims'));
      console.error('Error fetching insurance claims:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.plan, storage]);
  
  // Fetch coverages for a specific plan
  const fetchCoverages = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to fetch data
      const response = await adapter.plan.fetchCoverages(planId);
      setCoverages(prev => {
        // Filter out coverages for this plan and add new ones
        const filtered = prev.filter(coverage => coverage.planId !== planId);
        return [...filtered, ...response];
      });
      
      // Cache the data
      await storage.setItem('plan_coverages', JSON.stringify(coverages));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch coverages'));
      console.error('Error fetching plan coverages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.plan, coverages, storage]);
  
  // Submit a new claim
  const submitClaim = useCallback(async (claim: Omit<Claim, 'id' | 'status' | 'submissionDate' | 'approvedAmount'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to submit claim
      const newClaim = await adapter.plan.submitClaim(claim);
      setClaims(prev => [...prev, newClaim]);
      
      // Update cache
      await storage.setItem('plan_claims', JSON.stringify([...claims, newClaim]));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit claim'));
      console.error('Error submitting insurance claim:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.plan, claims, storage]);
  
  // Upload a document for a claim
  const uploadClaimDocument = useCallback(async (claimId: string, file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to upload document
      const documentUrl = await adapter.plan.uploadClaimDocument(claimId, file);
      
      // Update local state
      const updatedClaims = claims.map(claim => {
        if (claim.id === claimId) {
          return {
            ...claim,
            documents: [...(claim.documents || []), documentUrl],
          };
        }
        return claim;
      });
      
      setClaims(updatedClaims);
      
      // Update cache
      await storage.setItem('plan_claims', JSON.stringify(updatedClaims));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload document'));
      console.error('Error uploading claim document:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.plan, claims, storage]);
  
  // Cancel a claim
  const cancelClaim = useCallback(async (claimId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use platform adapter to cancel claim
      await adapter.plan.cancelClaim(claimId);
      
      // Update local state
      const updatedClaims = claims.map(claim => {
        if (claim.id === claimId) {
          return { ...claim, status: 'CANCELLED' as const };
        }
        return claim;
      });
      
      setClaims(updatedClaims);
      
      // Update cache
      await storage.setItem('plan_claims', JSON.stringify(updatedClaims));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel claim'));
      console.error('Error cancelling insurance claim:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adapter.plan, claims, storage]);
  
  // Context value
  const value: PlanContextState = {
    plans,
    benefits,
    claims,
    coverages,
    isLoading,
    error,
    fetchPlans,
    fetchBenefits,
    fetchClaims,
    fetchCoverages,
    submitClaim,
    uploadClaimDocument,
    cancelClaim,
  };
  
  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};

/**
 * Custom hook to use the plan context.
 * @returns The plan context state and methods.
 */
export const usePlanContext = () => {
  const context = useContext(PlanContext);
  
  if (!context) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  
  return context;
};
`
    },
    {
      name: 'index.ts',
      content: `export * from './HealthProvider';
export * from './CareProvider';
export * from './PlanProvider';
`
    }
  ];
  
  providerFiles.forEach(file => {
    const filePath = path.join(journeyContextPath, 'src', 'providers', file.name);
    writeFileIfNotExists(filePath, file.content);
  });
  
  // Create adapter files
  const adapterFiles = [
    {
      name: 'index.ts',
      path: path.join(journeyContextPath, 'src', 'adapters', 'index.ts'),
      content: `/**
 * Platform adapter utilities
 */

import { WebAdapter } from './web';
import { MobileAdapter } from './mobile';

// Platform detection
const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Get the appropriate platform adapter based on the current environment
 */
export function getPlatformAdapter() {
  if (isMobile) {
    return MobileAdapter;
  }
  return WebAdapter;
}

// Export adapter types
export type { PlatformAdapter } from './types';
`
    },
    {
      name: 'types.ts',
      path: path.join(journeyContextPath, 'src', 'adapters', 'types.ts'),
      content: `/**
 * Platform adapter type definitions
 */

import { HealthMetric, HealthGoal, DeviceConnection } from '@austa/interfaces/health';
import { Appointment, Provider, Medication, TelemedicineSession } from '@austa/interfaces/care';
import { InsurancePlan, Benefit, Claim, Coverage } from '@austa/interfaces/plan';

// Health adapter interface
export interface HealthAdapter {
  fetchMetrics: () => Promise<HealthMetric[]>;
  fetchGoals: () => Promise<HealthGoal[]>;
  fetchDevices: () => Promise<DeviceConnection[]>;
  addMetric: (metric: Omit<HealthMetric, 'id'>) => Promise<HealthMetric>;
  updateGoalProgress: (goalId: string, progress: number) => Promise<HealthGoal>;
  connectDevice: (deviceType: string, deviceId: string) => Promise<DeviceConnection>;
  disconnectDevice: (deviceId: string) => Promise<void>;
}

// Care adapter interface
export interface CareAdapter {
  fetchAppointments: () => Promise<Appointment[]>;
  fetchProviders: () => Promise<Provider[]>;
  fetchMedications: () => Promise<Medication[]>;
  scheduleAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  startTelemedicineSession: (appointmentId: string) => Promise<TelemedicineSession>;
  endTelemedicineSession: (sessionId: string) => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id'>) => Promise<Medication>;
  updateMedication: (medicationId: string, updates: Partial<Medication>) => Promise<Medication>;
}

// Plan adapter interface
export interface PlanAdapter {
  fetchPlans: () => Promise<InsurancePlan[]>;
  fetchBenefits: (planId: string) => Promise<Benefit[]>;
  fetchClaims: () => Promise<Claim[]>;
  fetchCoverages: (planId: string) => Promise<Coverage[]>;
  submitClaim: (claim: Omit<Claim, 'id' | 'status' | 'submissionDate' | 'approvedAmount'>) => Promise<Claim>;
  uploadClaimDocument: (claimId: string, file: File) => Promise<string>;
  cancelClaim: (claimId: string) => Promise<void>;
}

// Platform adapter interface
export interface PlatformAdapter {
  health: HealthAdapter;
  care: CareAdapter;
  plan: PlanAdapter;
}
`
    },
    {
      name: 'index.ts',
      path: path.join(journeyContextPath, 'src', 'adapters', 'web', 'index.ts'),
      content: `/**
 * Web platform adapter implementation
 */

import { PlatformAdapter } from '../types';
import { healthAdapter } from './health';
import { careAdapter } from './care';
import { planAdapter } from './plan';

/**
 * Web-specific adapter implementation
 */
export const WebAdapter: PlatformAdapter = {
  health: healthAdapter,
  care: careAdapter,
  plan: planAdapter,
};
`
    },
    {
      name: 'index.ts',
      path: path.join(journeyContextPath, 'src', 'adapters', 'mobile', 'index.ts'),
      content: `/**
 * Mobile platform adapter implementation
 */

import { PlatformAdapter } from '../types';
import { healthAdapter } from './health';
import { careAdapter } from './care';
import { planAdapter } from './plan';

/**
 * Mobile-specific adapter implementation
 */
export const MobileAdapter: PlatformAdapter = {
  health: healthAdapter,
  care: careAdapter,
  plan: planAdapter,
};
`
    }
  ];
  
  adapterFiles.forEach(file => {
    writeFileIfNotExists(file.path, file.content);
  });
  
  // Create storage module
  const storageFiles = [
    {
      name: 'index.ts',
      path: path.join(journeyContextPath, 'src', 'storage', 'index.ts'),
      content: `/**
 * Storage utilities for journey context
 */

import { useState, useEffect } from 'react';

// Storage interface
export interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

// Local storage implementation
const localStorageAdapter: Storage = {
  getItem: async (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  clear: async () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Memory storage fallback
const memoryStorage: Record<string, string> = {};
const memoryStorageAdapter: Storage = {
  getItem: async (key: string) => memoryStorage[key] || null,
  setItem: async (key: string, value: string) => {
    memoryStorage[key] = value;
  },
  removeItem: async (key: string) => {
    delete memoryStorage[key];
  },
  clear: async () => {
    Object.keys(memoryStorage).forEach(key => {
      delete memoryStorage[key];
    });
  },
};

// Determine if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Get the appropriate storage adapter
export const getStorageAdapter = (): Storage => {
  return isLocalStorageAvailable() ? localStorageAdapter : memoryStorageAdapter;
};

/**
 * Hook to use storage in components
 */
export const useStorage = () => {
  const [storage] = useState<Storage>(getStorageAdapter());
  
  // Log storage type on mount (development only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using storage adapter:', isLocalStorageAvailable() ? 'localStorage' : 'memoryStorage');
    }
  }, []);
  
  return storage;
};
`
    }
  ];
  
  storageFiles.forEach(file => {
    writeFileIfNotExists(file.path, file.content);
  });
  
  // Create rollup.config.js
  const rollupConfigPath = path.join(journeyContextPath, 'rollup.config.js');
  const rollupConfigContent = `import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          '@babel/preset-env',
          '@babel/preset-react',
          '@babel/preset-typescript',
        ],
      }),
      terser(),
    ],
    external: ['react', 'react-dom', '@austa/interfaces'],
  },
  {
    input: 'dist/esm/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
];
`;
  writeFileIfNotExists(rollupConfigPath, rollupConfigContent);
  
  // Create jest.config.js
  const jestConfigPath = path.join(journeyContextPath, 'jest.config.js');
  const jestConfigContent = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@storage/(.*)$': '<rootDir>/src/storage/$1',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
`;
  writeFileIfNotExists(jestConfigPath, jestConfigContent);
  
  // Create jest.setup.js
  const jestSetupPath = path.join(journeyContextPath, 'jest.setup.js');
  const jestSetupContent = `import '@testing-library/jest-dom';
`;
  writeFileIfNotExists(jestSetupPath, jestSetupContent);
  
  // Create .gitignore
  const gitignorePath = path.join(journeyContextPath, '.gitignore');
  const gitignoreContent = `# Dependencies
node_modules

# Build
dist

# Testing
coverage
.nyc_output

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db
`;
  writeFileIfNotExists(gitignorePath, gitignoreContent);
}

// 4. Update Package Configurations
function updatePackageConfigurations() {
  console.log('\n=== Updating Package Configurations ===');
  
  // Update mobile package.json
  const mobilePackagePath = path.join(rootDir, 'src', 'web', 'mobile', 'package.json');
  updatePackageJson(mobilePackagePath, (packageJson) => {
    // Add overrides for React Native packages
    packageJson.overrides = packageJson.overrides || {};
    packageJson.overrides = {
      ...packageJson.overrides,
      'react-native-webview': '13.13.5',
      'react-native-agora': '4.5.2',
      '@react-native/typescript-config': '0.73.1',
      'react-native': '0.73.4',
      'react': '18.2.0',
      'react-dom': '18.2.0'
    };
    
    // Add dependencies for new packages
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@design-system/primitives': '^1.0.0',
      '@austa/interfaces': '^1.0.0',
      '@austa/journey-context': '^1.0.0'
    };
    
    return packageJson;
  });
  
  // Update web package.json
  const webPackagePath = path.join(rootDir, 'src', 'web', 'web', 'package.json');
  updatePackageJson(webPackagePath, (packageJson) => {
    // Add resolutions for Next.js and React
    packageJson.resolutions = packageJson.resolutions || {};
    packageJson.resolutions = {
      ...packageJson.resolutions,
      'next': '14.2.0',
      'eslint-config-next': '14.2.0',
      'react': '18.2.0',
      'react-dom': '18.2.0'
    };
    
    // Add dependencies for new packages
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@design-system/primitives': '^1.0.0',
      '@austa/interfaces': '^1.0.0',
      '@austa/journey-context': '^1.0.0',
      'next': '14.2.0'
    };
    
    return packageJson;
  });
}

// Main execution
function main() {
  console.log('Starting module setup...');
  
  try {
    // 1. Setup Backend Shared Services (keeping existing functionality)
    setupBackendSharedServices();
    
    // 2. Setup Gamification Engine (keeping existing functionality)
    setupGamificationEngine();
    
    // 3. Setup Web Packages (new functionality)
    setupWebPackages();
    
    // 4. Update Package Configurations
    updatePackageConfigurations();
    
    console.log('\nModule setup completed successfully!');
  } catch (error) {
    console.error('Error during module setup:', error);
    process.exit(1);
  }
}

// Run the script
main();