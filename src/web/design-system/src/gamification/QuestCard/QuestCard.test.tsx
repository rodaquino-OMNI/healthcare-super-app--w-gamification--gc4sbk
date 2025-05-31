import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
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
  ProgressBar: ({ current, total, journey, ariaLabel, ...props }) => (
    <div 
      data-testid="progress-bar"
      data-current={current}
      data-total={total}
      data-journey={journey}
      aria-label={ariaLabel}
      {...props}
    >
      <div 
        data-testid="progress-fill"
        style={{ width: `${Math.min(Math.round((current / total) * 100), 100)}%` }}
      />
    </div>
  ),
}));

// Mock the Text component
jest.mock('../../primitives/Text/Text', () => ({
  Text: ({ children, journey, fontSize, fontWeight, color, ...props }) => (
    <span 
      data-testid="text"
      data-journey={journey}
      data-font-size={fontSize}
      data-font-weight={fontWeight}
      data-color={color}
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
  AchievementBadge: ({ achievement, size, ...props }) => (
    <div 
      data-testid="achievement-badge"
      data-achievement-id={achievement.id}
      data-achievement-title={achievement.title}
      data-size={size}
      {...props}
    />
  ),
}));

// Mock the useJourneyTheme hook
jest.mock('src/web/design-system/src/themes/index', () => ({
  useJourneyTheme: (journey) => {
    if (journey === 'health') {
      return { primary: '#0ACF83', secondary: '#A7F3D0' };
    } else if (journey === 'care') {
      return { primary: '#FF8C42', secondary: '#FFBB94' };
    } else if (journey === 'plan') {
      return { primary: '#3B82F6', secondary: '#93C5FD' };
    }
    return { primary: '#6366F1', secondary: '#A5B4FC' }; // Default
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

// Sample quest data for testing
const mockQuest = {
  id: 'quest-123',
  title: 'Complete Health Profile',
  description: 'Fill out all sections of your health profile',
  icon: 'clipboard-list',
  progress: 3,
  total: 5,
  journey: 'health'
};

const mockCompletedQuest = {
  ...mockQuest,
  progress: 5
};

describe('QuestCard', () => {
  it('renders correctly with default props', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    // Check that the card renders with correct content
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Complete Health Profile')).toBeInTheDocument();
    expect(screen.getByText('Fill out all sections of your health profile')).toBeInTheDocument();
    expect(screen.getByText('3 of 5 completed')).toBeInTheDocument();
    
    // Check that the icon is rendered with correct props
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-name', 'clipboard-list');
    expect(icon).toHaveAttribute('data-color', '#0ACF83'); // Health journey primary color
    
    // Check that the progress bar is rendered with correct props
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-current', '3');
    expect(progressBar).toHaveAttribute('data-total', '5');
    expect(progressBar).toHaveAttribute('data-journey', 'health');
    
    // Achievement badge should not be rendered for incomplete quest
    expect(screen.queryByTestId('achievement-badge')).not.toBeInTheDocument();
  });
  
  it('renders achievement badge when quest is completed', () => {
    renderWithTheme(<QuestCard quest={mockCompletedQuest} />);
    
    // Achievement badge should be rendered for completed quest
    const badge = screen.getByTestId('achievement-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-achievement-id', 'quest-123');
    expect(badge).toHaveAttribute('data-achievement-title', 'Complete Health Profile');
    expect(badge).toHaveAttribute('data-size', 'sm');
  });
  
  it('applies health journey theme correctly', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />, healthTheme);
    
    // Check journey-specific attributes
    expect(screen.getByTestId('card')).toHaveAttribute('data-journey', 'health');
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-journey', 'health');
    
    // Check that the icon has the health journey primary color
    expect(screen.getByTestId('icon')).toHaveAttribute('data-color', '#0ACF83');
  });
  
  it('applies care journey theme correctly', () => {
    const careQuest = { ...mockQuest, journey: 'care' };
    renderWithTheme(<QuestCard quest={careQuest} />, careTheme);
    
    // Check journey-specific attributes
    expect(screen.getByTestId('card')).toHaveAttribute('data-journey', 'care');
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-journey', 'care');
    
    // Check that the icon has the care journey primary color
    expect(screen.getByTestId('icon')).toHaveAttribute('data-color', '#FF8C42');
  });
  
  it('applies plan journey theme correctly', () => {
    const planQuest = { ...mockQuest, journey: 'plan' };
    renderWithTheme(<QuestCard quest={planQuest} />, planTheme);
    
    // Check journey-specific attributes
    expect(screen.getByTestId('card')).toHaveAttribute('data-journey', 'plan');
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-journey', 'plan');
    
    // Check that the icon has the plan journey primary color
    expect(screen.getByTestId('icon')).toHaveAttribute('data-color', '#3B82F6');
  });
  
  it('calculates progress percentage correctly', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    // Progress is 3/5 = 60%
    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveStyle('width: 60%');
    
    // Test with a different progress value
    const partialQuest = { ...mockQuest, progress: 2 };
    const { rerender } = renderWithTheme(<QuestCard quest={partialQuest} />);
    
    // Progress is 2/5 = 40%
    expect(screen.getByTestId('progress-fill')).toHaveStyle('width: 40%');
    
    // Test with progress > total (should cap at 100%)
    const overProgressQuest = { ...mockQuest, progress: 7 };
    rerender(<QuestCard quest={overProgressQuest} />);
    
    // Progress should be capped at 100%
    expect(screen.getByTestId('progress-fill')).toHaveStyle('width: 100%');
  });
  
  it('handles click events', () => {
    const handlePress = jest.fn();
    renderWithTheme(<QuestCard quest={mockQuest} onPress={handlePress} />);
    
    const card = screen.getByTestId('card');
    fireEvent.click(card);
    
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
  
  it('applies correct accessibility attributes', () => {
    renderWithTheme(<QuestCard quest={mockQuest} />);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('aria-label', 'Complete Health Profile quest. Fill out all sections of your health profile. Progress: 3 of 5.');
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('aria-label', 'Quest progress: 60%');
  });
  
  it('renders with different progress states', () => {
    // Test with zero progress
    const zeroProgressQuest = { ...mockQuest, progress: 0 };
    const { rerender } = renderWithTheme(<QuestCard quest={zeroProgressQuest} />);
    
    expect(screen.getByText('0 of 5 completed')).toBeInTheDocument();
    expect(screen.getByTestId('progress-fill')).toHaveStyle('width: 0%');
    expect(screen.queryByTestId('achievement-badge')).not.toBeInTheDocument();
    
    // Test with partial progress
    rerender(<QuestCard quest={mockQuest} />);
    
    expect(screen.getByText('3 of 5 completed')).toBeInTheDocument();
    expect(screen.getByTestId('progress-fill')).toHaveStyle('width: 60%');
    expect(screen.queryByTestId('achievement-badge')).not.toBeInTheDocument();
    
    // Test with complete progress
    rerender(<QuestCard quest={mockCompletedQuest} />);
    
    expect(screen.getByText('5 of 5 completed')).toBeInTheDocument();
    expect(screen.getByTestId('progress-fill')).toHaveStyle('width: 100%');
    expect(screen.getByTestId('achievement-badge')).toBeInTheDocument();
  });
  
  it('handles edge cases with zero total', () => {
    // Test with zero total (should prevent division by zero)
    const zeroTotalQuest = { ...mockQuest, total: 0, progress: 0 };
    renderWithTheme(<QuestCard quest={zeroTotalQuest} />);
    
    // Progress should be 0% to avoid division by zero
    expect(screen.getByTestId('progress-fill')).toHaveStyle('width: 0%');
    expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
  });
});