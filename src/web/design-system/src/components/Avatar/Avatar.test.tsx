import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Avatar } from './Avatar';
import { baseTheme } from '../../themes/base.theme';
import { healthTheme } from '../../themes/health.theme';
import { careTheme } from '../../themes/care.theme';
import { planTheme } from '../../themes/plan.theme';
import { useJourney } from '@austa/journey-context';

// Mock the journey context hook
jest.mock('@austa/journey-context', () => ({
  useJourney: jest.fn().mockReturnValue({
    currentJourney: 'health',
    setCurrentJourney: jest.fn(),
    availableJourneys: ['health', 'care', 'plan']
  })
}));

// Mock the Text component
jest.mock('../../primitives/Text/Text', () => ({
  Text: ({ children, color, fontWeight, ...props }) => (
    <span 
      data-testid="text" 
      data-color={color} 
      data-font-weight={fontWeight}
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock the Icon component
jest.mock('../../primitives/Icon/Icon', () => ({
  Icon: ({ name, size, color, ...props }) => (
    <span 
      data-testid="icon" 
      data-name={name} 
      data-size={size} 
      data-color={color}
      {...props} 
    />
  ),
}));

// Helper function to render Avatar with theme
const renderWithTheme = (ui, theme = baseTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Avatar', () => {
  // Test rendering with image
  it('renders correctly with image source', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        alt="User Avatar" 
        name="John Doe"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    
    const image = avatar.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(image).toHaveAttribute('alt', 'User Avatar');
  });
  
  // Test fallback to initials when no image
  it('renders initials when no image is provided', () => {
    renderWithTheme(
      <Avatar 
        name="John Doe"
        fallbackType="initials"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toBeInTheDocument();
    expect(initials).toHaveTextContent('JD');
  });
  
  // Test fallback to icon when no image and no name
  it('renders icon when no image and no name is provided', () => {
    renderWithTheme(
      <Avatar fallbackType="icon" />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-name', 'profile');
    expect(icon).toHaveAttribute('data-color', 'white');
  });
  
  // Test forced fallback
  it('shows fallback even when image is provided if showFallback is true', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        name="John Doe"
        showFallback={true}
        fallbackType="initials"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    
    const image = avatar.querySelector('img');
    expect(image).not.toBeInTheDocument();
    
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toBeInTheDocument();
    expect(initials).toHaveTextContent('JD');
  });
  
  // Test image error handling
  it('shows fallback when image fails to load', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/broken-image.jpg" 
        name="John Doe"
        fallbackType="initials"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    const image = avatar.querySelector('img');
    expect(image).toBeInTheDocument();
    
    // Simulate image load error
    fireEvent.error(image);
    
    // After error, initials should be shown
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toBeInTheDocument();
    expect(initials).toHaveTextContent('JD');
  });
  
  // Test onImageError callback
  it('calls onImageError when image fails to load', () => {
    const onImageErrorMock = jest.fn();
    
    renderWithTheme(
      <Avatar 
        src="https://example.com/broken-image.jpg" 
        name="John Doe"
        onImageError={onImageErrorMock}
      />
    );
    
    const image = screen.getByRole('img');
    fireEvent.error(image);
    
    expect(onImageErrorMock).toHaveBeenCalledTimes(1);
  });
  
  // Test custom size
  it('renders with custom size', () => {
    renderWithTheme(
      <Avatar 
        name="John Doe"
        size="64px"
        fallbackType="initials"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('width: 64px');
    expect(avatar).toHaveStyle('height: 64px');
  });
  
  // Test custom test ID
  it('renders with custom testID', () => {
    renderWithTheme(
      <Avatar 
        name="John Doe"
        testID="custom-avatar"
      />
    );
    
    const avatar = screen.getByTestId('custom-avatar');
    expect(avatar).toBeInTheDocument();
  });
  
  // Test accessibility attributes
  it('has correct accessibility attributes', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        alt="Custom Alt Text"
        name="John Doe"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('aria-label', 'Custom Alt Text');
    
    // Test default aria-label when only name is provided
    const { rerender } = renderWithTheme(
      <Avatar name="John Doe" />
    );
    
    expect(screen.getByTestId('avatar')).toHaveAttribute('aria-label', 'Avatar for John Doe');
    
    // Test default aria-label when neither alt nor name is provided
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('avatar')).toHaveAttribute('aria-label', 'User avatar');
  });
  
  // Test journey-specific theming - Health
  it('applies health journey styling correctly', () => {
    renderWithTheme(
      <Avatar 
        name="John Doe"
        journey="health"
      />,
      healthTheme
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('background-color: #0ACF83');
  });
  
  // Test journey-specific theming - Care
  it('applies care journey styling correctly', () => {
    renderWithTheme(
      <Avatar 
        name="John Doe"
        journey="care"
      />,
      careTheme
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('background-color: #FF8C42');
  });
  
  // Test journey-specific theming - Plan
  it('applies plan journey styling correctly', () => {
    renderWithTheme(
      <Avatar 
        name="John Doe"
        journey="plan"
      />,
      planTheme
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('background-color: #3A86FF');
  });
  
  // Test journey context integration
  it('uses current journey from context when journey prop is not provided', () => {
    // Mock the journey context to return 'care' journey
    (useJourney as jest.Mock).mockReturnValue({
      currentJourney: 'care',
      setCurrentJourney: jest.fn(),
      availableJourneys: ['health', 'care', 'plan']
    });
    
    renderWithTheme(
      <Avatar name="John Doe" />,
      careTheme
    );
    
    // Should use the care journey color from the theme
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('background-color: #FF8C42');
    
    // Reset mock for other tests
    (useJourney as jest.Mock).mockReturnValue({
      currentJourney: 'health',
      setCurrentJourney: jest.fn(),
      availableJourneys: ['health', 'care', 'plan']
    });
  });
  
  // Test initials generation
  it('generates correct initials from different name formats', () => {
    const { rerender } = renderWithTheme(
      <Avatar 
        name="John Doe"
        fallbackType="initials"
      />
    );
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('JD');
    
    // Test with single name
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar 
          name="John"
          fallbackType="initials"
        />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('J');
    
    // Test with multiple names
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar 
          name="John Middle Doe"
          fallbackType="initials"
        />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('JD');
    
    // Test with empty name
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar 
          name=""
          fallbackType="initials"
        />
      </ThemeProvider>
    );
    
    // Should not render initials for empty name
    expect(screen.queryByTestId('avatar-initials')).toHaveTextContent('');
  });
  
  // Test icon size based on avatar size
  it('sets icon size proportional to avatar size', () => {
    renderWithTheme(
      <Avatar 
        size="80px"
        fallbackType="icon"
      />
    );
    
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-size', 'calc(80px / 2)');
  });
});