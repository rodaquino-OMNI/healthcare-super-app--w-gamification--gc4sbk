import styled from 'styled-components';
import { Platform } from 'react-native';
import { colors, spacing } from '@design-system/primitives';
import { Icon } from '../../components/Icon';

/**
 * Determines the badge size in pixels based on the size prop
 * @param size The size of the badge ('sm', 'md', 'lg')
 * @returns The size in pixels
 */
export const getBadgeSize = (size: 'sm' | 'md' | 'lg'): number => {
  switch (size) {
    case 'sm': return 40;
    case 'lg': return 80;
    case 'md':
    default: return 60;
  }
};

/**
 * Hook to get the appropriate color for the journey
 * @param journey The journey identifier ('health', 'care', 'plan')
 * @returns An object with primary and secondary colors for the journey
 */
export const useJourneyColor = (journey: string) => {
  const journeyKey = (journey || 'health') as 'health' | 'care' | 'plan';
  
  return {
    primary: colors.journeys[journeyKey].primary,
    secondary: colors.journeys[journeyKey].secondary,
    background: colors.journeys[journeyKey].background
  };
};

/**
 * Container for the achievement badge
 */
export const BadgeContainer = styled.Pressable<{
  size: 'sm' | 'md' | 'lg';
  unlocked: boolean;
  journey: string;
}>`
  position: relative;
  width: ${props => getBadgeSize(props.size)}px;
  height: ${props => getBadgeSize(props.size)}px;
  border-radius: ${props => getBadgeSize(props.size) / 2}px;
  background-color: ${props => props.unlocked 
    ? colors.journeys[props.journey as 'health' | 'care' | 'plan'].background 
    : colors.neutral.gray200};
  justify-content: center;
  align-items: center;
  overflow: visible;
  ${Platform.OS === 'web' ? 'cursor: pointer;' : ''}
  opacity: ${props => props.unlocked ? 1 : 0.8};
`;

/**
 * Icon for the achievement badge
 */
export const BadgeIcon = styled(Icon)`
  opacity: ${props => props.unlocked ? 1 : 0.7};
`;

/**
 * Progress ring for locked achievements
 */
export const ProgressRing = styled.View<{
  progress: number;
  total: number;
  color: string;
  size: number;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: ${props => props.size / 2}px;
  border-width: ${props => props.size > 60 ? 3 : 2}px;
  border-color: ${props => props.color};
  opacity: ${props => (props.progress / Math.max(1, props.total)) * 0.8 + 0.2};
`;

/**
 * Indicator for unlocked achievements
 */
export const UnlockedIndicator = styled.View<{
  color: string;
}>`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: ${props => props.color};
  border-width: 2px;
  border-color: ${colors.neutral.white};
`;