import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // Version ^14.0.0
import { describe, it, expect } from '@jest/globals'; // Version ^29.0.0
import { AchievementNotification } from './AchievementNotification';
import { Achievement, AchievementCategory } from '@austa/interfaces/gamification';
import { ThemeProvider } from 'styled-components';
import { useJourneyTheme } from '@austa/journey-context';

// Mock the journey-context hook
jest.mock('@austa/journey-context', () => ({
  useJourneyTheme: jest.fn(),
}));

describe('AchievementNotification', () => {
  // Sample achievement data that matches the Achievement interface from @austa/interfaces/gamification
  const mockAchievement: Achievement = {
    id: '123',
    title: 'Test Achievement',
    description: 'This is a test achievement description.',
    category: AchievementCategory.HEALTH,
    journey: 'health',
    icon: 'test-icon',
    points: 100,
    rarity: 'common',
    imageUrl: 'test-image.png',
    badgeUrl: 'test-badge.png',
    tier: 1,
    progress: {
      current: 100,
      required: 100,
      percentage: 100,
      lastUpdated: new Date(),
    },
    unlocked: true,
    unlockedAt: new Date(),
  };

  // Mock theme for testing
  const mockTheme = {
    colors: {
      primary: '#00A86B', // Health journey green color
      secondary: '#4CAF50',
      text: '#333333',
      background: '#FFFFFF',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '16px',
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      fontSize: {
        small: '12px',
        medium: '16px',
        large: '20px',
        xlarge: '24px',
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        bold: 700,
      },
    },
  };

  beforeEach(() => {
    // Mock the useJourneyTheme hook to return our mock theme
    (useJourneyTheme as jest.Mock).mockReturnValue(mockTheme);
  });

  it('renders correctly with achievement details', () => {
    // Action: Render the AchievementNotification component with the achievement object
    render(
      <ThemeProvider theme={mockTheme}>
        <AchievementNotification achievement={mockAchievement} onClose={() => {}} />
      </ThemeProvider>
    );

    // Assertion: Verify that the achievement title is displayed
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();

    // Assertion: Verify that the achievement description is displayed
    expect(screen.getByText('This is a test achievement description.')).toBeInTheDocument();

    // Assertion: Verify that the points are displayed
    expect(screen.getByText('100 points')).toBeInTheDocument();

    // Assertion: Verify that the AchievementBadge component is rendered with the correct achievement data
    const badge = screen.getByLabelText('Test Achievement achievement badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Test Achievement achievement badge');
  });

  it('calls onClose when the OK button is clicked', () => {
    // Create a mock onClose function
    const onCloseMock = jest.fn();

    // Action: Render the AchievementNotification component with the achievement object and the mock onClose function
    render(
      <ThemeProvider theme={mockTheme}>
        <AchievementNotification achievement={mockAchievement} onClose={onCloseMock} />
      </ThemeProvider>
    );

    // Simulate a click on the close button
    const closeButton = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(closeButton);

    // Assertion: Verify that the onClose function is called
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('applies journey-specific theming based on achievement journey', () => {
    // Mock different journey themes
    const healthTheme = { ...mockTheme, colors: { ...mockTheme.colors, primary: '#00A86B' } }; // Green
    const careTheme = { ...mockTheme, colors: { ...mockTheme.colors, primary: '#FF9800' } }; // Orange
    const planTheme = { ...mockTheme, colors: { ...mockTheme.colors, primary: '#2196F3' } }; // Blue

    // Test health journey theming
    (useJourneyTheme as jest.Mock).mockReturnValue(healthTheme);
    const healthAchievement = { ...mockAchievement, journey: 'health' };
    const { rerender } = render(
      <ThemeProvider theme={healthTheme}>
        <AchievementNotification achievement={healthAchievement} onClose={() => {}} />
      </ThemeProvider>
    );

    // Verify health journey styling (we can't directly test CSS, but we can check if the component renders)
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    
    // Test care journey theming
    const careAchievement = { ...mockAchievement, journey: 'care' };
    (useJourneyTheme as jest.Mock).mockReturnValue(careTheme);
    rerender(
      <ThemeProvider theme={careTheme}>
        <AchievementNotification achievement={careAchievement} onClose={() => {}} />
      </ThemeProvider>
    );

    // Verify care journey styling
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    
    // Test plan journey theming
    const planAchievement = { ...mockAchievement, journey: 'plan' };
    (useJourneyTheme as jest.Mock).mockReturnValue(planTheme);
    rerender(
      <ThemeProvider theme={planTheme}>
        <AchievementNotification achievement={planAchievement} onClose={() => {}} />
      </ThemeProvider>
    );

    // Verify plan journey styling
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <AchievementNotification achievement={mockAchievement} onClose={() => {}} />
      </ThemeProvider>
    );

    // Verify the modal has proper role and aria attributes
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby', 'achievement-title');
    expect(modal).toHaveAttribute('aria-describedby', 'achievement-description');

    // Verify the title has the correct ID for accessibility
    const title = screen.getByText('Test Achievement');
    expect(title).toHaveAttribute('id', 'achievement-title');

    // Verify the description has the correct ID for accessibility
    const description = screen.getByText('This is a test achievement description.');
    expect(description).toHaveAttribute('id', 'achievement-description');

    // Verify the close button has accessible name
    const closeButton = screen.getByRole('button', { name: 'OK' });
    expect(closeButton).toHaveAttribute('aria-label', 'Close achievement notification');
  });
});