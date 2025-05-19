import React from 'react';
import { SpacingTokens } from '../themes/tokens.types';

/**
 * Journey types for theming components
 */
export type JourneyType = 'health' | 'care' | 'plan';

/**
 * Common props for all components
 */
export interface BaseComponentProps {
  /** Optional test ID for testing */
  testID?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Props for the Button component
 */
export interface ButtonProps extends BaseComponentProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button should take up the full width of its container */
  fullWidth?: boolean;
  /** Optional icon to display in the button */
  icon?: React.ReactNode;
  /** Whether the button should only display an icon */
  iconOnly?: boolean;
  /** Function to call when the button is pressed */
  onPress?: () => void;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Props for the Input component
 */
export interface InputProps extends 
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, 
  BaseComponentProps {
  /** Input ID */
  id?: string;
  /** Input name */
  name?: string;
  /** Input type */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  /** Input value for controlled component */
  value?: string;
  /** Default value for uncontrolled component */
  defaultValue?: string;
  /** Function to call when input value changes */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Function to call when input gains focus */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Function to call when input loses focus */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Error message or state */
  error?: string | boolean;
  /** Success state */
  success?: boolean;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the input should take up the full width of its container */
  fullWidth?: boolean;
  /** Bottom margin size */
  marginBottom?: keyof SpacingTokens;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** ID of element that labels this input */
  'aria-labelledby'?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Props for the Checkbox component
 */
export interface CheckboxProps extends BaseComponentProps {
  /** Checkbox ID */
  id?: string;
  /** Checkbox name */
  name?: string;
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Default checked state for uncontrolled component */
  defaultChecked?: boolean;
  /** Function to call when checkbox state changes */
  onChange?: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Error message or state */
  error?: string | boolean;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Props for the RadioButton component
 */
export interface RadioButtonProps extends BaseComponentProps {
  /** RadioButton ID */
  id?: string;
  /** RadioButton name */
  name?: string;
  /** RadioButton value */
  value: string;
  /** Whether the radio button is checked */
  checked?: boolean;
  /** Default checked state for uncontrolled component */
  defaultChecked?: boolean;
  /** Function to call when radio button state changes */
  onChange?: (value: string) => void;
  /** Label text */
  label?: string;
  /** Whether the radio button is disabled */
  disabled?: boolean;
  /** Whether the radio button is required */
  required?: boolean;
  /** Error message or state */
  error?: string | boolean;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Props for the Select component
 */
export interface SelectProps extends BaseComponentProps {
  /** Select ID */
  id?: string;
  /** Select name */
  name?: string;
  /** Options for the select */
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  /** Selected value(s) for controlled component */
  value?: string | string[];
  /** Default value(s) for uncontrolled component */
  defaultValue?: string | string[];
  /** Function to call when selection changes */
  onChange?: (value: string | string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select is required */
  required?: boolean;
  /** Error message or state */
  error?: string | boolean;
  /** Whether multiple options can be selected */
  multiple?: boolean;
  /** Whether to show a search input */
  searchable?: boolean;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Props for the DatePicker component
 */
export interface DatePickerProps extends BaseComponentProps {
  /** DatePicker ID */
  id?: string;
  /** DatePicker name */
  name?: string;
  /** Selected date for controlled component */
  value?: Date;
  /** Default date for uncontrolled component */
  defaultValue?: Date;
  /** Function to call when date changes */
  onChange?: (date: Date) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Whether the date picker is disabled */
  disabled?: boolean;
  /** Whether the date picker is required */
  required?: boolean;
  /** Error message or state */
  error?: string | boolean;
  /** Date format */
  dateFormat?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Props for the Card component
 */
export interface CardProps extends BaseComponentProps {
  /** Card elevation */
  elevation?: 'sm' | 'md' | 'lg';
  /** Function to call when card is pressed */
  onPress?: () => void;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Card content */
  children: React.ReactNode;
  /** Accessibility role */
  role?: string;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Props for the Modal component
 */
export interface ModalProps extends BaseComponentProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Modal title */
  title?: string;
  /** Function to call when modal is closed */
  onClose: () => void;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Modal content */
  children: React.ReactNode;
  /** Modal actions (buttons) */
  actions?: React.ReactNode;
}

/**
 * Props for the Accordion component
 */
export interface AccordionProps extends BaseComponentProps {
  /** Accordion title */
  title: string;
  /** Whether the accordion is expanded */
  isExpanded?: boolean;
  /** Function to call when accordion is toggled */
  onToggle?: (isExpanded: boolean) => void;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Accordion content */
  children: React.ReactNode;
}

/**
 * Props for the ProgressBar component
 */
export interface ProgressBarProps extends BaseComponentProps {
  /** Current progress value */
  current: number;
  /** Total progress value */
  total: number;
  /** ProgressBar size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show level markers */
  showLevels?: boolean;
  /** Level marker positions */
  levelMarkers?: number[];
  /** Journey type for theming */
  journey?: JourneyType;
}

/**
 * Props for the ProgressCircle component
 */
export interface ProgressCircleProps extends BaseComponentProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Circle size in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Whether to show percentage label */
  showLabel?: boolean;
  /** Custom color */
  color?: string;
  /** Journey type for theming */
  journey?: JourneyType;
}

/**
 * Props for the Toast component
 */
export interface ToastProps extends BaseComponentProps {
  /** Whether the toast is visible */
  visible: boolean;
  /** Toast message */
  message: string;
  /** Toast type */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** Function to call when toast is dismissed */
  onDismiss: () => void;
  /** Toast duration in milliseconds */
  duration?: number;
  /** Journey type for theming */
  journey?: JourneyType;
}

/**
 * Props for the Avatar component
 */
export interface AvatarProps extends BaseComponentProps {
  /** Image source */
  src?: string;
  /** Alternative text */
  alt?: string;
  /** Avatar size in pixels */
  size?: number;
  /** Whether to show fallback (initials or icon) */
  showFallback?: boolean;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Function to call when image fails to load */
  onImageError?: () => void;
}

/**
 * Props for the Badge component
 */
export interface BadgeProps extends BaseComponentProps {
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the badge is unlocked */
  unlocked?: boolean;
  /** Function to call when badge is pressed */
  onPress?: () => void;
  /** Journey type for theming */
  journey?: JourneyType;
  /** Badge content */
  children: React.ReactNode;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Props for the Tabs component
 */
export interface TabsProps extends BaseComponentProps {
  /** Tab items */
  items: Array<{ id: string; label: string; content: React.ReactNode }>;
  /** Default selected tab ID */
  defaultTab?: string;
  /** Selected tab ID for controlled component */
  selectedTab?: string;
  /** Function to call when tab selection changes */
  onTabChange?: (tabId: string) => void;
  /** Journey type for theming */
  journey?: JourneyType;
}