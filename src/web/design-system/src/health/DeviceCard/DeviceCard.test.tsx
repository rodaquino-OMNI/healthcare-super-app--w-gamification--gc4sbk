import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceCard } from './DeviceCard';
import { baseTheme } from '@austa/design-system/themes';
import { useJourney } from '@austa/journey-context';

// Mock react-native components
jest.mock('react-native', () => ({}));

// Mock the journey context hook
jest.mock('@austa/journey-context', () => ({
  useJourney: jest.fn().mockReturnValue({
    currentJourney: 'health',
    setCurrentJourney: jest.fn(),
    availableJourneys: ['health', 'care', 'plan']
  })
}));

// Mock the Touchable component
jest.mock('@design-system/primitives/src/components/Touchable', () => ({
  Touchable: ({ children, onPress, accessibilityLabel, ...props }) => (
    <button 
      data-testid="touchable" 
      onClick={onPress}
      aria-label={accessibilityLabel}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock the Icon component
jest.mock('@design-system/primitives/src/components/Icon', () => ({
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

// Mock the Box component
jest.mock('@design-system/primitives/src/components/Box', () => ({
  Box: ({ children, display, flexDirection, alignItems, marginRight, flex, ...props }) => (
    <div 
      data-testid="box"
      data-display={display}
      data-flex-direction={flexDirection}
      data-align-items={alignItems}
      data-margin-right={marginRight}
      data-flex={flex}
      {...props}
    >
      {children}
    </div>
  ),
}));

// Mock the Text component
jest.mock('@design-system/primitives/src/components/Text', () => ({
  Text: ({ children, ...props }) => (
    <span data-testid="text" {...props}>{children}</span>
  ),
}));

describe('DeviceCard', () => {
  // Test rendering with default props
  it('renders correctly with all required props', () => {
    render(
      <DeviceCard 
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    // Check that the component renders with correct content
    expect(screen.getByTestId('touchable')).toBeInTheDocument();
    expect(screen.getByText('Apple Watch')).toBeInTheDocument();
    expect(screen.getByText('Smartwatch')).toBeInTheDocument();
    expect(screen.getByText('Last sync: 5 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
  
  // Test icon selection based on device type
  it('selects the correct icon based on device type', () => {
    const { rerender } = render(
      <DeviceCard 
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    // Smartwatch should use steps icon
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'steps');
    
    // Test heart rate monitor
    rerender(
      <DeviceCard 
        deviceName="Polar H10"
        deviceType="Heart Rate Monitor"
        lastSync="10 minutes ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'heart');
    
    // Test scale
    rerender(
      <DeviceCard 
        deviceName="Withings Scale"
        deviceType="Smart Scale"
        lastSync="1 hour ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'weight');
    
    // Test glucose monitor
    rerender(
      <DeviceCard 
        deviceName="Dexcom G6"
        deviceType="Glucose Monitor"
        lastSync="30 minutes ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'glucose');
    
    // Test blood pressure monitor
    rerender(
      <DeviceCard 
        deviceName="Omron BP"
        deviceType="Blood Pressure Monitor"
        lastSync="2 hours ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'pulse');
    
    // Test sleep tracker
    rerender(
      <DeviceCard 
        deviceName="Oura Ring"
        deviceType="Sleep Tracker"
        lastSync="8 hours ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'sleep');
    
    // Test unknown device type (should use default icon)
    rerender(
      <DeviceCard 
        deviceName="Unknown Device"
        deviceType="Other"
        lastSync="1 day ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'heart-outline');
  });
  
  // Test connected vs disconnected styling
  it('applies correct styling for connected and disconnected states', () => {
    const { rerender } = render(
      <DeviceCard 
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    // Connected state should have success color for icon and status
    expect(screen.getByTestId('icon')).toHaveAttribute('data-color', 'semantic.success');
    expect(screen.getByText('Connected')).toHaveAttribute('connected', 'true');
    
    // Test disconnected state
    rerender(
      <DeviceCard 
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Disconnected"
      />
    );
    
    // Disconnected state should have gray color for icon and error color for status
    expect(screen.getByTestId('icon')).toHaveAttribute('data-color', 'neutral.gray400');
    expect(screen.getByText('Disconnected')).toHaveAttribute('connected', 'false');
  });
  
  // Test onPress callback
  it('calls onPress callback when pressed', () => {
    const onPressMock = jest.fn();
    render(
      <DeviceCard 
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
        onPress={onPressMock}
      />
    );
    
    const touchable = screen.getByTestId('touchable');
    fireEvent.click(touchable);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  // Test accessibility
  it('has correct accessibility attributes', () => {
    render(
      <DeviceCard 
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    const touchable = screen.getByTestId('touchable');
    expect(touchable).toHaveAttribute('aria-label', 'Apple Watch, Smartwatch, Connected, Last synced 5 minutes ago');
    expect(touchable).toHaveAttribute('journey', 'health');
    
    // Icon should be hidden from screen readers
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });
  
  // Test journey context integration
  it('uses health journey by default', () => {
    render(
      <DeviceCard 
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    const touchable = screen.getByTestId('touchable');
    expect(touchable).toHaveAttribute('journey', 'health');
  });
});