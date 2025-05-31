/**
 * Core Component Interfaces for the AUSTA SuperApp
 * 
 * This file defines TypeScript interfaces for all core UI components in the design system.
 * These components are built on top of the primitive components defined in primitives.types.ts.
 * 
 * The interfaces provide type safety and consistent prop structures across both web and mobile platforms,
 * while supporting journey-specific theming and platform-specific variations.
 */

import { ReactNode, CSSProperties } from 'react';
import type { StyleProp, ViewStyle, TextStyle, GestureResponderEvent } from 'react-native';

// Common types used across multiple components

/**
 * Defines the available journeys for theming components
 */
export type JourneyTheme = 'health' | 'care' | 'plan' | 'base';

/**
 * Defines common sizes used across components
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Defines common variant styles for components
 */
export type ComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';

/**
 * Defines common status states for components
 */
export type ComponentStatus = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Base props interface that all component props extend
 */
export interface BaseComponentProps {
  /** Optional ID for the component */
  id?: string;
  /** Optional test ID for testing */
  testID?: string;
  /** Optional class name for web styling */
  className?: string;
  /** Optional journey theme to apply */
  journeyTheme?: JourneyTheme;
  /** Optional accessibility label */
  accessibilityLabel?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Common props for components that can have platform-specific styles
 */
export interface StyledComponentProps extends BaseComponentProps {
  /** Web-specific style object */
  style?: CSSProperties;
  /** React Native specific style object */
  rnStyle?: StyleProp<ViewStyle | TextStyle>;
}

// Input Control Components

/**
 * Button component props
 */
export interface ButtonProps extends StyledComponentProps {
  /** Button label text */
  label: string;
  /** Optional icon to display before the label */
  leftIcon?: ReactNode;
  /** Optional icon to display after the label */
  rightIcon?: ReactNode;
  /** Button variant style */
  variant?: ComponentVariant;
  /** Button size */
  size?: ComponentSize;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button takes full width of its container */
  fullWidth?: boolean;
  /** Click handler for web */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Press handler for React Native */
  onPress?: (event: GestureResponderEvent) => void;
  /** Long press handler for React Native */
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Optional custom loading indicator */
  loadingIndicator?: ReactNode;
  /** Whether the button has rounded corners */
  rounded?: boolean;
  /** Optional tooltip text */
  tooltip?: string;
}

/**
 * Input component props
 */
export interface InputProps extends StyledComponentProps {
  /** Input name attribute */
  name: string;
  /** Input value */
  value: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Input label text */
  label?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the input */
  helperText?: string;
  /** Input type (text, password, email, etc.) */
  type?: string;
  /** Maximum length of input */
  maxLength?: number;
  /** Whether the input is multiline */
  multiline?: boolean;
  /** Number of rows for multiline input */
  rows?: number;
  /** Whether the input is in a loading state */
  loading?: boolean;
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** Optional icon to display at the start of the input */
  startIcon?: ReactNode;
  /** Optional icon to display at the end of the input */
  endIcon?: ReactNode;
  /** Change handler for web */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Change handler for React Native */
  onChangeText?: (text: string) => void;
  /** Focus handler */
  onFocus?: (event: any) => void;
  /** Blur handler */
  onBlur?: (event: any) => void;
  /** Submit handler */
  onSubmit?: () => void;
  /** Clear handler */
  onClear?: () => void;
  /** Input size */
  size?: ComponentSize;
  /** Input variant */
  variant?: 'outlined' | 'filled' | 'standard';
  /** Whether to auto-capitalize input */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Whether to auto-correct input */
  autoCorrect?: boolean;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
  /** Whether to show a clear button */
  clearable?: boolean;
}

/**
 * Select component props
 */
export interface SelectProps extends StyledComponentProps {
  /** Select name attribute */
  name: string;
  /** Selected value */
  value: string | string[];
  /** Options for the select */
  options: SelectOption[];
  /** Select label text */
  label?: string;
  /** Whether the select is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the select */
  helperText?: string;
  /** Whether multiple options can be selected */
  multiple?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is in a loading state */
  loading?: boolean;
  /** Whether the select is searchable */
  searchable?: boolean;
  /** Change handler for web */
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Change handler for React Native and custom implementations */
  onValueChange?: (value: string | string[]) => void;
  /** Focus handler */
  onFocus?: (event: any) => void;
  /** Blur handler */
  onBlur?: (event: any) => void;
  /** Select size */
  size?: ComponentSize;
  /** Select variant */
  variant?: 'outlined' | 'filled' | 'standard';
  /** Maximum height of the dropdown */
  maxHeight?: number | string;
  /** Whether the select is clearable */
  clearable?: boolean;
  /** Custom render function for option */
  renderOption?: (option: SelectOption) => ReactNode;
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
 * Checkbox component props
 */
export interface CheckboxProps extends StyledComponentProps {
  /** Checkbox name attribute */
  name: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Checkbox label text */
  label?: string;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the checkbox */
  helperText?: string;
  /** Whether the checkbox is in an indeterminate state */
  indeterminate?: boolean;
  /** Change handler for web */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Change handler for React Native */
  onValueChange?: (checked: boolean) => void;
  /** Checkbox size */
  size?: ComponentSize;
  /** Checkbox color */
  color?: string;
  /** Whether the label is positioned on the right */
  labelRight?: boolean;
}

/**
 * RadioButton component props
 */
export interface RadioButtonProps extends StyledComponentProps {
  /** RadioButton name attribute */
  name: string;
  /** RadioButton value */
  value: string;
  /** Whether the radio button is checked */
  checked: boolean;
  /** RadioButton label text */
  label?: string;
  /** Whether the radio button is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the radio button */
  helperText?: string;
  /** Change handler for web */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Change handler for React Native */
  onValueChange?: (value: string) => void;
  /** RadioButton size */
  size?: ComponentSize;
  /** RadioButton color */
  color?: string;
  /** Whether the label is positioned on the right */
  labelRight?: boolean;
}

/**
 * RadioGroup component props
 */
export interface RadioGroupProps extends StyledComponentProps {
  /** RadioGroup name attribute */
  name: string;
  /** Selected value */
  value: string;
  /** Options for the radio group */
  options: RadioOption[];
  /** RadioGroup label text */
  label?: string;
  /** Whether the radio group is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the radio group */
  helperText?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Direction of the radio buttons */
  direction?: 'horizontal' | 'vertical';
}

/**
 * Option for RadioGroup component
 */
export interface RadioOption {
  /** Option value */
  value: string;
  /** Option label */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

/**
 * DatePicker component props
 */
export interface DatePickerProps extends StyledComponentProps {
  /** DatePicker name attribute */
  name: string;
  /** Selected date */
  value: Date | null;
  /** DatePicker label text */
  label?: string;
  /** Whether the date picker is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the date picker */
  helperText?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Date format string */
  format?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the date picker is in a loading state */
  loading?: boolean;
  /** Change handler */
  onChange?: (date: Date | null) => void;
  /** Focus handler */
  onFocus?: (event: any) => void;
  /** Blur handler */
  onBlur?: (event: any) => void;
  /** Whether to show a clear button */
  clearable?: boolean;
  /** Whether to show time selection */
  showTime?: boolean;
  /** Whether the date picker is read-only */
  readOnly?: boolean;
  /** DatePicker size */
  size?: ComponentSize;
  /** DatePicker variant */
  variant?: 'outlined' | 'filled' | 'standard';
  /** First day of the week (0 = Sunday, 1 = Monday, etc.) */
  firstDayOfWeek?: number;
  /** Whether to disable past dates */
  disablePast?: boolean;
  /** Whether to disable future dates */
  disableFuture?: boolean;
  /** Custom function to determine if a date should be disabled */
  shouldDisableDate?: (date: Date) => boolean;
}

// Container Components

/**
 * Card component props
 */
export interface CardProps extends StyledComponentProps {
  /** Card content */
  children: ReactNode;
  /** Card title */
  title?: string | ReactNode;
  /** Card subtitle */
  subtitle?: string | ReactNode;
  /** Whether the card has a shadow */
  elevation?: 0 | 1 | 2 | 3 | 4;
  /** Whether the card has a border */
  bordered?: boolean;
  /** Whether the card is clickable */
  clickable?: boolean;
  /** Click handler for web */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Press handler for React Native */
  onPress?: (event: GestureResponderEvent) => void;
  /** Card header content */
  header?: ReactNode;
  /** Card footer content */
  footer?: ReactNode;
  /** Card cover image */
  cover?: string | ReactNode;
  /** Card actions */
  actions?: ReactNode;
  /** Whether the card has rounded corners */
  rounded?: boolean;
  /** Whether the card takes full width of its container */
  fullWidth?: boolean;
  /** Card padding */
  padding?: ComponentSize | number;
  /** Card background color */
  backgroundColor?: string;
}

/**
 * Modal component props
 */
export interface ModalProps extends StyledComponentProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Modal content */
  children: ReactNode;
  /** Modal title */
  title?: string | ReactNode;
  /** Close handler */
  onClose: () => void;
  /** Whether to show a close button */
  showCloseButton?: boolean;
  /** Whether to close the modal when clicking outside */
  closeOnClickOutside?: boolean;
  /** Whether to close the modal when pressing escape */
  closeOnEscape?: boolean;
  /** Modal width */
  width?: number | string;
  /** Modal height */
  height?: number | string;
  /** Modal footer content */
  footer?: ReactNode;
  /** Whether the modal is centered */
  centered?: boolean;
  /** Whether the modal has a backdrop */
  hasBackdrop?: boolean;
  /** Backdrop opacity */
  backdropOpacity?: number;
  /** Whether the modal is fullscreen */
  fullscreen?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Whether the modal has a scrollable body */
  scrollable?: boolean;
  /** Z-index for the modal */
  zIndex?: number;
}

/**
 * Accordion component props
 */
export interface AccordionProps extends StyledComponentProps {
  /** Accordion items */
  items: AccordionItem[];
  /** Whether multiple items can be expanded at once */
  multiple?: boolean;
  /** Default expanded item keys */
  defaultExpandedKeys?: string[];
  /** Controlled expanded item keys */
  expandedKeys?: string[];
  /** Change handler for controlled mode */
  onChange?: (expandedKeys: string[]) => void;
  /** Whether the accordion is bordered */
  bordered?: boolean;
  /** Whether the accordion has a shadow */
  elevation?: 0 | 1 | 2 | 3 | 4;
  /** Accordion variant */
  variant?: 'default' | 'filled' | 'separated';
  /** Whether to expand icon position */
  expandIconPosition?: 'left' | 'right';
  /** Custom expand icon */
  expandIcon?: ReactNode;
}

/**
 * Accordion item definition
 */
export interface AccordionItem {
  /** Unique key for the item */
  key: string;
  /** Item header content */
  header: string | ReactNode;
  /** Item content */
  content: ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Extra content to display in the header */
  extra?: ReactNode;
  /** Whether to show a border between header and content */
  showDivider?: boolean;
}

// Feedback Components

/**
 * ProgressBar component props
 */
export interface ProgressBarProps extends StyledComponentProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Whether to show the progress value as text */
  showValue?: boolean;
  /** Format function for the displayed value */
  formatValue?: (value: number, max: number) => string;
  /** ProgressBar color */
  color?: string;
  /** ProgressBar background color */
  backgroundColor?: string;
  /** ProgressBar height */
  height?: number | string;
  /** Whether the progress bar is animated */
  animated?: boolean;
  /** Whether the progress bar is striped */
  striped?: boolean;
  /** ProgressBar status */
  status?: ComponentStatus;
  /** Whether the progress bar is indeterminate */
  indeterminate?: boolean;
  /** Label to display above the progress bar */
  label?: string;
}

/**
 * ProgressCircle component props
 */
export interface ProgressCircleProps extends StyledComponentProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Whether to show the progress value as text */
  showValue?: boolean;
  /** Format function for the displayed value */
  formatValue?: (value: number, max: number) => string;
  /** ProgressCircle color */
  color?: string;
  /** ProgressCircle background color */
  backgroundColor?: string;
  /** ProgressCircle size */
  size?: ComponentSize | number;
  /** ProgressCircle thickness */
  thickness?: number;
  /** Whether the progress circle is animated */
  animated?: boolean;
  /** ProgressCircle status */
  status?: ComponentStatus;
  /** Whether the progress circle is indeterminate */
  indeterminate?: boolean;
  /** Label to display inside the progress circle */
  label?: string | ReactNode;
  /** Start angle in degrees (0 = top) */
  startAngle?: number;
  /** Whether to rotate clockwise */
  clockwise?: boolean;
}

/**
 * Toast component props
 */
export interface ToastProps extends StyledComponentProps {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ComponentStatus;
  /** Toast duration in milliseconds (0 = infinite) */
  duration?: number;
  /** Whether the toast is closable */
  closable?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Toast icon */
  icon?: ReactNode;
  /** Toast action button text */
  actionText?: string;
  /** Toast action handler */
  onAction?: () => void;
  /** Toast position */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether the toast has a progress bar */
  showProgress?: boolean;
  /** Whether the toast is pausable on hover */
  pauseOnHover?: boolean;
  /** Whether the toast is draggable */
  draggable?: boolean;
  /** Z-index for the toast */
  zIndex?: number;
}

// Navigation Components

/**
 * Tabs component props
 */
export interface TabsProps extends StyledComponentProps {
  /** Active tab key */
  activeKey: string;
  /** Tab items */
  items: TabItem[];
  /** Change handler */
  onChange: (activeKey: string) => void;
  /** Tabs position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Tabs size */
  size?: ComponentSize;
  /** Tabs variant */
  variant?: 'default' | 'card' | 'pill';
  /** Whether the tabs are centered */
  centered?: boolean;
  /** Whether the tabs are full width */
  fullWidth?: boolean;
  /** Whether to animate the tab indicator */
  animated?: boolean;
  /** Whether the tabs are scrollable */
  scrollable?: boolean;
  /** Whether to show the tab content */
  showContent?: boolean;
}

/**
 * Tab item definition
 */
export interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Tab label */
  label: string | ReactNode;
  /** Tab content */
  content?: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Tab icon */
  icon?: ReactNode;
  /** Badge to display on the tab */
  badge?: number | string;
  /** Custom render function for the tab */
  renderTab?: (tab: TabItem, isActive: boolean) => ReactNode;
}

/**
 * Avatar component props
 */
export interface AvatarProps extends StyledComponentProps {
  /** Avatar source (image URL) */
  src?: string;
  /** Fallback content when image fails to load */
  fallback?: string | ReactNode;
  /** Avatar alt text */
  alt?: string;
  /** Avatar size */
  size?: ComponentSize | number;
  /** Avatar shape */
  shape?: 'circle' | 'square' | 'rounded';
  /** Avatar background color */
  backgroundColor?: string;
  /** Avatar text color */
  color?: string;
  /** Whether the avatar is clickable */
  clickable?: boolean;
  /** Click handler for web */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Press handler for React Native */
  onPress?: (event: GestureResponderEvent) => void;
  /** Whether to show a border */
  bordered?: boolean;
  /** Border color */
  borderColor?: string;
  /** Whether to show a status indicator */
  showStatus?: boolean;
  /** Status indicator type */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** Status indicator position */
  statusPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Status indicator color */
  statusColor?: string;
  /** Whether the avatar is loading */
  loading?: boolean;
}

/**
 * Badge component props
 */export interface BadgeProps extends StyledComponentProps {
  /** Badge content */
  content?: string | number | ReactNode;
  /** Whether the badge is visible */
  visible?: boolean;
  /** Maximum count to show */
  maxCount?: number;
  /** Whether to show zero count */
  showZero?: boolean;
  /** Whether to show the badge as a dot */
  dot?: boolean;
  /** Badge color */
  color?: string;
  /** Badge text color */
  textColor?: string;
  /** Badge size */
  size?: ComponentSize;
  /** Badge position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Badge offset [x, y] */
  offset?: [number, number];
  /** Whether the badge is standalone (not attached to children) */
  standalone?: boolean;
  /** Children to attach the badge to */
  children?: ReactNode;
  /** Whether the badge has a pulse animation */
  pulse?: boolean;
  /** Whether the badge is outlined */
  outlined?: boolean;
  /** Badge shape */
  shape?: 'circle' | 'square' | 'rounded';
}