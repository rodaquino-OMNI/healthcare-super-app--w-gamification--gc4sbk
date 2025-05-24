/**
 * DatePicker Styled Components
 * 
 * This file defines the styled components for the DatePicker UI using primitives
 * from @design-system/primitives. It supports journey-specific theming for health,
 * care, and plan journeys.
 */

import styled from 'styled-components';
import { Box, Stack, Text } from '@design-system/primitives/components';
import { colors, spacing, shadows, animation } from '@design-system/primitives/tokens';
import type { JourneyTheme } from '@austa/interfaces/components';

/**
 * Helper function to get journey-specific color
 */
const getJourneyColor = (journeyTheme?: JourneyTheme): string => {
  switch (journeyTheme) {
    case 'health':
      return colors.journeys.health.primary;
    case 'care':
      return colors.journeys.care.primary;
    case 'plan':
      return colors.journeys.plan.primary;
    default:
      return colors.primary;
  }
};

/**
 * Main container for the DatePicker component
 */
export const DatePickerContainer = styled(Box)<{ journeyTheme?: JourneyTheme }>`
  width: 100%;
  max-width: 320px;
  background-color: ${colors.background.surface};
  border-radius: ${spacing.xs};
  box-shadow: ${shadows.md};
  overflow: hidden;
  transition: all ${animation.duration.normal}ms ${animation.easing.easeInOut};
`;

/**
 * Header section of the DatePicker
 */
export const DatePickerHeader = styled(Box)<{ journeyTheme?: JourneyTheme }>`
  padding: ${spacing.md};
  background-color: ${({ journeyTheme }) => getJourneyColor(journeyTheme)};
  color: ${colors.text.onPrimary};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Month and year display in the header
 */
export const DatePickerTitle = styled(Text)<{ journeyTheme?: JourneyTheme }>`
  font-weight: bold;
  color: ${colors.text.onPrimary};
`;

/**
 * Navigation buttons container
 */
export const DatePickerNavigation = styled(Stack)`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs};
`;

/**
 * Body section of the DatePicker containing the calendar
 */
export const DatePickerBody = styled(Box)`
  padding: ${spacing.md};
`;

/**
 * Week day header row
 */
export const DatePickerWeekDays = styled(Stack)`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${spacing.sm};
`;

/**
 * Week day label
 */
export const DatePickerWeekDay = styled(Text)`
  width: 36px;
  text-align: center;
  font-size: 12px;
  color: ${colors.text.secondary};
`;

/**
 * Calendar grid container
 */
export const DatePickerCalendar = styled(Box)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${spacing.xs};
`;

/**
 * Date cell in the calendar
 */
export const DatePickerCell = styled(Box)<{
  journeyTheme?: JourneyTheme;
  isSelected?: boolean;
  isToday?: boolean;
  isDisabled?: boolean;
  isOutsideMonth?: boolean;
}>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ isDisabled, isOutsideMonth }) => {
    if (isDisabled) return 0.3;
    if (isOutsideMonth) return 0.5;
    return 1;
  }};
  background-color: ${({ isSelected, journeyTheme }) =>
    isSelected ? getJourneyColor(journeyTheme) : 'transparent'};
  color: ${({ isSelected }) => (isSelected ? colors.text.onPrimary : colors.text.primary)};
  border: ${({ isToday, journeyTheme }) =>
    isToday ? `2px solid ${getJourneyColor(journeyTheme)}` : 'none'};
  transition: all ${animation.duration.fast}ms ${animation.easing.easeOut};

  &:hover {
    background-color: ${({ isSelected, isDisabled, journeyTheme }) =>
      isSelected || isDisabled
        ? undefined
        : `${getJourneyColor(journeyTheme)}20`};
  }
`;

/**
 * Footer section of the DatePicker
 */
export const DatePickerFooter = styled(Box)`
  padding: ${spacing.sm} ${spacing.md};
  border-top: 1px solid ${colors.border.light};
  display: flex;
  justify-content: flex-end;
  gap: ${spacing.sm};
`;

/**
 * Button used in the DatePicker
 */
export const DatePickerButton = styled(Box)<{
  journeyTheme?: JourneyTheme;
  variant?: 'primary' | 'secondary';
}>`
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.xs};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: all ${animation.duration.fast}ms ${animation.easing.easeOut};
  background-color: ${({ variant, journeyTheme }) =>
    variant === 'primary' ? getJourneyColor(journeyTheme) : 'transparent'};
  color: ${({ variant }) =>
    variant === 'primary' ? colors.text.onPrimary : colors.text.secondary};
  border: ${({ variant, journeyTheme }) =>
    variant === 'secondary' ? `1px solid ${getJourneyColor(journeyTheme)}` : 'none'};

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.6;
  }
`;

/**
 * Time picker container
 */
export const DatePickerTimeContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${spacing.sm};
  margin-top: ${spacing.md};
  padding-top: ${spacing.sm};
  border-top: 1px solid ${colors.border.light};
`;

/**
 * Time input field
 */
export const DatePickerTimeInput = styled(Box)<{ journeyTheme?: JourneyTheme }>`
  width: 60px;
  height: 36px;
  border: 1px solid ${colors.border.default};
  border-radius: ${spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  position: relative;
  
  &:focus-within {
    border-color: ${({ journeyTheme }) => getJourneyColor(journeyTheme)};
  }
  
  input {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    text-align: center;
    font-size: 16px;
    outline: none;
    color: ${colors.text.primary};
    
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    &[type=number] {
      -moz-appearance: textfield;
    }
  }
`;

/**
 * Time separator
 */
export const DatePickerTimeSeparator = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.text.primary};
`;