# @design-system/primitives

## Overview

The `@design-system/primitives` package provides the foundational building blocks for the AUSTA SuperApp design system. It contains design tokens, atomic UI components, and primitive elements that form the basis of all higher-level components across both web and mobile platforms.

This package is platform-agnostic and works seamlessly with both React (web) and React Native (mobile) applications, ensuring consistent design implementation across all AUSTA SuperApp interfaces.

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

```tsx
import { tokens } from '@design-system/primitives';

// Brand colors
const brandPrimary = tokens.colors.brand.primary; // #0066CC
const brandSecondary = tokens.colors.brand.secondary; // #00A3E0

// Journey-specific colors
const healthPrimary = tokens.colors.journeys.health.primary; // #0ACF83
const carePrimary = tokens.colors.journeys.care.primary; // #FF8C42
const planPrimary = tokens.colors.journeys.plan.primary; // #3A86FF

// Semantic colors
const success = tokens.colors.semantic.success; // #0ACF83
const warning = tokens.colors.semantic.warning; // #FFCC00
const error = tokens.colors.semantic.error; // #FF3B30
const info = tokens.colors.semantic.info; // #00A3E0

// Neutral colors
const black = tokens.colors.neutral.black; // #000000
const white = tokens.colors.neutral.white; // #FFFFFF
const gray100 = tokens.colors.neutral.gray100; // #F8F9FA
// ... other gray scales
```

### Typography

```tsx
import { tokens } from '@design-system/primitives';

// Font families
const fontPrimary = tokens.typography.fontFamily.primary; // 'Nunito Sans'
const fontSecondary = tokens.typography.fontFamily.secondary; // 'Roboto'

// Font sizes
const fontXs = tokens.typography.fontSize.xs; // 12px
const fontSm = tokens.typography.fontSize.sm; // 14px
const fontMd = tokens.typography.fontSize.md; // 16px
const fontLg = tokens.typography.fontSize.lg; // 18px
const fontXl = tokens.typography.fontSize.xl; // 20px
const font2xl = tokens.typography.fontSize['2xl']; // 24px
const font3xl = tokens.typography.fontSize['3xl']; // 30px
const font4xl = tokens.typography.fontSize['4xl']; // 36px

// Font weights
const fontRegular = tokens.typography.fontWeight.regular; // 400
const fontMedium = tokens.typography.fontWeight.medium; // 500
const fontSemibold = tokens.typography.fontWeight.semibold; // 600
const fontBold = tokens.typography.fontWeight.bold; // 700

// Line heights
const lineHeightTight = tokens.typography.lineHeight.tight; // 1.25
const lineHeightBase = tokens.typography.lineHeight.base; // 1.5
const lineHeightRelaxed = tokens.typography.lineHeight.relaxed; // 1.75

// Letter spacing
const letterSpacingTight = tokens.typography.letterSpacing.tight; // -0.05em
const letterSpacingNormal = tokens.typography.letterSpacing.normal; // 0
const letterSpacingWide = tokens.typography.letterSpacing.wide; // 0.05em
```

### Spacing

```tsx
import { tokens } from '@design-system/primitives';

// Based on 8-point grid system
const spaceXxs = tokens.spacing.xxs; // 2px
const spaceXs = tokens.spacing.xs; // 4px
const spaceSm = tokens.spacing.sm; // 8px
const spaceMd = tokens.spacing.md; // 16px
const spaceLg = tokens.spacing.lg; // 24px
const spaceXl = tokens.spacing.xl; // 32px
const space2xl = tokens.spacing['2xl']; // 48px
const space3xl = tokens.spacing['3xl']; // 64px
const space4xl = tokens.spacing['4xl']; // 96px
```

### Shadows

```tsx
import { tokens } from '@design-system/primitives';

// Elevation shadows
const shadowSm = tokens.shadows.sm; // '0 1px 2px rgba(0, 0, 0, 0.05)'
const shadowMd = tokens.shadows.md; // '0 4px 6px rgba(0, 0, 0, 0.1)'
const shadowLg = tokens.shadows.lg; // '0 10px 15px rgba(0, 0, 0, 0.1)'
const shadowXl = tokens.shadows.xl; // '0 20px 25px rgba(0, 0, 0, 0.15)'
```

### Animation

```tsx
import { tokens } from '@design-system/primitives';

// Duration
const durationFast = tokens.animation.duration.fast; // 150ms
const durationNormal = tokens.animation.duration.normal; // 300ms
const durationSlow = tokens.animation.duration.slow; // 500ms

// Easing
const easingStandard = tokens.animation.easing.standard; // 'cubic-bezier(0.4, 0.0, 0.2, 1)'
const easingAccelerate = tokens.animation.easing.accelerate; // 'cubic-bezier(0.4, 0.0, 1, 1)'
const easingDecelerate = tokens.animation.easing.decelerate; // 'cubic-bezier(0.0, 0.0, 0.2, 1)'
```

### Breakpoints

```tsx
import { tokens } from '@design-system/primitives';

// Responsive breakpoints
const breakpointXs = tokens.breakpoints.xs; // 0px (base)
const breakpointSm = tokens.breakpoints.sm; // 576px
const breakpointMd = tokens.breakpoints.md; // 768px
const breakpointLg = tokens.breakpoints.lg; // 992px
const breakpointXl = tokens.breakpoints.xl; // 1200px
const breakpoint2xl = tokens.breakpoints['2xl']; // 1400px
```

## Primitive Components

The package provides five foundational UI primitives that serve as the building blocks for all higher-level components in the design system.

### Box

A versatile layout component that provides comprehensive styling capabilities.

```tsx
// Web (React)
import { Box } from '@design-system/primitives';

const MyComponent = () => (
  <Box 
    padding="md"
    margin="sm"
    backgroundColor="neutral.gray100"
    borderRadius="md"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    width="100%"
    height="200px"
    shadow="md"
  >
    Content goes here
  </Box>
);

// Mobile (React Native)
import { Box } from '@design-system/primitives';

const MyComponent = () => (
  <Box 
    padding="md"
    margin="sm"
    backgroundColor="neutral.gray100"
    borderRadius="md"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    width="100%"
    height={200}
    shadow="md"
  >
    {/* Content goes here */}
  </Box>
);
```

### Text

A component for rendering text with typography controls.

```tsx
// Web (React)
import { Text } from '@design-system/primitives';

const MyComponent = () => (
  <Text 
    fontSize="md"
    fontWeight="bold"
    color="journeys.health.primary"
    textAlign="center"
    lineHeight="base"
    letterSpacing="normal"
    truncate
    numberOfLines={2}
  >
    This is a text component with health journey styling
  </Text>
);

// Mobile (React Native)
import { Text } from '@design-system/primitives';

const MyComponent = () => (
  <Text 
    fontSize="md"
    fontWeight="bold"
    color="journeys.health.primary"
    textAlign="center"
    lineHeight="base"
    letterSpacing="normal"
    numberOfLines={2}
  >
    This is a text component with health journey styling
  </Text>
);
```

### Stack

A layout component that arranges children with consistent spacing.

```tsx
// Web (React)
import { Stack, Box, Text } from '@design-system/primitives';

const MyComponent = () => (
  <Stack 
    direction="column"
    spacing="md"
    align="center"
    justify="center"
    wrap="nowrap"
  >
    <Box backgroundColor="journeys.health.primary" padding="md">
      <Text color="neutral.white">Item 1</Text>
    </Box>
    <Box backgroundColor="journeys.care.primary" padding="md">
      <Text color="neutral.white">Item 2</Text>
    </Box>
    <Box backgroundColor="journeys.plan.primary" padding="md">
      <Text color="neutral.white">Item 3</Text>
    </Box>
  </Stack>
);

// Mobile (React Native)
import { Stack, Box, Text } from '@design-system/primitives';

const MyComponent = () => (
  <Stack 
    direction="column"
    spacing="md"
    align="center"
    justify="center"
  >
    <Box backgroundColor="journeys.health.primary" padding="md">
      <Text color="neutral.white">Item 1</Text>
    </Box>
    <Box backgroundColor="journeys.care.primary" padding="md">
      <Text color="neutral.white">Item 2</Text>
    </Box>
    <Box backgroundColor="journeys.plan.primary" padding="md">
      <Text color="neutral.white">Item 3</Text>
    </Box>
  </Stack>
);
```

### Icon

A component for rendering SVG icons with dynamic fills and accessibility support.

```tsx
// Web (React)
import { Icon } from '@design-system/primitives';

const MyComponent = () => (
  <Icon 
    name="heart"
    size="md"
    color="journeys.health.primary"
    accessibilityLabel="Health icon"
  />
);

// Mobile (React Native)
import { Icon } from '@design-system/primitives';

const MyComponent = () => (
  <Icon 
    name="heart"
    size="md"
    color="journeys.health.primary"
    accessibilityLabel="Health icon"
  />
);
```

### Touchable

A cross-platform pressable element with consistent interaction states.

```tsx
// Web (React)
import { Touchable, Text } from '@design-system/primitives';

const MyComponent = () => (
  <Touchable 
    onPress={() => console.log('Pressed')}
    activeOpacity={0.8}
    backgroundColor="journeys.care.primary"
    padding="md"
    borderRadius="md"
    accessibilityLabel="Press me"
    accessibilityHint="Activates the button"
  >
    <Text color="neutral.white">Press Me</Text>
  </Touchable>
);

// Mobile (React Native)
import { Touchable, Text } from '@design-system/primitives';

const MyComponent = () => (
  <Touchable 
    onPress={() => console.log('Pressed')}
    activeOpacity={0.8}
    backgroundColor="journeys.care.primary"
    padding="md"
    borderRadius="md"
    accessibilityLabel="Press me"
    accessibilityHint="Activates the button"
  >
    <Text color="neutral.white">Press Me</Text>
  </Touchable>
);
```

## Integration with Design System

The `@design-system/primitives` package serves as the foundation for the AUSTA SuperApp design system. Higher-level components in the `@austa/design-system` package are built using these primitives, ensuring consistency across the application.

```tsx
// Example of how a Button component in @austa/design-system might use primitives
import { Touchable, Text } from '@design-system/primitives';

const Button = ({ children, variant = 'primary', journey = 'health', onPress, ...props }) => {
  const getBackgroundColor = () => {
    if (variant === 'primary') {
      return `journeys.${journey}.primary`;
    }
    return 'neutral.white';
  };

  const getTextColor = () => {
    if (variant === 'primary') {
      return 'neutral.white';
    }
    return `journeys.${journey}.primary`;
  };

  return (
    <Touchable
      backgroundColor={getBackgroundColor()}
      padding="md"
      borderRadius="md"
      onPress={onPress}
      {...props}
    >
      <Text color={getTextColor()} fontWeight="bold" textAlign="center">
        {children}
      </Text>
    </Touchable>
  );
};
```

## TypeScript Support

All components and tokens are fully typed with TypeScript, providing excellent developer experience with autocompletion and type checking.

```tsx
import { Box, BoxProps, tokens } from '@design-system/primitives';

// Type-safe props
const CustomBox = (props: BoxProps) => (
  <Box {...props} />
);

// Type-safe token access
type ColorToken = keyof typeof tokens.colors;
type SpacingToken = keyof typeof tokens.spacing;
```

## Accessibility

All primitive components are built with accessibility in mind, supporting WCAG 2.1 Level AA standards:

- Proper contrast ratios in color tokens
- Screen reader support via accessibilityLabel and accessibilityHint props
- Keyboard navigation support for web components
- Focus management utilities

## Contributing

We welcome contributions to the primitives package! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on how to contribute.

## License

Copyright © 2023 AUSTA. All rights reserved.