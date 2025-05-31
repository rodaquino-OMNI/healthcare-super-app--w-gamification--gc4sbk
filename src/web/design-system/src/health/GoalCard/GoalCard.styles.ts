import styled from 'styled-components';
import { tokens } from '@design-system/primitives';
import { useJourney } from '@austa/journey-context';

/**
 * Container for the GoalCard component.
 * Provides the main card structure with appropriate spacing, borders, and background.
 * Supports journey-specific theming through JourneyContext.
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
  
  /* Add hover and focus effects for accessibility */
  transition: ${tokens.animation.duration.normal} ${tokens.animation.easing.easeOut};
  transition-property: transform, box-shadow;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${tokens.shadows.md};
  }
  
  &:focus-within {
    outline: 2px solid ${tokens.colors.journeys.health.primary};
    outline-offset: 2px;
  }
  
  /* Responsive layout - mobile first approach */
  @media (min-width: ${tokens.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

/**
 * Title of the goal.
 * Uses typography tokens for consistent text styling.
 */
export const GoalTitle = styled.h3`
  font-family: ${tokens.typography.fontFamily.base};
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.neutral.gray900};
  margin: 0 0 ${tokens.spacing.sm} 0;
  
  /* Improve accessibility */
  &:focus {
    outline: none; /* Outline is handled by the container */
  }
  
  /* Responsive adjustments */
  @media (min-width: ${tokens.breakpoints.md}) {
    margin-bottom: 0;
    margin-right: ${tokens.spacing.md};
  }
`;

/**
 * Progress indicator for the goal.
 * Container for progress bar and progress information.
 */
export const GoalProgress = styled.div`
  margin-top: ${tokens.spacing.sm};
  width: 100%;
  
  /* Responsive adjustments */
  @media (min-width: ${tokens.breakpoints.md}) {
    margin-top: 0;
    flex: 1;
    max-width: 60%;
  }
  
  /* Style for the progress bar background */
  .progress-track {
    width: 100%;
    height: 8px;
    background-color: ${tokens.colors.neutral.gray200};
    border-radius: ${tokens.borderRadius.full};
    overflow: hidden;
    margin-bottom: ${tokens.spacing.xs};
  }
  
  /* Style for the progress bar indicator */
  .progress-bar {
    height: 100%;
    background-color: ${tokens.colors.journeys.health.primary};
    border-radius: ${tokens.borderRadius.full};
    transition: width ${tokens.animation.duration.normal} ${tokens.animation.easing.easeOut};
  }
  
  /* Style for the progress text */
  .progress-text {
    display: flex;
    justify-content: space-between;
    font-family: ${tokens.typography.fontFamily.base};
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.neutral.gray600};
  }
  
  /* Style for achievement elements that might appear with the progress */
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
 * Creates a themed version of the GoalCardContainer that uses the current journey's primary color
 * for theming elements like the border and focus outline.
 */
export const ThemedGoalCardContainer = styled(GoalCardContainer)`
  ${() => {
    // This will be evaluated at runtime to use the current journey's primary color
    const { journeyData } = useJourney();
    const journeyId = journeyData?.id || 'health';
    
    return `
      border-left-color: ${tokens.colors.journeys[journeyId].primary};
      
      &:focus-within {
        outline-color: ${tokens.colors.journeys[journeyId].primary};
      }
    `;
  }}
`;

/**
 * Creates a themed version of the GoalProgress that uses the current journey's primary color
 * for the progress bar and achievement text.
 */
export const ThemedGoalProgress = styled(GoalProgress)`
  ${() => {
    // This will be evaluated at runtime to use the current journey's primary color
    const { journeyData } = useJourney();
    const journeyId = journeyData?.id || 'health';
    
    return `
      .progress-bar {
        background-color: ${tokens.colors.journeys[journeyId].primary};
      }
      
      .achievement {
        .achievement-icon {
          color: ${tokens.colors.journeys[journeyId].primary};
        }
        
        .achievement-text {
          color: ${tokens.colors.journeys[journeyId].primary};
        }
      }
    `;
  }}
`;