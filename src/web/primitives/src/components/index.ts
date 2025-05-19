/**
 * @file Central barrel file that exports all primitive UI components from the primitives package.
 * This file simplifies imports for consumers by allowing them to import multiple components
 * from a single path, e.g., `import { Box, Text, Stack } from '@design-system/primitives/components'`.
 */

// Box component and types
export { default as Box } from './Box/Box';
export type { BoxProps } from './Box/Box';

// Icon component and types
export { Icon } from './Icon';
export type { IconProps } from './Icon';

// Stack component and types
export { Stack } from './Stack';
export type { StackProps } from './Stack';

// Text component and types
export { Text } from './Text';
export type { TextProps } from './Text';

// Touchable component and types
export { Touchable } from './Touchable';
export type { TouchableProps } from './Touchable';