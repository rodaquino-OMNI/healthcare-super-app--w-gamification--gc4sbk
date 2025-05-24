/**
 * Input component styles for the AUSTA SuperApp design system.
 * 
 * These styled components implement the design system's input styling with
 * theme-driven properties, journey-specific theming, and accessibility enhancements.
 * The styles centralize and enforce consistent, theme-aware styling for all Input components.
 */

import styled from 'styled-components'; // styled-components v6.1.8
import { ThemeAwareProps, ThemeProp } from '@austa/interfaces/themes/theme.types';
import { StyleProps } from '@austa/interfaces/themes/style-props.types';
import { colors } from '@design-system/primitives/src/tokens/colors';

/**
 * Input component prop interface
 */
export interface InputStyleProps extends StyleProps {
  /** Whether the input is in an error state */
  hasError?: boolean;
  /** Whether the input is disabled */
  isDisabled?: boolean;
  /** Whether the input is focused */
  isFocused?: boolean;
  /** Journey-specific theming */
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Container for the input field and label
 * Provides proper spacing and layout for the input component
 */
export const InputContainer = styled.div<ThemeAwareProps<InputStyleProps>>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  position: relative;
  
  ${({ mb, marginBottom, theme }) => (mb || marginBottom) && `
    margin-bottom: ${theme.spacing.get(mb || marginBottom || 'sm')};
  `}
`;

/**
 * Label for the input field
 * Implements proper typography and spacing according to the design system
 */
export const InputLabel = styled.label<ThemeAwareProps<InputStyleProps>>`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, hasError, journeyTheme }) => {
    if (hasError) return theme.colors.semantic.error;
    if (journeyTheme) return theme.colors.journeys[journeyTheme].text;
    return theme.colors.neutral.gray700;
  }};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  transition: color 0.2s ease;
`;

/**
 * The actual input field
 * Implements the design system's input styling with proper theming,
 * focus states, and accessibility enhancements
 */
export const InputField = styled.input<ThemeAwareProps<InputStyleProps>>`
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme, hasError, journeyTheme }) => {
    if (hasError) return theme.colors.semantic.error;
    if (journeyTheme) return theme.colors.journeys[journeyTheme].primary_30;
    return theme.colors.neutral.gray300;
  }};
  outline: none;
  color: ${({ theme, isDisabled }) => 
    isDisabled ? theme.colors.neutral.gray500 : theme.colors.neutral.gray700
  };
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  
  &:focus {
    border-color: ${({ theme, hasError, journeyTheme }) => {
      if (hasError) return theme.colors.semantic.error;
      if (journeyTheme) return theme.colors.journeys[journeyTheme].primary;
      return theme.colors.brand.primary;
    }};
    box-shadow: 0 0 0 2px ${({ theme, hasError, journeyTheme }) => {
      if (hasError) return theme.colors.semantic.error_token._20;
      if (journeyTheme) return theme.colors.journeys[journeyTheme].primary_20;
      return theme.colors.brand.primary_token._20;
    }};
  }
  
  &:hover:not(:disabled):not(:focus) {
    border-color: ${({ theme, hasError, journeyTheme }) => {
      if (hasError) return theme.colors.semantic.error;
      if (journeyTheme) return theme.colors.journeys[journeyTheme].primary_50;
      return theme.colors.neutral.gray400;
    }};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.neutral.gray100};
    border-color: ${({ theme }) => theme.colors.neutral.gray200};
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.gray500};
    opacity: 1; /* Firefox fix */
  }
  
  /* Accessibility enhancements */
  &:focus-visible {
    outline: 2px solid ${({ theme, journeyTheme }) => 
      journeyTheme ? theme.colors.journeys[journeyTheme].primary : theme.colors.brand.primary
    };
    outline-offset: 1px;
  }
  
  /* Journey-specific styling */
  ${({ theme, journeyTheme }) => journeyTheme && `
    &:focus {
      border-color: ${theme.colors.journeys[journeyTheme].primary};
      box-shadow: 0 0 0 2px ${theme.colors.journeys[journeyTheme].primary_20};
    }
  `}
`;

/**
 * Error message container for the input
 * Displays validation errors with proper styling
 */
export const InputError = styled.div<ThemeProp>`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  min-height: 18px;
`;

/**
 * Helper text container for the input
 * Provides additional context or instructions for the input field
 */
export const InputHelper = styled.div<ThemeProp>`
  color: ${({ theme }) => theme.colors.neutral.gray600};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  min-height: 18px;
`;