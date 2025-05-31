import styled from 'styled-components'; // styled-components@6.1.8
import { JourneyTheme } from '@austa/interfaces/components';

export const AvatarContainer = styled.div<{ size?: string; journey?: JourneyTheme }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border-radius: 50%;
  background-color: ${props => props.theme.colors.neutral.gray300};
  overflow: hidden;
  
  /* Apply journey-specific background colors with higher specificity */
  ${props => props.journey === 'health' && `
    &&& {
      background-color: ${props.theme.colors.journeys.health.primary};
    }
  `}
  
  ${props => props.journey === 'care' && `
    &&& {
      background-color: ${props.theme.colors.journeys.care.primary};
    }
  `}
  
  ${props => props.journey === 'plan' && `
    &&& {
      background-color: ${props.theme.colors.journeys.plan.primary};
    }
  `}
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const AvatarFallback = styled.span<{ size?: string; journey?: JourneyTheme }>`
  font-size: ${props => props.size ? `calc(${props.size} / 3)` : '1rem'};
  font-weight: 500;
  color: ${props => props.theme.colors.neutral.gray700};
  
  /* Apply journey-specific text colors with higher specificity */
  ${props => props.journey === 'health' && `
    &&& {
      color: ${props.theme.colors.accessibility.getJourneyContrastText('health', 'primary')};
    }
  `}
  
  ${props => props.journey === 'care' && `
    &&& {
      color: ${props.theme.colors.accessibility.getJourneyContrastText('care', 'primary')};
    }
  `}
  
  ${props => props.journey === 'plan' && `
    &&& {
      color: ${props.theme.colors.accessibility.getJourneyContrastText('plan', 'primary')};
    }
  `}
`;