import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { AchievementBadge } from './AchievementBadge';
import { JourneyContextProvider } from '@austa/journey-context';
import { Achievement, JourneyType } from '@austa/interfaces/gamification';

// Mock the primitive components to verify they're used correctly
jest.mock('@design-system/primitives', () => ({
  Box: ({ children, testID, ...props }: any) => (
    <div data-testid={testID} data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  Text: ({ children, testID, ...props }: any) => (
    <span data-testid={testID} data-props={JSON.stringify(props)}>
      {children}
    </span>
  ),
  Stack: ({ children, testID, ...props }: any) => (
    <div data-testid={testID} data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  Icon: ({ name, testID, ...props }: any) => (
    <div data-testid={testID || `icon-${name}`} data-icon={name} data-props={JSON.stringify(props)} />
  ),
}));

describe('AchievementBadge', () => {
  // Sample achievement data for testing
  const createAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
    id: 'test-achievement',
    title: 'Test Achievement',
    description: 'This is a test achievement',
    icon: 'trophy',
    progress: 5,
    total: 10,
    unlocked: false,
    journey: 'health' as JourneyType,
    ...overrides,
  });

  it('renders correctly for locked achievement', () => {
    const achievement = createAchievement();
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Check the accessibility label contains the achievement title and progress info
    const badge = screen.getByLabelText(/Test Achievement.*Progress: 5 of 10/);
    expect(badge).toBeInTheDocument();
    
    // Check the progress ring is displayed with correct progress value
    const progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toBeInTheDocument();
    expect(progressRing).toHaveAttribute('aria-valuenow', '50');
    expect(progressRing).toHaveAttribute('aria-valuemin', '0');
    expect(progressRing).toHaveAttribute('aria-valuemax', '100');
    
    // Verify primitive components are used correctly
    const badgeContainer = screen.getByTestId('badge-container');
    expect(badgeContainer).toBeInTheDocument();
    const containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.borderColor).toBeDefined();
  });
  
  it('renders correctly for unlocked achievement', () => {
    const achievement = createAchievement({ unlocked: true, progress: 10 });
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Check the accessibility label contains the achievement title and unlocked status
    const badge = screen.getByLabelText(/Test Achievement.*Unlocked/);
    expect(badge).toBeInTheDocument();
    
    // Check the progress ring is not displayed for unlocked achievements
    expect(screen.queryByTestId('progress-ring')).not.toBeInTheDocument();
    
    // Check the unlocked indicator is displayed
    const unlockedIndicator = screen.getByTestId('unlocked-indicator');
    expect(unlockedIndicator).toBeInTheDocument();
    
    // Verify the icon is displayed
    const icon = screen.getByTestId(`icon-${achievement.icon}`);
    expect(icon).toBeInTheDocument();
    const iconProps = JSON.parse(icon.getAttribute('data-props') || '{}');
    expect(iconProps.color).toBeDefined();
  });
  
  it('applies journey-specific styling', () => {
    const healthAchievement = createAchievement({ journey: 'health' });
    const careAchievement = createAchievement({ journey: 'care' });
    const planAchievement = createAchievement({ journey: 'plan' });
    
    // First render with health journey
    const { rerender } = render(
      <AchievementBadge achievement={healthAchievement} />
    );
    
    // Check health journey specific styling (green color)
    let badgeContainer = screen.getByTestId('badge-container');
    let containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.borderColor).toMatch(/#0ACF83/i);
    
    // Re-render with care journey
    rerender(
      <AchievementBadge achievement={careAchievement} />
    );
    
    // Check care journey specific styling (orange color)
    badgeContainer = screen.getByTestId('badge-container');
    containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.borderColor).toMatch(/#FF8C42/i);
    
    // Re-render with plan journey
    rerender(
      <AchievementBadge achievement={planAchievement} />
    );
    
    // Check plan journey specific styling (blue color)
    badgeContainer = screen.getByTestId('badge-container');
    containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.borderColor).toMatch(/#007AFF/i);
  });
  
  it('integrates with journey context', () => {
    const achievement = createAchievement({ journey: 'health' });
    
    render(
      <JourneyContextProvider initialJourney="health">
        <AchievementBadge achievement={achievement} />
      </JourneyContextProvider>
    );
    
    // Verify the component uses the journey context
    const badgeContainer = screen.getByTestId('badge-container');
    const containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.borderColor).toMatch(/#0ACF83/i);
    
    // Check that the title has the correct styling
    const title = screen.getByText(achievement.title);
    expect(title).toBeInTheDocument();
    const titleProps = JSON.parse(title.getAttribute('data-props') || '{}');
    expect(titleProps.color).toBeDefined();
  });
  
  it('renders different size variants correctly', () => {
    const achievement = createAchievement();
    
    // Test small size
    const { rerender } = render(
      <AchievementBadge achievement={achievement} size="small" />
    );
    
    let badgeContainer = screen.getByTestId('badge-container');
    let containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.width).toBe('60px');
    expect(containerProps.height).toBe('60px');
    
    // Test medium size (default)
    rerender(
      <AchievementBadge achievement={achievement} size="medium" />
    );
    
    badgeContainer = screen.getByTestId('badge-container');
    containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.width).toBe('80px');
    expect(containerProps.height).toBe('80px');
    
    // Test large size
    rerender(
      <AchievementBadge achievement={achievement} size="large" />
    );
    
    badgeContainer = screen.getByTestId('badge-container');
    containerProps = JSON.parse(badgeContainer.getAttribute('data-props') || '{}');
    expect(containerProps.width).toBe('100px');
    expect(containerProps.height).toBe('100px');
  });
  
  it('displays different progress states correctly', () => {
    // Test 0% progress
    const zeroProgress = createAchievement({ progress: 0 });
    const { rerender } = render(
      <AchievementBadge achievement={zeroProgress} />
    );
    
    let progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toHaveAttribute('aria-valuenow', '0');
    
    // Test 50% progress
    const halfProgress = createAchievement({ progress: 5 });
    rerender(
      <AchievementBadge achievement={halfProgress} />
    );
    
    progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toHaveAttribute('aria-valuenow', '50');
    
    // Test 100% progress but not unlocked
    const fullProgress = createAchievement({ progress: 10, unlocked: false });
    rerender(
      <AchievementBadge achievement={fullProgress} />
    );
    
    progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toHaveAttribute('aria-valuenow', '100');
  });
  
  it('has proper accessibility attributes', () => {
    const achievement = createAchievement();
    
    render(<AchievementBadge achievement={achievement} />);
    
    // Check that the badge has proper role
    const badge = screen.getByRole('img', { name: /Test Achievement/ });
    expect(badge).toBeInTheDocument();
    
    // Check that the progress indicator has proper ARIA attributes
    const progressRing = screen.getByTestId('progress-ring');
    expect(progressRing).toHaveAttribute('role', 'progressbar');
    expect(progressRing).toHaveAttribute('aria-valuenow', '50');
    expect(progressRing).toHaveAttribute('aria-valuemin', '0');
    expect(progressRing).toHaveAttribute('aria-valuemax', '100');
    expect(progressRing).toHaveAttribute('aria-label', 'Achievement progress');
  });
  
  it('passes accessibility tests', async () => {
    const achievement = createAchievement();
    
    const { container } = render(<AchievementBadge achievement={achievement} />);
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('supports custom onClick handler', () => {
    const achievement = createAchievement();
    const handleClick = jest.fn();
    
    render(<AchievementBadge achievement={achievement} onClick={handleClick} />);
    
    // Find the clickable element
    const clickableElement = screen.getByTestId('badge-container');
    clickableElement.click();
    
    // Verify the click handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(achievement);
  });
  
  it('renders tooltip with achievement description on hover', () => {
    const achievement = createAchievement();
    
    render(<AchievementBadge achievement={achievement} showTooltip />);
    
    // Check that the tooltip content is available
    const tooltipContent = screen.getByText(achievement.description);
    expect(tooltipContent).toBeInTheDocument();
  });
});