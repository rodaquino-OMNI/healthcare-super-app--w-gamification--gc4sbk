import styled from 'styled-components';
import { ThemeProps } from '@austa/interfaces';
import { spacing, borderRadius, colors, animation, breakpoints } from '@design-system/primitives';

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

export const ProgressBarFill = styled.div<ProgressBarFillProps>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ progress }) => `${Math.min(Math.max(progress, 0), 100)}%`};
  background-color: ${({ journey, theme }: ProgressBarFillProps & ThemeProps<any>) => 
    journey 
      ? theme.colors.journeys[journey].primary 
      : theme.colors.brand.primary
  };
  border-radius: ${borderRadius.md};
  transition: width ${animation.duration.medium} ${animation.easing.easeInOut};
  
  /* Add subtle gradient effect for better visual appeal */
  background-image: linear-gradient(
    to right,
    ${({ journey, theme }: ProgressBarFillProps & ThemeProps<any>) => 
      journey 
        ? `${theme.colors.journeys[journey].primary}99, ${theme.colors.journeys[journey].primary}` 
        : `${theme.colors.brand.primary}99, ${theme.colors.brand.primary}`
    }
  );
  
  /* Add subtle shadow for depth */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) inset;
`;