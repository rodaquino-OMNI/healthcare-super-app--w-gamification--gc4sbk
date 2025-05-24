/**
 * @file Central barrel file that exports all primitive UI components.
 * This file serves as the public API entry point for all primitive components,
 * ensuring a consistent and clean import pattern across the application.
 */

// Box component
export { default as Box } from './Box/Box';
export type { BoxProps } from './Box/Box';

// Icon component
export { Icon, type IconProps } from './Icon';

// Stack component
export { Stack, type StackProps } from './Stack';

// Text component
export { Text, type TextProps } from './Text';

// Touchable component
export { Touchable, type TouchableProps } from './Touchable';

// Default exports for easier importing
export { default as BoxComponent } from './Box/Box';
export { default as IconComponent } from './Icon';
export { default as StackComponent } from './Stack';
export { default as TextComponent } from './Text';
export { default as TouchableComponent } from './Touchable';