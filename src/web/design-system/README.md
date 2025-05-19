# AUSTA SuperApp Design System

## Overview

The AUSTA SuperApp Design System is a comprehensive collection of reusable components, design tokens, patterns, and guidelines that power our journey-centered healthcare application. This system ensures consistent, accessible, and engaging user experiences across all three core journeys: My Health (Minha Saúde), Care Now (Cuidar-me Agora), and My Plan & Benefits (Meu Plano & Benefícios).

The design system is organized into four discrete workspace packages within the monorepo:

- **@austa/design-system**: The main package that exports all components, themes, and utilities for application consumption. It serves as the public API entry point for all UI components.
- **@design-system/primitives**: Contains all design tokens, atomic UI building blocks, and primitive components that form the foundation of the design system.
- **@austa/interfaces**: Houses all shared TypeScript definitions and type contracts used across the design system and applications.
- **@austa/journey-context**: Provides context providers and hooks for journey-specific state management across components.

## Principles

- **Journey-Centered:** Components adapt to each journey context with appropriate theming, behaviors, and patterns

- **Accessibility First:** All components meet WCAG 2.1 Level AA standards to ensure inclusive experiences

- **Gamification Ready:** Built-in support for achievement indicators, progress tracking, and rewards

- **Cross-Platform:** Consistent implementation across web and mobile platforms

- **Performance Optimized:** Lightweight, efficient components that maintain high performance

- **Consistency with Flexibility:** Unified visual language that allows for journey-specific customization

## Technologies

- **React/React Native:** Core UI framework for both web and mobile platforms

- **Styled Components (v6.0+):** CSS-in-JS styling with theming capabilities

- **TypeScript (v5.3.3+):** Type-safe component development and usage

- **Storybook (v7.0+):** Component documentation and visual testing

- **Jest/React Testing Library (v14.0+):** Component testing with accessibility validation

- **Reanimated (v3.0+):** Performance-optimized animations for gamification effects

- **Victory Native (v36.0+):** Cross-platform chart components for health metrics

## Architecture

The design system follows a layered architecture that establishes clear separation of concerns and promotes component reusability:

### Design Tokens

At the foundation of the design system are design tokens—atomic values that define the visual language authored and versioned in the `@design-system/primitives` package:

- **Colors**: Defines palettes for brand colors, journey-specific themes (health: green, care: orange, plan: blue), semantic states (success, warning, error, info), and a neutral grayscale.
- **Typography**: Specifies font families, sizes, weights, line heights, and letter spacing optimized for bilingual support (Portuguese and English).
- **Spacing**: Implements an 8-point grid system for consistent layout spacing across the application.
- **Shadows**: Provides elevation tokens (sm, md, lg, xl) with precise RGBA values.
- **Animation**: Defines standardized animation durations and easing curves.
- **Breakpoints**: Establishes responsive breakpoints for adapting layouts across device sizes.

### UI Primitives

The design system includes five foundational primitives implemented in the standalone `@design-system/primitives` package with its own CI build pipeline:

- **Box**: Provides comprehensive layout capabilities (flex, grid, spacing, sizing, positioning).
- **Text**: Handles typography with support for all text styles, colors, and truncation.
- **Stack**: Implements flex container with responsive spacing and gap support.
- **Icon**: Manages SVG icon rendering with dynamic fills and accessibility.
- **Touchable**: Creates cross-platform pressable elements with consistent interaction states.

### Themes

The theming layer applies design tokens consistently across the application with theme contracts enforced by shared types from `@austa/interfaces`:

- **Base Theme**: Consolidates all design tokens into a default theme.
- **Journey-Specific Themes**: 
  - **Health Theme**: Green-based palette with health-specific component styling.
  - **Care Theme**: Orange-based palette with care-specific component styling.
  - **Plan Theme**: Blue-based palette with plan-specific component styling.

### Core Components

Built on primitives, the core components in `@austa/design-system` import primitives, tokens, and interfaces from their respective packages:

- **Input Controls**: Button, Input, Select, Checkbox, RadioButton, DatePicker
- **Containers**: Card, Modal, Accordion
- **Feedback**: ProgressBar, ProgressCircle, Toast
- **Navigation**: Tabs, Avatar, Badge

### Journey Components

Journey-specific components address the unique needs of each user journey, importing components from `@austa/design-system` and context from `@austa/journey-context`:

- **Health**: DeviceCard, GoalCard, HealthChart, MetricCard
- **Care**: AppointmentCard, MedicationCard, ProviderCard, SymptomSelector, VideoConsultation
- **Plan**: BenefitCard, ClaimCard, CoverageInfoCard, InsuranceCard

## Getting Started

1. **Installation:**

   ```bash
   # Using yarn
   yarn add @austa/design-system @design-system/primitives @austa/interfaces @austa/journey-context

   # Using npm
   npm install @austa/design-system @design-system/primitives @austa/interfaces @austa/journey-context
   
   # Using pnpm (recommended for workspace management)
   pnpm add @austa/design-system @design-system/primitives @austa/interfaces @austa/journey-context
   ```

2. **Setup:**

   ```jsx
   // In your app's root component
   import { ThemeProvider } from '@austa/design-system';
   import { defaultTheme } from '@design-system/primitives';
   import { JourneyProvider } from '@austa/journey-context';

   const App = () => {
     return (
       <JourneyProvider>
         <ThemeProvider theme={defaultTheme}>
           {/* Your application */}
         </ThemeProvider>
       </JourneyProvider>
     );
   };
   ```

3. **Basic Usage:**

   ```jsx
   // Import components from the main design system package
   import { Button, Card } from '@austa/design-system';
   // Import primitives from the primitives package
   import { Box, Text } from '@design-system/primitives';

   const MyComponent = () => {
     return (
       <Card journey="health">
         <Box padding="md">
           <Text variant="heading">Health Metrics</Text>
           <Text variant="body">Track your important health indicators</Text>
           <Button onPress={() => console.log('Button pressed')}>
             View Details
           </Button>
         </Box>
       </Card>
     );
   };
   ```

4. **Journey-Specific Components:**

   ```jsx
   // Import journey-specific components from the design system
   import { HealthMetricCard } from '@austa/design-system';
   // Import journey context hooks
   import { useHealthContext } from '@austa/journey-context';
   // Import shared interfaces
   import { HealthMetricType } from '@austa/interfaces';

   const HeartRateCard = () => {
     const { updateMetric } = useHealthContext();
     
     return (
       <HealthMetricCard
         title="Heart Rate"
         value={72}
         unit="bpm"
         trend="stable"
         achievement={{ title: "Heart Health Monitor", points: 50 }}
         onUpdate={(value) => updateMetric(HealthMetricType.HEART_RATE, value)}
       />
     );
   };
   ```

## Core Concepts

### Design Tokens

Foundational values for visual attributes across the design system.

```jsx
// Accessing design tokens from primitives package
import { tokens } from '@design-system/primitives';

// Color usage
const primaryHealthColor = tokens.colors.journeys.health.primary; // #0ACF83
const primaryCareColor = tokens.colors.journeys.care.primary; // #FF8C42
const primaryPlanColor = tokens.colors.journeys.plan.primary; // #3A86FF
```

### Journey Theming

All components support journey-specific styling via the `journey` prop.

```jsx
// Components adapt to journey context
<Button journey="health">View Health Dashboard</Button>
<Button journey="care">Book Appointment</Button>
<Button journey="plan">Submit Claim</Button>

// Using journey context
import { useJourneyContext } from '@austa/journey-context';

const MyComponent = () => {
  const { currentJourney } = useJourneyContext();
  
  return (
    <Button journey={currentJourney}>Dynamic Journey Button</Button>
  );
};
```

### Accessibility Features

Built-in accessibility support in all components.

```jsx
// Accessibility props are supported on all components
<Button 
  accessibilityLabel="View health metrics details"
  accessibilityHint="Opens the detailed view of your health metrics"
>
  View Details
</Button>
```

### Gamification Components

Specialized components for achievements, progress tracking, and rewards.

```jsx
import { AchievementBadge, ProgressTracker, RewardCard } from '@austa/design-system';
import { AchievementStatus } from '@austa/interfaces';

// Achievement badge
<AchievementBadge 
  achievement={{
    id: "steps-goal",
    title: "Step Master",
    description: "Complete 10,000 steps for 7 consecutive days",
    progress: 5,
    total: 7,
    status: AchievementStatus.IN_PROGRESS,
    journey: "health"
  }}
/>

// Progress tracker
<ProgressTracker 
  current={7500}
  target={10000}
  label="Daily Steps"
  journey="health"
/>
```

## Integration with Other Packages

The design system is designed to work seamlessly with other packages in the monorepo workspace:

### TypeScript Configuration

The design system packages use TypeScript project references to ensure proper build order and type checking:

```json
// tsconfig.json example
{
  "compilerOptions": {
    "paths": {
      "@design-system/primitives": ["../primitives/src"],
      "@austa/interfaces": ["../interfaces"],
      "@austa/journey-context": ["../journey-context/src"],
      "@austa/design-system": ["./src"]
    }
  },
  "references": [
    { "path": "../primitives" },
    { "path": "../interfaces" },
    { "path": "../journey-context" }
  ]
}
```

### Workspace Configuration

The design system uses pnpm workspaces to manage package dependencies and versioning:

```json
// package.json workspace example
{
  "name": "@austa/design-system",
  "version": "1.0.0",
  "dependencies": {
    "@design-system/primitives": "workspace:*",
    "@austa/interfaces": "workspace:*",
    "@austa/journey-context": "workspace:*"
  }
}
```

### Platform Integration

The design system is integrated with both web (Next.js) and mobile (React Native) platforms:

- **Web Integration**: Next.js configuration includes path aliases for all design system packages
- **Mobile Integration**: React Native Metro bundler is configured to resolve all design system packages

## Component Categories

- **Typography:** Text, Heading, Label

- **Layout:** Box, Flex, Grid, Stack

- **Inputs:** Button, TextField, Select, Checkbox, RadioButton, Toggle, DatePicker

- **Feedback:** Toast, Alert, ProgressBar, Skeleton

- **Navigation:** Tabs, BottomNavigation, Breadcrumb, Link

- **Containers:** Card, Modal, Drawer, Panel

- **Data Display:** Table, List, Tag, Badge, Avatar

- **Health Journey:** HealthMetricCard, MedicalTimeline, GoalCard, DeviceCard

- **Care Journey:** ProviderCard, AppointmentCard, TelemedicineScreen, MedicationCard

- **Plan Journey:** CoverageCard, ClaimCard, InsuranceCard, BenefitCard

- **Gamification:** AchievementBadge, ProgressTracker, RewardCard, LevelIndicator

- **Data Visualization:** BarChart, LineChart, PieChart, RadialProgress

## Documentation

For detailed documentation on each component, including APIs, examples, and accessibility guidelines, visit our Storybook:

[<https://design-system.austa.com.br](https://design-system.austa.com.br)>

## Migration Guide

If you're migrating from a previous version of the design system, please follow these steps:

1. **Update Dependencies**: Add all required packages to your package.json
   ```bash
   pnpm add @austa/design-system @design-system/primitives @austa/interfaces @austa/journey-context
   ```

2. **Update Imports**: Change your imports to use the appropriate packages
   ```jsx
   // Before
   import { Box, Text, Button } from '@austa/design-system';
   
   // After
   import { Box, Text } from '@design-system/primitives';
   import { Button } from '@austa/design-system';
   ```

3. **Update Context Usage**: Use the new journey context
   ```jsx
   // Before
   import { useJourney } from '@austa/design-system';
   
   // After
   import { useJourneyContext } from '@austa/journey-context';
   ```

4. **Update TypeScript Imports**: Use interfaces from the interfaces package
   ```jsx
   // Before
   import { HealthMetricType } from '@austa/design-system/types';
   
   // After
   import { HealthMetricType } from '@austa/interfaces';
   ```

## Contributing

We welcome contributions to the design system! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute.

## License

Copyright © 2025 AUSTA. All rights reserved.