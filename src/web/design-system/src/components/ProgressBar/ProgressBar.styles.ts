import styled from 'styled-components';
import { ThemeProps } from '@austa/interfaces/themes';
import { colors, spacing, borderRadius, animation, breakpoints } from '@design-system/primitives/tokens';

export const ProgressBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${spacing.sm};
  background-color: ${colors.neutral.gray200};
  border-radius: ${borderRadius.md};
  overflow: hidden;
  
  @media (max-width: ${breakpoints.sm}) {
    height: ${spacing.xs};
  }
  
  @media (min-width: ${breakpoints.lg}) {
    height: ${spacing.md};
  }
`;

interface ProgressBarFillProps {
  progress: number;
  journey?: 'health' | 'care' | 'plan';
}

export const ProgressBarFill = styled.div<ProgressBarFillProps & ThemeProps>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ progress }) => `${Math.min(Math.max(progress, 0), 100)}%`};
  background-color: ${({ journey, theme }) => 
    journey 
      ? theme.colors.journeys[journey].primary 
      : theme.colors.brand.primary
  };
  border-radius: ${borderRadius.md};
  transition: width ${animation.duration.medium} ${animation.easing.easeInOut};
  
  /* Add subtle gradient effect for better visual appeal */
  background-image: ${({ journey, theme }) => {
    const baseColor = journey 
      ? theme.colors.journeys[journey].primary 
      : theme.colors.brand.primary;
    const lighterColor = journey 
      ? theme.colors.journeys[journey].light 
      : theme.colors.brand.light;
    return `linear-gradient(to right, ${baseColor}, ${lighterColor})`;
  }};
  
  /* Add subtle animation on hover for interactive feedback */
  &:hover {
    opacity: 0.9;
    transition: width ${animation.duration.medium} ${animation.easing.easeInOut}, opacity ${animation.duration.fast} ${animation.easing.easeOut};
  }
  
  @media (max-width: ${breakpoints.sm}) {
    border-radius: ${borderRadius.sm};
  }
`;