/**
 * @file Central barrel file that exports all UI components from the design system.
 * This file provides a clean public API for consumers, allowing applications to import
 * multiple components from a single path.
 * 
 * @example
 * // Import multiple components from a single path
 * import { Button, Card, Input } from '@austa/design-system/components';
 */

import { ComponentType } from 'react';

// Import interfaces from @austa/interfaces
import type { ButtonProps, CardProps, InputProps, ModalProps } from '@austa/interfaces/components';
import type { JourneyType } from '@austa/interfaces/common';

/**
 * Input Components
 * Components that collect user input in various forms
 */

/**
 * Button component for triggering actions
 * @see ButtonProps from '@austa/interfaces/components'
 */
export { Button } from './Button';
export type { ButtonProps } from './Button';

/**
 * Checkbox component for boolean selections
 * @see CheckboxProps
 */
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

/**
 * DatePicker component for selecting dates
 * @see DatePickerProps
 */
export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

/**
 * Input component for text entry
 * @see InputProps from '@austa/interfaces/components'
 */
export { Input } from './Input';
export type { InputProps } from './Input';

/**
 * RadioButton component for single-choice selections
 * @see RadioButtonProps
 */
export { RadioButton } from './RadioButton';
export type { RadioButtonProps } from './RadioButton';

/**
 * Select component for dropdown selections
 * @see SelectProps
 */
export { Select } from './Select';
export type { SelectProps } from './Select';

/**
 * Container Components
 * Components that contain and organize other components
 */

/**
 * Accordion component for collapsible content sections
 * @see AccordionProps
 */
export { Accordion } from './Accordion';
export type { AccordionProps } from './Accordion';

/**
 * Card component for contained content with consistent styling
 * @see CardProps from '@austa/interfaces/components'
 */
export { Card } from './Card';
export type { CardProps } from './Card';

/**
 * Modal component for dialogs and popups
 * @see ModalProps from '@austa/interfaces/components'
 */
export { Modal } from './Modal';
export type { ModalProps } from './Modal';

/**
 * Tabs component for tabbed navigation
 * @see TabsProps
 */
export { Tabs } from './Tabs';
export type { TabsProps } from './Tabs';

/**
 * Feedback Components
 * Components that provide visual feedback to users
 */

/**
 * Badge component for status indicators and labels
 * @see BadgeProps
 */
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

/**
 * ProgressBar component for horizontal progress indication
 * @see ProgressBarProps
 */
export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

/**
 * ProgressCircle component for circular progress indication
 * @see ProgressCircleProps
 */
export { ProgressCircle } from './ProgressCircle';
export type { ProgressCircleProps } from './ProgressCircle';

/**
 * Toast component for temporary notifications
 * @see ToastProps
 */
export { Toast } from './Toast';
export type { ToastProps } from './Toast';

/**
 * Display Components
 * Components for displaying information
 */

/**
 * Avatar component for user profile images
 * @see AvatarProps
 */
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

/**
 * Component Groups
 * Convenience exports for related components
 */

/**
 * All input components grouped together
 */
export const InputComponents = {
  Button,
  Checkbox,
  DatePicker,
  Input,
  RadioButton,
  Select,
};

/**
 * All container components grouped together
 */
export const ContainerComponents = {
  Accordion,
  Card,
  Modal,
  Tabs,
};

/**
 * All feedback components grouped together
 */
export const FeedbackComponents = {
  Badge,
  ProgressBar,
  ProgressCircle,
  Toast,
};

/**
 * All display components grouped together
 */
export const DisplayComponents = {
  Avatar,
};

/**
 * Helper type for components that support journey theming
 * @template T The component props type
 */
export type JourneyAwareComponent<T> = ComponentType<T & { journey?: JourneyType }>;