/**
 * Component prop interfaces for the design system
 */

/**
 * Base component props shared by all components
 */
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  testID?: string;
}

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Input component props
 */
export interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  maxLength?: number;
  autoComplete?: string;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Progress bar component props
 */
export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Progress circle component props
 */
export interface ProgressCircleProps extends BaseComponentProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  thickness?: number;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Avatar component props
 */
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'rounded' | 'square';
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Badge component props
 */
export interface BadgeProps extends BaseComponentProps {
  content: string | number;
  variant?: 'filled' | 'outlined';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Checkbox component props
 */
export interface CheckboxProps extends BaseComponentProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * DatePicker component props
 */
export interface DatePickerProps extends BaseComponentProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  format?: string;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}

/**
 * Accordion component props
 */
export interface AccordionProps extends BaseComponentProps {
  title: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  journeyTheme?: 'health' | 'care' | 'plan' | 'default';
}