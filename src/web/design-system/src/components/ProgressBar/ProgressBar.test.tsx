import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Platform } from 'react-native';

// Import from the new package structure
import { colors, spacing } from '@design-system/primitives';
import { ProgressBarProps } from '@austa/interfaces/components/core.types';
import ProgressBar from './ProgressBar';

// Import themes from the design system
import { healthTheme, careTheme, planTheme } from '../../themes';

// Mock Platform for testing platform-specific behavior
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn((obj) => obj.web),
  },
}));

/**
 * Helper function to render components with a specific theme
 */
const renderWithTheme = (ui: React.ReactElement, theme: object) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('ProgressBar', () => {
  it('renders correctly with default props', () => {
    renderWithTheme(
      <ProgressBar current={50} total={100} testId="progress-bar" />,
      healthTheme
    );
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    
    // Check that the progress fill element exists and has the correct width
    const fill = progressBar.firstChild as HTMLElement;
    expect(fill).toHaveStyle('width: 50%');
  });

  it('calculates percentage correctly', () => {
    renderWithTheme(
      <ProgressBar current={25} total={200} testId="progress-bar" />,
      healthTheme
    );
    
    const progressBar = screen.getByTestId('progress-bar');
    const fill = progressBar.firstChild as HTMLElement;
    
    // 25/200 = 12.5%
    expect(fill).toHaveStyle('width: 12.5%');
  });

  it('clamps progress to 0-100% range', () => {
    // Test with current > total (should clamp to 100%)
    renderWithTheme(
      <ProgressBar current={150} total={100} testId="progress-bar-over" />,
      healthTheme
    );
    
    const progressBarOver = screen.getByTestId('progress-bar-over');
    const fillOver = progressBarOver.firstChild as HTMLElement;
    expect(fillOver).toHaveStyle('width: 100%');
    
    // Test with negative current (should clamp to 0%)
    renderWithTheme(
      <ProgressBar current={-10} total={100} testId="progress-bar-under" />,
      healthTheme
    );
    
    const progressBarUnder = screen.getByTestId('progress-bar-under');
    const fillUnder = progressBarUnder.firstChild as HTMLElement;
    expect(fillUnder).toHaveStyle('width: 0%');
  });

  it('applies correct journey-specific styling for all themes', () => {
    // Health journey
    renderWithTheme(
      <ProgressBar current={50} total={100} journey="health" testId="health-progress" />,
      healthTheme
    );
    
    const healthProgress = screen.getByTestId('health-progress');
    const healthFill = healthProgress.firstChild as HTMLElement;
    expect(healthFill).toHaveStyle(`background-color: ${colors.journeys.health.primary}`);
    
    // Care journey
    renderWithTheme(
      <ProgressBar current={50} total={100} journey="care" testId="care-progress" />,
      careTheme
    );
    
    const careProgress = screen.getByTestId('care-progress');
    const careFill = careProgress.firstChild as HTMLElement;
    expect(careFill).toHaveStyle(`background-color: ${colors.journeys.care.primary}`);
    
    // Plan journey
    renderWithTheme(
      <ProgressBar current={50} total={100} journey="plan" testId="plan-progress" />,
      planTheme
    );
    
    const planProgress = screen.getByTestId('plan-progress');
    const planFill = planProgress.firstChild as HTMLElement;
    expect(planFill).toHaveStyle(`background-color: ${colors.journeys.plan.primary}`);
  });

  it('renders level indicators when showLevels is true', () => {
    renderWithTheme(
      <ProgressBar 
        current={60} 
        total={100} 
        showLevels={true} 
        levelMarkers={[25, 50, 75]} 
        testId="levels-progress" 
      />,
      healthTheme
    );
    
    const progressBar = screen.getByTestId('levels-progress');
    
    // Should have 3 level markers
    const markers = progressBar.querySelectorAll('[aria-hidden="true"]');
    expect(markers.length).toBe(3);
    
    // Check marker positions
    expect(markers[0]).toHaveStyle('left: 25%');
    expect(markers[1]).toHaveStyle('left: 50%');
    expect(markers[2]).toHaveStyle('left: 75%');
  });

  it('applies correct ARIA attributes for accessibility', () => {
    renderWithTheme(
      <ProgressBar 
        current={30} 
        total={100} 
        ariaLabel="Test progress" 
        testId="aria-progress" 
      />,
      healthTheme
    );
    
    const progressBar = screen.getByTestId('aria-progress');
    
    expect(progressBar).toHaveAttribute('role', 'progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '30');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Test progress');
  });

  it('applies custom className when provided', () => {
    renderWithTheme(
      <ProgressBar 
        current={50} 
        total={100} 
        className="custom-progress" 
        testId="class-progress" 
      />,
      healthTheme
    );
    
    const progressBar = screen.getByTestId('class-progress');
    expect(progressBar).toHaveClass('custom-progress');
  });

  it('renders with different sizes using spacing tokens', () => {
    // Small size
    renderWithTheme(
      <ProgressBar current={50} total={100} size="sm" testId="sm-progress" />,
      healthTheme
    );
    
    const smProgress = screen.getByTestId('sm-progress');
    expect(smProgress).toHaveStyle(`height: ${spacing.xs}`);
    
    // Medium size (default)
    renderWithTheme(
      <ProgressBar current={50} total={100} size="md" testId="md-progress" />,
      healthTheme
    );
    
    const mdProgress = screen.getByTestId('md-progress');
    expect(mdProgress).toHaveStyle(`height: ${spacing.sm}`);
    
    // Large size
    renderWithTheme(
      <ProgressBar current={50} total={100} size="lg" testId="lg-progress" />,
      healthTheme
    );
    
    const lgProgress = screen.getByTestId('lg-progress');
    expect(lgProgress).toHaveStyle(`height: ${spacing.md}`);
  });

  it('handles zero total value', () => {
    renderWithTheme(
      <ProgressBar current={50} total={0} testId="zero-progress" />,
      healthTheme
    );
    
    const progressBar = screen.getByTestId('zero-progress');
    const fill = progressBar.firstChild as HTMLElement;
    
    // When total is 0, progress should be 0%
    expect(fill).toHaveStyle('width: 0%');
  });

  it('adapts to platform-specific rendering', () => {
    // Mock Platform.OS as 'web'
    (Platform.OS as string) = 'web';
    
    renderWithTheme(
      <ProgressBar current={50} total={100} testId="web-progress" />,
      healthTheme
    );
    
    const webProgress = screen.getByTestId('web-progress');
    expect(webProgress).toBeInTheDocument();
    
    // Mock Platform.OS as 'ios'
    (Platform.OS as string) = 'ios';
    
    renderWithTheme(
      <ProgressBar current={50} total={100} testId="ios-progress" />,
      healthTheme
    );
    
    const iosProgress = screen.getByTestId('ios-progress');
    expect(iosProgress).toBeInTheDocument();
    
    // Reset Platform.OS to 'web' for other tests
    (Platform.OS as string) = 'web';
  });

  it('handles responsive behavior based on viewport size', () => {
    // Mock window.matchMedia for testing responsive behavior
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('(min-width: 768px)'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    renderWithTheme(
      <ProgressBar current={50} total={100} testId="responsive-progress" />,
      healthTheme
    );
    
    const responsiveProgress = screen.getByTestId('responsive-progress');
    expect(responsiveProgress).toBeInTheDocument();
    
    // Clean up mock
    delete (window as any).matchMedia;
  });
});