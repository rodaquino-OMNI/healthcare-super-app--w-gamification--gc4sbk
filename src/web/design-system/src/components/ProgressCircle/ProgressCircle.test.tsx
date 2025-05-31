import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ProgressCircle } from './ProgressCircle';
import { baseTheme } from '../../../themes/baseTheme';
import { healthTheme } from '../../../themes/healthTheme';
import { careTheme } from '../../../themes/careTheme';
import { planTheme } from '../../../themes/planTheme';

// Custom render function that wraps component with ThemeProvider
const renderWithTheme = (ui: React.ReactElement, theme = baseTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('ProgressCircle', () => {
  // Test rendering with default properties
  it('renders with default properties', () => {
    renderWithTheme(<ProgressCircle progress={50} data-testid="progress-circle" />);
    
    const progressCircle = screen.getByTestId('progress-circle');
    expect(progressCircle).toBeInTheDocument();
    expect(progressCircle).toHaveAttribute('aria-valuenow', '50');
    expect(progressCircle).toHaveAttribute('aria-valuemin', '0');
    expect(progressCircle).toHaveAttribute('aria-valuemax', '100');
  });

  // Test custom size
  it('renders with custom size', () => {
    renderWithTheme(<ProgressCircle progress={50} size="128px" data-testid="progress-circle" />);
    
    const progressCircle = screen.getByTestId('progress-circle');
    expect(progressCircle).toHaveStyle('width: 128px');
    expect(progressCircle).toHaveStyle('height: 128px');
  });

  // Test progress value normalization
  it('normalizes progress values to be between 0 and 100', () => {
    // Test with value below 0
    renderWithTheme(<ProgressCircle progress={-20} data-testid="progress-circle-below" />);
    expect(screen.getByTestId('progress-circle-below')).toHaveAttribute('aria-valuenow', '0');
    
    // Test with value above 100
    renderWithTheme(<ProgressCircle progress={150} data-testid="progress-circle-above" />);
    expect(screen.getByTestId('progress-circle-above')).toHaveAttribute('aria-valuenow', '100');
    
    // Test with value within range
    renderWithTheme(<ProgressCircle progress={75} data-testid="progress-circle-normal" />);
    expect(screen.getByTestId('progress-circle-normal')).toHaveAttribute('aria-valuenow', '75');
  });

  // Test showing label
  it('displays percentage label when showLabel is true', () => {
    renderWithTheme(<ProgressCircle progress={42} showLabel={true} data-testid="progress-circle" />);
    
    const label = screen.getByText('42%');
    expect(label).toBeInTheDocument();
  });

  // Test not showing label
  it('does not display percentage label when showLabel is false', () => {
    renderWithTheme(<ProgressCircle progress={42} showLabel={false} data-testid="progress-circle" />);
    
    const label = screen.queryByText('42%');
    expect(label).not.toBeInTheDocument();
  });

  // Test journey-specific theming - Health
  it('applies health journey theming correctly', () => {
    renderWithTheme(
      <ProgressCircle progress={50} journey="health" data-testid="progress-circle" />,
      healthTheme
    );
    
    const progressCircle = screen.getByTestId('progress-circle');
    expect(progressCircle).toHaveAttribute('journey', 'health');
    
    // Check that SVG circle uses the health journey primary color
    const svgElement = progressCircle.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    
    const progressCircleElement = svgElement?.querySelector('circle:nth-of-type(2)');
    expect(progressCircleElement).toHaveAttribute('stroke', 'journeys.health.primary');
  });

  // Test journey-specific theming - Care
  it('applies care journey theming correctly', () => {
    renderWithTheme(
      <ProgressCircle progress={50} journey="care" data-testid="progress-circle" />,
      careTheme
    );
    
    const progressCircle = screen.getByTestId('progress-circle');
    expect(progressCircle).toHaveAttribute('journey', 'care');
    
    // Check that SVG circle uses the care journey primary color
    const svgElement = progressCircle.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    
    const progressCircleElement = svgElement?.querySelector('circle:nth-of-type(2)');
    expect(progressCircleElement).toHaveAttribute('stroke', 'journeys.care.primary');
  });

  // Test journey-specific theming - Plan
  it('applies plan journey theming correctly', () => {
    renderWithTheme(
      <ProgressCircle progress={50} journey="plan" data-testid="progress-circle" />,
      planTheme
    );
    
    const progressCircle = screen.getByTestId('progress-circle');
    expect(progressCircle).toHaveAttribute('journey', 'plan');
    
    // Check that SVG circle uses the plan journey primary color
    const svgElement = progressCircle.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    
    const progressCircleElement = svgElement?.querySelector('circle:nth-of-type(2)');
    expect(progressCircleElement).toHaveAttribute('stroke', 'journeys.plan.primary');
  });

  // Test custom color
  it('applies custom color when provided', () => {
    renderWithTheme(<ProgressCircle progress={50} color="#FF5500" data-testid="progress-circle" />);
    
    const progressCircle = screen.getByTestId('progress-circle');
    const svgElement = progressCircle.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    
    const progressCircleElement = svgElement?.querySelector('circle:nth-of-type(2)');
    expect(progressCircleElement).toHaveAttribute('stroke', '#FF5500');
  });

  // Test accessibility attributes
  it('has proper accessibility attributes', () => {
    renderWithTheme(<ProgressCircle progress={75} data-testid="progress-circle" />);
    
    const progressCircle = screen.getByTestId('progress-circle');
    expect(progressCircle).toHaveAttribute('role', 'progressbar');
    expect(progressCircle).toHaveAttribute('aria-valuenow', '75');
    expect(progressCircle).toHaveAttribute('aria-valuemin', '0');
    expect(progressCircle).toHaveAttribute('aria-valuemax', '100');
    expect(progressCircle).toHaveAttribute('aria-label', '75% complete');
  });

  // Test custom aria-label
  it('uses custom aria-label when provided', () => {
    renderWithTheme(
      <ProgressCircle 
        progress={30} 
        ariaLabel="Task completion: 30%" 
        data-testid="progress-circle" 
      />
    );
    
    const progressCircle = screen.getByTestId('progress-circle');
    expect(progressCircle).toHaveAttribute('aria-label', 'Task completion: 30%');
  });

  // Test SVG structure
  it('renders SVG with correct structure', () => {
    renderWithTheme(<ProgressCircle progress={50} data-testid="progress-circle" />);
    
    const progressCircle = screen.getByTestId('progress-circle');
    const svgElement = progressCircle.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('aria-hidden', 'true');
    
    // Should have two circle elements (background and progress)
    const circleElements = svgElement?.querySelectorAll('circle');
    expect(circleElements?.length).toBe(2);
    
    // Background circle
    const backgroundCircle = circleElements?.[0];
    expect(backgroundCircle).toHaveAttribute('stroke', 'neutral.gray300');
    
    // Progress circle
    const progressCircleElement = circleElements?.[1];
    expect(progressCircleElement).toHaveAttribute('stroke-linecap', 'round');
  });
});