import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ProgressCircle } from './ProgressCircle';
import { colors } from '@design-system/primitives/src/tokens/colors';
import { baseTheme } from '../../themes/base.theme';
import { healthTheme } from '../../themes/health.theme';
import { careTheme } from '../../themes/care.theme';
import { planTheme } from '../../themes/plan.theme';

// Mock Box component
jest.mock('../../primitives/Box', () => ({
  Box: ({ children, ...props }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
}));

// Mock Text component
jest.mock('../../primitives/Text', () => ({
  Text: ({ children, ...props }) => (
    <span data-testid="text" {...props}>
      {children}
    </span>
  ),
}));

describe('ProgressCircle', () => {
  // Test rendering with default props
  it('renders correctly with default props', () => {
    render(<ProgressCircle progress={50} />);
    
    const box = screen.getByTestId('box');
    expect(box).toBeInTheDocument();
    
    // Check SVG is rendered
    const svg = box.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check circles are rendered
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBe(2); // Background and progress circles
    
    // Check default size
    expect(box).toHaveAttribute('width', '64px');
    expect(box).toHaveAttribute('height', '64px');
    
    // Check progress value is set correctly
    expect(box).toHaveAttribute('aria-valuenow', '50');
  });
  
  // Test custom size
  it('renders with custom size', () => {
    render(<ProgressCircle progress={50} size="100px" />);
    
    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('width', '100px');
    expect(box).toHaveAttribute('height', '100px');
  });
  
  // Test progress values
  it('normalizes progress values to be between 0 and 100', () => {
    const { rerender } = render(<ProgressCircle progress={-20} />);
    
    // Should normalize negative values to 0
    let box = screen.getByTestId('box');
    expect(box).toHaveAttribute('aria-valuenow', '0');
    
    // Should normalize values over 100 to 100
    rerender(<ProgressCircle progress={150} />);
    box = screen.getByTestId('box');
    expect(box).toHaveAttribute('aria-valuenow', '100');
    
    // Should keep values between 0 and 100 as is
    rerender(<ProgressCircle progress={75} />);
    box = screen.getByTestId('box');
    expect(box).toHaveAttribute('aria-valuenow', '75');
  });
  
  // Test showing label
  it('renders with progress label when showLabel is true', () => {
    render(<ProgressCircle progress={42} showLabel={true} />);
    
    const text = screen.getByTestId('text');
    expect(text).toBeInTheDocument();
    expect(text).toHaveTextContent('42%');
  });
  
  it('does not render progress label when showLabel is false', () => {
    render(<ProgressCircle progress={42} showLabel={false} />);
    
    expect(screen.queryByTestId('text')).not.toBeInTheDocument();
  });
  
  // Test journey-specific theming
  it('renders with health journey theme', () => {
    render(<ProgressCircle progress={50} journey="health" />);
    
    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('journey', 'health');
    
    // Check that the progress circle uses the health journey color
    const svg = box.querySelector('svg');
    const progressCircle = svg.querySelectorAll('circle')[1]; // Second circle is the progress circle
    expect(progressCircle).toHaveAttribute('stroke', 'journeys.health.primary');
  });
  
  it('renders with care journey theme', () => {
    render(<ProgressCircle progress={50} journey="care" />);
    
    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('journey', 'care');
    
    // Check that the progress circle uses the care journey color
    const svg = box.querySelector('svg');
    const progressCircle = svg.querySelectorAll('circle')[1]; // Second circle is the progress circle
    expect(progressCircle).toHaveAttribute('stroke', 'journeys.care.primary');
  });
  
  it('renders with plan journey theme', () => {
    render(<ProgressCircle progress={50} journey="plan" />);
    
    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('journey', 'plan');
    
    // Check that the progress circle uses the plan journey color
    const svg = box.querySelector('svg');
    const progressCircle = svg.querySelectorAll('circle')[1]; // Second circle is the progress circle
    expect(progressCircle).toHaveAttribute('stroke', 'journeys.plan.primary');
  });
  
  // Test custom color
  it('renders with custom color', () => {
    render(<ProgressCircle progress={50} color="semantic.success" />);
    
    const box = screen.getByTestId('box');
    const svg = box.querySelector('svg');
    const progressCircle = svg.querySelectorAll('circle')[1]; // Second circle is the progress circle
    expect(progressCircle).toHaveAttribute('stroke', 'semantic.success');
  });
  
  // Test accessibility attributes
  it('has correct accessibility attributes', () => {
    render(<ProgressCircle progress={75} ariaLabel="Loading progress" />);
    
    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('role', 'progressbar');
    expect(box).toHaveAttribute('aria-valuemin', '0');
    expect(box).toHaveAttribute('aria-valuemax', '100');
    expect(box).toHaveAttribute('aria-valuenow', '75');
    expect(box).toHaveAttribute('aria-label', 'Loading progress');
  });
  
  it('uses default aria-label when not provided', () => {
    render(<ProgressCircle progress={75} />);
    
    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('aria-label', '75% complete');
  });
  
  // Test SVG parameters
  it('calculates SVG parameters correctly', () => {
    render(<ProgressCircle progress={50} />);
    
    const box = screen.getByTestId('box');
    const svg = box.querySelector('svg');
    
    // Check viewBox
    expect(svg).toHaveAttribute('viewBox', '0 0 36 36');
    
    // Check background circle
    const backgroundCircle = svg.querySelectorAll('circle')[0];
    expect(backgroundCircle).toHaveAttribute('cx', '18');
    expect(backgroundCircle).toHaveAttribute('cy', '18');
    expect(backgroundCircle).toHaveAttribute('r', '16.2'); // (36 - 3.6) / 2
    expect(backgroundCircle).toHaveAttribute('stroke', 'neutral.gray300');
    expect(backgroundCircle).toHaveAttribute('stroke-width', '3.6');
    
    // Check progress circle
    const progressCircle = svg.querySelectorAll('circle')[1];
    expect(progressCircle).toHaveAttribute('cx', '18');
    expect(progressCircle).toHaveAttribute('cy', '18');
    expect(progressCircle).toHaveAttribute('r', '16.2'); // (36 - 3.6) / 2
    expect(progressCircle).toHaveAttribute('stroke-width', '3.6');
    expect(progressCircle).toHaveAttribute('stroke-linecap', 'round');
    
    // Check that the progress circle has the correct transform
    expect(progressCircle).toHaveAttribute('transform', 'rotate(-90 18 18)');
  });
  
  // Test stroke-dashoffset calculation for different progress values
  it('calculates stroke-dashoffset correctly for different progress values', () => {
    const { rerender } = render(<ProgressCircle progress={0} />);
    
    const getStrokeDashoffset = () => {
      const box = screen.getByTestId('box');
      const svg = box.querySelector('svg');
      const progressCircle = svg.querySelectorAll('circle')[1];
      return progressCircle.getAttribute('stroke-dashoffset');
    };
    
    // At 0% progress, the dashoffset should be equal to the circumference
    const zeroProgressDashoffset = getStrokeDashoffset();
    
    // At 50% progress, the dashoffset should be half the circumference
    rerender(<ProgressCircle progress={50} />);
    const halfProgressDashoffset = getStrokeDashoffset();
    
    // At 100% progress, the dashoffset should be 0
    rerender(<ProgressCircle progress={100} />);
    const fullProgressDashoffset = getStrokeDashoffset();
    
    // Verify the dashoffset decreases as progress increases
    const zeroOffset = parseFloat(zeroProgressDashoffset);
    const halfOffset = parseFloat(halfProgressDashoffset);
    const fullOffset = parseFloat(fullProgressDashoffset);
    
    expect(zeroOffset).toBeGreaterThan(halfOffset);
    expect(halfOffset).toBeGreaterThan(fullOffset);
    expect(fullOffset).toBeCloseTo(0, 1); // Should be close to 0 with some rounding tolerance
  });
  
  // Test that SVG is marked as aria-hidden
  it('marks SVG as aria-hidden', () => {
    render(<ProgressCircle progress={50} />);
    
    const box = screen.getByTestId('box');
    const svg = box.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});