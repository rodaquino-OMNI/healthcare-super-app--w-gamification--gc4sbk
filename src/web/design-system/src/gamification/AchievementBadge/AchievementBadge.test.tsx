import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementBadge } from './AchievementBadge';
import { Achievement, AchievementCategory } from '@austa/interfaces/gamification';
import * as JourneyContext from '@austa/journey-context';
import { colors } from '../../tokens/colors';

// Mock the journey context hook
jest.mock('@austa/journey-context', () => ({
  useJourneyContext: jest.fn(),
}));

// Mock the styled components to verify primitive usage
jest.mock('./AchievementBadge.styles', () => {
  const original = jest.requireActual('./AchievementBadge.styles');
  return {
    ...original,
    BadgeContainer: jest.fn(props => <div data-testid="badge-container" {...props} />),
    BadgeIcon: jest.fn(props => <div data-testid="badge-icon" {...props} />),
    ProgressRing: jest.fn(props => <div data-testid="progress-ring" {...props} />),
    UnlockedIndicator: jest.fn(props => <div data-testid="unlocked-indicator" {...props} />),
    useJourneyColor: jest.fn(journey => {
      const journeyColors = {
        health: { primary: '#0ACF83', secondary: '#E6F9F1' },
        care: { primary: '#FF8C42', secondary: '#FFF1E6' },
        plan: { primary: '#2D9CDB', secondary: '#E6F3FB' },
      };
      return journeyColors[journey] || journeyColors.health;
    }),
  };
});

describe('AchievementBadge', () => {
  // Sample achievement data for testing
  const createMockAchievement = (overrides = {}): Achievement => ({
    id: 'test-achievement',
    title: 'Test Achievement',
    description: 'This is a test achievement',
    category: AchievementCategory.HEALTH,
    journey: 'health',
    icon: 'trophy',
    points: 100,
    rarity: 'common',
    imageUrl: 'https://example.com/image.png',
    badgeUrl: 'https://example.com/badge.png',
    tier: 1,
    progress: {
      current: 5,
      required: 10,
      percentage: 50,
      lastUpdated: new Date(),
    },
    unlocked: false,
    unlockedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for locked achievement', () => {
    const achievement = createMockAchievement();
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Check the accessibility label contains the achievement title and progress info
    const badge = screen.getByLabelText(/Test Achievement.*Progress: 5 of 10/);
    expect(badge).toBeInTheDocument();
    
    // Check the progress ring is displayed with correct progress value
    const progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toBeInTheDocument();
    expect(progressRing).toHaveAttribute('aria-valuemin', '0');
    expect(progressRing).toHaveAttribute('aria-valuemax', '100');
    expect(progressRing).toHaveAttribute('aria-valuenow', '50');
    
    // Verify the badge icon has the correct color for locked state
    const badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon).toBeInTheDocument();
    expect(badgeIcon).toHaveAttribute('color', colors.neutral.gray400);
  });
  
  it('renders correctly for unlocked achievement', () => {
    const achievement = createMockAchievement({
      progress: { current: 10, required: 10, percentage: 100, lastUpdated: new Date() },
      unlocked: true,
      unlockedAt: new Date(),
    });
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Check the accessibility label contains the achievement title and unlocked status
    const badge = screen.getByLabelText(/Test Achievement.*Unlocked/);
    expect(badge).toBeInTheDocument();
    
    // Check the progress ring is not displayed for unlocked achievements
    expect(screen.queryByTestId('progress-ring')).not.toBeInTheDocument();
    
    // Check the unlocked indicator is displayed
    expect(screen.getByTestId('unlocked-indicator')).toBeInTheDocument();
    
    // Verify the badge icon has the correct color for unlocked state
    const badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon).toBeInTheDocument();
    expect(badgeIcon).toHaveAttribute('color', '#0ACF83'); // Health journey color
  });
  
  it('applies journey-specific styling', () => {
    const healthAchievement = createMockAchievement({
      journey: 'health',
      unlocked: true,
    });
    
    const careAchievement = createMockAchievement({
      journey: 'care',
      unlocked: true,
    });
    
    const planAchievement = createMockAchievement({
      journey: 'plan',
      unlocked: true,
    });
    
    // First render with health journey
    const { rerender } = render(
      <AchievementBadge achievement={healthAchievement} />
    );
    
    // Check health journey specific styling (green color)
    let badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon).toHaveAttribute('color', '#0ACF83');
    
    // Re-render with care journey
    rerender(
      <AchievementBadge achievement={careAchievement} />
    );
    
    // Check care journey specific styling (orange color)
    badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon).toHaveAttribute('color', '#FF8C42');
    
    // Re-render with plan journey
    rerender(
      <AchievementBadge achievement={planAchievement} />
    );
    
    // Check plan journey specific styling (blue color)
    badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon).toHaveAttribute('color', '#2D9CDB');
  });
  
  it('renders different size variants correctly', () => {
    const achievement = createMockAchievement();
    
    // Test small size
    const { rerender } = render(
      <AchievementBadge achievement={achievement} size="sm" />
    );
    
    let badgeContainer = screen.getByTestId('badge-container');
    expect(badgeContainer).toHaveAttribute('size', 'sm');
    
    // Test medium size (default)
    rerender(
      <AchievementBadge achievement={achievement} size="md" />
    );
    
    badgeContainer = screen.getByTestId('badge-container');
    expect(badgeContainer).toHaveAttribute('size', 'md');
    
    // Test large size
    rerender(
      <AchievementBadge achievement={achievement} size="lg" />
    );
    
    badgeContainer = screen.getByTestId('badge-container');
    expect(badgeContainer).toHaveAttribute('size', 'lg');
  });
  
  it('handles showProgress prop correctly', () => {
    const achievement = createMockAchievement();
    
    // Test with showProgress=true (default)
    const { rerender } = render(
      <AchievementBadge achievement={achievement} showProgress={true} />
    );
    
    expect(screen.getByTestId('progress-ring')).toBeInTheDocument();
    
    // Test with showProgress=false
    rerender(
      <AchievementBadge achievement={achievement} showProgress={false} />
    );
    
    expect(screen.queryByTestId('progress-ring')).not.toBeInTheDocument();
  });
  
  it('calls onPress callback when badge is pressed', () => {
    const achievement = createMockAchievement();
    const onPressMock = jest.fn();
    
    render(
      <AchievementBadge achievement={achievement} onPress={onPressMock} />
    );
    
    const badgeContainer = screen.getByTestId('badge-container');
    fireEvent.click(badgeContainer);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  it('integrates with journey context', () => {
    // Mock the journey context hook to return journey-specific data
    const mockUseJourneyContext = JourneyContext.useJourneyContext as jest.Mock;
    mockUseJourneyContext.mockReturnValue({
      currentJourney: 'health',
      journeyTheme: {
        colors: {
          primary: '#0ACF83',
          secondary: '#E6F9F1',
        },
      },
    });
    
    const achievement = createMockAchievement();
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Verify the journey context was used
    expect(mockUseJourneyContext).toHaveBeenCalled();
  });
  
  it('provides proper accessibility attributes', () => {
    const achievement = createMockAchievement();
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Check for proper accessibility label
    const badge = screen.getByLabelText(/Test Achievement.*This is a test achievement.*Progress: 5 of 10/);
    expect(badge).toBeInTheDocument();
    
    // Check progress ring has proper ARIA attributes
    const progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toHaveAttribute('aria-valuemin', '0');
    expect(progressRing).toHaveAttribute('aria-valuemax', '100');
    expect(progressRing).toHaveAttribute('aria-valuenow', '50');
    
    // Check icon has aria-hidden
    const badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon).toHaveAttribute('aria-hidden', 'true');
  });
  
  it('handles achievements with zero total progress correctly', () => {
    const achievement = createMockAchievement({
      progress: { current: 0, required: 0, percentage: 0, lastUpdated: new Date() },
    });
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Check the progress ring has 0% progress
    const progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toHaveAttribute('aria-valuenow', '0');
  });
  
  it('handles achievements with invalid journey type gracefully', () => {
    const achievement = createMockAchievement({
      journey: 'invalid-journey' as any,
    });
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Should default to health journey styling
    const badgeContainer = screen.getByTestId('badge-container');
    expect(badgeContainer).toBeInTheDocument();
    // Component should render without errors
  });
});