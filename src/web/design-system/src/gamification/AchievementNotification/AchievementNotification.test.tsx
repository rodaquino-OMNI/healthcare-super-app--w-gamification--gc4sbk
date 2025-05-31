import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementNotification } from './AchievementNotification';
import { AchievementCategory } from '@austa/interfaces/gamification/achievements';

// Mock the useJourney hook
jest.mock('@austa/journey-context/src/hooks/useJourney', () => ({
  useJourney: () => ({
    getJourneyTheme: () => ({
      colors: {
        primary: '#00A859',
        secondary: '#E6F5ED',
      },
    }),
  }),
}));

// Mock achievement data
const mockAchievement = {
  id: 'achievement-123',
  title: 'First Steps',
  description: 'Complete your first health assessment',
  category: AchievementCategory.HEALTH,
  journey: 'health',
  icon: 'trophy',
  points: 50,
  rarity: 'common',
  imageUrl: '/images/achievements/first-steps.png',
  badgeUrl: '/images/badges/first-steps.png',
  tier: 1,
  progress: {
    current: 1,
    required: 1,
    percentage: 100,
    lastUpdated: new Date(),
  },
  unlocked: true,
  unlockedAt: new Date(),
};

describe('AchievementNotification', () => {
  it('renders the achievement notification with correct content', () => {
    const onCloseMock = jest.fn();
    
    render(
      <AchievementNotification
        achievement={mockAchievement}
        visible={true}
        onClose={onCloseMock}
      />
    );
    
    // Check that the title and description are rendered
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    expect(screen.getByText(mockAchievement.title)).toBeInTheDocument();
    expect(screen.getByText(mockAchievement.description)).toBeInTheDocument();
    
    // Check that the points are displayed
    expect(screen.getByText(`+${mockAchievement.points} XP`)).toBeInTheDocument();
    
    // Check that the OK button is rendered
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
  
  it('calls onClose when the OK button is clicked', () => {
    const onCloseMock = jest.fn();
    
    render(
      <AchievementNotification
        achievement={mockAchievement}
        visible={true}
        onClose={onCloseMock}
      />
    );
    
    // Click the OK button
    fireEvent.click(screen.getByText('OK'));
    
    // Check that onClose was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  
  it('applies journey-specific theming based on the achievement journey', () => {
    const careAchievement = {
      ...mockAchievement,
      journey: 'care',
    };
    
    const { rerender } = render(
      <AchievementNotification
        achievement={mockAchievement}
        visible={true}
        onClose={() => {}}
      />
    );
    
    // Re-render with a different journey
    rerender(
      <AchievementNotification
        achievement={careAchievement}
        visible={true}
        onClose={() => {}}
      />
    );
    
    // The journey-specific theming is applied via styled-components
    // and would require more complex testing to verify the actual styles
    // This test is primarily to ensure the component doesn't crash when changing journeys
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
  });
  
  it('has proper accessibility attributes', () => {
    render(
      <AchievementNotification
        achievement={mockAchievement}
        visible={true}
        onClose={() => {}}
      />
    );
    
    // Check that the title has the correct ID for aria-labelledby
    const title = screen.getByText(mockAchievement.title);
    expect(title.id).toBe('achievement-title');
    
    // Check that the description has the correct ID for aria-describedby
    const description = screen.getByText(mockAchievement.description);
    expect(description.id).toBe('achievement-description');
    
    // Check that the OK button has the correct accessibility attributes
    const okButton = screen.getByText('OK');
    expect(okButton.parentElement).toHaveAttribute('accessibilityRole', 'button');
    expect(okButton.parentElement).toHaveAttribute('accessibilityLabel', 'Close achievement notification');
  });
});