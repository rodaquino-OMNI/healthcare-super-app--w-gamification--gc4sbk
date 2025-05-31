/**
 * @design-system/primitives
 * 
 * This is the main entry point for the @design-system/primitives package.
 * It exports all design tokens and primitive UI components that form the foundation
 * of the AUSTA SuperApp design system.
 *
 * The package is organized into two main categories:
 * 1. Tokens - Design tokens (colors, typography, spacing, shadows, animations, breakpoints)
 * 2. Components - Primitive UI components (Box, Text, Stack, Icon, Touchable)
 *
 * @example
 * // Import tokens
 * import { colors, spacing, typography } from '@design-system/primitives';
 *
 * // Import components
 * import { Box, Text, Stack } from '@design-system/primitives';
 *
 * // Import specific token or component
 * import { colors } from '@design-system/primitives/tokens';
 * import { Box } from '@design-system/primitives/components';
 */

// Export all tokens
export * from './tokens';

// Export all components
export * from './components';

// Re-export tokens as a namespace for backward compatibility
import * as tokensImport from './tokens';
export const tokens = tokensImport;

// Re-export components as a namespace for backward compatibility
import * as componentsImport from './components';
export const components = componentsImport;

// Export individual tokens for direct imports
export { default as colors } from './tokens/colors';
export { default as typography } from './tokens/typography';
export { default as spacing } from './tokens/spacing';
export { default as shadows } from './tokens/shadows';
export { default as animation } from './tokens/animation';
export { default as breakpoints } from './tokens/breakpoints';

// Export individual components for direct imports
export { Box } from './components/Box/Box';
export { Text } from './components/Text/Text';
export { Stack } from './components/Stack/Stack';
export { Icon } from './components/Icon/Icon';
export { Touchable } from './components/Touchable/Touchable';