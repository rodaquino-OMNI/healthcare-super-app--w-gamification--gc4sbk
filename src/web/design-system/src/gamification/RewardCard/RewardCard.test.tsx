import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RewardCard from './RewardCard';
import { ThemeProvider } from '@design-system/primitives/themes';
import { JourneyProvider } from '@austa/journey-context';
import { Reward, RewardCategory, RewardStatus } from '@austa/interfaces/gamification/rewards';

// Helper function to render components with theme and journey context
const renderWithProviders = (ui: React.ReactElement, journey: 'health' | 'care' | 'plan' = 'health') => {
  return render(
    <JourneyProvider initialJourney={journey}>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </JourneyProvider>
  );
};

// Create a mock reward that satisfies both the component requirements and the Reward interface
const createMockReward = (overrides: Partial<Reward> = {}): Reward => ({
  id: 'test-reward',
  title: 'Weekly Goal Achieved',
  description: 'You completed your weekly step goal!',
  icon: 'trophy',
  xp: 100,
  journey: 'health',
  category: RewardCategory.VIRTUAL,
  status: RewardStatus.AVAILABLE,
  availableFrom: new Date(),
  availableUntil: null,
  redemptionLimit: null,
  ...overrides
});

describe('RewardCard', () => {
  it('renders reward information correctly', () => {
    const mockReward = createMockReward();

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
    const healthReward = createMockReward({
      id: 'health-reward',
      title: 'Health Reward',
      description: 'A health journey reward',
      icon: 'heart',
      journey: 'health',
    });
    
    renderWithProviders(
      <RewardCard reward={healthReward} testID="health-reward" />,
      'health'
    );
    
    const rewardCard = screen.getByTestId('health-reward');
    expect(rewardCard).toBeInTheDocument();
    expect(screen.getByText('Health Reward')).toBeInTheDocument();
    
    // Health journey should have specific styling (this would be better with a more specific test,
    // but we're checking that the component renders with the correct journey context)
    expect(rewardCard).toHaveStyle('border-color: var(--health-primary)');
  });

  it('applies journey-specific styling for care journey', () => {
    const careReward = createMockReward({
      id: 'care-reward',
      title: 'Care Reward',
      description: 'A care journey reward',
      icon: 'doctor',
      journey: 'care',
    });
    
    renderWithProviders(
      <RewardCard reward={careReward} testID="care-reward" />,
      'care'
    );
    
    const rewardCard = screen.getByTestId('care-reward');
    expect(rewardCard).toBeInTheDocument();
    expect(screen.getByText('Care Reward')).toBeInTheDocument();
    
    // Care journey should have specific styling
    expect(rewardCard).toHaveStyle('border-color: var(--care-primary)');
  });

  it('applies journey-specific styling for plan journey', () => {
    const planReward = createMockReward({
      id: 'plan-reward',
      title: 'Plan Reward',
      description: 'A plan journey reward',
      icon: 'document',
      journey: 'plan',
    });
    
    renderWithProviders(
      <RewardCard reward={planReward} testID="plan-reward" />,
      'plan'
    );
    
    const rewardCard = screen.getByTestId('plan-reward');
    expect(rewardCard).toBeInTheDocument();
    expect(screen.getByText('Plan Reward')).toBeInTheDocument();
    
    // Plan journey should have specific styling
    expect(rewardCard).toHaveStyle('border-color: var(--plan-primary)');
  });

  it('calls onPress callback when clicked', () => {
    const mockReward = createMockReward();
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
    const mockReward = createMockReward({
      title: 'Test Reward',
      description: 'A test reward',
    });
    
    renderWithProviders(
      <RewardCard reward={mockReward} testID="reward-card" />
    );
    
    // Check if the reward card has appropriate accessibility attributes
    const card = screen.getByTestId('reward-card');
    
    // The default accessibility label should include title, description, and XP
    expect(card).toHaveAttribute('aria-label', 'Test Reward reward. A test reward. Worth 100 XP.');
  });
  
  it('accepts custom accessibility label', () => {
    const mockReward = createMockReward();
    
    renderWithProviders(
      <RewardCard 
        reward={mockReward} 
        testID="reward-card" 
        accessibilityLabel="Custom accessibility label" 
      />
    );
    
    const card = screen.getByTestId('reward-card');
    expect(card).toHaveAttribute('aria-label', 'Custom accessibility label');
  });

  it('supports keyboard navigation when interactive', () => {
    const mockReward = createMockReward();
    const onPressMock = jest.fn();
    
    renderWithProviders(
      <RewardCard 
        reward={mockReward} 
        onPress={onPressMock} 
        testID="reward-card" 
      />
    );
    
    const card = screen.getByTestId('reward-card');
    
    // Check that the element is keyboard focusable
    expect(card).toHaveAttribute('tabIndex', '0');
    
    // Simulate keyboard Enter press
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(onPressMock).toHaveBeenCalledTimes(1);
    
    // Simulate keyboard Space press
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    expect(onPressMock).toHaveBeenCalledTimes(2);
  });

  it('does not trigger keyboard events when not interactive', () => {
    const mockReward = createMockReward();
    // No onPress provided, so not interactive
    
    renderWithProviders(
      <RewardCard 
        reward={mockReward} 
        testID="reward-card" 
      />
    );
    
    const card = screen.getByTestId('reward-card');
    
    // Non-interactive elements should not be keyboard focusable
    expect(card).not.toHaveAttribute('tabIndex', '0');
  });
});