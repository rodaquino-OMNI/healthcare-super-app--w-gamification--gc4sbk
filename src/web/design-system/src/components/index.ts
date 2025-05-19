/**
 * @file Component exports for the AUSTA SuperApp design system
 * 
 * This file serves as the central barrel export for all UI components in the design system.
 * It provides a clean public API for consumers, allowing applications to import multiple
 * components from a single path.
 * 
 * Example usage:
 * ```tsx
 * import { Button, Card, Input } from '@austa/design-system/components';
 * ```
 * 
 * Components are organized by functional category to improve discoverability:
 * - Input Controls: Form elements and interactive controls
 * - Containers: Layout and content containers
 * - Feedback: Progress indicators and notifications
 * - Navigation: Navigation and identification elements
 */

// Import component interfaces from @austa/interfaces
import type {
  AccordionProps,
  AvatarProps,
  BadgeProps,
  ButtonProps,
  CardProps,
  CheckboxProps,
  DatePickerProps,
  InputProps,
  ModalProps,
  ProgressBarProps,
  ProgressCircleProps,
  RadioButtonProps,
  SelectProps,
  TabsProps,
  ToastProps
} from '@austa/interfaces/components';

// ===== Input Controls =====

/**
 * Button component for triggering actions
 * 
 * @supports variants: primary, secondary, tertiary
 * @supports sizes: sm, md, lg
 * @supports states: disabled, loading
 * @supports journeys: health, care, plan
 */
export { Button } from './Button';
export type { ButtonProps };

/**
 * Input component for text entry
 * 
 * @supports types: text, email, password, number
 * @supports states: disabled, error
 * @supports journeys: health, care, plan
 */
export { Input } from './Input';
export type { InputProps };

/**
 * Select component for dropdown selection
 * 
 * @supports variants: single, multi
 * @supports features: search, filtering
 * @supports states: disabled, error
 * @supports journeys: health, care, plan
 */
export { Select } from './Select';
export type { SelectProps };

/**
 * Checkbox component for boolean selection
 * 
 * @supports states: checked, unchecked, disabled, error
 * @supports journeys: health, care, plan
 * @supports platforms: web, mobile
 */
export { Checkbox } from './Checkbox';
export type { CheckboxProps };

/**
 * RadioButton component for single selection from a group
 * 
 * @supports states: selected, unselected, disabled, error
 * @supports journeys: health, care, plan
 * @supports platforms: web, mobile
 */
export { RadioButton } from './RadioButton';
export type { RadioButtonProps };

/**
 * DatePicker component for date selection
 * 
 * @supports features: min/max dates, custom format, locale (pt-BR)
 * @supports states: disabled, error
 * @supports journeys: health, care, plan
 * @supports methods: open(), close(), clear()
 */
export { DatePicker } from './DatePicker';
export type { DatePickerProps };

// ===== Containers =====

/**
 * Card component for content grouping
 * 
 * @supports elevations: sm, md, lg
 * @supports features: journey-specific accents, onPress handling
 * @supports journeys: health, care, plan
 */
export { Card } from './Card';
export type { CardProps };

/**
 * Modal component for overlay dialogs
 * 
 * @supports features: title, close button, backdrop click
 * @supports journeys: health, care, plan
 * @supports a11y: focus trap, escape to close
 */
export { Modal } from './Modal';
export type { ModalProps };

/**
 * Accordion component for collapsible content
 * 
 * @supports states: expanded, collapsed
 * @supports features: controlled/uncontrolled mode
 * @supports journeys: health, care, plan
 * @supports a11y: keyboard navigation
 */
export { Accordion } from './Accordion';
export type { AccordionProps };

// ===== Feedback =====

/**
 * ProgressBar component for horizontal progress indication
 * 
 * @supports sizes: sm, md, lg
 * @supports features: level markers, percentage display
 * @supports journeys: health, care, plan
 * @supports a11y: aria-valuenow, aria-valuemin, aria-valuemax
 */
export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps };

/**
 * ProgressCircle component for circular progress indication
 * 
 * @supports features: customizable size, stroke width, percentage display
 * @supports journeys: health, care, plan
 * @supports a11y: aria-valuenow, aria-valuemin, aria-valuemax
 */
export { ProgressCircle } from './ProgressCircle';
export type { ProgressCircleProps };

/**
 * Toast component for temporary notifications
 * 
 * @supports types: success, error, warning, info
 * @supports features: auto-dismiss, close button
 * @supports journeys: health, care, plan
 * @supports a11y: role="alert"
 */
export { Toast } from './Toast';
export type { ToastProps };

// ===== Navigation =====

/**
 * Tabs component for content organization
 * 
 * @supports features: controlled/uncontrolled mode
 * @supports journeys: health, care, plan
 * @supports a11y: keyboard navigation, ARIA roles
 */
export { Tabs } from './Tabs';
export type { TabsProps };

/**
 * Avatar component for user representation
 * 
 * @supports features: image with fallback to initials or icon
 * @supports sizes: customizable via size prop
 * @supports journeys: health, care, plan
 */
export { Avatar } from './Avatar';
export type { AvatarProps };

/**
 * Badge component for status indication
 * 
 * @supports states: unlocked, locked
 * @supports sizes: sm, md, lg
 * @supports journeys: health, care, plan
 */
export { Badge } from './Badge';
export type { BadgeProps };