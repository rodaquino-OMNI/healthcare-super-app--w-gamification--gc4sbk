/**
 * Setup file that runs after the test environment is set up but before tests run
 * 
 * This file is used to extend Jest's expect and add custom matchers for testing
 * design system components.
 */

// Import testing-library extensions based on platform
if (process.env.PLATFORM === 'web' || !process.env.PLATFORM) {
  require('@testing-library/jest-dom');
}

// Add custom matchers for styled-components
import { toHaveStyleRule } from 'jest-styled-components';
expect.extend({ toHaveStyleRule });

// Import React Native Testing Library helpers
import { within } from '@testing-library/react-native';

// Add custom matchers for design system specific testing
expect.extend({
  // Custom matcher to check if a component has the correct journey theme
  toHaveJourneyTheme(received, journey) {
    // Handle DOM elements in web environment
    if (received.hasAttribute && typeof received.hasAttribute === 'function') {
      const hasJourneyAttr = received.hasAttribute('journey') && 
                            received.getAttribute('journey') === journey;
      
      return {
        message: () => `expected ${received} to have journey="${journey}" attribute`,
        pass: hasJourneyAttr
      };
    }
    
    // Handle React Native components
    const hasJourneyProp = received.props && received.props.journey === journey;
    
    return {
      message: () => `expected component to have journey="${journey}" prop`,
      pass: hasJourneyProp
    };
  },
  
  // Custom matcher to check if a component has the correct variant
  toHaveVariant(received, variant) {
    // Handle DOM elements in web environment
    if (received.hasAttribute && typeof received.hasAttribute === 'function') {
      const hasVariantAttr = received.hasAttribute('variant') && 
                            received.getAttribute('variant') === variant;
      
      return {
        message: () => `expected ${received} to have variant="${variant}" attribute`,
        pass: hasVariantAttr
      };
    }
    
    // Handle React Native components
    const hasVariantProp = received.props && received.props.variant === variant;
    
    return {
      message: () => `expected component to have variant="${variant}" prop`,
      pass: hasVariantProp
    };
  },
  
  // Custom matcher to check if a component has the correct size
  toHaveSize(received, size) {
    // Handle DOM elements in web environment
    if (received.hasAttribute && typeof received.hasAttribute === 'function') {
      const hasSizeAttr = received.hasAttribute('size') && 
                         received.getAttribute('size') === size;
      
      return {
        message: () => `expected ${received} to have size="${size}" attribute`,
        pass: hasSizeAttr
      };
    }
    
    // Handle React Native components
    const hasSizeProp = received.props && received.props.size === size;
    
    return {
      message: () => `expected component to have size="${size}" prop`,
      pass: hasSizeProp
    };
  },
  
  // Custom matcher for testing accessibility props in React Native
  toBeAccessible(received, { label, role, hint } = {}) {
    let pass = true;
    let failureMessages = [];
    
    // Check for accessibility props based on platform
    if (process.env.PLATFORM === 'ios' || process.env.PLATFORM === 'android') {
      // React Native accessibility props
      if (label && (!received.props.accessibilityLabel || received.props.accessibilityLabel !== label)) {
        pass = false;
        failureMessages.push(`Expected accessibilityLabel to be "${label}" but got "${received.props.accessibilityLabel || 'undefined'}"`);
      }
      
      if (role && (!received.props.accessibilityRole || received.props.accessibilityRole !== role)) {
        pass = false;
        failureMessages.push(`Expected accessibilityRole to be "${role}" but got "${received.props.accessibilityRole || 'undefined'}"`);
      }
      
      if (hint && (!received.props.accessibilityHint || received.props.accessibilityHint !== hint)) {
        pass = false;
        failureMessages.push(`Expected accessibilityHint to be "${hint}" but got "${received.props.accessibilityHint || 'undefined'}"`);
      }
    } else {
      // Web accessibility attributes
      if (label && (!received.getAttribute('aria-label') || received.getAttribute('aria-label') !== label)) {
        pass = false;
        failureMessages.push(`Expected aria-label to be "${label}" but got "${received.getAttribute('aria-label') || 'undefined'}"`);
      }
      
      if (role && (!received.getAttribute('role') || received.getAttribute('role') !== role)) {
        pass = false;
        failureMessages.push(`Expected role to be "${role}" but got "${received.getAttribute('role') || 'undefined'}"`);
      }
      
      if (hint && (!received.getAttribute('aria-description') || received.getAttribute('aria-description') !== hint)) {
        pass = false;
        failureMessages.push(`Expected aria-description to be "${hint}" but got "${received.getAttribute('aria-description') || 'undefined'}"`);
      }
    }
    
    return {
      message: () => failureMessages.join('\n'),
      pass
    };
  }
});

// Set up global test timeouts
jest.setTimeout(10000); // 10 seconds

// Clean up after each test
afterEach(() => {
  // Clean up any side effects that might affect other tests
  jest.clearAllMocks();
});

// Set up platform-specific globals
global.getPlatform = () => process.env.PLATFORM || 'web';

// Helper function to get platform-specific test utils
global.getTestUtils = () => {
  const platform = getPlatform();
  if (platform === 'web') {
    return require('@testing-library/react');
  } else {
    return require('@testing-library/react-native');
  }
};