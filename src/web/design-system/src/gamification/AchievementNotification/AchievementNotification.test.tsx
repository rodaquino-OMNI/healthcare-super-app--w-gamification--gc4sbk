import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // Version ^14.0.0
import { describe, it, expect, jest } from '@jest/globals'; // Version ^29.0.0
import { AchievementNotification } from './AchievementNotification';
import { Achievement } from '@austa/interfaces/gamification';
import { ThemeProvider } from 'styled-components';
import { themes } from '../../themes';

describe('AchievementNotification', () => {
  // Helper function to render the component with a specific journey theme
  const renderWithTheme = (achievement: Achievement, onClose = jest.fn()) => {
    return render(
      <ThemeProvider theme={themes[achievement.journey]}>
        <AchievementNotification achievement={achievement} onClose={onClose} />
      </ThemeProvider>
    );
  };

  it('renders correctly with achievement details', () => {
    // Define an achievement object with sample data using the Achievement interface
    const achievement: Achievement = {
      id: '123',
      title: 'Test Achievement',
      description: 'This is a test achievement description.',
      journey: 'health',
      icon: 'test-icon',
      progress: 100,
      total: 100,
      unlocked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Action: Render the AchievementNotification component with the achievement object
    renderWithTheme(achievement);

    // Assertion: Verify that the achievement title is displayed using the Text primitive
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();

    // Assertion: Verify that the achievement description is displayed using the Text primitive
    expect(screen.getByText('This is a test achievement description.')).toBeInTheDocument();

    // Assertion: Verify that the AchievementBadge component is rendered with the correct achievement data
    expect(screen.getByLabelText('Test Achievement achievement. This is a test achievement description. Unlocked')).toBeInTheDocument();

    // Assertion: Verify the OK button is rendered using the Button primitive
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('calls onClose when the OK button is clicked', () => {
    // Define an achievement object with sample data
    const achievement: Achievement = {
      id: '123',
      title: 'Test Achievement',
      description: 'This is a test achievement description.',
      journey: 'health',
      icon: 'test-icon',
      progress: 100,
      total: 100,
      unlocked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create a mock onClose function
    const onCloseMock = jest.fn();

    // Action: Render the AchievementNotification component with the achievement object and the mock onClose function
    renderWithTheme(achievement, onCloseMock);

    // Simulate a click on the OK button
    const okButton = screen.getByRole('button', { name: 'OK' });
    fireEvent.press(okButton);

    // Assertion: Verify that the onClose function is called
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('applies journey-specific theming based on achievement journey', () => {
    // Test with health journey
    const healthAchievement: Achievement = {
      id: '123',
      title: 'Health Achievement',
      description: 'This is a health achievement.',
      journey: 'health',
      icon: 'health-icon',
      progress: 100,
      total: 100,
      unlocked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { rerender } = renderWithTheme(healthAchievement);
    
    // Get the notification container and verify it has the health theme color
    const healthContainer = screen.getByTestId('achievement-notification-container');
    expect(healthContainer).toHaveStyle(`background-color: ${themes.health.colors.background.card}`);

    // Test with care journey
    const careAchievement: Achievement = {
      id: '456',
      title: 'Care Achievement',
      description: 'This is a care achievement.',
      journey: 'care',
      icon: 'care-icon',
      progress: 100,
      total: 100,
      unlocked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Re-render with care journey achievement
    rerender(
      <ThemeProvider theme={themes[careAchievement.journey]}>
        <AchievementNotification achievement={careAchievement} onClose={jest.fn()} />
      </ThemeProvider>
    );

    // Get the notification container and verify it has the care theme color
    const careContainer = screen.getByTestId('achievement-notification-container');
    expect(careContainer).toHaveStyle(`background-color: ${themes.care.colors.background.card}`);
  });

  it('has proper accessibility attributes', () => {
    const achievement: Achievement = {
      id: '123',
      title: 'Test Achievement',
      description: 'This is a test achievement description.',
      journey: 'health',
      icon: 'test-icon',
      progress: 100,
      total: 100,
      unlocked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    renderWithTheme(achievement);

    // Verify the notification has the correct role
    const notification = screen.getByRole('dialog');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveAttribute('aria-labelledby', 'achievement-title');
    expect(notification).toHaveAttribute('aria-describedby', 'achievement-description');

    // Verify the title has the correct ID for accessibility
    const title = screen.getByText('Test Achievement');
    expect(title).toHaveAttribute('id', 'achievement-title');

    // Verify the description has the correct ID for accessibility
    const description = screen.getByText('This is a test achievement description.');
    expect(description).toHaveAttribute('id', 'achievement-description');

    // Verify the OK button has the correct accessibility attributes
    const okButton = screen.getByRole('button', { name: 'OK' });
    expect(okButton).toHaveAttribute('aria-label', 'Close achievement notification');
  });
});