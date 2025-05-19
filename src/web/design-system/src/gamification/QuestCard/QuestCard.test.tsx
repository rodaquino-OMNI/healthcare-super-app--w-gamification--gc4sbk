import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QuestCard } from './QuestCard';
import { baseTheme } from '../../themes/base.theme';
import { healthTheme } from '../../themes/health.theme';
import { careTheme } from '../../themes/care.theme';
import { planTheme } from '../../themes/plan.theme';

// Mock the Card component
jest.mock('../../components/Card/Card', () => ({
  Card: ({ children, journey, onPress, accessibilityLabel, ...props }) => (
    <div 
      data-testid="card" 
      data-journey={journey}
      onClick={onPress}
      aria-label={accessibilityLabel}
      {...props}
    >
      {children}
    </div>
  ),
}));

// Mock the ProgressBar component
jest.mock('../../components/ProgressBar/ProgressBar', () => ({
  ProgressBar: ({ current, total, journey, size, ariaLabel }) => (
    <div 
      data-testid="progress-bar"
      data-current={current}
      data-total={total}
      data-journey={journey}
      data-size={size}
      aria-label={ariaLabel}
    />
  ),
}));

// Mock the Text component
jest.mock('../../primitives/Text/Text', () => ({
  Text: ({ children, fontWeight, fontSize, journey, color, style, ...props }) => (
    <span 
      data-testid="text"
      data-font-weight={fontWeight}
      data-font-size={fontSize}
      data-journey={journey}
      data-color={color}
      style={style}
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock the Icon component
jest.mock('../../primitives/Icon/Icon', () => ({
  Icon: ({ name, size, color, ...props }) => (
    <span 
      data-testid="icon"
      data-name={name}
      data-size={size}
      data-color={color}
      {...props}
    />
  ),
}));

// Mock the AchievementBadge component
jest.mock('../AchievementBadge/AchievementBadge', () => ({
  AchievementBadge: ({ achievement, size }) => (
    <div 
      data-testid="achievement-badge"
      data-achievement-id={achievement.id}
      data-achievement-title={achievement.title}
      data-size={size}
    />
  ),
}));

// Mock the useJourneyTheme hook
jest.mock('src/web/design-system/src/themes/index', () => ({
  useJourneyTheme: (journey) => {
    if (journey === 'health') {
      return { primary: '#0ACF83', secondary: '#E8F9F1' };
    } else if (journey === 'care') {
      return { primary: '#FF8C42', secondary: '#FFF1E8' };
    } else if (journey === 'plan') {
      return { primary: '#4285F4', secondary: '#E8F1FF' };
    }
    return { primary: '#6E41E2', secondary: '#F0EBFF' }; // Default theme
  },
}));

/**
 * Helper function to render a component with a specific theme
 */
const renderWithTheme = (ui: React.ReactElement, theme = baseTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('QuestCard', () => {
  // Sample quest data for testing
  const mockQuest = {
    id: 'quest-123',
    title: 'Complete Your Profile',
    description: 'Fill out all sections of your health profile',
    icon: 'user-profile',
    progress: 3,
    total: 5,
    journey: 'health'
  };

  const mockCompletedQuest = {
    ...mockQuest,
    progress: 5,
  };

  it('renders correctly with quest details', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    // Check if the card is rendered
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    
    // Check if the quest title is rendered
    expect(screen.getByText(mockQuest.title)).toBeInTheDocument();
    
    // Check if the quest description is rendered
    expect(screen.getByText(mockQuest.description)).toBeInTheDocument();
    
    // Check if the icon is rendered with correct name
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-name', mockQuest.icon);
    
    // Check if the progress bar is rendered with correct values
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-current', mockQuest.progress.toString());
    expect(progressBar).toHaveAttribute('data-total', mockQuest.total.toString());
    
    // Check if the progress text is rendered
    expect(screen.getByText(`${mockQuest.progress} of ${mockQuest.total} completed`)).toBeInTheDocument();
  });

  it('applies journey-specific styling for health journey', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    // Check if the card has the correct journey attribute
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-journey', 'health');
    
    // Check if the progress bar has the correct journey attribute
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-journey', 'health');
    
    // Check if the icon has the correct color (health primary color)
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-color', '#0ACF83');
  });

  it('applies journey-specific styling for care journey', () => {
    const careQuest = { ...mockQuest, journey: 'care' };
    renderWithTheme(<QuestCard quest={careQuest} />);
    
    // Check if the card has the correct journey attribute
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-journey', 'care');
    
    // Check if the progress bar has the correct journey attribute
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-journey', 'care');
    
    // Check if the icon has the correct color (care primary color)
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-color', '#FF8C42');
  });

  it('applies journey-specific styling for plan journey', () => {
    const planQuest = { ...mockQuest, journey: 'plan' };
    renderWithTheme(<QuestCard quest={planQuest} />);
    
    // Check if the card has the correct journey attribute
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-journey', 'plan');
    
    // Check if the progress bar has the correct journey attribute
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-journey', 'plan');
    
    // Check if the icon has the correct color (plan primary color)
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-color', '#4285F4');
  });

  it('calculates progress percentage correctly', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    // Calculate expected progress percentage
    const expectedPercentage = Math.min(Math.round((mockQuest.progress / mockQuest.total) * 100), 100);
    
    // Check if the progress bar aria-label contains the correct percentage
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('aria-label', `Quest progress: ${expectedPercentage}%`);
  });

  it('shows achievement badge when quest is completed', () => {
    renderWithTheme(<QuestCard quest={mockCompletedQuest} />);
    
    // Check if the achievement badge is rendered
    const achievementBadge = screen.getByTestId('achievement-badge');
    expect(achievementBadge).toBeInTheDocument();
    expect(achievementBadge).toHaveAttribute('data-achievement-id', mockCompletedQuest.id);
    expect(achievementBadge).toHaveAttribute('data-achievement-title', mockCompletedQuest.title);
    expect(achievementBadge).toHaveAttribute('data-size', 'sm');
  });

  it('does not show achievement badge when quest is not completed', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    // Check that the achievement badge is not rendered
    expect(screen.queryByTestId('achievement-badge')).not.toBeInTheDocument();
  });

  it('calls onPress callback when clicked', () => {
    const onPressMock = jest.fn();
    renderWithTheme(<QuestCard quest={mockQuest} onPress={onPressMock} />);
    
    // Click the card
    const card = screen.getByTestId('card');
    fireEvent.click(card);
    
    // Check if the onPress callback was called
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    // Check if the card has the correct accessibility label
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('aria-label', 
      `${mockQuest.title} quest. ${mockQuest.description}. Progress: ${mockQuest.progress} of ${mockQuest.total}.`
    );
    
    // Check if the progress bar has the correct aria-label
    const progressBar = screen.getByTestId('progress-bar');
    const expectedPercentage = Math.min(Math.round((mockQuest.progress / mockQuest.total) * 100), 100);
    expect(progressBar).toHaveAttribute('aria-label', `Quest progress: ${expectedPercentage}%`);
    
    // Check if the icon is marked as decorative
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('handles edge case with 0 total progress', () => {
    const zeroTotalQuest = { ...mockQuest, total: 0, progress: 0 };
    renderWithTheme(<QuestCard quest={zeroTotalQuest} />);
    
    // Should not crash and should display 0 of 0 completed
    expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
    
    // Progress percentage should be 0 or 100 (depending on implementation)
    const progressBar = screen.getByTestId('progress-bar');
    const ariaLabel = progressBar.getAttribute('aria-label');
    expect(ariaLabel === 'Quest progress: 0%' || ariaLabel === 'Quest progress: 100%').toBeTruthy();
  });

  it('handles edge case with progress exceeding total', () => {
    const excessProgressQuest = { ...mockQuest, total: 5, progress: 10 };
    renderWithTheme(<QuestCard quest={excessProgressQuest} />);
    
    // Should display the actual values
    expect(screen.getByText('10 of 5 completed')).toBeInTheDocument();
    
    // Progress percentage should be capped at 100%
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('aria-label', 'Quest progress: 100%');
    
    // Achievement badge should be shown
    expect(screen.getByTestId('achievement-badge')).toBeInTheDocument();
  });
});