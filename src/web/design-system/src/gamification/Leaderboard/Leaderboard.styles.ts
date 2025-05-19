import styled from 'styled-components';
import { colors, typography } from '@design-system/primitives/tokens';

export const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const LeaderboardHeader = styled.div`
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid ${colors.neutral.gray200};
`;

export const LeaderboardTitle = styled.h2`
  font-size: ${typography.fontSize.xl};
  font-weight: ${typography.fontWeight.bold};
  color: ${colors.neutral.gray900};
  margin: 0;
`;

export const LeaderboardList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

export const LeaderboardItem = styled.li<{ isCurrentUser?: boolean; journey?: string }>`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  background-color: ${props => 
    props.isCurrentUser && props.journey
      ? colors.journeys[props.journey as keyof typeof colors.journeys].background
      : 'transparent'
  };
  
  &:hover {
    background-color: ${colors.neutral.gray100};
  }
`;

export const Rank = styled.div`
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.bold};
  width: 32px;
  text-align: center;
  color: ${colors.neutral.gray800};
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

export const Username = styled.div`
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.neutral.gray900};
  margin-right: 8px;
`;

export const Score = styled.div`
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.bold};
  color: ${colors.neutral.gray800};
  margin-left: auto;
`;