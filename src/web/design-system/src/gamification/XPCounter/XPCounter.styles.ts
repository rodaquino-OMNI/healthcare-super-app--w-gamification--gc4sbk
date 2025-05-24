/**
 * XPCounter component styles
 * 
 * Defines styled components for the XPCounter that show XP values and remaining progress
 * with journey-specific styling. This file creates the visual presentation layer for the
 * XPCounter component, using spacing, typography, and color tokens from the design system
 * primitives package.
 */

import styled from 'styled-components';
import { JourneyType } from '@austa/interfaces/themes';
import { spacing, typography, colors } from '@design-system/primitives';

/**
 * Container for the XP counter component
 * Provides layout structure with proper spacing
 */
export const XPContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: ${spacing.sm} 0;
`;

/**
 * Label for displaying the XP value
 * Supports journey-specific styling based on the current journey
 */
export const XPLabel = styled.span<{ journey?: JourneyType }>`
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.bold};
  color: ${({ theme, journey }) => 
    journey ? colors.journeys[journey].primary : colors.brand.primary};
  display: flex;
  align-items: center;
`;

/**
 * Component for displaying remaining XP to next level
 * Uses neutral colors for secondary information
 */
export const XPRemaining = styled.span`
  font-size: ${typography.fontSize.sm};
  color: ${colors.neutral.gray600};
  margin-top: ${spacing.xs};
`;