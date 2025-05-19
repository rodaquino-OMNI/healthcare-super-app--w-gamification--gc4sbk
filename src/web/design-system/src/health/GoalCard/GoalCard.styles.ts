import styled from 'styled-components';
import { tokens } from '@design-system/primitives';
import { useJourney } from '@austa/journey-context';

/**
 * Container for the GoalCard component.
 * Provides the main card structure with appropriate spacing, borders, and background.
 * Implements journey-specific theming and improved accessibility.
 */
export const GoalCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${tokens.spacing.md};
  border-radius: ${tokens.borderRadius.md};
  background-color: ${tokens.colors.neutral.white};
  border-left: 4px solid ${tokens.colors.journeys.health.primary};
  box-shadow: ${tokens.shadows.sm};
  margin-bottom: ${tokens.spacing.md};
  
  /* Enhanced transition for smoother interactions */
  transition: transform ${tokens.animation.duration.fast}ms ${tokens.animation.easing.easeOut},
              box-shadow ${tokens.animation.duration.fast}ms ${tokens.animation.easing.easeOut};
  
  /* Improved hover state with subtle elevation */
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${tokens.shadows.md};
  }
  
  /* Added focus state for accessibility */
  &:focus-within {
    outline: 2px solid ${tokens.colors.journeys.health.primary};
    outline-offset: 2px;
  }
  
  /* Mobile-first approach with responsive layout changes */
  @media (min-width: ${tokens.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

/**
 * Title of the goal.
 * Uses typography tokens for consistent text styling.
 * Enhanced with improved responsive behavior and accessibility.
 */
export const GoalTitle = styled.h3`
  font-family: ${tokens.typography.fontFamily.base};
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral.gray900};
  margin: 0 0 ${tokens.spacing.sm} 0;
  
  /* Improved truncation for long titles */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  
  @media (min-width: ${tokens.breakpoints.md}) {
    margin-bottom: 0;
    margin-right: ${tokens.spacing.md};
    flex-shrink: 0;
    max-width: 40%;
  }
`;

/**
 * Progress indicator for the goal.
 * Container for progress bar and progress information.
 * Enhanced with improved responsive layout and accessibility.
 */
export const GoalProgress = styled.div`
  margin-top: ${tokens.spacing.sm};
  width: 100%;
  
  @media (min-width: ${tokens.breakpoints.md}) {
    margin-top: 0;
    flex: 1;
    max-width: 60%;
  }
  
  /* Style for the progress bar background with improved accessibility */
  .progress-track {
    width: 100%;
    height: 8px;
    background-color: ${tokens.colors.neutral.gray200};
    border-radius: ${tokens.borderRadius.full};
    overflow: hidden;
    margin-bottom: ${tokens.spacing.xs};
  }
  
  /* Style for the progress bar indicator with smoother animation */
  .progress-bar {
    height: 100%;
    background-color: ${tokens.colors.journeys.health.primary};
    border-radius: ${tokens.borderRadius.full};
    transition: width ${tokens.animation.duration.normal}ms ${tokens.animation.easing.easeInOut};
  }
  
  /* Style for the progress text with improved contrast */
  .progress-text {
    display: flex;
    justify-content: space-between;
    font-family: ${tokens.typography.fontFamily.base};
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.neutral.gray700}; /* Improved contrast from gray600 */
    margin-top: ${tokens.spacing.xs};
  }
  
  /* Style for achievement elements with enhanced accessibility */
  .achievement {
    display: flex;
    align-items: center;
    margin-top: ${tokens.spacing.sm};
    
    .achievement-icon {
      margin-right: ${tokens.spacing.xs};
      color: ${tokens.colors.journeys.health.primary};
    }
    
    .achievement-text {
      font-family: ${tokens.typography.fontFamily.base};
      font-size: ${tokens.typography.fontSize.sm};
      font-weight: ${tokens.typography.fontWeight.medium};
      color: ${tokens.colors.journeys.health.primary};
    }
  }
`;

/**
 * Goal metadata section for displaying additional information.
 * New component to improve information hierarchy and layout.
 */
export const GoalMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacing.xs};
  margin-top: ${tokens.spacing.sm};
  
  .metadata-item {
    display: flex;
    align-items: center;
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.neutral.gray600};
    background-color: ${tokens.colors.neutral.gray100};
    padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
    border-radius: ${tokens.borderRadius.sm};
    
    .metadata-icon {
      margin-right: ${tokens.spacing.xs};
      color: ${tokens.colors.journeys.health.secondary};
    }
  }
  
  @media (min-width: ${tokens.breakpoints.md}) {
    margin-top: 0;
    justify-content: flex-end;
  }
`;