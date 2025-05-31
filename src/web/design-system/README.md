# AUSTA SuperApp Design System

## Overview

The AUSTA SuperApp Design System is a comprehensive collection of reusable components, design tokens, patterns, and guidelines that power our journey-centered healthcare application. This system ensures consistent, accessible, and engaging user experiences across all three core journeys: My Health (Minha Saúde), Care Now (Cuidar-me Agora), and My Plan & Benefits (Meu Plano & Benefícios).

## Architecture

The design system is organized into four discrete workspace packages within the monorepo:

- **@austa/design-system**: The main package that exports all components, themes, and utilities for application consumption. It serves as the public API entry point for all UI components.
- **@design-system/primitives**: Contains all design tokens, atomic UI building blocks, and primitive components that form the foundation of the design system.
- **@austa/interfaces**: Houses all shared TypeScript definitions and type contracts used across the design system and applications.
- **@austa/journey-context**: Provides context providers and hooks for journey-specific state management across components.

This unified approach ensures consistency across platforms while optimizing for the specific capabilities and constraints of each environment.

### Layered Architecture

The design system follows a layered architecture that establishes clear separation of concerns and promotes component reusability:

1. **Design Tokens** (@design-system/primitives): Foundational values for colors, typography, spacing, shadows, animation, and breakpoints.
2. **Themes**: Journey-specific theming applied consistently using theme contracts from @austa/interfaces.
3. **UI Primitives** (@design-system/primitives): Five foundational components (Box, Text, Stack, Icon, Touchable).
4. **Core Components** (@austa/design-system): Built on primitives, importing from @design-system/primitives and @austa/interfaces.
5. **Journey Context** (@austa/journey-context): React context providers for journey-specific state management.
6. **Journey Components**: Specialized components for each journey, importing from @austa/design-system and @austa/journey-context.
7. **Data Visualization**: Chart components for health metrics and other data visualization needs.
8. **Gamification Elements**: Components supporting the gamification system across all journeys.

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

## Getting Started

1. **Installation:**

   ```bash
   # Using yarn
   yarn add @austa/design-system @design-system/primitives @austa/interfaces @austa/journey-context

   # Using npm
   npm install @austa/design-system @design-system/primitives @austa/interfaces @austa/journey-context

   # Using pnpm
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
   // Import primitives directly when needed
   import { Box, Text } from '@design-system/primitives';
   
   // Import components from the main design system
   import { Button, Card } from '@austa/design-system';
   
   // Import journey-specific hooks
   import { useHealthContext } from '@austa/journey-context';

   const MyComponent = () => {
     const { activeMetrics } = useHealthContext();
     
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
   // Import journey-specific components
   import { HealthMetricCard } from '@austa/design-system';
   
   // Import types from interfaces package
   import { MetricTrend } from '@austa/interfaces/health';

   const HeartRateCard = () => {
     return (
       <HealthMetricCard
         title="Heart Rate"
         value={72}
         unit="bpm"
         trend={MetricTrend.STABLE}
         achievement={{ title: "Heart Health Monitor", points: 50 }}
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
// Import from the main design system package
import { AchievementBadge, ProgressTracker, RewardCard } from '@austa/design-system';

// Import types from interfaces package
import { Achievement } from '@austa/interfaces/gamification';

// Achievement badge
<AchievementBadge 
  achievement={{
    id: "steps-goal",
    title: "Step Master",
    description: "Complete 10,000 steps for 7 consecutive days",
    progress: 5,
    total: 7,
    unlocked: false,
    journey: "health"
  } as Achievement}
/>

// Progress tracker
<ProgressTracker 
  current={7500}
  target={10000}
  label="Daily Steps"
  journey="health"
/>
```

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

## Integration with Other Packages

The design system is designed to work seamlessly with other packages in the monorepo:

### Web Integration

```jsx
// In Next.js applications
import { Button } from '@austa/design-system';
import { Box, Text } from '@design-system/primitives';
import { useJourneyState } from '@austa/journey-context';
import { UserProfile } from '@austa/interfaces/auth';

const ProfileComponent = ({ user }: { user: UserProfile }) => {
  const { currentJourney } = useJourneyState();
  
  return (
    <Box padding="lg">
      <Text variant="heading">{user.name}</Text>
      <Button journey={currentJourney}>Update Profile</Button>
    </Box>
  );
};
```

### Mobile Integration

```jsx
// In React Native applications
import { AppointmentCard } from '@austa/design-system';
import { Stack } from '@design-system/primitives';
import { useCareContext } from '@austa/journey-context';
import { Appointment } from '@austa/interfaces/care';

const AppointmentsScreen = () => {
  const { appointments } = useCareContext();
  
  return (
    <Stack spacing="md">
      {appointments.map((appointment: Appointment) => (
        <AppointmentCard 
          key={appointment.id}
          appointment={appointment}
        />
      ))}
    </Stack>
  );
};
```

## Documentation

For detailed documentation on each component, including APIs, examples, and accessibility guidelines, visit our Storybook:

[https://design-system.austa.com.br](https://design-system.austa.com.br)

## Contributing

We welcome contributions to the design system! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute.

## License

Copyright © 2023-2025 AUSTA. All rights reserved.