import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import ProgressBar from './ProgressBar';
// Updated imports to use @design-system/primitives for theme tokens
import { colors, spacing } from '@design-system/primitives';
// Updated imports to use types from @austa/interfaces
import type { JourneyTheme } from '@austa/interfaces/components';

/**
 * Mock themes using primitives from @design-system/primitives
 */
const mockThemes = {
  healthTheme: {
    colors: {
      journeys: {
        health: {
          primary: colors.journeys.health.primary,
          secondary: colors.journeys.health.secondary
        },
        care: {
          primary: colors.journeys.care.primary,
          secondary: colors.journeys.care.secondary
        },
        plan: {
          primary: colors.journeys.plan.primary,
          secondary: colors.journeys.plan.secondary
        }
      },
      neutral: {
        gray200: colors.neutral.gray200
      },
      brand: {
        primary: colors.brand.primary,
        secondary: colors.brand.secondary
      }
    },
    spacing: {
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md
    },
    borderRadius: {
      md: '4px'
    }
  },
  careTheme: {
    colors: {
      journeys: {
        health: {
          primary: colors.journeys.health.primary,
          secondary: colors.journeys.health.secondary
        },
        care: {
          primary: colors.journeys.care.primary,
          secondary: colors.journeys.care.secondary
        },
        plan: {
          primary: colors.journeys.plan.primary,
          secondary: colors.journeys.plan.secondary
        }
      },
      neutral: {
        gray200: colors.neutral.gray200
      },
      brand: {
        primary: colors.brand.primary,
        secondary: colors.brand.secondary
      }
    },
    spacing: {
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md
    },
    borderRadius: {
      md: '4px'
    }
  },
  planTheme: {
    colors: {
      journeys: {
        health: {
          primary: colors.journeys.health.primary,
          secondary: colors.journeys.health.secondary
        },
        care: {
          primary: colors.journeys.care.primary,
          secondary: colors.journeys.care.secondary
        },
        plan: {
          primary: colors.journeys.plan.primary,
          secondary: colors.journeys.plan.secondary
        }
      },
      neutral: {
        gray200: colors.neutral.gray200
      },
      brand: {
        primary: colors.brand.primary,
        secondary: colors.brand.secondary
      }
    },
    spacing: {
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md
    },
    borderRadius: {
      md: '4px'
    }
  }
};

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
      mockThemes.healthTheme
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
      mockThemes.healthTheme
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
      mockThemes.healthTheme
    );
    
    const progressBarOver = screen.getByTestId('progress-bar-over');
    const fillOver = progressBarOver.firstChild as HTMLElement;
    expect(fillOver).toHaveStyle('width: 100%');
    
    // Test with negative current (should clamp to 0%)
    renderWithTheme(
      <ProgressBar current={-10} total={100} testId="progress-bar-under" />,
      mockThemes.healthTheme
    );
    
    const progressBarUnder = screen.getByTestId('progress-bar-under');
    const fillUnder = progressBarUnder.firstChild as HTMLElement;
    expect(fillUnder).toHaveStyle('width: 0%');
  });

  it('applies correct journey-specific styling', () => {
    // Health journey
    renderWithTheme(
      <ProgressBar current={50} total={100} journey="health" testId="health-progress" />,
      mockThemes.healthTheme
    );
    
    const healthProgress = screen.getByTestId('health-progress');
    const healthFill = healthProgress.firstChild as HTMLElement;
    expect(healthFill).toHaveStyle(`background-color: ${colors.journeys.health.primary}`);
    
    // Care journey
    renderWithTheme(
      <ProgressBar current={50} total={100} journey="care" testId="care-progress" />,
      mockThemes.careTheme
    );
    
    const careProgress = screen.getByTestId('care-progress');
    const careFill = careProgress.firstChild as HTMLElement;
    expect(careFill).toHaveStyle(`background-color: ${colors.journeys.care.primary}`);
    
    // Plan journey
    renderWithTheme(
      <ProgressBar current={50} total={100} journey="plan" testId="plan-progress" />,
      mockThemes.planTheme
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
      mockThemes.healthTheme
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

  it('applies correct ARIA attributes', () => {
    renderWithTheme(
      <ProgressBar 
        current={30} 
        total={100} 
        ariaLabel="Test progress" 
        testId="aria-progress" 
      />,
      mockThemes.healthTheme
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
      mockThemes.healthTheme
    );
    
    const progressBar = screen.getByTestId('class-progress');
    expect(progressBar).toHaveClass('custom-progress');
  });

  it('renders with different sizes', () => {
    // Small size
    renderWithTheme(
      <ProgressBar current={50} total={100} size="sm" testId="sm-progress" />,
      mockThemes.healthTheme
    );
    
    const smProgress = screen.getByTestId('sm-progress');
    expect(smProgress).toHaveStyle(`height: ${spacing.xs}`);
    
    // Medium size (default)
    renderWithTheme(
      <ProgressBar current={50} total={100} size="md" testId="md-progress" />,
      mockThemes.healthTheme
    );
    
    const mdProgress = screen.getByTestId('md-progress');
    expect(mdProgress).toHaveStyle(`height: ${spacing.sm}`);
    
    // Large size
    renderWithTheme(
      <ProgressBar current={50} total={100} size="lg" testId="lg-progress" />,
      mockThemes.healthTheme
    );
    
    const lgProgress = screen.getByTestId('lg-progress');
    expect(lgProgress).toHaveStyle(`height: ${spacing.md}`);
  });

  it('handles zero total value', () => {
    renderWithTheme(
      <ProgressBar current={50} total={0} testId="zero-progress" />,
      mockThemes.healthTheme
    );
    
    const progressBar = screen.getByTestId('zero-progress');
    const fill = progressBar.firstChild as HTMLElement;
    
    // When total is 0, progress should be 0%
    expect(fill).toHaveStyle('width: 0%');
  });

  // New test for responsive behavior
  it('maintains consistent styling across different themes', () => {
    // Render with health theme
    const { unmount: unmountHealth } = renderWithTheme(
      <ProgressBar current={50} total={100} testId="theme-progress" />,
      mockThemes.healthTheme
    );
    
    const healthProgress = screen.getByTestId('theme-progress');
    expect(healthProgress).toHaveStyle(`background-color: ${colors.neutral.gray200}`);
    unmountHealth();
    
    // Render with care theme
    const { unmount: unmountCare } = renderWithTheme(
      <ProgressBar current={50} total={100} testId="theme-progress" />,
      mockThemes.careTheme
    );
    
    const careProgress = screen.getByTestId('theme-progress');
    expect(careProgress).toHaveStyle(`background-color: ${colors.neutral.gray200}`);
    unmountCare();
    
    // Render with plan theme
    renderWithTheme(
      <ProgressBar current={50} total={100} testId="theme-progress" />,
      mockThemes.planTheme
    );
    
    const planProgress = screen.getByTestId('theme-progress');
    expect(planProgress).toHaveStyle(`background-color: ${colors.neutral.gray200}`);
  });

  // New test for platform-specific rendering
  it('uses correct ARIA attributes for accessibility across platforms', () => {
    renderWithTheme(
      <ProgressBar 
        current={75} 
        total={100} 
        testId="platform-progress" 
      />,
      mockThemes.healthTheme
    );
    
    const progressBar = screen.getByTestId('platform-progress');
    
    // Check that all required ARIA attributes are present for screen readers
    expect(progressBar).toHaveAttribute('role', 'progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label'); // Should have some aria-label
  });

  // New test for journey-specific marker colors
  it('applies correct journey-specific colors to level markers', () => {
    // Health journey markers
    renderWithTheme(
      <ProgressBar 
        current={60} 
        total={100} 
        journey="health"
        showLevels={true} 
        levelMarkers={[50]} 
        testId="health-marker-progress" 
      />,
      mockThemes.healthTheme
    );
    
    const healthMarker = screen.getByTestId('health-marker-progress').querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(healthMarker).toHaveStyle(`background-color: ${colors.journeys.health.secondary}`);
    
    // Care journey markers
    renderWithTheme(
      <ProgressBar 
        current={60} 
        total={100} 
        journey="care"
        showLevels={true} 
        levelMarkers={[50]} 
        testId="care-marker-progress" 
      />,
      mockThemes.careTheme
    );
    
    const careMarker = screen.getByTestId('care-marker-progress').querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(careMarker).toHaveStyle(`background-color: ${colors.journeys.care.secondary}`);
    
    // Plan journey markers
    renderWithTheme(
      <ProgressBar 
        current={60} 
        total={100} 
        journey="plan"
        showLevels={true} 
        levelMarkers={[50]} 
        testId="plan-marker-progress" 
      />,
      mockThemes.planTheme
    );
    
    const planMarker = screen.getByTestId('plan-marker-progress').querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(planMarker).toHaveStyle(`background-color: ${colors.journeys.plan.secondary}`);
  });
});