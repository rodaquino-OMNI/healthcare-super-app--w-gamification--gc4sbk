import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RewardCard from './RewardCard';
import { ThemeProvider } from '@design-system/primitives/themes';
import { JourneyProvider } from '@austa/journey-context';
import { Reward } from '@austa/interfaces/gamification/rewards';

// Helper function to render components with theme and journey context
const renderWithProviders = (ui: React.ReactElement, journey: 'health' | 'care' | 'plan' = 'health') => {
  return render(
    <ThemeProvider>
      <JourneyProvider initialJourney={journey}>
        {ui}
      </JourneyProvider>
    </ThemeProvider>
  );
};

describe('RewardCard', () => {
  it('renders reward information correctly', () => {
    const mockReward: Reward = {
      id: 'test-reward',
      title: 'Weekly Goal Achieved',
      description: 'You completed your weekly step goal!',
      icon: 'trophy',
      xp: 100,
      journey: 'health',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    renderWithProviders(
      <RewardCard reward={mockReward} testID="reward-card" />
    );

    // Check if the reward title is rendered
    expect(screen.getByText('Weekly Goal Achieved')).toBeInTheDocument();
    
    // Check if the reward description is rendered
    expect(screen.getByText('You completed your weekly step goal!')).toBeInTheDocument();
    
    // Check if the XP value is rendered
    expect(screen.getByText('+100 XP')).toBeInTheDocument();
    
    // Check if the icon is rendered (through aria-hidden attribute)
    const iconElement = screen.getByTestId('icon-container');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies journey-specific styling for health journey', () => {
    const healthReward: Reward = {
      id: 'health-reward',
      title: 'Health Reward',
      description: 'A health journey reward',
      icon: 'heart',
      xp: 50,
      journey: 'health',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    renderWithProviders(
      <RewardCard reward={healthReward} testID="health-reward" />,
      'health'
    );
    
    const rewardCard = screen.getByTestId('health-reward');
    expect(rewardCard).toBeInTheDocument();
    expect(screen.getByText('Health Reward')).toBeInTheDocument();
    
    // We can't directly test CSS properties with React Testing Library
    // but we can verify the journey-specific class is applied
    expect(rewardCard).toHaveAttribute('data-journey', 'health');
  });

  it('applies journey-specific styling for care journey', () => {
    const careReward: Reward = {
      id: 'care-reward',
      title: 'Care Reward',
      description: 'A care journey reward',
      icon: 'doctor',
      xp: 75,
      journey: 'care',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    renderWithProviders(
      <RewardCard reward={careReward} testID="care-reward" />,
      'care'
    );
    
    const rewardCard = screen.getByTestId('care-reward');
    expect(rewardCard).toBeInTheDocument();
    expect(screen.getByText('Care Reward')).toBeInTheDocument();
    
    // Verify journey-specific attribute
    expect(rewardCard).toHaveAttribute('data-journey', 'care');
  });

  it('applies journey-specific styling for plan journey', () => {
    const planReward: Reward = {
      id: 'plan-reward',
      title: 'Plan Reward',
      description: 'A plan journey reward',
      icon: 'document',
      xp: 100,
      journey: 'plan',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    renderWithProviders(
      <RewardCard reward={planReward} testID="plan-reward" />,
      'plan'
    );
    
    const rewardCard = screen.getByTestId('plan-reward');
    expect(rewardCard).toBeInTheDocument();
    expect(screen.getByText('Plan Reward')).toBeInTheDocument();
    
    // Verify journey-specific attribute
    expect(rewardCard).toHaveAttribute('data-journey', 'plan');
  });

  it('calls onPress callback when clicked', () => {
    const mockReward: Reward = {
      id: 'test-reward',
      title: 'Test Reward',
      description: 'A test reward',
      icon: 'trophy',
      xp: 100,
      journey: 'health',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const onPressMock = jest.fn();
    
    renderWithProviders(
      <RewardCard reward={mockReward} onPress={onPressMock} testID="reward-card" />
    );
    
    // Click the reward card
    fireEvent.click(screen.getByTestId('reward-card'));
    
    // Check if the onPress callback was called
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders with default accessibility attributes', () => {
    const mockReward: Reward = {
      id: 'test-reward',
      title: 'Test Reward',
      description: 'A test reward',
      icon: 'trophy',
      xp: 100,
      journey: 'health',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    renderWithProviders(
      <RewardCard reward={mockReward} testID="reward-card" />
    );
    
    // Check if the reward card has appropriate accessibility attributes
    const card = screen.getByTestId('reward-card');
    
    // The default accessibility label should include title, description, and XP
    expect(card).toHaveAttribute('aria-label', 'Test Reward reward. A test reward. Worth 100 XP.');
  });

  it('renders with custom accessibility attributes', () => {
    const mockReward: Reward = {
      id: 'test-reward',
      title: 'Test Reward',
      description: 'A test reward',
      icon: 'trophy',
      xp: 100,
      journey: 'health',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    renderWithProviders(
      <RewardCard 
        reward={mockReward} 
        testID="reward-card" 
        accessibilityLabel="Custom accessibility label" 
      />
    );
    
    const cardWithCustomLabel = screen.getByTestId('reward-card');
    expect(cardWithCustomLabel).toHaveAttribute('aria-label', 'Custom accessibility label');
  });

  it('supports keyboard navigation for accessibility', () => {
    const mockReward: Reward = {
      id: 'test-reward',
      title: 'Test Reward',
      description: 'A test reward',
      icon: 'trophy',
      xp: 100,
      journey: 'health',
      status: 'available',
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const onPressMock = jest.fn();
    
    renderWithProviders(
      <RewardCard reward={mockReward} onPress={onPressMock} testID="reward-card" />
    );
    
    // Get the reward card element
    const card = screen.getByTestId('reward-card');
    
    // Simulate keyboard Enter key press
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    
    // Check if the onPress callback was called
    expect(onPressMock).toHaveBeenCalledTimes(1);
    
    // Simulate keyboard Space key press
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    
    // Check if the onPress callback was called again
    expect(onPressMock).toHaveBeenCalledTimes(2);
  });

  it('displays reward status when available', () => {
    const mockReward: Reward = {
      id: 'test-reward',
      title: 'Test Reward',
      description: 'A test reward',
      icon: 'trophy',
      xp: 100,
      journey: 'health',
      status: 'redeemed',  // Testing with redeemed status
      category: 'achievement',
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    renderWithProviders(
      <RewardCard reward={mockReward} testID="reward-card" />
    );
    
    // Check if the reward status is displayed
    expect(screen.getByText('Redeemed')).toBeInTheDocument();
  });
});