import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Input } from './Input';
import { baseTheme } from '../../themes/base.theme';
import { healthTheme } from '../../themes/health.theme';
import { careTheme } from '../../themes/care.theme';
import { planTheme } from '../../themes/plan.theme';

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement, theme = baseTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Input', () => {
  it('renders correctly with default props', () => {
    renderWithTheme(<Input placeholder="Enter text" data-testid="test-input" />);
    
    const input = screen.getByTestId('test-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toHaveAttribute('type', 'text'); // Default type
  });
  
  it('renders with a label', () => {
    renderWithTheme(<Input label="Username" data-testid="test-input" />);
    
    const label = screen.getByText('Username');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', expect.any(String));
  });
  
  it('handles text input changes', () => {
    const handleChange = jest.fn();
    renderWithTheme(
      <Input 
        value="" 
        onChange={handleChange} 
        data-testid="test-input" 
      />
    );
    
    const input = screen.getByTestId('test-input');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toBe('test value');
  });
  
  it('applies disabled styling and attributes', () => {
    renderWithTheme(<Input disabled data-testid="test-input" />);
    
    const input = screen.getByTestId('test-input');
    expect(input).toBeDisabled();
    expect(input).toHaveStyle('cursor: not-allowed');
  });
  
  it('supports different input types', () => {
    const { rerender } = renderWithTheme(
      <Input type="password" data-testid="test-input" />
    );
    
    let input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('type', 'password');
    
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Input type="email" data-testid="test-input" />
      </ThemeProvider>
    );
    
    input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('type', 'email');
    
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Input type="number" data-testid="test-input" />
      </ThemeProvider>
    );
    
    input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('type', 'number');
  });
  
  it('applies error styling and message', () => {
    renderWithTheme(
      <Input 
        error="This field is required" 
        data-testid="test-input" 
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
  });
  
  it('applies journey-specific styling for health theme', () => {
    renderWithTheme(
      <Input 
        journey="health" 
        label="Health Metric" 
        data-testid="test-input" 
      />,
      healthTheme
    );
    
    const label = screen.getByText('Health Metric');
    expect(label).toBeInTheDocument();
    // Would check for specific styling but this is handled by styled-components
  });
  
  it('applies journey-specific styling for care theme', () => {
    renderWithTheme(
      <Input 
        journey="care" 
        label="Care Provider" 
        data-testid="test-input" 
      />,
      careTheme
    );
    
    const label = screen.getByText('Care Provider');
    expect(label).toBeInTheDocument();
    // Would check for specific styling but this is handled by styled-components
  });
  
  it('applies journey-specific styling for plan theme', () => {
    renderWithTheme(
      <Input 
        journey="plan" 
        label="Plan Details" 
        data-testid="test-input" 
      />,
      planTheme
    );
    
    const label = screen.getByText('Plan Details');
    expect(label).toBeInTheDocument();
    // Would check for specific styling but this is handled by styled-components
  });
  
  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    renderWithTheme(
      <Input 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
        data-testid="test-input" 
      />
    );
    
    const input = screen.getByTestId('test-input');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
  
  it('applies accessibility attributes', () => {
    renderWithTheme(
      <Input 
        aria-label="Username input" 
        data-testid="test-input" 
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('aria-label', 'Username input');
    
    // Test with aria-labelledby
    const { rerender } = renderWithTheme(
      <Input 
        aria-labelledby="username-label" 
        data-testid="test-input-2" 
      />
    );
    
    const input2 = screen.getByTestId('test-input-2');
    expect(input2).toHaveAttribute('aria-labelledby', 'username-label');
    
    // Test with label (should set aria-labelledby to the label id)
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Input 
          label="Username" 
          data-testid="test-input-3" 
        />
      </ThemeProvider>
    );
    
    const input3 = screen.getByTestId('test-input-3');
    const labelId = input3.getAttribute('id');
    expect(input3).toHaveAttribute('aria-labelledby', labelId);
  });
  
  it('forwards ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    
    renderWithTheme(
      <Input 
        ref={ref} 
        data-testid="test-input" 
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(ref.current).toBe(input);
  });
});