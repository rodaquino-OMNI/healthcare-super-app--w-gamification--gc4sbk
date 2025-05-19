import styled, { css } from 'styled-components';
import { Box, Text, Touchable } from '@design-system/primitives';
import { Card } from '@design-system/primitives/components';
import { JourneyType } from '@austa/interfaces/common';
import { MetricCardStyleProps } from '@austa/interfaces/health';
import { useJourneyContext } from '@austa/journey-context';

/**
 * The main container for the MetricCard component, extending the Card component.
 * Applies journey-specific styling with proper spacing and visual treatment.
 */
export const MetricCardContainer = styled(Card)<{ journeyType?: JourneyType }>`
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  border-left: 4px solid ${props => {
    const journeyType = props.journeyType || 'health';
    return props.theme.colors.journeys[journeyType].primary;
  }};
  background-color: ${props => {
    const journeyType = props.journeyType || 'health';
    return props.theme.colors.journeys[journeyType].background;
  }};
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  /* Improved accessibility for keyboard navigation */
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.semantic.focus};
    outline-offset: 2px;
  }
  
  /* Responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

/**
 * Container for the metric icon with appropriate styling.
 * Uses journey-specific primary color for the background.
 */
export const MetricIconContainer = styled(Box)<{ journeyType?: JourneyType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => {
    const journeyType = props.journeyType || 'health';
    return props.theme.colors.journeys[journeyType].primary;
  }};
  color: ${props => props.theme.colors.neutral.white};
  margin-right: ${props => props.theme.spacing.sm};
  
  /* Responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 32px;
    height: 32px;
  }
`;

/**
 * Styled text component for the metric title.
 */
export const MetricTitle = styled(Text)<MetricCardStyleProps>`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.neutral.gray800};
  margin-bottom: ${props => props.theme.spacing.xs};
  
  /* Accessibility enhancement for screen readers */
  ${props => props.isScreenReaderOnly && css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  `}
  
  /* Responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
`;

/**
 * Styled text component for the metric value.
 */
export const MetricValue = styled(Text)<MetricCardStyleProps>`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.neutral.gray900};
  margin-right: ${props => props.theme.spacing.xs};
  display: inline-flex;
  align-items: baseline;
  
  /* Responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: ${props => props.theme.typography.fontSize.lg};
  }
`;

/**
 * Styled text component for the metric unit.
 */
export const MetricUnit = styled(Text)<MetricCardStyleProps>`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.regular};
  color: ${props => props.theme.colors.neutral.gray600};
  margin-left: ${props => props.theme.spacing.xs};
  
  /* Responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: ${props => props.theme.typography.fontSize.xs};
  }
`;

/**
 * Styled container for the trend indicator with conditional styling based on trend direction.
 * Uses semantic colors for different trend states.
 */
export const TrendIndicatorContainer = styled(Box)<{ trend?: 'up' | 'down' | 'stable' }>`
  display: flex;
  align-items: center;
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-top: ${props => props.theme.spacing.xs};
  color: ${props => 
    props.trend === 'up' 
      ? props.theme.colors.semantic.success 
      : props.trend === 'down' 
        ? props.theme.colors.semantic.error 
        : props.theme.colors.neutral.gray600
  };
  
  /* Accessibility enhancement for screen readers */
  & .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  /* Responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: ${props => props.theme.typography.fontSize.xs};
  }
`;

/**
 * Styled container for achievement badges displayed on the metric card.
 * Uses journey-specific colors with transparency for the background.
 */
export const AchievementContainer = styled(Box)<{ journeyType?: JourneyType }>`
  display: flex;
  align-items: center;
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xs};
  background-color: ${props => {
    const journeyType = props.journeyType || 'health';
    return `${props.theme.colors.journeys[journeyType].primary}10`; // 10% opacity
  }};
  border-radius: ${props => props.theme.borderRadius.sm};
  
  /* Responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin-top: ${props => props.theme.spacing.xs};
    padding: ${props => props.theme.spacing.xxs};
  }
`;

/**
 * Touchable wrapper for the metric card to handle click events.
 * Provides proper accessibility attributes for interactive elements.
 */
export const MetricCardTouchable = styled(Touchable)<{ journeyType?: JourneyType }>`
  width: 100%;
  text-decoration: none;
  color: inherit;
  
  &:focus {
    outline: none;
  }
  
  &:focus-visible {
    outline: 2px solid ${props => {
      const journeyType = props.journeyType || 'health';
      return props.theme.colors.journeys[journeyType].primary;
    }};
    outline-offset: 2px;
  }
`;