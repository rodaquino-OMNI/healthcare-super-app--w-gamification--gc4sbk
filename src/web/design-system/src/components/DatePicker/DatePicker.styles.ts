import styled from 'styled-components';
import { Box, Stack, Text } from '@design-system/primitives';
import { colors, spacing, shadows } from '@design-system/primitives/tokens';
import { JourneyType } from '@austa/interfaces/components';

interface StyledComponentProps {
  journey?: JourneyType;
}

/**
 * Main container for the DatePicker component
 */
export const DatePickerContainer = styled(Box)<StyledComponentProps>`
  border-radius: ${spacing.xs};
  box-shadow: ${shadows.md};
  background-color: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;
  width: 280px;
`;

/**
 * Header section of the DatePicker
 */
export const DatePickerHeader = styled(Box)<StyledComponentProps>`
  padding: ${spacing.sm} ${spacing.md};
  background-color: ${({ journey, theme }) => {
    if (journey === 'health') return theme.colors.health.primary;
    if (journey === 'care') return theme.colors.care.primary;
    if (journey === 'plan') return theme.colors.plan.primary;
    return theme.colors.primary;
  }};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Month/year title in the DatePicker header
 */
export const DatePickerTitle = styled(Text)<StyledComponentProps>`
  color: ${colors.white};
  font-weight: 600;
`;

/**
 * Body section of the DatePicker containing the calendar
 */
export const DatePickerBody = styled(Box)`
  padding: ${spacing.sm};
`;

/**
 * Week day header row
 */
export const DatePickerWeekDays = styled(Stack)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: ${spacing.xs};
`;

/**
 * Week day label
 */
export const DatePickerWeekDay = styled(Text)`
  text-align: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${spacing.xs} 0;
`;

/**
 * Grid container for days
 */
export const DatePickerDaysGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${spacing.xxs};
`;

/**
 * Individual day cell
 */
export const DatePickerDay = styled(Box)<StyledComponentProps & { isSelected?: boolean; isToday?: boolean; isDisabled?: boolean }>`
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ isDisabled }) => (isDisabled ? 0.4 : 1)};
  background-color: ${({ isSelected, journey, theme }) => {
    if (isSelected) {
      if (journey === 'health') return theme.colors.health.primary;
      if (journey === 'care') return theme.colors.care.primary;
      if (journey === 'plan') return theme.colors.plan.primary;
      return theme.colors.primary;
    }
    return 'transparent';
  }};
  color: ${({ isSelected, isToday, theme }) => {
    if (isSelected) return colors.white;
    if (isToday) return theme.colors.text.accent;
    return theme.colors.text.primary;
  }};
  border: ${({ isToday, isSelected }) => {
    if (isToday && !isSelected) return `1px solid currentColor`;
    return 'none';
  }};

  &:hover {
    background-color: ${({ isSelected, isDisabled, journey, theme }) => {
      if (isDisabled) return 'transparent';
      if (isSelected) return 'currentColor';
      if (journey === 'health') return theme.colors.health.light;
      if (journey === 'care') return theme.colors.care.light;
      if (journey === 'plan') return theme.colors.plan.light;
      return theme.colors.background.hover;
    }};
  }
`;

/**
 * Footer section of the DatePicker
 */
export const DatePickerFooter = styled(Box)`
  padding: ${spacing.sm} ${spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  justify-content: flex-end;
  gap: ${spacing.sm};
`;

/**
 * Button used in the DatePicker
 */
export const DatePickerButton = styled(Box)<StyledComponentProps & { variant?: 'primary' | 'secondary' }>`
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xxs};
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  background-color: ${({ variant, journey, theme }) => {
    if (variant === 'primary') {
      if (journey === 'health') return theme.colors.health.primary;
      if (journey === 'care') return theme.colors.care.primary;
      if (journey === 'plan') return theme.colors.plan.primary;
      return theme.colors.primary;
    }
    return 'transparent';
  }};
  color: ${({ variant, theme }) => {
    if (variant === 'primary') return colors.white;
    return theme.colors.text.primary;
  }};
  border: ${({ variant, theme }) => {
    if (variant === 'secondary') return `1px solid ${theme.colors.border.medium}`;
    return 'none';
  }};

  &:hover {
    background-color: ${({ variant, journey, theme }) => {
      if (variant === 'primary') {
        if (journey === 'health') return theme.colors.health.dark;
        if (journey === 'care') return theme.colors.care.dark;
        if (journey === 'plan') return theme.colors.plan.dark;
        return theme.colors.primary;
      }
      return theme.colors.background.hover;
    }};
  }
`;

/**
 * Navigation button for previous/next month
 */
export const DatePickerNavButton = styled(Box)`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${colors.white};
  border-radius: 50%;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;