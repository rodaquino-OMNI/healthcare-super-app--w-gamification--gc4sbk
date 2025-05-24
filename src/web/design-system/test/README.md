# Design System Testing

## Overview

This directory contains the testing setup for the @austa/design-system package. The testing configuration is designed to support comprehensive testing of design system components across both web and mobile platforms, with proper integration with primitives, interfaces, and journey context packages.

## Test Structure

- `setup-tests.js`: Global setup file that runs before Jest loads the test environment
- `setup-after-env.js`: Setup file that runs after the environment is set up but before tests run
- `__mocks__/`: Directory containing mock implementations for various modules
- `run-tests.js`: Helper script to run tests for specific platforms

## Running Tests

You can run tests for specific platforms using the following commands:

```bash
# Run tests for all platforms
npm test

# Run tests for web platform only
npm test -- --platform=web

# Run tests for iOS platform only
npm test -- --platform=ios

# Run tests for Android platform only
npm test -- --platform=android

# Run tests with watch mode
npm test -- --watch --platform=web

# Run tests for a specific component
npm test -- Button
```

## Writing Tests

### Component Tests

Component tests should be placed in the same directory as the component being tested, with a `.test.tsx` or `.spec.tsx` extension. For example:

```
src/components/Button/
  ├── Button.tsx
  ├── Button.styles.ts
  ├── Button.test.tsx
  └── index.ts
```

### Example Test

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from './Button';

describe('<Button />', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Button>Test Button</Button>);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button onPress={onPressMock}>Clickable Button</Button>
    );
    
    fireEvent.press(getByText('Clickable Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
```

### Platform-Specific Tests

You can write platform-specific tests using the global `getPlatform()` function:

```tsx
describe('<Button />', () => {
  it('renders correctly on different platforms', () => {
    const { getByText } = render(<Button>Platform Button</Button>);
    
    if (getPlatform() === 'web') {
      // Web-specific assertions
      expect(getByText('Platform Button')).toHaveStyleRule('cursor', 'pointer');
    } else {
      // Native-specific assertions
      expect(getByText('Platform Button')).toHaveProp('accessibilityRole', 'button');
    }
  });
});
```

## Custom Matchers

The testing setup includes several custom matchers to make testing design system components easier:

- `toHaveJourneyTheme(journey)`: Checks if a component has the correct journey theme
- `toHaveVariant(variant)`: Checks if a component has the correct variant
- `toHaveSize(size)`: Checks if a component has the correct size
- `toBeAccessible({ label, role, hint })`: Checks if a component has the correct accessibility props

## Mocking

The testing setup includes mocks for React Native components and APIs, as well as for the primitives package. You can add additional mocks in the `__mocks__` directory as needed.

## Coverage

The testing configuration includes coverage reporting with thresholds to ensure code quality. You can view the coverage report by running:

```bash
npm test -- --coverage
```

The coverage report will be generated in the `coverage` directory.