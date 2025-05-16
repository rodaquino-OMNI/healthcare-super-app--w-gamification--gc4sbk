/**
 * Core Component Interfaces
 * 
 * This file defines TypeScript interfaces for core UI components in the AUSTA SuperApp design system.
 * These interfaces ensure consistent prop typing across all core components and provide
 * platform-specific type variations where needed for web and mobile implementations.
 * 
 * The interfaces are organized into the following categories:
 * - Input Controls: Button, Input, Select, Checkbox, RadioButton, DatePicker
 * - Containers: Card, Modal, Accordion
 * - Feedback: ProgressBar, ProgressCircle, Toast
 * - Navigation: Tabs, Avatar, Badge
 */

import { ReactNode, MouseEvent, ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { GestureResponderEvent, TextInputChangeEventData, NativeSyntheticEvent } from 'react-native';

// Common types used across multiple components

/**
 * Common size variants used across components
 */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Common status variants used for feedback components
 */
export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Journey theme variants for component styling
 */
export type JourneyTheme = 'base' | 'health' | 'care' | 'plan';

/**
 * Common props shared across all components
 */
export interface BaseComponentProps {
  /** Optional ID for the component */
  id?: string;
  /** Optional test ID for testing */
  testID?: string;
  /** Optional class name for web styling */
  className?: string;
  /** Optional style object for component styling */
  style?: Record<string, any>;
  /** Optional journey theme variant */
  journeyTheme?: JourneyTheme;
  /** Optional accessibility label */
  accessibilityLabel?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

// Input Controls

/**
 * Button component props interface
 */
export interface ButtonProps extends BaseComponentProps {
  /** Button label text */
  label: string;
  /** Optional icon to display before the label */
  leftIcon?: ReactNode;
  /** Optional icon to display after the label */
  rightIcon?: ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
  /** Button size */
  size?: SizeVariant;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Whether the button takes full width of its container */
  fullWidth?: boolean;
  /** Whether the button has rounded corners */
  rounded?: boolean;
  /** Click handler for web */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Press handler for mobile */
  onPress?: (event: GestureResponderEvent) => void;
  /** Long press handler for mobile */
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Focus handler */
  onFocus?: (event: FocusEvent<HTMLButtonElement>) => void;
  /** Blur handler */
  onBlur?: (event: FocusEvent<HTMLButtonElement>) => void;
  /** Type of button (for web) */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Input component props interface
 */
export interface InputProps extends BaseComponentProps {
  /** Input name */
  name: string;
  /** Input value */
  value: string;
  /** Input placeholder */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message displayed when input has an error */
  errorMessage?: string;
  /** Whether the input is in error state */
  hasError?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Input type */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  /** Input size */
  size?: SizeVariant;
  /** Maximum length of input */
  maxLength?: number;
  /** Whether the input is in loading state */
  loading?: boolean;
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** Optional icon to display at the start of the input */
  leftIcon?: ReactNode;
  /** Optional icon to display at the end of the input */
  rightIcon?: ReactNode;
  /** Whether the input takes full width of its container */
  fullWidth?: boolean;
  /** Change handler for web */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Change handler for mobile */
  onChangeText?: (text: string) => void;
  /** Focus handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Key press handler */
  onKeyPress?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Submit editing handler for mobile */
  onSubmitEditing?: (event: NativeSyntheticEvent<TextInputChangeEventData>) => void;
  /** Auto-capitalization behavior for mobile */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto-correction behavior for mobile */
  autoCorrect?: boolean;
  /** Whether to enable auto-complete */
  autoComplete?: string;
}

/**
 * Select component props interface
 */
export interface SelectProps extends BaseComponentProps {
  /** Select name */
  name: string;
  /** Selected value */
  value: string | string[];
  /** Options for the select */
  options: SelectOption[];
  /** Select label */
  label?: string;
  /** Helper text displayed below the select */
  helperText?: string;
  /** Error message displayed when select has an error */
  errorMessage?: string;
  /** Whether the select is in error state */
  hasError?: boolean;
  /** Whether the select is required */
  required?: boolean;
  /** Whether multiple options can be selected */
  multiple?: boolean;
  /** Select size */
  size?: SizeVariant;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is in loading state */
  loading?: boolean;
  /** Whether the select takes full width of its container */
  fullWidth?: boolean;
  /** Change handler */
  onChange?: (value: string | string[]) => void;
  /** Focus handler */
  onFocus?: (event: FocusEvent<HTMLSelectElement>) => void;
  /** Blur handler */
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void;
  /** Open handler */
  onOpen?: () => void;
  /** Close handler */
  onClose?: () => void;
}

/**
 * Option for Select component
 */
export interface SelectOption {
  /** Option value */
  value: string;
  /** Option label */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Optional group the option belongs to */
  group?: string;
  /** Optional icon to display with the option */
  icon?: ReactNode;
}

/**
 * Checkbox component props interface
 */
export interface CheckboxProps extends BaseComponentProps {
  /** Checkbox name */
  name: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Checkbox label */
  label?: string;
  /** Helper text displayed below the checkbox */
  helperText?: string;
  /** Error message displayed when checkbox has an error */
  errorMessage?: string;
  /** Whether the checkbox is in error state */
  hasError?: boolean;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Checkbox size */
  size?: SizeVariant;
  /** Whether the checkbox is in indeterminate state */
  indeterminate?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Focus handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}

/**
 * RadioButton component props interface
 */
export interface RadioButtonProps extends BaseComponentProps {
  /** RadioButton name */
  name: string;
  /** RadioButton value */
  value: string;
  /** Whether the radio button is checked */
  checked: boolean;
  /** RadioButton label */
  label?: string;
  /** Helper text displayed below the radio button */
  helperText?: string;
  /** Error message displayed when radio button has an error */
  errorMessage?: string;
  /** Whether the radio button is in error state */
  hasError?: boolean;
  /** Whether the radio button is required */
  required?: boolean;
  /** RadioButton size */
  size?: SizeVariant;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Focus handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}

/**
 * DatePicker component props interface
 */
export interface DatePickerProps extends BaseComponentProps {
  /** DatePicker name */
  name: string;
  /** Selected date */
  value: Date | null;
  /** DatePicker label */
  label?: string;
  /** Helper text displayed below the date picker */
  helperText?: string;
  /** Error message displayed when date picker has an error */
  errorMessage?: string;
  /** Whether the date picker is in error state */
  hasError?: boolean;
  /** Whether the date picker is required */
  required?: boolean;
  /** DatePicker size */
  size?: SizeVariant;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Whether the date picker is in loading state */
  loading?: boolean;
  /** Whether the date picker takes full width of its container */
  fullWidth?: boolean;
  /** Format to display the date */
  displayFormat?: string;
  /** Change handler */
  onChange?: (date: Date | null) => void;
  /** Focus handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Open handler */
  onOpen?: () => void;
  /** Close handler */
  onClose?: () => void;
}

// Containers

/**
 * Card component props interface
 */
export interface CardProps extends BaseComponentProps {
  /** Card content */
  children: ReactNode;
  /** Card title */
  title?: string | ReactNode;
  /** Card subtitle */
  subtitle?: string | ReactNode;
  /** Whether the card has a shadow */
  elevated?: boolean;
  /** Shadow intensity */
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether the card has a border */
  bordered?: boolean;
  /** Whether the card has rounded corners */
  rounded?: boolean;
  /** Whether the card is interactive */
  interactive?: boolean;
  /** Whether the card is in loading state */
  loading?: boolean;
  /** Optional footer content */
  footer?: ReactNode;
  /** Optional header actions */
  headerActions?: ReactNode;
  /** Click handler for web */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /** Press handler for mobile */
  onPress?: (event: GestureResponderEvent) => void;
}

/**
 * Modal component props interface
 */
export interface ModalProps extends BaseComponentProps {
  /** Modal content */
  children: ReactNode;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Modal title */
  title?: string | ReactNode;
  /** Whether to show a close button */
  showCloseButton?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Whether to close the modal when clicking outside */
  closeOnOutsideClick?: boolean;
  /** Whether to close the modal when pressing escape key */
  closeOnEscape?: boolean;
  /** Whether the modal has a backdrop */
  hasBackdrop?: boolean;
  /** Close handler */
  onClose: () => void;
  /** Open handler */
  onOpen?: () => void;
  /** After open handler */
  onAfterOpen?: () => void;
  /** Before close handler */
  onBeforeClose?: () => void;
  /** Optional footer content */
  footer?: ReactNode;
  /** Optional header actions */
  headerActions?: ReactNode;
}

/**
 * Accordion component props interface
 */
export interface AccordionProps extends BaseComponentProps {
  /** Accordion items */
  items: AccordionItem[];
  /** Whether multiple items can be expanded at once */
  allowMultiple?: boolean;
  /** Index of the initially expanded item(s) */
  defaultIndex?: number | number[];
  /** Whether the accordion has a border */
  bordered?: boolean;
  /** Whether the accordion is compact */
  compact?: boolean;
  /** Change handler */
  onChange?: (expandedIndexes: number | number[]) => void;
}

/**
 * Accordion item interface
 */
export interface AccordionItem {
  /** Item title */
  title: string | ReactNode;
  /** Item content */
  content: ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Optional icon to display with the title */
  icon?: ReactNode;
}

// Feedback

/**
 * ProgressBar component props interface
 */
export interface ProgressBarProps extends BaseComponentProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum progress value */
  max?: number;
  /** Whether to show the progress value */
  showValue?: boolean;
  /** Progress bar size */
  size?: SizeVariant;
  /** Progress bar color variant */
  variant?: StatusVariant;
  /** Whether the progress bar is animated */
  animated?: boolean;
  /** Whether the progress bar is striped */
  striped?: boolean;
  /** Optional label to display */
  label?: string;
}

/**
 * ProgressCircle component props interface
 */
export interface ProgressCircleProps extends BaseComponentProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum progress value */
  max?: number;
  /** Whether to show the progress value */
  showValue?: boolean;
  /** Progress circle size */
  size?: SizeVariant;
  /** Progress circle color variant */
  variant?: StatusVariant;
  /** Whether the progress circle is animated */
  animated?: boolean;
  /** Optional label to display */
  label?: string;
  /** Thickness of the progress circle */
  thickness?: number;
  /** Optional content to display inside the circle */
  children?: ReactNode;
}

/**
 * Toast component props interface
 */
export interface ToastProps extends BaseComponentProps {
  /** Toast message */
  message: string;
  /** Toast title */
  title?: string;
  /** Toast variant */
  variant?: StatusVariant;
  /** Whether the toast is visible */
  isVisible: boolean;
  /** Duration in milliseconds before auto-hiding */
  duration?: number;
  /** Whether to show a close button */
  showCloseButton?: boolean;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Close handler */
  onClose: () => void;
  /** Action button text */
  actionText?: string;
  /** Action button handler */
  onAction?: () => void;
  /** Position of the toast */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Navigation

/**
 * Tabs component props interface
 */
export interface TabsProps extends BaseComponentProps {
  /** Tab items */
  tabs: TabItem[];
  /** Index of the active tab */
  activeIndex: number;
  /** Tab size */
  size?: SizeVariant;
  /** Tab variant */
  variant?: 'default' | 'pills' | 'underlined' | 'contained';
  /** Whether the tabs take full width of their container */
  fullWidth?: boolean;
  /** Change handler */
  onChange: (index: number) => void;
  /** Whether to render the tab content */
  renderContent?: boolean;
  /** Whether the tabs are centered */
  centered?: boolean;
  /** Whether the tabs are scrollable */
  scrollable?: boolean;
}

/**
 * Tab item interface
 */
export interface TabItem {
  /** Tab label */
  label: string;
  /** Tab content */
  content?: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Optional icon to display with the label */
  icon?: ReactNode;
  /** Optional badge to display with the label */
  badge?: number | string;
}

/**
 * Avatar component props interface
 */
export interface AvatarProps extends BaseComponentProps {
  /** Avatar name (used for initials and alt text) */
  name?: string;
  /** Avatar image source */
  src?: string;
  /** Avatar size */
  size?: SizeVariant;
  /** Avatar shape */
  shape?: 'circle' | 'square' | 'rounded';
  /** Whether to show a border */
  bordered?: boolean;
  /** Background color when using initials */
  bgColor?: string;
  /** Text color when using initials */
  textColor?: string;
  /** Whether the avatar is in loading state */
  loading?: boolean;
  /** Optional icon to display when no image or initials are available */
  fallbackIcon?: ReactNode;
  /** Click handler for web */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /** Press handler for mobile */
  onPress?: (event: GestureResponderEvent) => void;
  /** Error handler when image fails to load */
  onError?: () => void;
}

/**
 * Badge component props interface
 */
export interface BadgeProps extends BaseComponentProps {
  /** Badge content */
  content: string | number | ReactNode;
  /** Badge variant */
  variant?: StatusVariant;
  /** Badge size */
  size?: SizeVariant;
  /** Whether the badge is visible */
  visible?: boolean;
  /** Maximum value to display (shows "+" suffix if exceeded) */
  max?: number;
  /** Whether the badge is a dot (no content) */
  dot?: boolean;
  /** Optional component to attach the badge to */
  children?: ReactNode;
  /** Badge position when attached to a component */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether the badge is standalone (not attached to another component) */
  standalone?: boolean;
  /** Click handler for web */
  onClick?: (event: MouseEvent<HTMLSpanElement>) => void;
  /** Press handler for mobile */
  onPress?: (event: GestureResponderEvent) => void;
}