import styled from 'styled-components'; // styled-components v6.1.8
import 'styled-components/macro';
import { ThemeType } from '@austa/interfaces/themes';
import { SpacingTokens } from '@austa/interfaces/themes/tokens.types';

// Extend DefaultTheme with our ThemeType
declare module 'styled-components' {
  export interface DefaultTheme extends ThemeType {}
}

/**
 * Interface for InputContainer props
 */
interface InputContainerProps {
  $fullWidth?: boolean;
  $marginBottom?: keyof SpacingTokens;
}

/**
 * Container for the input field and label
 */
export const InputContainer = styled.div<InputContainerProps>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme, $marginBottom }) => 
    $marginBottom ? theme.spacing[$marginBottom] : theme.spacing.sm};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
`;

/**
 * Interface for InputLabel props
 */
interface InputLabelProps {
  $required?: boolean;
  $disabled?: boolean;
  $journey?: 'health' | 'care' | 'plan';
}

/**
 * Label for the input field
 */
export const InputLabel = styled.label<InputLabelProps>`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, $disabled, $journey }) => 
    $disabled 
      ? theme.colors.neutral.gray500 
      : $journey 
        ? theme.colors.journeys[$journey].text 
        : theme.colors.neutral.gray700};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  
  ${({ $required }) => $required && `
    &::after {
      content: '*';
      color: ${({ theme }) => theme.colors.semantic.error};
      margin-left: ${({ theme }) => theme.spacing.xxs};
    }
  `}
`;

/**
 * Interface for InputField props
 */
interface InputFieldProps {
  $error?: boolean;
  $success?: boolean;
  $disabled?: boolean;
  $journey?: 'health' | 'care' | 'plan';
  $size?: 'sm' | 'md' | 'lg';
}

/**
 * The actual input field
 */
export const InputField = styled.input<InputFieldProps>`
  padding: ${({ theme, $size }) => {
    switch ($size) {
      case 'sm': return theme.spacing.xs;
      case 'lg': return theme.spacing.md;
      default: return theme.spacing.sm;
    }
  }};
  font-size: ${({ theme, $size }) => {
    switch ($size) {
      case 'sm': return theme.typography.fontSize.sm;
      case 'lg': return theme.typography.fontSize.lg;
      default: return theme.typography.fontSize.md;
    }
  }};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme, $error, $success, $journey }) => {
    if ($error) return theme.colors.semantic.error;
    if ($success) return theme.colors.semantic.success;
    if ($journey) return theme.colors.journeys[$journey].primary;
    return theme.colors.neutral.gray300;
  }};
  outline: none;
  color: ${({ theme }) => theme.colors.neutral.gray700};
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    border-color: ${({ theme, $error, $success, $journey }) => {
      if ($error) return theme.colors.semantic.error;
      if ($success) return theme.colors.semantic.success;
      if ($journey) return theme.colors.journeys[$journey].primary;
      return theme.colors.brand.primary;
    }};
    box-shadow: 0 0 0 2px ${({ theme, $error, $success, $journey }) => {
      if ($error) return `${theme.colors.semantic.error}25`;
      if ($success) return `${theme.colors.semantic.success}25`;
      if ($journey) return `${theme.colors.journeys[$journey].primary}25`;
      return `${theme.colors.brand.primary}25`;
    }};
  }
  
  &:hover:not(:disabled):not(:focus) {
    border-color: ${({ theme, $error, $success, $journey }) => {
      if ($error) return theme.colors.semantic.error;
      if ($success) return theme.colors.semantic.success;
      if ($journey) return theme.colors.journeys[$journey].primary;
      return theme.colors.neutral.gray400;
    }};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.neutral.gray100};
    color: ${({ theme }) => theme.colors.neutral.gray500};
    cursor: not-allowed;
    border-color: ${({ theme }) => theme.colors.neutral.gray200};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.gray500};
    opacity: 1;
  }
  
  /* Improve accessibility for screen readers */
  &:focus:not(:focus-visible) {
    outline: none;
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme, $journey }) => 
      $journey ? theme.colors.journeys[$journey].primary : theme.colors.brand.primary};
    outline-offset: 1px;
  }
`;