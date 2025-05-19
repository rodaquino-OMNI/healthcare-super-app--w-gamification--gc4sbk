import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementNotification } from './AchievementNotification';
import { colors } from '@design-system/primitives/src/tokens';

// Mock styled-components to avoid styled-component specific issues in tests
jest.mock('./AchievementNotification.styles', () => {
  const originalModule = jest.requireActual('./AchievementNotification.styles');
  return {
    ...originalModule,
    ModalOverlay: ({ children, ...props }: any) => (
      <div data-testid="modal-overlay" {...props}>
        {children}
      </div>
    ),
    ModalContent: ({ children, journeyColor, ...props }: any) => (
      <div data-testid="modal-content" data-journey-color={journeyColor} {...props}>
        {children}
      </div>
    ),
    ModalTitle: ({ children, journeyColor, ...props }: any) => (
      <h2 data-testid="modal-title" data-journey-color={journeyColor} {...props}>
        {children}
      </h2>
    ),
    AchievementTitle: ({ children, ...props }: any) => (
      <h3 data-testid="achievement-title" {...props}>
        {children}
      </h3>
    ),
    AchievementDescription: ({ children, ...props }: any) => (
      <p data-testid="achievement-description" {...props}>
        {children}
      </p>
    ),
    DismissButton: ({ children, journeyColor, onClick, ...props }: any) => (
      <button 
        data-testid="dismiss-button" 
        data-journey-color={journeyColor} 
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    ),
    BadgeContainer: ({ children, ...props }: any) => (
      <div data-testid="badge-container" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock the journey-context hook
jest.mock('@austa/journey-context/src/hooks', () => ({
  useJourney: () => ({
    activeJourney: 'health',
  }),
}));

// Mock the AchievementBadge component
jest.mock('../AchievementBadge', () => ({
  AchievementBadge: (props: any) => (
    <div data-testid="achievement-badge">
      <div>Icon: {props.icon}</div>
      <div>Journey: {props.journey}</div>
      <div>Unlocked: {props.unlocked ? 'true' : 'false'}</div>
    </div>
  ),
}));

describe('AchievementNotification', () => {
  const mockAchievement = {
    id: '123',
    title: 'Test Achievement',
    description: 'This is a test achievement description',
    icon: 'trophy',
    journey: 'health',
    unlocked: true,
    progress: 100,
    total: 100,
  };

  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the achievement notification with correct content', () => {
    render(
      <AchievementNotification
        achievement={mockAchievement}
        onDismiss={mockOnDismiss}
      />
    );

    // Check if the title and description are rendered
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    expect(screen.getByText('This is a test achievement description')).toBeInTheDocument();
    
    // Check if the badge is rendered
    expect(screen.getByTestId('achievement-badge')).toBeInTheDocument();
    
    // Check if the OK button is rendered
    expect(screen.getByRole('button', { name: /close achievement notification/i })).toBeInTheDocument();
    
    // Check if the modal has the correct accessibility attributes
    const modal = screen.getByTestId('modal-overlay');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onDismiss when OK button is clicked', () => {
    render(
      <AchievementNotification
        achievement={mockAchievement}
        onDismiss={mockOnDismiss}
      />
    );

    // Click the OK button
    fireEvent.click(screen.getByRole('button', { name: /close achievement notification/i }));
    
    // Check if onDismiss was called
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render when isVisible is false', () => {
    render(
      <AchievementNotification
        achievement={mockAchievement}
        onDismiss={mockOnDismiss}
        isVisible={false}
      />
    );

    // Check that nothing is rendered
    expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Achievement')).not.toBeInTheDocument();
  });

  it('uses the achievement journey if provided', () => {
    const careAchievement = {
      ...mockAchievement,
      journey: 'care',
    };

    render(
      <AchievementNotification
        achievement={careAchievement}
        onDismiss={mockOnDismiss}
      />
    );

    // Check if the badge has the correct journey
    const badge = screen.getByTestId('achievement-badge');
    expect(badge).toHaveTextContent('Journey: care');
    
    // Check if the modal content has the correct journey color
    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveAttribute('data-journey-color', colors.journeys.care.primary);
  });

  it('falls back to activeJourney if achievement journey is not provided', () => {
    const noJourneyAchievement = {
      ...mockAchievement,
      journey: undefined,
    };

    render(
      <AchievementNotification
        achievement={noJourneyAchievement}
        onDismiss={mockOnDismiss}
      />
    );

    // Check if the badge has the fallback journey from useJourney
    const badge = screen.getByTestId('achievement-badge');
    expect(badge).toHaveTextContent('Journey: health');
    
    // Check if the modal content has the correct journey color
    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveAttribute('data-journey-color', colors.journeys.health.primary);
  });
});