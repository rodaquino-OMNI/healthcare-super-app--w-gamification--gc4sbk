import styled from 'styled-components';
import { JourneyType } from '@austa/interfaces/themes';
import { spacing, typography, colors } from '@design-system/primitives';

type JourneyProps = {
  journey?: JourneyType;
};

export const XPContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: ${spacing.sm} 0;
`;

export const XPLabel = styled.span<JourneyProps>`
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.bold};
  color: ${({ theme, journey }) => 
    journey ? theme.colors.journeys[journey].primary : colors.brand.primary};
  display: flex;
  align-items: center;
`;

export const XPRemaining = styled.span`
  font-size: ${typography.fontSize.sm};
  color: ${colors.neutral.gray600};
  margin-top: ${spacing.xs};
`;