/**
 * @design-system/primitives
 * 
 * This is the main entry point for the primitives package that exports all design tokens
 * and primitive UI components. It serves as the central aggregation point for all tokens
 * (colors, typography, spacing, shadows, animations, breakpoints) and UI primitives
 * (Box, Text, Stack, Icon, Touchable).
 * 
 * This package provides the foundation for the AUSTA SuperApp design system and ensures
 * consistent design language across all platforms (web and mobile).
 */

// Export all design tokens
export * from './tokens';

// Export all primitive components
export * from './components';

// For backward compatibility and explicit imports
import * as tokens from './tokens';
import * as components from './components';

// Named exports for tokens
export const {
  colors,
  typography,
  spacing,
  shadows,
  animation,
  breakpoints
} = tokens;

// Named exports for components
export const {
  Box,
  Text,
  Stack,
  Icon,
  Touchable
} = components;

// Default export for convenience
export default {
  tokens,
  components,
  // Individual token categories
  colors,
  typography,
  spacing,
  shadows,
  animation,
  breakpoints,
  // Individual components
  Box,
  Text,
  Stack,
  Icon,
  Touchable
};