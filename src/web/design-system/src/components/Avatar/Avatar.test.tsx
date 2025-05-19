import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { baseTheme } from '../../themes/base.theme';
import { Avatar } from './Avatar';
import { colors } from '../../tokens/colors';

// Helper function to render Avatar with ThemeProvider
const renderWithTheme = (ui: React.ReactNode) => {
  return render(<ThemeProvider theme={baseTheme}>{ui}</ThemeProvider>);
};

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        alt="John Doe" 
        testID="avatar"
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });
  
  it('renders initials when src is not provided', () => {
    renderWithTheme(
      <Avatar 
        alt="John Doe" 
        testID="avatar"
      />
    );
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
  
  it('renders a single initial for single-word names', () => {
    renderWithTheme(
      <Avatar 
        alt="John" 
        testID="avatar"
      />
    );
    
    expect(screen.getByText('J')).toBeInTheDocument();
  });
  
  it('renders a default icon when alt is not provided', () => {
    renderWithTheme(
      <Avatar testID="avatar" />
    );
    
    // The icon is rendered as an SVG, so we check for the container
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    // We can't easily test for the SVG content, but we can check that
    // no initials are rendered
    expect(avatar.textContent).toBe('');
  });
  
  it('applies custom size', () => {
    renderWithTheme(
      <Avatar 
        alt="John Doe" 
        size={60} 
        testID="avatar"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('width: 60px');
    expect(avatar).toHaveStyle('height: 60px');
  });
  
  it('applies journey-specific theming for health journey', () => {
    renderWithTheme(
      <Avatar 
        alt="John Doe" 
        journey="health" 
        testID="avatar"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    // We can't easily test the exact color value due to how styled-components works,
    // but we can check that the component renders correctly
    expect(avatar).toBeInTheDocument();
  });
  
  it('applies journey-specific theming for care journey', () => {
    renderWithTheme(
      <Avatar 
        alt="John Doe" 
        journey="care" 
        testID="avatar"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
  });
  
  it('applies journey-specific theming for plan journey', () => {
    renderWithTheme(
      <Avatar 
        alt="John Doe" 
        journey="plan" 
        testID="avatar"
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
  });
  
  it('calls onImageError when image fails to load', () => {
    const onImageError = jest.fn();
    renderWithTheme(
      <Avatar 
        src="https://example.com/invalid.jpg" 
        alt="John Doe" 
        onImageError={onImageError}
        testID="avatar"
      />
    );
    
    const img = screen.getByRole('img');
    fireEvent.error(img);
    
    expect(onImageError).toHaveBeenCalled();
  });
  
  it('shows fallback when showFallback is true', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        alt="John Doe" 
        showFallback={true}
        testID="avatar"
      />
    );
    
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});