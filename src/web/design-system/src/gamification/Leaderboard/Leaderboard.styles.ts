import styled from 'styled-components';
import { spacing } from '@design-system/primitives/tokens/spacing';
import { colors } from '@design-system/primitives/tokens/colors';
import { breakpoints } from '@design-system/primitives/tokens/breakpoints';
import { shadows } from '@design-system/primitives/tokens/shadows';
import { typography } from '@design-system/primitives/tokens/typography';
import { JourneyType } from '@austa/interfaces/common';

/**
 * The main container for the leaderboard
 */
export const LeaderboardContainer = styled.div<{ journey?: JourneyType }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${colors.neutral.white};
  border-radius: ${spacing.xs};
  box-shadow: ${shadows.sm};
  overflow: hidden;
  padding: ${spacing.md};
  border-top: 4px solid ${({ journey }) => 
    journey 
      ? colors.journeys[journey].primary 
      : colors.brand.primary
  };

  @media (min-width: ${breakpoints.md}) {
    box-shadow: ${shadows.md};
  }
`;

/**
 * The header section of the leaderboard
 */
export const LeaderboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.md};
  padding-bottom: ${spacing.sm};
  border-bottom: 1px solid ${colors.neutral.gray100};
`;

/**
 * The title of the leaderboard
 */
export const LeaderboardTitle = styled.h3<{ journey?: JourneyType }>`
  font-size: ${typography.sizes.lg};
  font-weight: ${typography.weights.semibold};
  color: ${({ journey }) => 
    journey 
      ? colors.journeys[journey].primary 
      : colors.brand.primary
  };
  margin: 0;
  line-height: ${typography.lineHeights.heading};
`;

/**
 * The list containing leaderboard entries
 */
export const LeaderboardList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 400px;
  
  /* Improve scrollbar styling for better accessibility */
  scrollbar-width: thin;
  scrollbar-color: ${colors.neutral.gray300} ${colors.neutral.gray100};
  
  &::-webkit-scrollbar {
    width: ${spacing.xs};
  }
  
  &::-webkit-scrollbar-track {
    background: ${colors.neutral.gray100};
    border-radius: ${spacing.xs};
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${colors.neutral.gray300};
    border-radius: ${spacing.xs};
    border: 2px solid ${colors.neutral.gray100};
  }
`;

/**
 * A single item in the leaderboard list
 */
export const LeaderboardItem = styled.li<{ isCurrentUser?: boolean; rank: number; journey?: JourneyType }>`
  display: flex;
  align-items: center;
  padding: ${spacing.sm} ${spacing.md};
  border-radius: ${spacing.xxs};
  margin-bottom: ${spacing.xs};
  background-color: ${({ isCurrentUser }) => 
    isCurrentUser 
      ? colors.neutral.gray100 
      : 'transparent'
  };
  
  ${({ rank, journey }) => rank <= 3 && `
    border-left: 4px solid ${
      rank === 1 
        ? colors.semantic.gold
        : rank === 2 
          ? colors.semantic.silver
          : colors.semantic.bronze
    };
  `}
  
  &:hover {
    background-color: ${colors.neutral.gray100};
  }
  
  &:focus-visible {
    outline: 2px solid ${({ journey }) => 
      journey 
        ? colors.journeys[journey].primary 
        : colors.brand.primary
    };
    outline-offset: 2px;
  }
  
  @media (min-width: ${breakpoints.md}) {
    padding: ${spacing.md};
  }
`;

/**
 * The rank number of a leaderboard item
 */
export const Rank = styled.div<{ rank: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: ${typography.weights.bold};
  font-size: ${typography.sizes.sm};
  margin-right: ${spacing.md};
  
  ${({ rank }) => {
    if (rank === 1) {
      return `
        background-color: ${colors.semantic.goldLight};
        color: ${colors.semantic.goldDark};
      `;
    } else if (rank === 2) {
      return `
        background-color: ${colors.semantic.silverLight};
        color: ${colors.semantic.silverDark};
      `;
    } else if (rank === 3) {
      return `
        background-color: ${colors.semantic.bronzeLight};
        color: ${colors.semantic.bronzeDark};
      `;
    }
    return `
      background-color: ${colors.neutral.gray100};
      color: ${colors.neutral.gray700};
    `;
  }}
  
  @media (min-width: ${breakpoints.md}) {
    min-width: 40px;
    height: 40px;
    font-size: ${typography.sizes.md};
  }
`;

/**
 * Container for user information in a leaderboard item
 */
export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; // This is needed for text-overflow to work
`;

/**
 * The username of a leaderboard item
 */
export const Username = styled.span`
  font-weight: ${typography.weights.semibold};
  color: ${colors.neutral.gray900};
  margin-bottom: ${spacing.xs};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: ${typography.lineHeights.body};
`;

/**
 * The score of a leaderboard item
 */
export const Score = styled.span<{ journey?: JourneyType }>`
  display: flex;
  align-items: center;
  font-weight: ${typography.weights.bold};
  color: ${({ journey }) => 
    journey 
      ? colors.journeys[journey].primary 
      : colors.brand.primary
  };
  margin-left: auto;
  padding-left: ${spacing.md};
  font-size: ${typography.sizes.md};
`;