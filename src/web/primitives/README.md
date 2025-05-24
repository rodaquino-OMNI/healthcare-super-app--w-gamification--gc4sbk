# @design-system/primitives

## Overview

The `@design-system/primitives` package provides the foundational building blocks for the AUSTA SuperApp design system. It contains design tokens, atomic UI components, and primitive elements that form the basis of all UI components across both web and mobile platforms.

This package is platform-agnostic and works seamlessly with both React (web) and React Native (mobile) applications, ensuring consistent styling and behavior across all platforms.

## Installation

```bash
# Using yarn
yarn add @design-system/primitives

# Using npm
npm install @design-system/primitives

# Using pnpm
pnpm add @design-system/primitives
```

## Design Tokens

Design tokens are the atomic values that define the visual language of the AUSTA SuperApp. They ensure consistency across all components and platforms.

### Colors

```jsx
import { tokens } from '@design-system/primitives';

// Brand colors
const primaryColor = tokens.colors.brand.primary; // #5B39F3
const secondaryColor = tokens.colors.brand.secondary; // #8F7DF7

// Journey-specific colors
const healthPrimary = tokens.colors.journeys.health.primary; // #0ACF83
const carePrimary = tokens.colors.journeys.care.primary; // #FF8C42
const planPrimary = tokens.colors.journeys.plan.primary; // #3A86FF

// Semantic colors
const successColor = tokens.colors.semantic.success; // #0ACF83
const errorColor = tokens.colors.semantic.error; // #FF3B30
const warningColor = tokens.colors.semantic.warning; // #FFCC00
const infoColor = tokens.colors.semantic.info; // #3A86FF

// Neutral colors
const black = tokens.colors.neutral.black; // #000000
const white = tokens.colors.neutral.white; // #FFFFFF
const gray100 = tokens.colors.neutral.gray100; // #F8F9FA
const gray900 = tokens.colors.neutral.gray900; // #212529
```

### Typography

```jsx
import { tokens } from '@design-system/primitives';

// Font families
const fontFamily = tokens.typography.fontFamily.base; // 'Inter, system-ui, sans-serif'
const monoFamily = tokens.typography.fontFamily.mono; // 'Roboto Mono, monospace'

// Font sizes
const fontSize = tokens.typography.fontSize.md; // 16px
const headingSize = tokens.typography.fontSize.xl; // 24px

// Font weights
const regular = tokens.typography.fontWeight.regular; // 400
const bold = tokens.typography.fontWeight.bold; // 700

// Line heights
const lineHeight = tokens.typography.lineHeight.md; // 1.5
```

### Spacing

```jsx
import { tokens } from '@design-system/primitives';

// Spacing values (8-point grid system)
const spaceXs = tokens.spacing.xs; // 4px
const spaceSm = tokens.spacing.sm; // 8px
const spaceMd = tokens.spacing.md; // 16px
const spaceLg = tokens.spacing.lg; // 24px
const spaceXl = tokens.spacing.xl; // 32px
const space2xl = tokens.spacing['2xl']; // 48px
const space3xl = tokens.spacing['3xl']; // 64px
```

### Shadows

```jsx
import { tokens } from '@design-system/primitives';

// Shadow values
const shadowSm = tokens.shadows.sm; // '0 1px 2px rgba(0, 0, 0, 0.05)'
const shadowMd = tokens.shadows.md; // '0 4px 6px rgba(0, 0, 0, 0.1)'
const shadowLg = tokens.shadows.lg; // '0 10px 15px rgba(0, 0, 0, 0.1)'
const shadowXl = tokens.shadows.xl; // '0 20px 25px rgba(0, 0, 0, 0.15)'
```

### Animation

```jsx
import { tokens } from '@design-system/primitives';

// Animation durations
const durationFast = tokens.animation.duration.fast; // '150ms'
const durationNormal = tokens.animation.duration.normal; // '300ms'
const durationSlow = tokens.animation.duration.slow; // '500ms'

// Animation easing curves
const easingStandard = tokens.animation.easing.standard; // 'cubic-bezier(0.4, 0.0, 0.2, 1)'
const easingAccelerate = tokens.animation.easing.accelerate; // 'cubic-bezier(0.4, 0.0, 1, 1)'
const easingDecelerate = tokens.animation.easing.decelerate; // 'cubic-bezier(0.0, 0.0, 0.2, 1)'
```

### Breakpoints

```jsx
import { tokens } from '@design-system/primitives';

// Responsive breakpoints
const breakpointSm = tokens.breakpoints.sm; // '640px'
const breakpointMd = tokens.breakpoints.md; // '768px'
const breakpointLg = tokens.breakpoints.lg; // '1024px'
const breakpointXl = tokens.breakpoints.xl; // '1280px'
const breakpoint2xl = tokens.breakpoints['2xl']; // '1536px'
```

## Primitive Components

The package includes five foundational primitive components that serve as the building blocks for all UI components in the design system.

### Box

A versatile layout component that provides comprehensive layout capabilities including flex, grid, spacing, sizing, and positioning.

```jsx
import { Box } from '@design-system/primitives';

// Web example
const WebExample = () => (
  <Box 
    display="flex" 
    flexDirection="column" 
    padding="md" 
    backgroundColor="neutral.gray100"
    borderRadius="md"
    width="100%"
    maxWidth="500px"
  >
    <Box padding="sm" backgroundColor="white" marginBottom="md">
      Content Box 1
    </Box>
    <Box padding="sm" backgroundColor="white">
      Content Box 2
    </Box>
  </Box>
);

// React Native example
const MobileExample = () => (
  <Box 
    display="flex" 
    flexDirection="column" 
    padding="md" 
    backgroundColor="neutral.gray100"
    borderRadius="md"
    width="100%"
  >
    <Box padding="sm" backgroundColor="white" marginBottom="md">
      <Text>Content Box 1</Text>
    </Box>
    <Box padding="sm" backgroundColor="white">
      <Text>Content Box 2</Text>
    </Box>
  </Box>
);
```

### Text

Handles typography with support for all text styles, colors, and truncation options.

```jsx
import { Text } from '@design-system/primitives';

// Web example
const WebExample = () => (
  <>
    <Text variant="heading1" color="brand.primary">Heading Text</Text>
    <Text variant="body" color="neutral.gray900">Regular body text with standard styling.</Text>
    <Text 
      variant="caption" 
      color="neutral.gray600"
      numberOfLines={1} // Truncates text after 1 line
    >
      This is a caption text that will be truncated if it gets too long for a single line.
    </Text>
  </>
);

// React Native example
const MobileExample = () => (
  <>
    <Text variant="heading1" color="brand.primary">Heading Text</Text>
    <Text variant="body" color="neutral.gray900">Regular body text with standard styling.</Text>
    <Text 
      variant="caption" 
      color="neutral.gray600"
      numberOfLines={1} // Works the same on mobile
    >
      This is a caption text that will be truncated if it gets too long for a single line.
    </Text>
  </>
);
```

### Stack

Implements flex container with responsive spacing and gap support for easy vertical or horizontal layouts.

```jsx
import { Stack, Box, Text } from '@design-system/primitives';

// Vertical stack (default)
const VerticalStackExample = () => (
  <Stack spacing="md">
    <Box padding="sm" backgroundColor="journeys.health.primary">
      <Text color="white">Item 1</Text>
    </Box>
    <Box padding="sm" backgroundColor="journeys.care.primary">
      <Text color="white">Item 2</Text>
    </Box>
    <Box padding="sm" backgroundColor="journeys.plan.primary">
      <Text color="white">Item 3</Text>
    </Box>
  </Stack>
);

// Horizontal stack
const HorizontalStackExample = () => (
  <Stack direction="row" spacing="md" alignItems="center">
    <Box padding="sm" backgroundColor="journeys.health.primary">
      <Text color="white">Item 1</Text>
    </Box>
    <Box padding="sm" backgroundColor="journeys.care.primary">
      <Text color="white">Item 2</Text>
    </Box>
    <Box padding="sm" backgroundColor="journeys.plan.primary">
      <Text color="white">Item 3</Text>
    </Box>
  </Stack>
);
```

### Icon

Manages SVG icon rendering with dynamic fills and accessibility support.

```jsx
import { Icon, Stack } from '@design-system/primitives';

const IconExample = () => (
  <Stack direction="row" spacing="md">
    <Icon name="heart" size="md" color="semantic.error" />
    <Icon name="calendar" size="md" color="journeys.care.primary" />
    <Icon name="document" size="md" color="journeys.plan.primary" />
    <Icon 
      name="notification" 
      size="lg" 
      color="brand.primary"
      accessibilityLabel="Notifications" // For screen readers
    />
  </Stack>
);
```

### Touchable

Creates cross-platform pressable elements with consistent interaction states.

```jsx
import { Touchable, Text, Icon } from '@design-system/primitives';

const TouchableExample = () => (
  <>
    <Touchable 
      onPress={() => console.log('Pressed!')}
      backgroundColor="brand.primary"
      paddingVertical="sm"
      paddingHorizontal="md"
      borderRadius="md"
      pressedOpacity={0.8} // Opacity when pressed
    >
      <Text color="white">Press Me</Text>
    </Touchable>
    
    <Touchable 
      onPress={() => console.log('Icon pressed!')}
      hitSlop={8} // Extends touch area by 8px in all directions
      accessibilityLabel="Settings"
      accessibilityRole="button"
    >
      <Icon name="settings" size="md" color="neutral.gray900" />
    </Touchable>
  </>
);
```

## Integration with Design System

The `@design-system/primitives` package serves as the foundation for the main `@austa/design-system` package. All higher-level components in the design system are built using these primitives, ensuring consistency across the entire application.

```jsx
// Example of how the design system uses primitives internally
import { Box, Text, Touchable } from '@design-system/primitives';

// A Button component in the main design system might look like this
const Button = ({ children, variant = 'primary', size = 'md', onPress, ...props }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return 'brand.primary';
      case 'secondary': return 'brand.secondary';
      case 'health': return 'journeys.health.primary';
      case 'care': return 'journeys.care.primary';
      case 'plan': return 'journeys.plan.primary';
      default: return 'brand.primary';
    }
  };
  
  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 'xs', paddingHorizontal: 'sm' };
      case 'md': return { paddingVertical: 'sm', paddingHorizontal: 'md' };
      case 'lg': return { paddingVertical: 'md', paddingHorizontal: 'lg' };
      default: return { paddingVertical: 'sm', paddingHorizontal: 'md' };
    }
  };
  
  return (
    <Touchable
      backgroundColor={getBackgroundColor()}
      borderRadius="md"
      {...getPadding()}
      pressedOpacity={0.8}
      onPress={onPress}
      {...props}
    >
      <Text 
        color="white" 
        variant={size === 'sm' ? 'buttonSmall' : 'button'}
        textAlign="center"
      >
        {children}
      </Text>
    </Touchable>
  );
};
```

## Usage with Journey Context

The primitives can be used alongside the `@austa/journey-context` package to create journey-specific UI components:

```jsx
import { Box, Text, Stack } from '@design-system/primitives';
import { useHealthContext } from '@austa/journey-context';

const HealthMetricDisplay = () => {
  const { currentMetrics } = useHealthContext();
  
  return (
    <Box 
      backgroundColor="journeys.health.background"
      padding="md"
      borderRadius="md"
    >
      <Text variant="heading2" color="journeys.health.primary">Your Health Metrics</Text>
      <Stack spacing="sm" marginTop="md">
        {currentMetrics.map(metric => (
          <Box 
            key={metric.id}
            backgroundColor="white"
            padding="sm"
            borderRadius="sm"
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
          >
            <Text variant="body">{metric.name}</Text>
            <Text variant="body" fontWeight="bold">{metric.value} {metric.unit}</Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
```

## TypeScript Support

All components and tokens are fully typed with TypeScript, providing excellent developer experience with autocompletion and type checking.

```tsx
import { Box, Text, tokens } from '@design-system/primitives';

// TypeScript will enforce correct prop types
const TypedExample = () => (
  <Box 
    padding="md" // Type-checked against available spacing tokens
    backgroundColor="journeys.health.primary" // Type-checked against available color tokens
    borderRadius="md" // Type-checked against available radius tokens
  >
    <Text 
      variant="heading2" // Type-checked against available text variants
      color="white" // Type-checked against available colors
      numberOfLines={2} // Type-checked as number
    >
      TypeScript-powered Components
    </Text>
  </Box>
);
```

## Contributing

We welcome contributions to the primitives package! Please see the main [CONTRIBUTING.md](../CONTRIBUTING.md) file for guidelines on how to contribute.

## License

Copyright © 2023 AUSTA. All rights reserved.