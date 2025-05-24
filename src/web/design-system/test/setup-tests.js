/**
 * Global setup file for design system tests
 * 
 * This file runs before Jest loads the test environment and is used to set up
 * global mocks and configurations needed for all tests.
 */

// Mock react-native components that might be used in components
jest.mock('react-native', () => {
  // Get the current platform from the environment or default to 'web'
  const platform = process.env.PLATFORM || 'web';
  
  return {
    // Mock ActivityIndicator component used in loading states
    ActivityIndicator: ({ size, color, ...props }) => (
      global.document ? 
        global.document.createElement('div', {
          'data-testid': 'activity-indicator',
          'data-size': size,
          'data-color': color,
          ...props
        }) : 
        { type: 'ActivityIndicator', props: { size, color, ...props } }
    ),
    // Add other react-native components as needed
    View: props => global.document ? 
      global.document.createElement('div', props) : 
      { type: 'View', props },
    Text: props => global.document ? 
      global.document.createElement('span', props) : 
      { type: 'Text', props },
    TouchableOpacity: props => global.document ? 
      global.document.createElement('button', props) : 
      { type: 'TouchableOpacity', props },
    Platform: {
      OS: platform,
      select: obj => obj[platform] || obj.default || obj[Object.keys(obj)[0]]
    },
    StyleSheet: {
      create: styles => styles,
      flatten: style => style,
      hairlineWidth: 1,
    },
    Dimensions: {
      get: () => ({
        window: { width: 375, height: 812 },
        screen: { width: 375, height: 812 }
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    // Add any other RN APIs that might be used
    Animated: {
      View: props => global.document ? 
        global.document.createElement('div', props) : 
        { type: 'Animated.View', props },
      Text: props => global.document ? 
        global.document.createElement('span', props) : 
        { type: 'Animated.Text', props },
      createAnimatedComponent: component => component,
      timing: () => ({
        start: callback => callback && callback({ finished: true }),
      }),
      spring: () => ({
        start: callback => callback && callback({ finished: true }),
      }),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          interpolate: jest.fn(),
        })),
      })),
    },
    I18nManager: {
      isRTL: false,
      getConstants: () => ({ isRTL: false }),
    },
    NativeModules: {},
    UIManager: {
      measureInWindow: jest.fn(),
      measure: jest.fn(),
    },
  };
});

// Mock the primitives components
jest.mock('@design-system/primitives', () => ({
  Box: props => global.document ? 
    global.document.createElement('div', { 'data-testid': 'box', ...props }) : 
    { type: 'Box', props },
  Text: props => global.document ? 
    global.document.createElement('span', { 'data-testid': 'text', ...props }) : 
    { type: 'Text', props },
  Stack: props => global.document ? 
    global.document.createElement('div', { 'data-testid': 'stack', ...props }) : 
    { type: 'Stack', props },
  Touchable: props => global.document ? 
    global.document.createElement('button', { 'data-testid': 'touchable', ...props }) : 
    { type: 'Touchable', props },
  Icon: props => global.document ? 
    global.document.createElement('span', { 'data-testid': 'icon', ...props }) : 
    { type: 'Icon', props },
}));

// Set up global variables that might be needed
global.__DEV__ = true;

// Setup for web environment
if (process.env.PLATFORM === 'web' || !process.env.PLATFORM) {
  // Mock window.matchMedia for responsive design testing
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() { return null; }
      unobserve() { return null; }
      disconnect() { return null; }
    };

    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() { return null; }
      unobserve() { return null; }
      disconnect() { return null; }
    };
  }
}

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Ignore specific expected errors
  if (
    args[0]?.includes('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes('Warning: useLayoutEffect does nothing on the server') ||
    args[0]?.includes('Warning: The current testing environment is not configured to support act')
  ) {
    return;
  }
  originalConsoleError(...args);
};