import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ThemeProvider } from 'styled-components';
import { Checkbox } from './Checkbox';
import { baseTheme, healthTheme, careTheme, planTheme } from '../../themes';

describe('Checkbox Component', () => {
  // Test rendering and basic functionality
  describe('Basic Functionality', () => {
    const defaultProps = {
      id: 'test-checkbox',
      name: 'test-checkbox',
      value: 'test',
      label: 'Test Checkbox',
      onChange: jest.fn(),
    };

    it('renders correctly in unchecked state', () => {
      render(<Checkbox {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('renders correctly in checked state', () => {
      render(<Checkbox {...defaultProps} checked />);
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it('renders correctly in disabled state', () => {
      render(<Checkbox {...defaultProps} disabled />);
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeDisabled();
    });

    it('calls onChange when clicked', () => {
      const handleChange = jest.fn();
      render(
        <Checkbox
          {...defaultProps}
          onChange={handleChange}
        />
      );
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      fireEvent.click(checkbox);
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          checked: true,
          name: 'test-checkbox',
          id: 'test-checkbox',
          value: 'test'
        })
      }));
    });

    it('does not call onChange when clicked if disabled', () => {
      const handleChange = jest.fn();
      render(
        <Checkbox
          {...defaultProps}
          onChange={handleChange}
          disabled
        />
      );
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      fireEvent.click(checkbox);
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('updates internal state when checked prop changes', () => {
      const { rerender } = render(<Checkbox {...defaultProps} checked={false} />);
      
      let checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      expect(checkbox).not.toBeChecked();
      
      rerender(<Checkbox {...defaultProps} checked={true} />);
      
      checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      expect(checkbox).toBeChecked();
    });
  });

  // Test journey-specific styling
  describe('Journey-specific Styling', () => {
    const defaultProps = {
      id: 'test-checkbox',
      name: 'test-checkbox',
      value: 'test',
      label: 'Test Checkbox',
      onChange: jest.fn(),
      checked: true,
    };

    it('applies health journey styling when journey="health"', () => {
      render(
        <ThemeProvider theme={healthTheme}>
          <Checkbox {...defaultProps} journey="health" />
        </ThemeProvider>
      );
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      const checkboxContainer = checkbox.closest('div');
      
      // Verify the checkbox has the correct styling
      // This is a visual test, so we're checking for the presence of the checkmark
      expect(screen.getByTestId('checkbox-checkmark')).toBeInTheDocument();
      
      // We can't directly test CSS-in-JS styles in JSDOM, but we can verify
      // that the component renders with the correct structure
      expect(checkboxContainer).toBeInTheDocument();
    });

    it('applies care journey styling when journey="care"', () => {
      render(
        <ThemeProvider theme={careTheme}>
          <Checkbox {...defaultProps} journey="care" />
        </ThemeProvider>
      );
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      const checkboxContainer = checkbox.closest('div');
      
      expect(screen.getByTestId('checkbox-checkmark')).toBeInTheDocument();
      expect(checkboxContainer).toBeInTheDocument();
    });

    it('applies plan journey styling when journey="plan"', () => {
      render(
        <ThemeProvider theme={planTheme}>
          <Checkbox {...defaultProps} journey="plan" />
        </ThemeProvider>
      );
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      const checkboxContainer = checkbox.closest('div');
      
      expect(screen.getByTestId('checkbox-checkmark')).toBeInTheDocument();
      expect(checkboxContainer).toBeInTheDocument();
    });

    it('applies default styling when no journey is specified', () => {
      render(
        <ThemeProvider theme={baseTheme}>
          <Checkbox {...defaultProps} />
        </ThemeProvider>
      );
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      const checkboxContainer = checkbox.closest('div');
      
      expect(screen.getByTestId('checkbox-checkmark')).toBeInTheDocument();
      expect(checkboxContainer).toBeInTheDocument();
    });
  });

  // Test accessibility
  describe('Accessibility', () => {
    const defaultProps = {
      id: 'test-checkbox',
      name: 'test-checkbox',
      value: 'test',
      label: 'Test Checkbox',
      onChange: jest.fn(),
    };

    it('has no accessibility violations', async () => {
      const { container } = render(
        <ThemeProvider theme={baseTheme}>
          <Checkbox {...defaultProps} />
        </ThemeProvider>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<Checkbox {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /test checkbox/i });
      
      // Check for proper accessibility attributes
      expect(checkbox).toHaveAttribute('aria-hidden', 'true');
      
      // The Touchable component should have proper accessibility role and state
      const touchable = screen.getByTestId(`checkbox-${defaultProps.id}`);
      expect(touchable).toHaveAttribute('role', 'checkbox');
      expect(touchable).toHaveAttribute('aria-checked', 'false');
      expect(touchable).toHaveAttribute('aria-label', defaultProps.label);
    });

    it('has proper ARIA attributes when checked', () => {
      render(<Checkbox {...defaultProps} checked />);
      
      // The Touchable component should have proper accessibility role and state
      const touchable = screen.getByTestId(`checkbox-${defaultProps.id}`);
      expect(touchable).toHaveAttribute('role', 'checkbox');
      expect(touchable).toHaveAttribute('aria-checked', 'true');
    });

    it('has proper ARIA attributes when disabled', () => {
      render(<Checkbox {...defaultProps} disabled />);
      
      // The Touchable component should have proper accessibility role and state
      const touchable = screen.getByTestId(`checkbox-${defaultProps.id}`);
      expect(touchable).toHaveAttribute('role', 'checkbox');
      expect(touchable).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // Test with different props
  describe('Props Variations', () => {
    it('renders with custom testID', () => {
      render(
        <Checkbox
          id="test-checkbox"
          name="test-checkbox"
          value="test"
          label="Test Checkbox"
          onChange={jest.fn()}
          testID="custom-test-id"
        />
      );
      
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });

    it('renders with different label text', () => {
      render(
        <Checkbox
          id="test-checkbox"
          name="test-checkbox"
          value="test"
          label="Custom Label Text"
          onChange={jest.fn()}
        />
      );
      
      expect(screen.getByText('Custom Label Text')).toBeInTheDocument();
    });
  });
});